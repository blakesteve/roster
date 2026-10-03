import * as React from "react";

/**
 * What a title says, for telling whether it changed: its text, and for a
 * component inside it, the component's name and its plain props (a date
 * included), so `<NightDate date={d} />` says something even with no
 * children. Styling is not content: `className` and `style` never count, on a
 * component or an element. A component whose words change with nothing in its
 * props (it reads a context, say) is invisible here; pass `contentKey`.
 */
export function titleSignature(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number" || typeof node === "bigint") return String(node);
  if (Array.isArray(node)) return node.map(titleSignature).join("");
  if (React.isValidElement(node)) {
    const { children, ...props } = node.props as { children?: React.ReactNode } & Record<string, unknown>;
    if (typeof node.type === "string") return titleSignature(children);
    const type = node.type as { displayName?: string; name?: string };
    const own = Object.entries(props)
      .filter(([key]) => key !== "className" && key !== "style")
      .map(([key, value]) => {
        if (value instanceof Date) return `${key}=${value.toISOString()}`;
        if (["string", "number", "boolean", "bigint"].includes(typeof value)) return `${key}=${String(value)}`;
        return null;
      })
      .filter(Boolean)
      .join(",");
    return `<${type.displayName ?? type.name ?? "?"}${own ? ` ${own}` : ""}>` + titleSignature(children);
  }
  return "";
}
