import { useEffect, useState, type CSSProperties } from "react";
import { Dialog as HeadlessDialog, DialogPanel, DialogTitle } from "@headlessui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Dialog, type DialogProps } from "./Dialog";
import { Button } from "../../atoms/Button/Button";
import { Input } from "../../atoms/Input/Input";
import { Textarea } from "../../atoms/Textarea/Textarea";
import { Toaster } from "../../molecules/Toast/Toaster";
import { toast } from "../../molecules/Toast/toast-api";
import { PageRegions } from "../../../test/PageRegions";

const meta = {
  title: "Organisms/Dialog",
  component: Dialog,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
### Accessible Modal Window

The **Dialog** component interrupts the user's workflow to demand a response or convey critical information. Built on top of \`@headlessui/react\`, it handles focus trapping, escape-key closing, and screen-reader announcements automatically.

#### 🌙 Native Dark Mode
This component relies on Tailwind's native \`dark:\` classes. It automatically listens to the \`.dark\` class on your document's root. The typography uses \`text-inherit\` and opacity utilities to guarantee perfect contrast across wildly different background colors without manual text-color prop drilling.

#### 🚀 Implementation Instructions

Because the Dialog is a controlled component, its visibility is managed by the parent using standard React state. 

The API leverages two dimensions of styling:
1. **\`variant\`**: Defines the base background and text color (e.g., \`white\`, \`slate\`, \`primary\`).
2. **\`status\`**: Overlays semantic accents on top of the base variant (e.g., \`destructive\`, \`success\`).

\`\`\`tsx
import { useState } from 'react';
import { Dialog, Button } from '@blakesteve/roster';

const Feature = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Delete Item</Button>
      
      <Dialog 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        title="Confirm Deletion"
        description="This action cannot be undone."
        variant="white"
        status="destructive" // Applies the red error border
      >
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button variant="solid" colorScheme="error">Delete</Button>
        </div>
      </Dialog>
    </>
  );
};
\`\`\`
`,
      },
    },
  },
  argTypes: {
    isOpen: {
      control: "boolean",
      description:
        "Toggles the dialog visibility. **Must be controlled by parent state.**",
      table: { defaultValue: { summary: "false" } },
    },
    onClose: {
      description:
        "Callback fired when the user clicks the backdrop, presses Escape, or clicks the close icon.",
      action: "closed",
    },
    title: {
      control: "text",
      description: "The primary accessible heading of the dialog.",
      type: { name: "string", required: true },
    },
    description: {
      control: "text",
      description:
        "Optional subtext displayed directly below the title. Automatically linked for screen readers.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl", "2xl", "3xl", "full"],
      description:
        "Constrains the maximum width of the dialog panel, allowing it to adapt gracefully on mobile devices.",
      table: { defaultValue: { summary: "md" } },
    },
    variant: {
      control: "select",
      options: ["white", "slate", "primary", "glass"],
      description:
        "The base visual style and background color of the dialog. Adapts automatically to dark mode.",
      table: { defaultValue: { summary: "white" } },
    },
    status: {
      control: "select",
      options: ["default", "destructive", "success"],
      description: "Applies semantic top-border accents over the base variant.",
      table: { defaultValue: { summary: "default" } },
    },
    children: {
      description:
        "The main content area of the dialog. Typically used for forms, confirmation messages, and action buttons.",
      control: false,
    },
    layout: {
      control: "inline-radio",
      options: ["default", "fullscreen"],
      description:
        "`default`: the panel with Roster's header and close button. `fullscreen`: the whole viewport, no box and no header of Roster's, for a photo viewer or a full-screen card; the controls inside are yours.",
      table: { defaultValue: { summary: "default" } },
    },
    titleHidden: {
      control: "boolean",
      description: "Keep the title as the dialog's accessible name, said by a screen reader, without showing it.",
      table: { defaultValue: { summary: "false" } },
    },
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof Dialog>;

const DialogWrapper = (args: Omit<DialogProps, "isOpen" | "onClose">) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Dialog</Button>
      <Dialog {...args} isOpen={isOpen} onClose={() => setIsOpen(false)}>
        {args.children}
      </Dialog>
    </>
  );
};

export const WhiteStandard: Story = {
  render: (args) => <DialogWrapper {...args} />,
  args: {
    title: "Invite Teammates",
    description: "Send invitations to join your roster.",
    size: "md",
    variant: "white",
    status: "default",
    children: (
      <div className="rst:mt-4 rst:flex rst:flex-col rst:gap-4 rst:text-left">
        <Input placeholder="Enter email address..." />
        <div className="rst:flex rst:justify-end rst:gap-3 rst:pt-2">
          <Button variant="outline" colorScheme="neutral">
            Cancel
          </Button>
          <Button variant="solid" colorScheme="primary">
            Send Invite
          </Button>
        </div>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          "The standard `white` variant. Crisp white in light mode, dropping to a sophisticated dark gray in dark mode. Ideal for standard forms.",
      },
    },
  },
};

export const SlateMoody: Story = {
  render: (args) => <DialogWrapper {...args} />,
  args: {
    title: "System Update Available",
    description: "Version 2.4.0 is ready to install.",
    size: "sm",
    variant: "slate",
    status: "default",
    children: (
      <div className="rst:mt-6 rst:flex rst:justify-end rst:gap-3">
        <Button
          variant="outline"
          className="rst:text-white rst:border-gray-500 rst:hover:bg-gray-600"
        >
          Remind Me Later
        </Button>
        <Button variant="solid" colorScheme="primary">
          Install Now
        </Button>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          "The `slate` variant provides a solid mid-dark gray in light mode, dropping to a deep, moody gray in dark mode. Great for technical prompts or terminal-style interfaces.",
      },
    },
  },
};

/**
 * A form on an inverting panel — the combination that had no story.
 */
export const FieldsOnAnInvertedPanel: Story = {
  render: (args) => <DialogWrapper {...args} />,
  args: {
    title: "Fields on slate",
    description: "Every control here is drawn on a panel that inverts against the page.",
    size: "md",
    variant: "slate",
    status: "default",
    children: (
      <div className="rst:mt-6 rst:flex rst:flex-col rst:gap-4">
        <Input label="Name" placeholder="Type here" />
        <Textarea label="Notes" placeholder="What happened?" />

      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          "This is the story that did not exist, and its absence is why three regressions reached a consumer before anyone here saw them.\n\n`slate` and `primary` are dark whatever the page is doing, while `--roster-ring` and `--roster-control-*` are declared at `:root` and `.dark` and therefore follow the PAGE. On a light page that handed these fields the light-mode values: gray-900 text at **1.70:1** on the panel, and a focus ring at **1.61:1**. Both variants now set the ring and the control trio on their own subtree, giving 9.42:1 for the text and 3.80:1 for the ring.\n\nView it in light mode, which is the failing direction — in dark mode the page-level values were already right and nothing was ever visibly wrong.\n\nOnly `outline` fields are shown. `soft` and `Checkbox` carry their own light FILLS — gray-100 and white — which nothing inverts, so on this panel they are stark light boxes at 2.31:1 and 2.52:1 against their own borders. Tokenizing control fills is filed as a follow-up; showing them here would document a broken state as if it were the point of the story.",
      },
    },
  },
};

export const PrimaryBrand: Story = {
  render: (args) => <DialogWrapper {...args} />,
  args: {
    title: "Welcome to Tidewater!",
    description: "You're almost ready to make your first pick.",
    size: "md",
    variant: "primary",
    status: "default",
    children: (
      <div className="rst:mt-6 rst:flex rst:justify-end rst:gap-3">
        <Button
          variant="solid"
          className="rst:bg-white rst:text-primary-700 rst:hover:bg-gray-100"
        >
          Let's Go!
        </Button>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          "The `primary` variant drenches the dialog in your brand color. The typography automatically inherits the color to ensure it remains perfectly readable.",
      },
    },
  },
};

export const DestructiveAction: Story = {
  render: (args) => <DialogWrapper {...args} />,
  args: {
    title: "Delete League",
    description:
      "Are you sure you want to delete this league? All data will be permanently removed. This action cannot be undone.",
    size: "md",
    variant: "white",
    status: "destructive",
    children: (
      <div className="rst:mt-6 rst:flex rst:justify-end rst:gap-3">
        <Button variant="outline" colorScheme="neutral">
          Cancel
        </Button>
        <Button variant="solid" colorScheme="error">
          Yes, Delete League
        </Button>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates the composability of the new API. The `status="destructive"` prop applies a semantic error border on top of the `variant="white"` base style.',
      },
    },
  },
};

export const SuccessSlate: Story = {
  render: (args) => <DialogWrapper {...args} />,
  args: {
    title: "Payment Successful",
    description: "Your subscription has been renewed for another year.",
    size: "sm",
    variant: "slate",
    status: "success",
    children: (
      <div className="rst:mt-6 rst:flex rst:justify-end rst:gap-3">
        <Button
          variant="solid"
          colorScheme="success"
          className="rst:w-full rst:justify-center"
        >
          View Receipt
        </Button>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Another example of composability: a `status="success"` border applied to a `variant="slate"` dialog.',
      },
    },
  },
};

export const GlassEffect: Story = {
  render: (args) => <DialogWrapper {...args} />,
  args: {
    title: "Pro Feature",
    description: "Upgrade your account to access advanced analytics.",
    size: "sm",
    variant: "glass",
    status: "default",
    children: (
      <div className="rst:mt-6 rst:flex rst:flex-col rst:gap-3">
        <Button
          variant="solid"
          colorScheme="primary"
          className="rst:w-full rst:justify-center"
        >
          Upgrade Now
        </Button>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          "The `glass` variant utilizes `backdrop-blur` directly on the panel. This creates a stunning frosted effect when triggered over image-heavy backgrounds.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="rst:p-24 rst:bg-linear-to-br rst:from-indigo-500 rst:via-purple-500 rst:to-pink-500 rst:dark:from-indigo-900 rst:dark:via-purple-900 rst:dark:to-slate-900 rst:rounded-xl rst:flex rst:justify-center rst:transition-colors">
        <Story />
      </div>
    ),
  ],
};

const page = within(document.body);

/* ── Full screen ───────────────────────────────────────────────────────── */

const PHOTOS = [
  { caption: "Harbor at dawn", sky: "#f6c28b", sea: "#3d6b8f", sun: "#fff1c9" },
  { caption: "Ridge trail in October", sky: "#9ec5e8", sea: "#5b7f4a", sun: "#fdf6d8" },
  { caption: "Lighthouse after the storm", sky: "#6f7f9c", sea: "#2b3a52", sun: "#d9e2f2" },
  { caption: "Meadow at noon", sky: "#bfe0f7", sea: "#7aa35a", sun: "#fffbe6" },
];

/* A landscape drawn in CSS: sky, sun and land, so the story needs no image. */
const landscape = (p: (typeof PHOTOS)[number]): CSSProperties => ({
  width: "min(88vw, 960px)",
  aspectRatio: "3 / 2",
  borderRadius: 4,
  background: `radial-gradient(circle at 72% 30%, ${p.sun} 0 7%, transparent 7.5%), linear-gradient(transparent 62%, ${p.sea} 62%), linear-gradient(${p.sky}, #ffffff)`,
});

/* The scrim, darker for photos: `--roster-backdrop` is the one property every
   overlay's scrim reads. Set while the viewer is open, and put back after. */
function useDarkScrim(on: boolean) {
  useEffect(() => {
    if (!on) return;
    const root = document.documentElement;
    const before = root.style.getPropertyValue("--roster-backdrop");
    root.style.setProperty("--roster-backdrop", "rgb(12 10 9 / 0.94)");
    return () => {
      if (before) root.style.setProperty("--roster-backdrop", before);
      else root.style.removeProperty("--roster-backdrop");
    };
  }, [on]);
}

function PhotoViewer(args: Omit<DialogProps, "isOpen" | "onClose" | "children">) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  useDarkScrim(open);
  const photo = PHOTOS[index];
  const step = (by: number) => setIndex((i) => (i + by + PHOTOS.length) % PHOTOS.length);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open the album</Button>
      <Dialog {...args} isOpen={open} onClose={() => setOpen(false)}>
        <div
          style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24, color: "#f5f5f4" }}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") step(-1);
            if (e.key === "ArrowRight") step(1);
          }}
        >
          <div style={{ alignSelf: "stretch", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span aria-live="polite" style={{ fontSize: 14, opacity: 0.8 }}>
              {index + 1} of {PHOTOS.length}
            </span>
            <Button variant="solid" colorScheme="neutral" autoFocus onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
          <div role="img" aria-label={photo.caption} style={landscape(photo)} />
          <p style={{ margin: 0, fontSize: 15 }}>{photo.caption}</p>
          <div style={{ display: "flex", gap: 12 }}>
            <Button variant="solid" colorScheme="neutral" onClick={() => step(-1)}>
              Previous
            </Button>
            <Button variant="solid" colorScheme="neutral" onClick={() => step(1)}>
              Next
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

export const PhotoViewerFullScreen: Story = {
  name: "Photo viewer (full screen)",
  render: (args) => <PhotoViewer {...args} />,
  args: { title: "Photos from the trip", layout: "fullscreen", titleHidden: true, children: null },
  parameters: {
    docs: {
      description: {
        story:
          "`layout=\"fullscreen\"` with `titleHidden`: the dialog is the whole viewport, with no box, no padding and no header of Roster's. The counter, the caption, Previous, Next and Close are the app's own; Roster keeps the rest. Focus moves in on open (to Close, which carries `autoFocus`), Tab stays among the viewer's controls, Escape closes, focus goes back to the button that opened it, and the page behind is inert. The title isn't shown but names the dialog, so a screen reader announces \"Photos from the trip\". The darker scrim is `--roster-backdrop`, set while the viewer is open. The arrow keys page through the photos too.",
      },
    },
  },
};

function FullScreenCard(args: Omit<DialogProps, "isOpen" | "onClose" | "children">) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Read the story</Button>
      <Dialog {...args} isOpen={open} onClose={() => setOpen(false)}>
        <div style={{ minHeight: "100%", display: "grid", placeItems: "center", padding: 24 }}>
          <article
            style={{ position: "relative", width: "min(92vw, 560px)", padding: 32, borderRadius: 16, background: "#fffaf3", color: "#1c1917", boxShadow: "0 24px 64px rgb(0 0 0 / 0.35)" }}
          >
            <p style={{ margin: 0, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.6 }}>Summer, 1998</p>
            <h3 style={{ margin: "8px 0 16px", fontSize: 26 }}>The rope swing at the quarry</h3>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              Everyone said the rope would hold, and it did, every time but one. We came back the next summer with a new rope and a better knot, and the story got longer every year after.
            </p>
            <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
              <Button autoFocus onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
          </article>
        </div>
      </Dialog>
    </>
  );
}

export const FullScreenCardStory: Story = {
  name: "Full-screen card",
  render: (args) => <FullScreenCard {...args} />,
  args: { title: "The rope swing at the quarry", layout: "fullscreen", titleHidden: true, children: null },
  parameters: {
    docs: {
      description: {
        story:
          "A card laid out by the app, over the whole viewport: its own heading, text and Close. The dialog's hidden title matches the card's heading, so the name a screen reader hears is the one on screen. A tall card scrolls inside the dialog, and the page behind stays still.",
      },
    },
  },
};

/**
 * While the dialog is open, everything behind it is `inert`: not focusable,
 * not clickable, and out of a screen reader's reach. On close, focus goes back
 * to whatever opened it.
 */
export const PageBehindIsInert: Story = {
  args: { title: "Rename item", description: "Choose a new name.", children: <p>Body</p> },
  render: (args) => <DialogWrapper {...args} />,
  play: async ({ canvasElement }) => {
    const opener = within(canvasElement).getByRole("button", { name: "Open Dialog" });
    await expect(opener.closest("[inert]")).toBeNull();
    await userEvent.click(opener);
    const dialog = await page.findByRole("dialog");
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    await waitFor(() => expect(opener.closest("[inert]")).not.toBeNull());
    await expect(dialog.closest("[inert]")).toBeNull();
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(opener).toHaveFocus();
    await expect(opener.closest("[inert]")).toBeNull();
  },
  parameters: { controls: { disable: true } },
};

/**
 * A page laid out as a header, a main and a footer, all children of `<body>`,
 * with the toast host inside the main. While the dialog is open, all three are
 * inert and hidden from a screen reader, and a toast fired from the dialog is
 * still announced. On close, each gets back exactly what it had.
 */
export const PageAroundIsInert: Story = {
  /* Kept off the docs page: it renders into `<body>`, so there it would land
     below everything else. */
  tags: ["!autodocs"],
  args: { title: "Rename item", description: "Choose a new name.", children: null },
  render: function Render(args) {
    const [open, setOpen] = useState(false);
    return (
      <PageRegions>
        <Toaster />
        <Button onClick={() => setOpen(true)}>Open Dialog</Button>
        <Dialog {...args} isOpen={open} onClose={() => setOpen(false)}>
          <Button onClick={() => toast.success("Saved")}>Save</Button>
        </Dialog>
      </PageRegions>
    );
  },
  play: async () => {
    const header = page.getByTestId("page-header");
    const main = page.getByTestId("page-main");
    const footer = page.getByTestId("page-footer");
    const hidden = "[inert], [aria-hidden='true']";
    for (const region of [header, main, footer]) {
      await expect(region.closest(hidden)).toBeNull();
    }

    await userEvent.click(page.getByRole("button", { name: "Open Dialog" }));
    const dialog = await page.findByRole("dialog");
    await waitFor(() => expect(main).toHaveAttribute("inert"));
    for (const region of [header, footer]) {
      await expect(region).toHaveAttribute("inert");
      await expect(region).toHaveAttribute("aria-hidden", "true");
    }
    await expect(dialog.closest(hidden)).toBeNull();

    await userEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    const saved = await page.findByText("Saved");
    await expect(saved.closest(hidden)).toBeNull();
    await expect(saved.closest("[aria-live]")).toHaveAttribute("aria-live", "polite");
    await expect(saved.closest("[data-roster-toaster]")?.parentElement).toBe(document.body);

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(header).not.toHaveAttribute("inert");
    await expect(header).toHaveAttribute("aria-hidden", "false");
    for (const region of [main, footer]) {
      await expect(region).not.toHaveAttribute("inert");
      await expect(region).not.toHaveAttribute("aria-hidden");
    }
    toast.remove();
  },
  parameters: { controls: { disable: true } },
};

/**
 * A route change unmounts a dialog without closing it. The page around it
 * comes back whole: Headless UI and Roster each mark part of it, and neither
 * leaves its part behind.
 */
export const UnmountedWhileOpen: Story = {
  tags: ["!autodocs"],
  args: { title: "Leave this page?", children: null },
  render: function Render(args) {
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(true);
    return (
      <PageRegions>
        <Button onClick={() => setOpen(true)}>Open Dialog</Button>
        {mounted && (
          <Dialog {...args} isOpen={open} onClose={() => setOpen(false)}>
            <Button onClick={() => setMounted(false)}>Go to another page</Button>
          </Dialog>
        )}
      </PageRegions>
    );
  },
  play: async () => {
    const regions = ["page-header", "page-main", "page-footer"].map((id) => page.getByTestId(id));
    await userEvent.click(page.getByRole("button", { name: "Open Dialog" }));
    const dialog = await page.findByRole("dialog");
    await waitFor(() => {
      for (const region of regions) expect(region).toHaveAttribute("inert");
    });

    await userEvent.click(within(dialog).getByRole("button", { name: "Go to another page" }));
    await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => {
      for (const region of regions) expect(region).not.toHaveAttribute("inert");
    });
    await expect(regions[0]).toHaveAttribute("aria-hidden", "false");
    await expect(regions[1]).not.toHaveAttribute("aria-hidden");
    await expect(regions[2]).not.toHaveAttribute("aria-hidden");
  },
  parameters: { controls: { disable: true } },
};

/**
 * A Roster Dialog opened from inside a dialog built on Headless UI directly,
 * which has no lock of its own. Headless UI has already marked `<main>` when
 * the inner one opens, and that is left to it: closing both gives the page
 * back whole, not with `<main>` stuck inert.
 */
export const InsideAHeadlessUIDialog: Story = {
  tags: ["!autodocs"],
  args: { title: "Are you sure?", children: null },
  render: function Render(args) {
    const [outer, setOuter] = useState(false);
    const [inner, setInner] = useState(false);
    return (
      <PageRegions>
        <Button onClick={() => setOuter(true)}>Open outer</Button>
        <HeadlessDialog open={outer} onClose={() => setOuter(false)}>
          <DialogPanel style={{ position: "fixed", inset: "24px", background: "white", padding: "16px" }}>
            <DialogTitle>Outer</DialogTitle>
            <Button onClick={() => setInner(true)}>Open inner</Button>
            <Button onClick={() => setOuter(false)}>Close outer</Button>
            <Dialog {...args} isOpen={inner} onClose={() => setInner(false)}>
              <Button onClick={() => setInner(false)}>Done</Button>
            </Dialog>
          </DialogPanel>
        </HeadlessDialog>
      </PageRegions>
    );
  },
  play: async () => {
    const regions = ["page-header", "page-main", "page-footer"].map((id) => page.getByTestId(id));
    await userEvent.click(page.getByRole("button", { name: "Open outer" }));
    await userEvent.click(await page.findByRole("button", { name: "Open inner" }));
    const inner = await page.findByRole("dialog", { name: "Are you sure?" });
    await waitFor(() => {
      for (const region of regions) expect(region).toHaveAttribute("inert");
    });

    await userEvent.click(within(inner).getByRole("button", { name: "Done" }));
    await waitFor(() => expect(page.queryByRole("dialog", { name: "Are you sure?" })).not.toBeInTheDocument());
    await userEvent.click(page.getByRole("button", { name: "Close outer" }));
    await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => {
      for (const region of regions) expect(region).not.toHaveAttribute("inert");
    });
    await expect(regions[0]).toHaveAttribute("aria-hidden", "false");
    await expect(regions[1]).not.toHaveAttribute("aria-hidden");
    await expect(regions[2]).not.toHaveAttribute("aria-hidden");
  },
  parameters: { controls: { disable: true } },
};

/**
 * A dialog that is open on its first render (from a deep link, say) animates
 * in the way one opened by a click does, fading up from transparent and
 * scaling up from 95%, and the page behind it is inert from the start.
 */
export const OpenOnFirstRender: Story = {
  /* Also run with reduced motion on: the dialog must fade up from
     transparent there too, not paint once at rest and then flicker. */
  tags: ["reduced-motion"],
  args: { title: "Welcome back", description: "Here is what changed.", children: <p>Body</p> },
  render: function Render(args) {
    const [open, setOpen] = useState(true);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Dialog</Button>
        <Dialog {...args} isOpen={open} onClose={() => setOpen(false)} />
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const dialog = await page.findByRole("dialog");
    const panel = dialog.querySelector(".rst\\:rounded-2xl") as HTMLElement;
    // Caught on its way in: part-transparent, not painted at rest first.
    await expect(Number(getComputedStyle(panel).opacity)).toBeLessThan(1);
    await waitFor(() => expect(getComputedStyle(panel).opacity).toBe("1"));

    /* `hidden: true` because the page behind is `aria-hidden` now, which is
       the point, and role queries skip what assistive technology can not
       reach. */
    const opener = within(canvasElement).getByRole("button", { name: "Open Dialog", hidden: true });
    await waitFor(() => expect(opener.closest("[inert]")).not.toBeNull());
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(opener.closest("[inert]")).toBeNull();
  },
  parameters: { controls: { disable: true } },
};
