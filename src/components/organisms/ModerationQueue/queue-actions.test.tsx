import { describe, expect, it } from "vitest";
import { ModerationQueue } from "./ModerationQueue";
import { editAction, type QueueAction } from "./queue-actions";

/**
 * Typed drafts. An edit action's `run` receives the draft as the type its
 * `initial` makes, so a form, a validation rule and a request can't disagree
 * about what a draft holds.
 *
 * Most of this file is checked by the compiler, not by running it: `tsc -b`
 * reads tests too. Each `@ts-expect-error` marks a line that must NOT compile,
 * and is itself an error if the line ever does. So if drafts quietly became
 * `any`, every one of them would fail the build. The lines without one are
 * the twins: the same shapes, agreeing, which must compile.
 */

type Recipe = { id: string; title: string; body: string };

const Form = () => null;

describe("typed drafts", () => {
  it("gives run, validate and the form the draft initial makes", () => {
    const actions: QueueAction<Recipe>[] = [
      editAction({
        id: "edit",
        label: "Edit and list",
        edit: {
          title: "Edit before listing",
          submitLabel: "List it",
          initial: (r) => ({ title: r.title, tags: [] as string[] }),
          Form,
          validate: (d) => (d.tags.length > 3 ? "Three tags at most." : undefined),
        },
        run: async (r, { draft }) => {
          const title: string = draft.title;
          const tags: string[] = draft.tags;
          void [r.id, title, tags];
        },
      }),

      editAction({
        id: "misread",
        label: "Edit",
        edit: { title: "Edit", submitLabel: "Save", initial: (r) => ({ title: r.title }), Form },
        // @ts-expect-error the draft has no `body`: run reads a field initial never makes
        run: async (_r, { draft }) => void draft.body,
      }),

      editAction({
        id: "mistyped",
        label: "Edit",
        edit: { title: "Edit", submitLabel: "Save", initial: (r) => ({ title: r.title }), Form },
        run: async (_r, { draft }) => {
          // @ts-expect-error the draft's title is a string, not a number
          const n: number = draft.title;
          void n;
        },
      }),

      editAction({
        id: "invalid",
        label: "Edit",
        edit: {
          title: "Edit",
          submitLabel: "Save",
          initial: (r) => ({ title: r.title }),
          Form,
          // @ts-expect-error validate reads a field the draft doesn't have
          validate: (d) => (d.tags.length ? undefined : "Add a tag."),
        },
        run: async () => {},
      }),

      // @ts-expect-error a literal edit action, without editAction, could only type its draft `any`
      { id: "literal", label: "Edit", edit: { title: "Edit", submitLabel: "Save", initial: () => ({}), Form }, run: async () => {} },

      /* The other kinds are plain objects, and get their own input types. */
      {
        id: "reject",
        label: "Reject",
        reason: { prompt: "Why?", options: [{ value: "dup", label: "Duplicate" }] },
        run: async (_r, { reason }) => void reason?.value?.toUpperCase(),
      },
    ];
    expect(actions.map((a) => a.id)).toEqual(["edit", "misread", "mistyped", "invalid", "literal", "reject"]);
  });

  it("keeps a checked action's draft out of reach", () => {
    const checked = editAction<Recipe, { title: string }>({
      id: "edit",
      label: "Edit",
      edit: { title: "Edit", submitLabel: "Save", initial: (r) => ({ title: r.title }), Form },
      run: async () => {},
    });
    /* What a queue shows is still there. */
    const shown: string = checked.edit.submitLabel;
    // @ts-expect-error read back, the draft would be `any`; the checked action doesn't expose it
    void checked.edit.initial;
    const respread: QueueAction<Recipe>[] = [
      // @ts-expect-error a spread with a new `initial` would skip the check editAction made
      { ...checked, edit: { ...checked.edit, initial: () => 42 } },
    ];
    expect([shown, respread.length]).toEqual(["Save", 1]);
  });

  it("infers the item type from the queue's items, through the builder", () => {
    /* Inline in JSX, the function form is the one that types: its `edit` is
       bound to the queue's item type, which a free-standing editAction in
       an array can't see yet when it's checked. */
    const items: Recipe[] = [{ id: "1", title: "Lentil soup", body: "" }];
    const queue = (
      <ModerationQueue
        label="Waiting for review"
        items={items}
        getKey={(r) => r.id}
        itemLabel={(r) => r.title}
        renderContent={(r) => r.body}
        actions={(a) => [
          a.edit({
            id: "edit",
            label: "Edit",
            edit: { title: "Edit", submitLabel: "Save", initial: (r) => ({ title: r.title }), Form },
            run: async (r, { draft }) => void [r.id, draft.title],
          }),
          a.edit({
            id: "edit-wrong",
            label: "Edit",
            edit: { title: "Edit", submitLabel: "Save", initial: (r) => ({ title: r.title }), Form },
            // @ts-expect-error the draft has no `tags`
            run: async (_r, { draft }) => void draft.tags,
          }),
          // @ts-expect-error a field the item doesn't have
          { id: "bad", label: "Bad", run: async (r) => void r.author },
        ]}
      />
    );
    expect(queue).toBeTruthy();
  });
});
