import type { Meta, StoryObj } from "@storybook/react-vite";
import { Pullquote } from "./Pullquote";

const meta = {
  title: "Molecules/Pullquote",
  component: Pullquote,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "A line lifted out of running prose and given room.",
          "",
          "**Markup.** `<figure>` + `<blockquote>` + `<figcaption>`, which is the pairing the HTML spec provides for a quote with attribution. A styled `<div>` would look identical and would lose the association between the quote and its source for assistive tech.",
          "",
          "**The `cite` slot is not only for people.** In technical writing the most useful attribution is often a *reason* rather than a speaker — *\"Why it took a while to spot\"*, *\"The tradeoff\"*, *\"What the metrics said\"*. The slot takes any node, so use it for whichever the sentence actually needs.",
          "",
          "**`cite` versus `citeUrl`.** `cite` is the visible caption. `citeUrl` is the machine-readable source URL, which lands on the `<blockquote cite>` attribute where the spec expects it. They are separate because the text you want to show and the URL you want to record are rarely the same string.",
          "",
          "**Width.** The quote is capped at `48ch` regardless of its container, because a pullquote that runs the full width of a wide column stops being a pullquote and becomes a paragraph in a bigger font.",
        ].join("\n"),
      },
    },
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["rule", "plain", "centered"] },
    colorScheme: {
      control: "select",
      options: ["primary", "success", "error", "amber", "neutral", "current"],
    },
    cite: { control: "text" },
    citeUrl: { control: "text" },
  },
} satisfies Meta<typeof Pullquote>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    children:
      "A login wall on a poll about game controllers would have killed the sample size.",
    cite: "Why votes are anonymous",
  },
};

export const Variants: Story = {
  args: { children: "placeholder" },
  render: () => (
    <div className="rst:flex rst:max-w-2xl rst:flex-col rst:gap-10">
      <Pullquote variant="rule" cite="rule — the default">
        The rule gives the quote a left edge to hang from, which is enough to
        separate it from the paragraph above without a full break in the page.
      </Pullquote>
      <Pullquote variant="plain" cite="plain">
        No rule at all. The size does the separating, which suits a page that
        already has a lot of vertical lines in it.
      </Pullquote>
      <Pullquote variant="centered" cite="centered">
        Centered, for a quote that earns a whole break in the page rather than a
        pause inside one.
      </Pullquote>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "`rule` is the default because it is the quietest option that still reads as a lift-out. Reserve `centered` for the one quote per page that is meant to stop you.",
      },
    },
  },
};

export const ColorSchemes: Story = {
  args: { children: "placeholder" },
  render: () => (
    <div className="rst:flex rst:max-w-2xl rst:flex-col rst:gap-8">
      <Pullquote colorScheme="primary" cite="primary">
        The default accent.
      </Pullquote>
      <Pullquote colorScheme="neutral" cite="neutral">
        For prose with several pullquotes, where a colored rule on each would
        turn the page into a highlighter.
      </Pullquote>
      <Pullquote colorScheme="success" cite="success">
        For a quote that reports something that went right.
      </Pullquote>
      <Pullquote colorScheme="error" cite="error">
        For a quote about what broke.
      </Pullquote>
      <Pullquote colorScheme="amber" cite="amber">
        For a caveat.
      </Pullquote>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The scheme colors the rule only; the quote text stays at full contrast in every case. That is deliberate — a pullquote is body copy that has been promoted, and tinting it would demote it again.",
      },
    },
  },
};

export const WithoutAttribution: Story = {
  args: { children: "placeholder" },
  render: () => (
    <div className="rst:max-w-2xl">
      <Pullquote>
        Not every lifted line has a source worth naming. Leave `cite` off and the
        figcaption is not rendered at all.
      </Pullquote>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "With no `cite`, no `<figcaption>` is emitted — you get an empty-caption-free figure rather than a stray blank line under the quote.",
      },
    },
  },
};

export const WithSourceUrl: Story = {
  args: { children: "placeholder" },
  render: () => (
    <div className="rst:max-w-2xl">
      <Pullquote
        cite="MDN — the blockquote element"
        citeUrl="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/blockquote"
      >
        The cite attribute holds a URL that designates a source document for the
        quoted material.
      </Pullquote>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "`citeUrl` sets `<blockquote cite>`. Browsers do not surface it visually, which is exactly why the visible caption is a separate prop — if you want the source clickable, put a link in `cite` as well.",
      },
    },
  },
};

export const InProse: Story = {
  args: { children: "placeholder" },
  render: () => (
    <div className="rst:max-w-prose rst:space-y-4 rst:text-[0.9375rem] rst:leading-relaxed rst:text-gray-700 rst:dark:text-gray-300">
      <p className="rst:m-0">
        Game Verdict asks one question — controller or keyboard — and the answer
        is only interesting if enough people answer it. Which made the login
        screen the most expensive component on the site.
      </p>
      <Pullquote cite="Why votes are anonymous">
        A login wall on a poll about game controllers would have killed the
        sample size.
      </Pullquote>
      <p className="rst:m-0">
        So votes are keyed to a browser fingerprint instead. It is not perfect:
        the same person on a phone and a laptop counts twice. At this scale that
        is cheaper than the votes that would never have been cast.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The intended use. The `my-1` default is small on purpose — the surrounding prose owns the vertical rhythm, and a pullquote that punches its own hole in the flow tends to fight whatever `space-y-*` the article is using.",
      },
    },
  },
};

export const InheritsColor: Story = {
  args: { children: "placeholder" },
  render: () => (
    <div className="rst:max-w-2xl rst:text-purple-600 rst:dark:text-purple-400">
      <Pullquote colorScheme="current" cite="Tinted by the parent">
        `current` inherits the rule color from whatever wraps it, which is how a
        page paints every quote in a per-project accent it works out at runtime.
      </Pullquote>
    </div>
  ),
};

export const DarkMode: Story = {
  args: { children: "placeholder" },
  render: () => (
    <div className="dark">
      <div className="rst:flex rst:flex-col rst:gap-8 rst:rounded-xl rst:bg-gray-950 rst:p-6">
        <Pullquote cite="Why votes are anonymous">
          A login wall on a poll about game controllers would have killed the
          sample size.
        </Pullquote>
        <Pullquote variant="centered" colorScheme="neutral" cite="The tradeoff">
          The same person on a phone and a laptop counts twice.
        </Pullquote>
      </div>
    </div>
  ),
};
