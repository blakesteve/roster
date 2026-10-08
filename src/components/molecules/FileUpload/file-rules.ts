/**
 * The rules FileUpload checks a picked or dropped file against, kept apart
 * from the component so they can be tested on their own.
 */

/* What a file's extension says its type is, for the files that arrive with
   none. Some cloud-backed picks on Android hand over a File whose `type` is
   empty, and a check that trusted `type` alone would turn a real photo away. */
const BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  jfif: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  heic: "image/heic",
  heif: "image/heif",
  bmp: "image/bmp",
  tif: "image/tiff",
  tiff: "image/tiff",
  pdf: "application/pdf",
};

const extensionOf = (name: string) => {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
};

/** The file's type as reported, or as its extension implies when none is. */
export function typeOf(file: Pick<File, "name" | "type">): string {
  return (file.type || BY_EXTENSION[extensionOf(file.name)] || "").toLowerCase();
}

/**
 * Whether `file` matches one of `accepted`, written the way an `accept`
 * attribute is: a type (`image/png`), a family (`image/*`) or an extension
 * (`.png`). An empty list accepts anything.
 */
export function matchesType(file: Pick<File, "name" | "type">, accepted: readonly string[]): boolean {
  if (accepted.length === 0) return true;
  const type = typeOf(file);
  const ext = extensionOf(file.name);
  return accepted.some((raw) => {
    const rule = raw.trim().toLowerCase();
    if (!rule) return false;
    if (rule.startsWith(".")) return ext === rule.slice(1);
    if (rule.endsWith("/*")) return type.startsWith(rule.slice(0, -1));
    return type === rule;
  });
}

/** An `accept` attribute's value, as a list. */
export const acceptList = (accept: string) => accept.split(",").map((s) => s.trim()).filter(Boolean);

/** The same file picked twice: same name, size and modified time. */
export const sameFile = (a: File, b: File) =>
  a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;

/**
 * A byte count as a short size: "820 KB", "2.4 MB". In units of 1,024, the way
 * a limit is usually written (`15 * 1024 * 1024`), so that limit reads back as
 * "15 MB" rather than "15.7 MB".
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  const mb = bytes / (1024 * 1024);
  return `${mb < 9.95 ? mb.toFixed(1).replace(/\.0$/, "") : Math.round(mb)} MB`;
}
