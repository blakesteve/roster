import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Input } from "./Input";
import { Button } from "../Button/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faEnvelope, faEye } from "@fortawesome/free-solid-svg-icons";

const meta = {
  title: "Atoms/Input",
  component: Input,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A highly versatile **Input** atom powered by Headless UI. It supports leading and trailing icons, built-in labels, helper text, error validation states, and full dark mode compliance across all variants.\n\n**Sizing** matches `Button` exactly — `sm` / `default` / `lg` are `h-9` / `h-10` / `h-11` — so a field and a submit button line up in a row. See *Paired With Button*.\n\n**Theming**: the `outline` variant reads four custom properties — `--roster-input-bg`, `-border`, `-text` and `-border-focus` — so a field can take a host palette without forking the variant. Set all four; leaving `-text` out is the one that bites. See *Themed With Tokens*.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="rst:p-8 rst:space-y-12">
        <div className="light rst:bg-gray-50 rst:p-6 rst:rounded-xl rst:border rst:border-gray-100 rst:shadow-sm">
          <p className="rst:text-[10px] rst:font-bold rst:text-gray-400 rst:mb-6 rst:uppercase rst:tracking-widest">
            Light Mode Preview
          </p>
          <div className="rst:max-w-md">
            <Story />
          </div>
        </div>
        <div className="dark rst:bg-gray-950 rst:p-6 rst:rounded-xl rst:border rst:border-gray-800 rst:shadow-xl">
          <p className="rst:text-[10px] rst:font-bold rst:text-gray-500 rst:mb-6 rst:uppercase rst:tracking-widest">
            Dark Mode Preview
          </p>
          <div className="rst:max-w-md">
            <Story />
          </div>
        </div>
      </div>
    ),
  ],
  argTypes: {
    variant: {
      control: "select",
      options: ["white", "soft", "slate", "outline", "ghost"],
    },
    size: {
      control: "inline-radio",
      options: ["sm", "default", "lg"],
      description: "Matches Button's scale: h-9 / h-10 / h-11.",
    },
    inputClassName: {
      control: false,
      description:
        "Classes for the `<input>` itself. `className` goes to the outer Field wrapper.",
    },
    disabled: { control: "boolean" },
    error: { control: "boolean" },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default standard text field. Clean, bordered, and works well on light or dark backgrounds.
 */
export const DefaultOutline: Story = {
  args: {
    placeholder: "Enter your name...",
    label: "Full Name",
    variant: "outline",
  },
};

/**
 * The `white` variant provides a solid, elevated background. Perfect for placing inside tinted cards or gray backgrounds.
 */
/**
 * Guards the claim that moving `outline` onto tokens changed nothing.
 */
export const DefaultOutlineTokensResolve: Story = {
  tags: ["!autodocs"],
  args: { placeholder: "Enter your name...", label: "Full Name", variant: "outline" },
  play: async ({ canvasElement }) => {
    /* This story is also the only guard on the var() chain itself.
       `check-classes-emit.mjs` proves a class emits a rule; it cannot prove the
       custom property inside an arbitrary value resolves. A typo such as
       `--roster-input-bordr` emits valid CSS, goes invalid at computed-value
       time, and falls back to `currentcolor` — the same silent failure that
       script was written for. Add a fifth token, extend this story.

       The values below are what the `outline` variant rendered BEFORE it read
       tokens, when it hardcoded border-gray-300 / dark:border-gray-700 and
       text-gray-900 / dark:text-gray-100. If a token default drifts, or the
       `.dark` block in index.css is dropped, or the var chain breaks, this
       fails. Class-presence assertions in jsdom cannot see any of that.

       The meta decorator renders every story twice, light then dark, which is
       what makes both scopes reachable from one story. */
    const [light, dark] = [...canvasElement.querySelectorAll("input")];
    expect(light).toBeTruthy();
    expect(dark).toBeTruthy();

    const l = getComputedStyle(light);
    expect(l.borderTopColor).toBe("rgb(214, 211, 209)"); // gray-300
    expect(l.color).toBe("rgb(28, 25, 23)"); // gray-900

    const d = getComputedStyle(dark);
    expect(d.borderTopColor).toBe("rgb(68, 64, 60)"); // gray-700
    expect(d.color).toBe("rgb(245, 245, 244)"); // gray-100
  },
};

export const WhiteWithEmail: Story = {
  args: {
    type: "email",
    label: "Email Address",
    placeholder: "user@megasquad.com",
    startIcon: <FontAwesomeIcon icon={faEnvelope} className="rst:h-4 rst:w-4" />,
    helperText: "We'll never share your email.",
    variant: "white",
  },
};

/**
 * The `soft` variant removes the border and uses a subtle background fill. Great for search bars or high-density forms.
 */
export const SoftSearch: Story = {
  args: {
    placeholder: "Search players...",
    variant: "soft",
    startIcon: <FontAwesomeIcon icon={faSearch} className="rst:h-4 rst:w-4" />,
  },
};

/**
 * The `slate` variant provides a bold, dark background. Originally designed for MegaSquad's heavy dashboard dialogs.
 */
export const MegaSquadSlate: Story = {
  args: {
    variant: "slate",
    label: "Filter Roster",
    placeholder: "Filter by name...",
    startIcon: <FontAwesomeIcon icon={faSearch} className="rst:h-4 rst:w-4" />,
  },
};

/**
 * Showcases how to pass interactive elements into the `endIcon` prop.
 */
export const PasswordAction: Story = {
  args: {
    type: "password",
    label: "Password",
    defaultValue: "Secret123",
    endIcon: (
      <button className="rst:opacity-70 rst:hover:opacity-100 rst:transition-opacity rst:focus:outline-none">
        <FontAwesomeIcon icon={faEye} className="rst:h-4 rst:w-4" />
      </button>
    ),
    variant: "outline",
  },
};

/**
 * Error states automatically override the border, text, and focus ring colors, and explicitly style the helper text.
 */
export const WithError: Story = {
  args: {
    label: "Username",
    defaultValue: "taken_username",
    errorMessage: "This username is already taken.",
    variant: "soft",
    error: true,
  },
};

/**
 * Disabled inputs automatically dim their opacity and prevent user interaction.
 */
export const Disabled: Story = {
  args: {
    label: "League ID",
    defaultValue: "LGE-99482-X",
    disabled: true,
    variant: "soft",
    helperText: "You cannot change your league ID after creation.",
  },
};

/**
 * Three heights, and they are the same three `Button` uses.
 */
export const Sizes: Story = {
  render: () => (
    <div className="rst:space-y-4">
      <Input size="sm" label="Small" placeholder="h-9" />
      <Input size="default" label="Default" placeholder="h-10" />
      <Input size="lg" label="Large" placeholder="h-11" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "`sm` / `default` / `lg` resolve to `h-9` / `h-10` / `h-11`, the same scale as `Button`. A unit test asserts the two components agree at every size, so they cannot drift apart.",
      },
    },
  },
};

/**
 * The reason the size scale exists.
 */
export const PairedWithButton: Story = {
  render: () => (
    <div className="rst:space-y-6">
      {(["sm", "default", "lg"] as const).map((size) => (
        <div key={size} className="rst:flex rst:items-end rst:gap-2">
          <Input
            size={size}
            label={`size="${size}"`}
            placeholder="you@example.com"
            className="rst:flex-1"
          />
          <Button size={size} colorScheme="primary">
            Invite
          </Button>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    /* The reason this assertion exists: the heights were right and the row was
       still visibly wrong. Headless UI's Field appends a hidden zero-height
       <span> after the control, and Tailwind v4 applies `space-y` as
       `margin-block-end` on `:not(:last-child)` — so the input's wrapper took a
       6px bottom margin, the Field's box ended below the control, and
       `items-end` aligned the Button to that phantom edge. Every size was 6px
       out while every height was correct.

       jsdom computes no layout, so only a browser test can see it. */
    const rows = [...canvasElement.querySelectorAll("div")].filter(
      (d) => d.className.includes("items-end") && d.querySelector("input") && d.querySelector("button"),
    );
    expect(rows.length).toBeGreaterThan(0);

    for (const row of rows) {
      const input = row.querySelector("input")!.getBoundingClientRect();
      const button = row.querySelector("button")!.getBoundingClientRect();
      expect(Math.abs(button.bottom - input.bottom)).toBeLessThan(0.5);
      expect(Math.abs(button.height - input.height)).toBeLessThan(0.5);
    }
  },
  parameters: {
    docs: {
      description: {
        story:
          "The case that motivated the size prop. `Input` used to be a fixed 42px while `Button` was 40px or 44px, so a field beside a submit button lined up at no size at all — retrospect gave up and kept a raw `<input>` pinned to `h-11`. Note `className` on the field: it lands on the outer wrapper, which is what makes `flex-1` work here.",
      },
    },
  },
};

/**
 * A field wearing a host's palette rather than Roster's.
 */
export const ThemedWithTokens: Story = {
  render: () => (
    <div
      className="rst:rounded-xl rst:p-6"
      style={
        {
          background: "#1a1a2e",
          "--roster-input-border": "rgba(212,175,55,0.28)",
          "--roster-input-bg": "rgba(255,255,255,0.02)",
          "--roster-input-text": "#f5f5f4",
          "--roster-input-border-focus": "rgba(212,175,55,0.9)",
        } as React.CSSProperties
      }
    >
      <div className="rst:flex rst:items-end rst:gap-2">
        <Input
          size="lg"
          placeholder="Last.fm username"
          className="rst:flex-1"
        />
        <Button size="lg" colorScheme="amber">
          Read my chart
        </Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The `outline` variant reads four custom properties — `--roster-input-bg`, `-border`, `-text` and `-border-focus` — so a host can restyle the field without forking the variant. Set all four: a dark-first host that sets only the first three leaves `-text` at its light default, which is near-black text on a dark field. This is retrospect's deep indigo with a gold hairline at 28% alpha, which previously had no variant to reach for and no token to point at.\n\nSet them in **both** `:root` and `.dark` in real usage. Roster's own `.dark` rule has equal specificity and comes later in the stylesheet, so a `:root`-only override is discarded in dark mode — the same trap as `--roster-scrollbar-thumb`.\n\nThe other four variants stay opinionated: `white`, `soft`, `slate` and `ghost` each name a specific surface, and a token that meant something different in each would not be a token.",
      },
    },
  },
};

/**
 * `className` and `inputClassName` go to different elements.
 */
export const ReachingTheControl: Story = {
  render: () => (
    <Input
      label="Tracking number"
      placeholder="Monospace, via inputClassName"
      className="rst:max-w-xs"
      inputClassName="rst:font-mono rst:tracking-wider"
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          "`className` lands on the outer `Field` wrapper, which is right for layout — width, flex, margins. `inputClassName` reaches the `<input>` itself and wins over the variant, not because it comes last in the attribute (CSS ignores that) but because `cn` is tailwind-merge and removes the class it conflicts with. Before this existed, the control was unreachable from outside and `size` was the only way to change its height.",
      },
    },
  },
};
