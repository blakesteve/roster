import type { Meta, StoryObj } from "@storybook/react-vite";
import { ThemeToggle } from "./ThemeToggle";

const meta = {
  title: "Atoms/ThemeToggle",
  component: ThemeToggle,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "Toggles Roster's class-based dark mode by putting `.dark` on the document root, and remembers the choice in `localStorage`.",
          "",
          "**This actually changes the theme.** Clicking it in these docs will flip Storybook itself — that is not a bug, it is the component working. Every story on this page shares one document root, so there is only ever one theme to toggle.",
          "",
          "**How it relates to Navbar.** `Navbar`'s `themeMode` prop describes what palette *the bar* paints itself with; it does not change the app's theme. This component is the thing that changes it. Pair them with `themeMode=\"auto\"` and the nav follows whatever this sets. They are not two answers to the same question.",
          "",
          "**Avoiding the flash.** A toggle alone cannot prevent a flash of the wrong theme on first paint, because the class has to be on `<html>` before React runs. Add a blocking script to your document head:",
          "",
          "```html",
          "<script>",
          "  try {",
          '    var s = localStorage.getItem("roster-theme");',
          '    var dark = s ? s === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;',
          '    if (dark) document.documentElement.classList.add("dark");',
          "  } catch (e) {}",
          "</script>",
          "```",
          "",
          "**Why the DOM is the source of truth.** That script writes the class before React exists, so component state would only ever be a stale copy of it. The toggle reads the live class through `useSyncExternalStore` and a `MutationObserver`, which also means anything *else* that flips the class — a settings page, a keyboard shortcut, another toggle — is reflected here without wiring.",
        ].join("\n"),
      },
    },
  },
  argTypes: {
    showLabel: { control: "boolean" },
    storageKey: { control: "text" },
    toDarkLabel: { control: "text" },
    toLightLabel: { control: "text" },
    variant: {
      control: "select",
      options: ["solid", "soft", "outline", "ghost", "link"],
    },
    size: {
      control: "inline-radio",
      options: ["xs", "sm", "default", "lg", "icon"],
    },
    onThemeChange: { action: "themeChange" },
  },
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {},
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <ThemeToggle />
      <ThemeToggle showLabel />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Icon-only is the default and is fully labeled for assistive tech via `aria-label` — the visible text is optional, not a fallback. `showLabel` names the *current* mode rather than the destination, which is the convention users read faster in a settings row. The `aria-label` says the opposite, because a button's accessible name should describe what pressing it does.",
      },
    },
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <ThemeToggle variant="ghost" showLabel />
      <ThemeToggle variant="soft" showLabel />
      <ThemeToggle variant="outline" showLabel />
      <ThemeToggle variant="solid" showLabel />
      <ThemeToggle variant="link" showLabel />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "It is a `Button` underneath, so every Button variant, color scheme, and size passes straight through. `ghost` is the default because a theme toggle is chrome and should not compete with the actions around it.",
      },
    },
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <ThemeToggle size="xs" showLabel />
      <ThemeToggle size="sm" showLabel />
      <ThemeToggle size="default" showLabel />
      <ThemeToggle size="lg" showLabel />
      <ThemeToggle size="icon" />
    </div>
  ),
};

export const InAToolbar: Story = {
  render: () => (
    <div className="flex max-w-lg items-center justify-between rounded-lg border border-gray-200 px-4 py-2 dark:border-gray-800">
      <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
        blakeb.dev
      </span>
      <ThemeToggle />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The usual home: a header or toolbar, icon-only, low contrast. Note the surrounding chrome recolors with it, because the `.dark` class lands on the root rather than on a wrapper.",
      },
    },
  },
};

export const CustomStorageKey: Story = {
  args: { storageKey: "my-app-theme", showLabel: true },
  parameters: {
    docs: {
      description: {
        story:
          "The default key is `roster-theme`. Change it if your app already owns one, and change your blocking script to match — a mismatch means the script and the toggle disagree, which shows up as a flash on every reload.",
      },
    },
  },
};

export const CustomLabels: Story = {
  args: {
    toDarkLabel: "Turn the lights off",
    toLightLabel: "Turn the lights back on",
    showLabel: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "`toDarkLabel` and `toLightLabel` set the accessible name in each state. Worth setting if your product has a voice, and worth translating if it has more than one language.",
      },
    },
  },
};

export const ObservingChanges: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <ThemeToggle showLabel />
        <ThemeToggle showLabel />
        <ThemeToggle showLabel />
      </div>
      <p className="m-0 max-w-prose text-xs text-gray-500 dark:text-gray-400">
        Three independent toggles, no shared state, no context. Click any one of
        them and all three update, because each is reading the live class on
        the document root rather than a copy of it.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The practical payoff of treating the DOM as the source of truth. It also means a theme change made anywhere else in your app — a preferences screen, a keyboard shortcut, a blocking script on load — is picked up here with no wiring at all.",
      },
    },
  },
};
