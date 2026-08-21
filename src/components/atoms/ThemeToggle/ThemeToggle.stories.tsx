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
    lightLabel: { control: "text" },
    darkLabel: { control: "text" },
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
    <div className="rst:flex rst:items-center rst:gap-4">
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
    <div className="rst:flex rst:flex-wrap rst:items-center rst:gap-3">
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
    <div className="rst:flex rst:flex-wrap rst:items-center rst:gap-3">
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
    <div className="rst:flex rst:max-w-lg rst:items-center rst:justify-between rst:rounded-lg rst:border rst:border-gray-200 rst:px-4 rst:py-2 rst:dark:border-gray-800">
      <span className="rst:font-mono rst:text-[0.625rem] rst:uppercase rst:tracking-[0.14em] rst:text-gray-500 rst:dark:text-gray-400">
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
    showLabel: true,
    lightLabel: "Press sheet",
    darkLabel: "Blueline",
    toDarkLabel: "Switch to the blueline proof",
    toLightLabel: "Switch back to the press sheet",
  },
  parameters: {
    docs: {
      description: {
        story: [
          "Four independent labels, because the visible text and the accessible name are answering different questions.",
          "",
          "`lightLabel` / `darkLabel` are what the button *shows*, and they name the current state. `toDarkLabel` / `toLightLabel` are what a screen reader *announces*, and they name the destination, because a button's accessible name should describe what pressing it does.",
          "",
          "The values here are blakeb.dev's, whose two states are a press sheet and a blueline proof rather than light and dark. That site is the reason these props exist: a hardcoded \"Light\"/\"Dark\" meant adopting the component would have cost the metaphor the whole site is built on.",
        ].join("\n"),
      },
    },
  },
};

export const CustomIcons: Story = {
  render: () => (
    <div className="rst:flex rst:flex-wrap rst:items-center rst:gap-3">
      <ThemeToggle
        showLabel
        lightLabel="Press sheet"
        darkLabel="Blueline"
        lightIcon={<span aria-hidden="true">\u25D0</span>}
        darkIcon={<span aria-hidden="true">\u25D1</span>}
      />
      <ThemeToggle
        lightIcon={<span aria-hidden="true">\u2600</span>}
        darkIcon={<span aria-hidden="true">\u263D</span>}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "`lightIcon` and `darkIcon` replace the default moon and sun with any node. Mark them `aria-hidden`: the button is already named by its `aria-label`, so an announced icon is just noise.",
      },
    },
  },
};

export const ObservingChanges: Story = {
  render: () => (
    <div className="rst:flex rst:flex-col rst:gap-3">
      <div className="rst:flex rst:items-center rst:gap-3">
        <ThemeToggle showLabel />
        <ThemeToggle showLabel />
        <ThemeToggle showLabel />
      </div>
      <p className="rst:m-0 rst:max-w-prose rst:text-xs rst:text-gray-500 rst:dark:text-gray-400">
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
