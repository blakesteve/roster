/**
 * FileUpload's rows as 5.24 drew them, made from rows drawn now: the two
 * wrappers that let a row wrap taken out (the box around the name and the
 * buttons, and the buttons' own box), and the three classes they came with
 * put back. Nothing else differs, which `FileUpload.unchanged.checks` proves
 * by reading today's fields through it against 5.15's digests.
 *
 * It changes `root` in place, so it's for a copy: a field's HTML, or a twin
 * row measured beside the real one.
 */
export function asRows524(root: ParentNode) {
  for (const li of root.querySelectorAll("[data-file-item]")) {
    li.classList.remove("rst:flex-wrap");
    const body = li.querySelector(":scope > [data-file-body]");
    const actions = body?.querySelector(":scope > [data-file-actions]");
    if (!body || !actions) throw new Error("asRows524: a row without its two wrappers");
    actions.replaceWith(...actions.childNodes);
    body.replaceWith(...body.childNodes);
    li.querySelector(":scope > div")!.classList.replace("rst:flex-[1_1_5rem]", "rst:flex-1");
    li.querySelector("[data-file-status] > span")!.removeAttribute("class");
  }
}

/** The two wrappers, which 5.24's rows didn't have. */
export const isRowWrapper = (el: Element) => el.hasAttribute("data-file-body") || el.hasAttribute("data-file-actions");
