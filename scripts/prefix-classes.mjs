/**
 * Codemod: prefix every Tailwind class Roster authors with `rst:`.
 *
 * Roster ships its component internals as compiled Tailwind utility classes.
 * Those names are global, and Roster's stylesheet deliberately sits in a layer
 * BELOW the host's `utilities` so a consumer's own classes can override it. The
 * unintended consequence is that any host app using the same class name wins on
 * Roster's own internal elements too. A host that used `bg-white` anywhere
 * defeated Roster's `dark:bg-gray-950` on the Textarea; one that used
 * `translate-x-0` pinned the Switch thumb at rest.
 *
 * Prefixing removes the collision without touching the layer order, so the
 * documented escape hatch — a consumer's `className` beating Roster — still
 * works.
 *
 * AST-driven rather than regex: class strings sit beside import paths, prop
 * names, and cva variant selectors that look identical to a pattern match.
 *
 * Usage:  node scripts/prefix-classes.mjs <files...>      # dry run
 *         APPLY=1 node scripts/prefix-classes.mjs <files...>
 *         DUMP=1  node scripts/prefix-classes.mjs <files...>   # tokens only
 */
import ts from "typescript";
import { readFileSync, writeFileSync } from "node:fs";

const PREFIX = "rst:";

/**
 * `dark` is not Roster's to rename. It is the class the *consuming document*
 * carries, and Roster's own `@custom-variant dark (&:where(.dark, .dark *))`
 * matches it literally. Button applies it directly for `surface="dark"`, on the
 * reasoning that an element carrying `.dark` satisfies its own variant —
 * prefixing that to `rst:dark` would match nothing and silently kill the prop.
 * `light` is its counterpart in the stories, marking a forced-light panel.
 */
const NEVER = new Set(["dark", "light"]);

function prefixTokens(text) {
  return text
    .split(/(\s+)/)
    .map((tok) => {
      if (!tok.trim()) return tok;
      if (tok.startsWith(PREFIX)) return tok;
      if (NEVER.has(tok)) return tok;
      // Utilities start with a letter, a bracketed arbitrary variant, or a
      // negative sign. Anything else is not ours to rename.
      if (!/^[a-zA-Z[-]/.test(tok)) return tok;
      return PREFIX + tok;
    })
    .join("");
}

/**
 * `cva()` is not uniformly class-bearing, and treating it as if it were is how
 * a codemod quietly breaks a component library. Its shape is
 *
 *   cva(base, { variants: { size: { sm: "<classes>" } },
 *               defaultVariants: { size: "sm" },
 *               compoundVariants: [{ size: "sm", class: "<classes>" }] })
 *
 * so `"sm"` appears both as a class list and as a variant *selector*. Prefixing
 * the selectors turns `defaultVariants: { size: "sm" }` into `"rst:sm"`, which
 * matches no variant and silently drops the styling. Only `base`, the leaves of
 * `variants`, and `class`/`className` inside `compoundVariants` carry classes.
 */
const CLASS_KEYS = new Set(["class", "className"]);

/**
 * Headless UI's `Transition` takes its animation states as class strings on
 * their own props, not on `className`, so they are just as much Roster's
 * styling as anything in a cva block — and just as collidable.
 */
const CLASS_ATTRS = new Set([
  "className",
  "enter", "enterFrom", "enterTo",
  "leave", "leaveFrom", "leaveTo",
]);
const keyOf = (prop) => prop.name?.getText().replace(/["']/g, "") ?? "";

function run(file) {
  const src = readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits = [];

  /**
   * A class list and a variant name are both just strings, and inside `cn()`
   * they sit inches apart:
   *
   *   cn(variant === "card" ? "text-error-800/80" : "text-gray-500")
   *
   * The first is a comparison operand and must be left alone — prefixing it
   * rewrites the condition to `variant === "rst:card"`, which is never true, so
   * the component silently takes the wrong branch forever. Same for the
   * `theme === "dark"` checks. Only the branches are classes.
   */
  const EQUALITY = new Set([
    ts.SyntaxKind.EqualsEqualsEqualsToken,
    ts.SyntaxKind.ExclamationEqualsEqualsToken,
    ts.SyntaxKind.EqualsEqualsToken,
    ts.SyntaxKind.ExclamationEqualsToken,
  ]);

  const isSelector = (node) => {
    const parent = node.parent;
    if (!parent) return false;
    if (ts.isBinaryExpression(parent) && EQUALITY.has(parent.operatorToken.kind)) return true;
    if (ts.isCaseClause(parent)) return true;
    if (ts.isPropertyAccessExpression(parent) || ts.isElementAccessExpression(parent)) return true;
    return false;
  };

  function collect(node) {
    if (isSelector(node)) return;
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const before = node.text;
      const after = prefixTokens(before);
      if (after !== before) {
        edits.push({ start: node.getStart() + 1, end: node.getEnd() - 1, before, after });
      }
      return;
    }
    if (ts.isTemplateExpression(node)) {
      for (const part of [node.head, ...node.templateSpans.map((s) => s.literal)]) {
        const before = part.text;
        const after = prefixTokens(before);
        if (after !== before) {
          const trailing = ts.isTemplateTail(part) || ts.isNoSubstitutionTemplateLiteral(part) ? 1 : 2;
          edits.push({ start: part.getStart() + 1, end: part.getEnd() - trailing, before, after });
        }
      }
      node.templateSpans.forEach((s) => ts.forEachChild(s.expression, walk));
      return;
    }
    ts.forEachChild(node, collect);
  }

  function cva(call) {
    const [base, config] = call.arguments;
    if (base) collect(base);
    if (!config || !ts.isObjectLiteralExpression(config)) return;
    for (const prop of config.properties) {
      if (!ts.isPropertyAssignment(prop)) continue;
      const key = keyOf(prop);
      if (key === "variants" && ts.isObjectLiteralExpression(prop.initializer)) {
        for (const group of prop.initializer.properties) {
          if (!ts.isPropertyAssignment(group)) continue;
          if (!ts.isObjectLiteralExpression(group.initializer)) continue;
          for (const leaf of group.initializer.properties) {
            if (ts.isPropertyAssignment(leaf)) collect(leaf.initializer);
          }
        }
      } else if (key === "compoundVariants" && ts.isArrayLiteralExpression(prop.initializer)) {
        for (const entry of prop.initializer.elements) {
          if (!ts.isObjectLiteralExpression(entry)) continue;
          for (const field of entry.properties) {
            if (ts.isPropertyAssignment(field) && CLASS_KEYS.has(keyOf(field))) {
              collect(field.initializer);
            }
          }
        }
      }
      /* defaultVariants is deliberately skipped: selectors, never classes. */
    }
  }

  function walk(node) {
    if (ts.isCallExpression(node)) {
      const name = node.expression.getText();
      /* `expect(el).not.toHaveClass(...)` — match the matcher, not the chain. */
      const matcher = name.split(".").pop();
      if (name === "cva") return cva(node);
      if (name === "cn" || name === "clsx" || name === "twMerge") {
        return node.arguments.forEach(collect);
      }
      /* Deliberately only `toHaveClass`. The lone `toContain` in the suite
         asserts a mask-image value, and prefixing it would be nonsense. */
      if (matcher === "toHaveClass") return node.arguments.forEach(collect);
    }
    if (ts.isJsxAttribute(node) && CLASS_ATTRS.has(node.name.getText())) {
      return node.initializer ? collect(node.initializer) : undefined;
    }
    /**
     * Lookup maps: `const MAX_HEIGHT: Record<Size, string> = { md: "max-h-24" }`.
     * A third way this codebase stores classes, alongside cva and className, and
     * the one that looks least like styling. Gated on the `Record<…, string>`
     * annotation and on every value being a string literal, so an ordinary
     * config object is never touched.
     */
    if (ts.isVariableDeclaration(node) && node.type && node.initializer) {
      const isRecordOfString = /^Record<[^>]*,\s*string\s*>$/.test(node.type.getText());
      if (isRecordOfString && ts.isObjectLiteralExpression(node.initializer)) {
        const props = node.initializer.properties;
        const allStrings = props.every(
          (p) => ts.isPropertyAssignment(p) && ts.isStringLiteral(p.initializer),
        );
        if (allStrings) return props.forEach((p) => collect(p.initializer));
      }
    }
    ts.forEachChild(node, walk);
  }

  ts.forEachChild(sf, walk);
  if (!edits.length) return null;

  edits.sort((a, b) => b.start - a.start);
  let out = src;
  for (const e of edits) out = out.slice(0, e.start) + e.after + out.slice(e.end);
  if (process.env.APPLY === "1") writeFileSync(file, out);
  return { file, edits };
}

const results = process.argv.slice(2).map(run).filter(Boolean);

if (process.env.DUMP === "1") {
  const toks = new Set();
  for (const r of results) {
    for (const e of r.edits) for (const t of e.before.split(/\s+/).filter(Boolean)) toks.add(t);
  }
  console.log(JSON.stringify([...toks].sort()));
} else {
  const total = results.reduce((n, r) => n + r.edits.length, 0);
  console.log(`${process.env.APPLY === "1" ? "APPLIED" : "DRY RUN"}: ${results.length} files, ${total} strings`);
  for (const r of results.slice(0, 2)) {
    const s = r.edits[r.edits.length - 1];
    console.log(`\n  ${r.file}\n    - ${s.before.slice(0, 88)}\n    + ${s.after.slice(0, 88)}`);
  }
}
