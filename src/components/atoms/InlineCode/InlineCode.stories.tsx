import type { Meta, StoryObj } from "@storybook/react-vite";
import { InlineCode } from "./InlineCode";

const meta = {
  title: "Atoms/InlineCode",
  component: InlineCode,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "A `<code>` element for identifiers inside running prose: a prop name, a file path, a CSS custom property, a package.",
          "",
          "**Not for code blocks.** This is a single-line inline element with no scroll, no wrapping strategy, and no syntax highlighting. A multi-line snippet in here will look wrong and behave worse. Use a `<pre>` and a real highlighter for those.",
          "",
          "**Sizing.** It sits at `0.8125rem` rather than `1em`, because a monospace face at the same nominal size as the surrounding text always looks a notch too big. The fixed size keeps every inline code span consistent regardless of what it is nested in.",
        ].join("\n"),
      },
    },
  },
  argTypes: {
    colorScheme: {
      control: "inline-radio",
      options: ["primary", "neutral", "current"],
    },
    surface: { control: "inline-radio", options: ["none", "soft"] },
  },
} satisfies Meta<typeof InlineCode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { children: "useSyncExternalStore" },
};

export const ColorSchemes: Story = {
  args: { children: "placeholder" },
  render: () => (
    <div className="rst:flex rst:flex-col rst:gap-3 rst:text-sm rst:text-gray-700 rst:dark:text-gray-300">
      <p className="rst:m-0">
        Primary: pass <InlineCode>themeMode=&quot;auto&quot;</InlineCode> to the
        navbar.
      </p>
      <p className="rst:m-0">
        Neutral:{" "}
        <InlineCode colorScheme="neutral">themeMode=&quot;auto&quot;</InlineCode>{" "}
        stays inside the sentence.
      </p>
      <p className="rst:m-0 rst:text-purple-600 rst:dark:text-purple-400">
        Current:{" "}
        <InlineCode colorScheme="current">themeMode=&quot;auto&quot;</InlineCode>{" "}
        inherits the paragraph.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "`primary` is the default: it makes identifiers findable when you are scanning a paragraph for the one you need. `neutral` is for prose where code appears so often that tinting it all would turn the page into confetti. `current` inherits, which is how a consuming app tints code to a per-page accent.",
      },
    },
  },
};

export const Surfaces: Story = {
  args: { children: "placeholder" },
  render: () => (
    <div className="rst:flex rst:flex-col rst:gap-3 rst:text-sm rst:text-gray-700 rst:dark:text-gray-300">
      <p className="rst:m-0">
        None: the file lives at <InlineCode>src/index.css</InlineCode> and is
        imported for you.
      </p>
      <p className="rst:m-0">
        Soft: the file lives at{" "}
        <InlineCode surface="soft">src/index.css</InlineCode> and is imported for
        you.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "`none` is the default, and it is the right call in dense technical prose — a page of chips is harder to read than a page of tinted words. Reach for `soft` when code appears rarely enough that each instance should stop the eye, or when it sits on a busy background that a color alone cannot separate it from.",
      },
    },
  },
};

export const InProse: Story = {
  args: { children: "placeholder" },
  render: () => (
    <div className="rst:max-w-prose rst:space-y-3 rst:text-sm rst:leading-relaxed rst:text-gray-700 rst:dark:text-gray-300">
      <p className="rst:m-0">
        Roster wraps its own output in{" "}
        <InlineCode>@layer roster</InlineCode>, declared between{" "}
        <InlineCode>components</InlineCode> and <InlineCode>utilities</InlineCode>
        . That ordering is why your app&apos;s utilities still win, and why
        importing Roster before or after Tailwind stopped mattering.
      </p>
      <p className="rst:m-0">
        The reset is opt-in from{" "}
        <InlineCode>@blakesteve/roster/preflight.css</InlineCode>, so a host app
        with its own normalize is not fighting a second one.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Line height is unaffected: the element sets no vertical padding in the default `none` surface, so a paragraph full of identifiers keeps an even rhythm.",
      },
    },
  },
};

export const LongIdentifiers: Story = {
  args: { children: "placeholder" },
  render: () => (
    <div className="rst:max-w-[22rem] rst:text-sm rst:text-gray-700 rst:dark:text-gray-300">
      <p className="rst:m-0">
        Deep paths such as{" "}
        <InlineCode>src/components/molecules/DescriptionList/DescriptionList.tsx</InlineCode>{" "}
        wrap at the container edge rather than forcing a horizontal scrollbar.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Nothing here prevents wrapping, which is deliberate — a long path breaking across two lines is far better than a paragraph that scrolls sideways. If a specific identifier must stay whole, add `whitespace-nowrap` via `className`.",
      },
    },
  },
};

export const DarkMode: Story = {
  args: { children: "placeholder" },
  render: () => (
    <div className="dark">
      <div className="rst:space-y-3 rst:rounded-xl rst:bg-gray-950 rst:p-6 rst:text-sm rst:text-gray-300">
        <p className="rst:m-0">
          Primary <InlineCode>useKeySequence</InlineCode> in a sentence.
        </p>
        <p className="rst:m-0">
          Neutral{" "}
          <InlineCode colorScheme="neutral">useKeySequence</InlineCode> in a
          sentence.
        </p>
        <p className="rst:m-0">
          Soft surface{" "}
          <InlineCode surface="soft">useKeySequence</InlineCode> in a sentence.
        </p>
      </div>
    </div>
  ),
};
