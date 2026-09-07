import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { Toast } from "./Toast";
import { Toaster } from "./Toaster";
import { toast } from "./toast-api";
import { Button } from "../../atoms/Button/Button";

const meta = {
  title: "Molecules/Toast",
  component: Toast,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "Transient chrome that floats over the page, announced rather than found, and gone in a few seconds.",
          "",
          "**Toast or Alert?** Alert sits in the flow of a page or a form, stays as long as the condition does, and the reader finds it by looking at the thing it is about. Toast is announced and disappears. They share a color language and an icon set on purpose — *this failed* should not be two different reds depending on where it is said.",
          "",
          "**Mount `<Toaster />` once near the root**, then call `toast.success(...)` from anywhere. It wraps `react-hot-toast`, which both consuming apps already depended on at the same version, so existing call sites do not move — what changes is that toasts stop being styled with hardcoded hex in each app.",
        ].join("\n"),
      },
    },
  },
  argTypes: {
    colorScheme: {
      control: "inline-radio",
      options: ["neutral", "success", "error", "amber", "info", "primary"],
    },
    variant: { control: "inline-radio", options: ["soft", "solid", "glass"] },
  },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The body on its own, with no queue behind it.
 */
export const Playground: Story = {
  args: {
    children: "Your picks are locked for this week.",
    colorScheme: "success",
    title: "Saved",
    onDismiss: () => {},
  },
};

export const Tones: Story = {
  args: { children: "placeholder" },
  render: () => (
    <div className="rst:flex rst:max-w-md rst:flex-col rst:gap-3">
      <Toast colorScheme="success">Your picks are locked.</Toast>
      <Toast colorScheme="error">That squad name is taken.</Toast>
      <Toast colorScheme="amber">Picks close in ten minutes.</Toast>
      <Toast colorScheme="info">Week 4 matchups are up.</Toast>
      <Toast colorScheme="primary">You have been invited to a league.</Toast>
      <Toast>Nothing happened, which is also news.</Toast>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The same six schemes and the same icons as `Alert`.\n\nThe fills are opaque rather than the tint `Alert` uses, because a toast is drawn over arbitrary page content and a wash that reads correctly inside a form can disappear over an image. Neutral takes `--roster-popover-bg` and its siblings, so a consumer who has themed their menus gets this without doing anything else.",
      },
    },
  },
};

/**
 * Solid, for toasts that land somewhere the app does not control.
 */
export const Solid: Story = {
  args: { children: "placeholder" },
  render: () => (
    <div className="rst:flex rst:max-w-md rst:flex-col rst:gap-3">
      <Toast variant="solid" colorScheme="success">
        Your picks are locked.
      </Toast>
      <Toast variant="solid" colorScheme="error" onDismiss={() => {}}>
        That squad name is taken.
      </Toast>
      <Toast variant="solid" colorScheme="amber">
        Picks close in ten minutes.
      </Toast>
      <Toast variant="solid" colorScheme="info">
        Week 4 matchups are up.
      </Toast>
      <Toast variant="solid" colorScheme="primary">
        You have been invited to a league.
      </Toast>
      <Toast variant="solid">Nothing happened, which is also news.</Toast>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "`soft` is the default because a stack of tinted toasts does not shout. Reach for `solid` when they land over photography, video, or any surface the app does not own — `bg-success-50` is a whisper on a white page and illegible over an image.\n\nThe fills and ink tokens are Pill's and Chip's, step for step, so the three do not disagree about what a solid success looks like. `src/contrast.test.ts` measures these six pairs alongside theirs.\n\nSet it once on `<Toaster variant=\"solid\" />` and the whole queue follows.",
      },
    },
  },
};

/**
 * Glass, over something busy enough to show the problem.
 */
export const Glass: Story = {
  args: { children: "placeholder" },
  render: () => (
    <div
      className="rst:flex rst:max-w-md rst:flex-col rst:gap-3 rst:rounded-lg rst:p-6"
      /* Coarse on purpose. The first version of this used 12px stripes, and
         `backdrop-blur-xl` is a 24px blur — it averaged them into a flat color
         and the story showed no translucency at all, which is the one thing it
         exists to show. Blocks have to be wider than the blur radius to
         survive it. */
      style={{
        backgroundImage:
          "repeating-linear-gradient(45deg,#0f6498 0 80px,#ec4f29 80px 160px)",
      }}
    >
      <Toast variant="glass" colorScheme="success">
        Your picks are locked.
      </Toast>
      <Toast variant="glass" colorScheme="error" onDismiss={() => {}}>
        That squad name is taken.
      </Toast>
      <Toast variant="glass">Nothing happened, which is also news.</Toast>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "A neutral surface at 70% with a backdrop blur, with the tone carried by the border alone — the surface and the text stay neutral for every scheme. Matches `Dialog`'s variant of the same name.\n\nAnything whose contrast depends on the backdrop is a guess here, so only the neutral ink is used: 17.49 over white, 6.14 over black and 9.22 over a brand color. Border-only tone is the cost of that — reach for `solid` when the tone has to be unmistakable.\n\nThe stripes are deliberately hostile, because that is the case where translucency stops being decoration. `src/contrast.test.ts` still measures `solid` rather than this, since a number here would be a number for one background.",
      },
    },
  },
};

/**
 * The real thing: a queue, a position, and the imperative handle.
 */
export const Live: Story = {
  args: { children: "placeholder" },
  render: () => (
    <div className="rst:flex rst:flex-wrap rst:gap-2">
      <Toaster position="bottom-right" />
      <Button onClick={() => toast.success("Your picks are locked.")}>Success</Button>
      <Button colorScheme="error" onClick={() => toast.error("That squad name is taken.")}>
        Error
      </Button>
      <Button variant="outline" onClick={() => toast.info("Week 4 matchups are up.")}>
        Info
      </Button>
      <Button variant="outline" onClick={() => toast.warning("Picks close in ten minutes.")}>
        Warning
      </Button>
      <Button variant="ghost" onClick={() => toast("Nothing happened.")}>
        Plain
      </Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    /* `info` is the one worth asserting. react-hot-toast ships no `info`, so
       an app that wants one improvises — mega-squad improvised by calling
       `toast.error`, and every informational message in that app rendered as
       an error until this existed. */
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Info" }));

    const body = await within(document.body).findByText("Week 4 matchups are up.");
    const shell = body.closest("div[class*='rst:border']");
    await expect(shell?.className).toContain("rst:bg-info-50");
    await expect(shell?.className).not.toContain("rst:bg-error-50");
  },
  parameters: {
    docs: {
      description: {
        story:
          "`info` and `warning` are Roster's additions. `react-hot-toast` ships `success`, `error`, `loading` and `blank` only, which is why one consumer's `info` helper called `toast.error` — there was nothing else to call, and every informational message in that app had been rendering as an error.\n\nErrors are announced `alert` / `assertive`; everything else is `status` / `polite`. That is also Roster's decision rather than the library's: `react-hot-toast` marks every toast polite, and a polite live region is read when the user next pauses, which for a message that disappears in four seconds can mean never.",
      },
    },
  },
};

export const WithTitleAndDismiss: Story = {
  args: { children: "placeholder" },
  render: () => (
    <div className="rst:flex rst:max-w-md rst:flex-col rst:gap-3">
      <Toast colorScheme="error" title="Could not save" onDismiss={() => {}}>
        The league closed while you were picking. Nothing was lost.
      </Toast>
      <Toast colorScheme="success" onDismiss={() => {}}>
        Saved.
      </Toast>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("button", { name: "Dismiss" })).toHaveLength(2);
  },
  parameters: {
    docs: {
      description: {
        story:
          "A `title` gives the message a bolded first line, the same shape `Alert` uses. `onDismiss` adds the control; `Toaster` wires it to the queue for you, so you only pass this when rendering a `Toast` yourself.",
      },
    },
  },
};

/**
 * A toast is the one piece of chrome a reader cannot look away from.
 */
export const ReducedMotion: Story = {
  args: { children: "placeholder" },
  render: () => (
    <div className="rst:flex rst:flex-col rst:gap-3">
      <Toaster position="top-center" />
      <p className="rst:max-w-md rst:text-sm">
        Turn on <em>Reduce motion</em> in your OS and fire one. It appears and
        leaves without sliding.
      </p>
      <div>
        <Button onClick={() => toast.success("No slide, no fade-up.")}>Fire one</Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The enter animation is behind `motion-safe`, so a reader with `prefers-reduced-motion` gets the toast without the movement. This matters more here than on most components: a toast arrives unbidden and cannot be looked away from, so a slide is motion the reader did not ask for and cannot avoid.\n\nThe exit is a plain opacity transition rather than an `animate-out`, because this build ships the enter half of the animation utilities and not the exit half — `scripts/check-classes-emit.mjs` fails the build on a class that produces no CSS, which is how that was found rather than shipped.",
      },
    },
  },
};
