import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../../atoms/Button/Button";
import { Input } from "../../atoms/Input/Input";
import { Textarea } from "../../atoms/Textarea/Textarea";
import { QueueEditDialog } from "./QueueEditDialog";

const meta = {
  title: "Organisms/ModerationQueue/QueueEditDialog",
  component: QueueEditDialog,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Shows a ModerationQueue edit step in a Dialog. You don't render it yourself: pass it as an edit action's `surface`, and the queue renders it with the step's title, your form, its validation message, and the Cancel and submit buttons.\n\n```tsx\na.edit({ id: \"edit\", label: \"Edit and list\",\n  edit: { title: \"Tidy it up\", submitLabel: \"List it\", surface: QueueEditDialog,\n          initial: (r) => ({ title: r.title }), Form: TitleForm },\n  run: (r, { draft }) => api.list(r.id, draft) })\n```\n\nIt's a separate export so a queue that never edits in a Dialog never ships one. While a decision is in flight it doesn't close, so the outcome always has somewhere to show. The stories below render it on its own to show what the queue hands it.",
      },
    },
  },
  args: {
    open: false,
    title: "Tidy it up before listing",
    busy: false,
    onCancel: () => {},
    onAfterClose: () => {},
    children: null,
    submitButton: null,
    cancelButton: null,
  },
} satisfies Meta<typeof QueueEditDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/* A decision takes a moment, like a request. While it's in flight the
   Dialog holds; then it lands and closes. */
const DECIDING_MS = 1500;

function Demo() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const decide = () => {
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setOpen(false);
    }, DECIDING_MS);
  };
  const [title, setTitle] = useState("Smoky red lentil soup");
  const [method, setMethod] = useState("Sweat an onion with cumin, add red lentils and stock, simmer, finish with lemon.");
  return (
    <>
      <Button onClick={() => setOpen(true)}>Edit and list</Button>
      <QueueEditDialog
        open={open}
        title="Tidy it up before listing"
        description="Fix typos and trim. Keep the cook's own words."
        busy={busy}
        onCancel={() => setOpen(false)}
        onAfterClose={() => {}}
        cancelButton={
          <Button size="lg" variant="ghost" colorScheme="neutral" disabled={busy} onClick={() => setOpen(false)}>
            Cancel
          </Button>
        }
        submitButton={
          <Button size="lg" colorScheme="success" isLoading={busy} onClick={decide}>
            List it
          </Button>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea label="Method" rows={4} value={method} onChange={(e) => setMethod(e.target.value)} />
        </div>
      </QueueEditDialog>
    </>
  );
}

export const Default: Story = {
  render: () => <Demo />,
  parameters: {
    docs: {
      description: {
        story:
          "Open it, edit, and press **List it**. For a moment the decision is in flight: the button spins, Cancel waits, and Escape, the backdrop and the close button leave the Dialog open, so the outcome has somewhere to show. Then it lands and the Dialog closes. Cancel, Escape and the close button all close it at any other time.",
      },
    },
  },
};
