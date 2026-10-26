/* Marks a rejection without relying on `instanceof`, which fails when the
   error was made by another copy of this module (two bundles, or two
   versions of the library on one page). `Symbol.for` is one registry for the
   whole page, so every copy reads the same symbol. */
const MARK = Symbol.for("@blakesteve/roster/file-upload-rejection");

/**
 * Throw this from FileUpload's `upload`, or reject with it, when the file can
 * never be added: the server says it isn't a photo, its type is refused, it
 * can't be decoded. The file ends `rejected`, as a file turned away on picking
 * does: "Not added." with this message as the reason, no Try again, and its
 * place in `maxFiles` freed. A plain `Error` still means the upload failed and
 * can be tried again.
 *
 * ```ts
 * upload={async (file, { signal }) => {
 *   const response = await fetch("/photos", { method: "POST", body: file, signal });
 *   if (response.status === 415) throw new FileUploadRejection("That isn't a photo.");
 *   if (!response.ok) throw new Error("The server is busy.");
 *   return (await response.json()).id;
 * }}
 * ```
 *
 * No React in this module, so a server-side helper can make one too.
 */
export class FileUploadRejection extends Error {
  constructor(reason: string, options?: ErrorOptions) {
    super(reason, options);
    this.name = "FileUploadRejection";
    Object.defineProperty(this, MARK, { value: true });
  }
}

/** Whether `error` says the file can never be added: a `FileUploadRejection` from any copy of this module. */
export const isFileUploadRejection = (error: unknown): boolean =>
  error instanceof FileUploadRejection || (typeof error === "object" && error !== null && MARK in error);
