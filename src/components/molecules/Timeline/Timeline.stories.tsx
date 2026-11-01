import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Button } from "../../atoms/Button/Button";
import { Timeline, type TimelineStep } from "./Timeline";

/* Built here, once, not in a story's render: Storybook's code snippet walks
   the elements in a prop, and one made during a render reaches into React's
   tree (RadioTileGroup's stories say more). */
const actions = (week: number, empty = false) =>
  empty ? (
    <Button size="sm" variant="outline" colorScheme="neutral" aria-label={`Add a topic for week ${week}`}>
      Add a topic
    </Button>
  ) : (
    <Button size="sm" variant="outline" colorScheme="neutral" aria-label={`Edit week ${week}`}>
      Edit
    </Button>
  );

const COURSE: TimelineStep[] = [
  { id: "w1", when: "Week 1 · Sep 2", title: "Soil and compost", content: "What a bed needs before anything goes in it.", actions: actions(1) },
  { id: "w2", when: "Week 2 · Sep 9", title: "Sowing in rows", content: "Depth, spacing, and labels you can read in the rain.", actions: actions(2) },
  { id: "w3", when: "Week 3 · Sep 16", title: "Water and mulch", content: "Less often, deeper. 12 people signed up.", actions: actions(3) },
  { id: "w4", when: "Week 4 · Sep 23", title: "Pests without poison", content: "Netting, companions and a lot of patience.", actions: actions(4) },
  { id: "w5", when: "Week 5 · Sep 30", title: "No topic yet", content: "Opens for sign-ups on Sep 23.", actions: actions(5, true), marker: "hollow" },
];

const meta = {
  title: "Molecules/Timeline",
  component: Timeline,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "Steps down the page, each with content of its own: a schedule, a history, an onboarding list.",
          "",
          "Each step has a `title`, any `content` under it, a leading `when` column, a trailing `actions` column, and a `marker` on a line through them all: its number by default, a check once done, `\"hollow\"` for an empty step, or a mark of your own. Every column comes from one grid, so they line up from step to step whatever each step holds. Below 40rem of its own width, `when` moves above the body and the actions under it.",
          "",
          "`current` marks the step you're on (the ones before it are done); `nowBefore` draws a \"now\" divider before a step, where today falls, which needn't be beside the current one.",
          "",
          "An ordered list with a name. The current step is `aria-current=\"step\"` and each finished one says \"done\". The markers, the line and the divider are decoration, hidden from assistive technology. It takes no keys: buttons and links in a step are reached in reading order.",
          "",
          "`StepProgress` is the horizontal sibling for a flow: names only, with a status that says where you are as you move. They share their markers.",
        ].join("\n"),
      },
    },
  },
  argTypes: {
    current: { control: { type: "range", min: 0, max: COURSE.length + 1, step: 1 } },
    nowBefore: { control: { type: "number", min: 1, max: COURSE.length } },
    label: { control: "text" },
    labels: { control: "object" },
    steps: { control: false },
  },
} satisfies Meta<typeof Timeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { steps: COURSE, label: "The course, week by week", current: 3, nowBefore: 4, labels: { now: "Today" } },
  render: (args) => (
    <div style={{ maxWidth: 820 }}>
      <Timeline {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const list = within(canvasElement).getByRole("list", { name: "The course, week by week" });
    await expect(within(list).getAllByRole("listitem")).toHaveLength(COURSE.length);
    await expect(list.querySelector('[aria-current="step"]')).toHaveTextContent("Water and mulch");
  },
};

const SETUP: TimelineStep[] = [
  { id: "account", title: "Make an account", content: "Your name and an email we can reach you at." },
  { id: "team", title: "Invite your team", content: "Anyone you add can see every project." },
  { id: "project", title: "Start a project", content: "Pick a template, or start from nothing." },
  { id: "share", title: "Share it", content: "A link, or an invite by email." },
];

/** An onboarding list: titles and a line of help, no `when` and no actions. */
export const Onboarding: Story = {
  args: { steps: SETUP, label: "Getting started", current: 2 },
  render: (args) => (
    <div style={{ maxWidth: 520 }}>
      <Timeline {...args} />
    </div>
  ),
};

const ORDER: TimelineStep[] = [
  { id: "placed", when: "Oct 28, 9:14", title: "Order placed", content: "Two items, paid by card." },
  { id: "packed", when: "Oct 29, 16:02", title: "Packed" },
  { id: "shipped", when: "Oct 30, 08:40", title: "Shipped", content: "Tracking number 4471 0093 22." },
  { id: "delivered", when: "Nov 1, 11:25", title: "Delivered", content: "Left with a neighbor." },
];

/** A history: every step done (`current` past the last). */
export const History: Story = {
  args: { steps: ORDER, label: "Order history", current: ORDER.length + 1 },
  render: (args) => (
    <div style={{ maxWidth: 640 }}>
      <Timeline {...args} />
    </div>
  ),
};

/** Below 40rem of its own width: `when` above the body, the actions under it. */
export const Narrow: Story = {
  args: { steps: COURSE, label: "The course, week by week", current: 3, nowBefore: 4, labels: { now: "Today" } },
  render: (args) => (
    <div style={{ width: 340 }}>
      <Timeline {...args} />
    </div>
  ),
};

/* A consumer's own marks: a stamped number for a week with a topic. */
const Stamp = ({ n }: { n: number }) => (
  <span style={{ display: "grid", placeItems: "center", width: 30, height: 30, borderRadius: 4, background: "#b91c1c", color: "#fff", font: "700 13px/1 system-ui", transform: "rotate(-4deg)" }}>
    {n}
  </span>
);
const STAMPED: TimelineStep[] = COURSE.map((s, i) => (s.marker === "hollow" ? s : { ...s, marker: <Stamp n={i + 1} /> }));

/** `marker`: a mark of your own on the line, and `"hollow"` for the empty week. */
export const YourOwnMarkers: Story = {
  args: { steps: STAMPED, label: "The course, week by week", current: 3, nowBefore: 4, labels: { now: "Today" } },
  render: (args) => (
    <div style={{ maxWidth: 820 }}>
      <Timeline {...args} />
    </div>
  ),
};

/** On a dark page, with the line's dark values. */
export const Dark: Story = {
  args: { steps: COURSE, label: "The course, week by week", current: 3, nowBefore: 4, labels: { now: "Today" } },
  render: (args) => (
    <div className="dark" style={{ maxWidth: 820, padding: 24, borderRadius: 12, background: "#0c0a09" }}>
      <Timeline {...args} />
    </div>
  ),
};
