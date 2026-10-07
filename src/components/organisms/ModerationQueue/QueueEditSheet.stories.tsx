import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../../atoms/Button/Button";
import { Input } from "../../atoms/Input/Input";
import { Textarea } from "../../atoms/Textarea/Textarea";
import { RadioGroup } from "../../molecules/RadioGroup/RadioGroup";
import { QueueEditSheet } from "./QueueEditSheet";

const meta = {
  title: "Organisms/ModerationQueue/QueueEditSheet",
  component: QueueEditSheet,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Shows a ModerationQueue edit step in a Sheet, for a long form that wants the room on a phone. You don't render it yourself: pass it as an edit action's `surface`, and the queue renders it with the step's title, your form and its buttons.\n\nThe submit button sits in the Sheet's header, where its actions go, and Cancel is the Sheet's own close button, so there's one way out rather than two side by side. While a decision is in flight it doesn't close. It's a separate export so a queue that never edits in a Sheet never ships one.",
      },
    },
  },
  args: {
    open: false,
    title: "Enrich before publishing",
    busy: false,
    onCancel: () => {},
    onAfterClose: () => {},
    children: null,
    submitButton: null,
    cancelButton: null,
  },
} satisfies Meta<typeof QueueEditSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/* A decision takes a moment, like a request. While it's in flight the
   Sheet holds; then it lands and closes. */
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
  const [title, setTitle] = useState("Overnight rye loaf");
  const [category, setCategory] = useState("Baking");
  const [method, setMethod] = useState(
    "Mix rye, bread flour, salt and a spoon of starter the night before. Shape in the morning and bake hot in a covered pot.",
  );
  return (
    <>
      <Button onClick={() => setOpen(true)}>Edit and list</Button>
      <QueueEditSheet
        open={open}
        title="Tidy it up before listing"
        description="Fix typos and trim. Keep the cook's own words."
        busy={busy}
        onCancel={() => setOpen(false)}
        onAfterClose={() => {}}
        cancelButton={null}
        submitButton={
          <Button size="lg" colorScheme="success" isLoading={busy} onClick={decide}>
            List it
          </Button>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 16 }}>
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <RadioGroup
            label="Category"
            orientation="horizontal"
            value={category}
            onChange={setCategory}
            options={["Soups", "Baking", "Salads", "Preserves"].map((c) => ({ value: c, label: c }))}
          />
          <Textarea label="Method" rows={6} value={method} onChange={(e) => setMethod(e.target.value)} />
        </div>
      </QueueEditSheet>
    </>
  );
}

export const Default: Story = {
  render: () => <Demo />,
  parameters: {
    docs: {
      description: {
        story:
          "A longer form, with room to breathe. Press **List it** in the header: for a moment the decision is in flight and the Sheet holds, then it lands and closes. The close button, Escape and a drag down close it at any other time.",
      },
    },
  },
};
