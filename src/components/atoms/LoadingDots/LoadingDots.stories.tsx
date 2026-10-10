import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { LoadingDots } from "./LoadingDots";

const meta = {
  title: "Atoms/LoadingDots",
  component: LoadingDots,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "Three dots for a model that's generating and hasn't sent anything yet. Reserved for that: a conversational surface, before the first token. For anything else waiting, use Spinner, Progress or a Skeleton.",
          "",
          "It stands in for text, so it takes the size and color of the text around it, and it goes the moment the first token arrives: render the text **instead of** it, never beside it.",
          "",
          "At rest the dots read 1, 0.6 and 0.3, a still frame of movement, which is also what reduced motion shows. A screen reader hears `label` (\"Loading\" by default; say what's coming, like \"Writing a reply\").",
        ].join("\n"),
      },
    },
  },
} satisfies Meta<typeof LoadingDots>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 32, alignItems: "baseline", flexWrap: "wrap" }}>
      <span style={{ fontSize: 14 }}>
        <LoadingDots label="Writing a reply" />
      </span>
      <span style={{ fontSize: 20 }}>
        <LoadingDots label="Writing a reply" />
      </span>
      <span style={{ fontSize: 28, color: "#0a4f7a" }}>
        <LoadingDots label="Writing a reply" />
      </span>
    </div>
  ),
  parameters: { docs: { description: { story: "Sized and colored by the text around it." } } },
};

function Reply() {
  const [text, setText] = useState("");
  const full = "The ridge loop is clear to the saddle; expect mud past the second creek.";
  useEffect(() => {
    let i = 0;
    let t: ReturnType<typeof setTimeout>;
    const step = () => {
      i = i >= full.length ? 0 : i + 3;
      setText(i === 0 ? "" : full.slice(0, i));
      t = setTimeout(step, i === 0 ? 2000 : 60);
    };
    t = setTimeout(step, 2000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{ maxWidth: 420, padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(127,127,127,.35)", fontSize: 14, lineHeight: "20px", minHeight: 20 }}>
      {text ? text : <LoadingDots label="Writing a reply" />}
    </div>
  );
}

export const ReplacedByTheReply: Story = {
  render: () => <Reply />,
  parameters: { docs: { description: { story: "The dots hold the reply's place until its first words arrive, then the words replace them." } } },
};
