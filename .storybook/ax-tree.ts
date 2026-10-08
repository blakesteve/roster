/**
 * Reads Chromium's accessibility tree for an element in the story under test:
 * its role, its name, its description, and its invalid, disabled and busy states, as a screen
 * reader is handed them. An attribute in the DOM is what the page asked for; this is what the
 * browser made of it, which is what a requirement about "announced as invalid"
 * is actually about.
 *
 * Runs in the test runner's Node process over the Chrome DevTools Protocol,
 * like ./real-input.ts, and is handed to stories the same way.
 */
import type { BrowserCommand } from "vitest/node";

type AXValue = { value?: unknown };
type AXProperty = { name: string; value: AXValue };
type AXNode = { role?: AXValue; name?: AXValue; description?: AXValue; properties?: AXProperty[]; ignored?: boolean };
type DOMNode = {
  nodeId: number;
  nodeName: string;
  children?: DOMNode[];
  contentDocument?: DOMNode;
};

export type AXState = {
  role: string;
  name: string;
  description: string;
  invalid: string | null;
  ignored: boolean;
  disabled: boolean;
  busy: boolean;
};

function documents(node: DOMNode, out: DOMNode[] = []): DOMNode[] {
  if (node.nodeName === "#document") out.push(node);
  if (node.contentDocument) documents(node.contentDocument, out);
  for (const child of node.children ?? []) documents(child, out);
  return out;
}

/* One DevTools session per page, kept rather than opened per call. Calls on
   one page must not overlap: `DOM.getDocument` invalidates the node ids an
   earlier call is still using. Each page runs one story file at a time, so
   today they can't. */
type Page = Parameters<BrowserCommand>[0]["page"];
type Session = Awaited<ReturnType<ReturnType<Page["context"]>["newCDPSession"]>>;
const sessions = new WeakMap<Page, Promise<Session>>();
function sessionFor(page: Page): Promise<Session> {
  let session = sessions.get(page);
  if (!session) {
    session = page.context().newCDPSession(page);
    sessions.set(page, session);
  }
  return session;
}

/** The work itself, on one session. */
async function read(session: Session, selectors: string[]): Promise<AXState[]> {
  /* No `Accessibility.enable`: it turns accessibility on for the whole page,
     and `getPartialAXTree` doesn't need it. */
  await session.send("DOM.enable");
  const { root } = (await session.send("DOM.getDocument", { depth: -1, pierce: true })) as { root: DOMNode };
  const docs = documents(root);
  const results: AXState[] = [];
  for (const selector of selectors) {
    let nodeId = 0;
    for (const doc of docs) {
      const found = (await session.send("DOM.querySelector", { nodeId: doc.nodeId, selector })) as { nodeId: number };
      if (found.nodeId) {
        nodeId = found.nodeId;
        break;
      }
    }
    if (!nodeId) throw new Error(`ax-tree: ${selector} not found in any document`);
    const { nodes } = (await session.send("Accessibility.getPartialAXTree", { nodeId, fetchRelatives: false })) as {
      nodes: AXNode[];
    };
    const node = nodes[0] ?? {};
    const prop = (name: string) => node.properties?.find((p) => p.name === name)?.value.value;
    const invalid = prop("invalid");
    results.push({
      role: String(node.role?.value ?? ""),
      name: String(node.name?.value ?? ""),
      description: String(node.description?.value ?? ""),
      invalid: invalid === undefined ? null : String(invalid),
      ignored: !!node.ignored,
      /* Chromium reports `busy` as 1 rather than true. */
      disabled: !!prop("disabled"),
      busy: !!prop("busy"),
    });
  }
  return results;
}

/**
 * The accessibility tree's view of each element matching `selectors`, in
 * order, from one walk of the page's DOM.
 *
 * Found by searching every document in the page rather than through the
 * test's frame handle, which the runner can replace and which came back
 * detached in a full run. Tag each element with a fresh id first, so the
 * selector can only match it.
 *
 * The stories that call this run in their own project, after every other
 * (vite.config.ts): at the start of a full parallel run the page didn't
 * answer the DevTools protocol for 15s and more, where run alone each read
 * takes milliseconds.
 */
export const axStates: BrowserCommand<[selectors: string[]]> = async (context, selectors): Promise<AXState[]> =>
  read(await sessionFor(context.page), selectors);

export const axCommands = { axStates };

declare module "vitest/browser" {
  interface BrowserCommands {
    axStates: (selectors: string[]) => Promise<AXState[]>;
  }
}
