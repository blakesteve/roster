import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "../../atoms/Badge/Badge";
import { Input } from "../../atoms/Input/Input";
import { Textarea } from "../../atoms/Textarea/Textarea";
import { LiquidTabs } from "../../molecules/LiquidTabs/LiquidTabs";
import { MediaPreview } from "../../molecules/MediaPreview/MediaPreview";
import { RadioGroup } from "../../molecules/RadioGroup/RadioGroup";
import { ModerationQueue } from "./ModerationQueue";
import { QueueEditDialog } from "./QueueEditDialog";
import { QueueEditSheet } from "./QueueEditSheet";
import type { QueueFormProps } from "./queue-actions";

const meta = {
  title: "Organisms/ModerationQueue",
  component: ModerationQueue,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A queue of things waiting for a decision. The app hands it the items and what can be decided; the queue handles the layout, busy and failed states, the confirm, reason and edit steps, where focus goes after an item leaves, and a live region that says what happened and how many are left. **It never fetches**: each action's `run` makes the request, and the app removes the item when the decision lands.\n\nThe example is a neighborhood recipe exchange whose submissions get a look before they're listed. Every decision here takes a moment and then lands, the way a real request would.",
      },
    },
  },
} satisfies Meta<typeof ModerationQueue>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ── Invented content ──────────────────────────────────────────────────── */

type Recipe = {
  id: string;
  title: string;
  by: string;
  category: "Soups" | "Baking" | "Salads" | "Preserves";
  sent: string;
  method: string;
  photo: string | null;
};

/* Flat illustrations, drawn inline so the story needs no network. */
const art = (bg: string, shape: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 144 112'><rect width='144' height='112' fill='${bg}'/>${shape}</svg>`,
  )}`;
const SOUP = art("#f4e7d7", "<ellipse cx='72' cy='62' rx='46' ry='30' fill='#c8553d'/><ellipse cx='72' cy='54' rx='40' ry='14' fill='#e8a04d'/><circle cx='58' cy='52' r='4' fill='#7a9e4f'/><circle cx='84' cy='56' r='3' fill='#7a9e4f'/>");
const BREAD = art("#efe6da", "<rect x='30' y='44' width='84' height='40' rx='18' fill='#b77b42'/><path d='M46 52 l10 -8 M66 52 l10 -8 M86 52 l10 -8' stroke='#e7c393' stroke-width='5' stroke-linecap='round'/>");

const RECIPES: Recipe[] = [
  {
    id: "r1",
    title: "Smoky red lentil soup",
    by: "Dana Okafor",
    category: "Soups",
    sent: "12 minutes ago",
    method: "Sweat an onion with cumin and smoked paprika, add red lentils and stock, simmer 20 minutes, then finish with lemon and a handful of parsley.",
    photo: SOUP,
  },
  {
    id: "r2",
    title: "Overnight rye loaf",
    by: "Ollie Brandt",
    category: "Baking",
    sent: "1 hour ago",
    method: "Mix rye, bread flour, salt and a spoon of starter the night before. Shape in the morning and bake hot in a covered pot.",
    photo: BREAD,
  },
  {
    id: "r3",
    title: "Charred corn salad",
    by: "Mei Tanaka",
    category: "Salads",
    sent: "Yesterday",
    method: "Blister corn in a dry pan, toss with lime, chili, crumbled cheese and cilantro.",
    photo: "/photos/corn-salad.heic",
  },
];

type Suggestion = { id: string; name: string; on: string };
const SUGGESTIONS: Suggestion[] = [
  { id: "s1", name: "Weeknight", on: "Smoky red lentil soup" },
  { id: "s2", name: "No-knead", on: "Overnight rye loaf" },
];

/* Every decision takes a beat, like a request. */
const later = () => new Promise<void>((resolve) => setTimeout(resolve, 700));

type Draft = { title: string; method: string; category: Recipe["category"] };
function RecipeForm({ value, onChange }: QueueFormProps<Recipe, Draft>) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Input label="Title" value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} />
      <Textarea label="Method" rows={5} value={value.method} onChange={(e) => onChange({ ...value, method: e.target.value })} />
      <RadioGroup
        label="Category"
        orientation="horizontal"
        value={value.category}
        onChange={(category) => onChange({ ...value, category: category as Draft["category"] })}
        options={["Soups", "Baking", "Salads", "Preserves"].map((c) => ({ value: c, label: c }))}
      />
    </div>
  );
}

function RecipeExchange({ editIn }: { editIn: "dialog" | "sheet" }) {
  const [tab, setTab] = useState("recipes");
  const [recipes, setRecipes] = useState(RECIPES);
  const [suggestions, setSuggestions] = useState(SUGGESTIONS);
  const drop = (id: string) => setRecipes((rs) => rs.filter((r) => r.id !== id));

  const count = (n: number, active: boolean) =>
    n > 0 ? (
      <Badge variant={active ? "neutral" : "primary"} fill="soft" size="xs" style={{ marginLeft: 6 }}>
        {n}
      </Badge>
    ) : null;

  return (
    <div style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: 24 }}>
      <LiquidTabs
        tabs={[
          { id: "recipes", label: (active) => <>New recipes{count(recipes.length, active)}</> },
          { id: "suggestions", label: (active) => <>Category ideas{count(suggestions.length, active)}</> },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      {tab === "recipes" ? (
        <ModerationQueue
          label="New recipes"
          hideLabel
          items={recipes}
          getKey={(r) => r.id}
          itemLabel={(r) => `${r.title}, from ${r.by}`}
          renderMeta={(r) => (
            <>
              <Badge variant="teal" fill="soft" size="xs">
                {r.category}
              </Badge>
              <span>{r.sent}</span>
            </>
          )}
          renderContent={(r) => (
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
              <MediaPreview src={r.photo} href={r.photo ?? undefined} alt={`${r.title}, as sent`} />
              <p style={{ flex: "1 1 220px", margin: 0, lineHeight: 1.6 }}>{r.method}</p>
            </div>
          )}
          empty={{ title: "All caught up", description: "New recipes will show up here." }}
          actions={(a) => [
            {
              id: "list",
              label: "List it",
              done: "Listed",
              tone: "success",
              run: async (r) => {
                await later();
                drop(r.id);
              },
            },
            a.edit({
              id: "edit",
              label: "Edit and list",
              done: "Listed with edits",
              edit: {
                title: "Tidy it up before listing",
                description: "Fix typos and trim. Keep the cook's own words.",
                submitLabel: "List it",
                surface: editIn === "sheet" ? QueueEditSheet : QueueEditDialog,
                initial: (r) => ({ title: r.title, method: r.method, category: r.category }),
                Form: RecipeForm,
                validate: (d) =>
                  !d.title.trim() ? "Give it a title." : d.method.trim().length < 20 ? "The method needs a little more." : undefined,
              },
              run: async (r) => {
                await later();
                drop(r.id);
              },
            }),
            {
              id: "send-back",
              label: "Send back",
              done: "Sent back",
              tone: "danger",
              reason: {
                prompt: "Why is it going back? The cook will see this.",
                options: [
                  { value: "duplicate", label: "We already have this one" },
                  { value: "incomplete", label: "Steps or amounts are missing" },
                  { value: "not-a-recipe", label: "Not a recipe" },
                ],
                required: true,
                noteLabel: "A note for the cook (optional)",
              },
              run: async (r) => {
                await later();
                drop(r.id);
              },
            },
          ]}
        />
      ) : (
        <ModerationQueue
          label="Category ideas"
          hideLabel
          density="compact"
          items={suggestions}
          getKey={(s) => s.id}
          itemLabel={(s) => `"${s.name}" on ${s.on}`}
          renderContent={() => null}
          empty={{ title: "No ideas waiting" }}
          actions={[
            {
              id: "add",
              label: "Add it",
              done: "Added",
              tone: "success",
              run: async (s) => {
                await later();
                setSuggestions((xs) => xs.filter((x) => x.id !== s.id));
              },
            },
            {
              id: "pass",
              label: "Pass",
              done: "Passed",
              run: async (s) => {
                await later();
                setSuggestions((xs) => xs.filter((x) => x.id !== s.id));
              },
            },
          ]}
        />
      )}
    </div>
  );
}

export const RecipeExchangeQueue: Story = {
  name: "Recipe exchange",
  args: undefined as never,
  render: () => <RecipeExchange editIn="dialog" />,
  parameters: {
    docs: {
      description: {
        story:
          "Two queues under tabs, each tab showing how many are waiting. **List it** decides in one click. **Edit and list** opens the cook's recipe in a Dialog, with its own validation. **Send back** asks why first. The corn salad's photo is a format the browser can't draw, so its preview falls back to a link to the original.",
      },
    },
  },
};

export const EditingInASheet: Story = {
  name: "Editing in a Sheet",
  args: undefined as never,
  render: () => <RecipeExchange editIn="sheet" />,
  parameters: {
    docs: {
      description: {
        story: "The same queue with its edit step in a Sheet, which gives a long form room on a phone.",
      },
    },
  },
};

export const States: Story = {
  args: undefined as never,
  render: () => {
    const base = {
      getKey: (r: Recipe) => r.id,
      itemLabel: (r: Recipe) => r.title,
      renderContent: () => null,
      actions: [],
    };
    return (
      <div style={{ display: "grid", gap: 32, maxWidth: 640 }}>
        <ModerationQueue<Recipe> {...base} label="Loading" items={[]} status="loading" />
        <ModerationQueue<Recipe>
          {...base}
          label="Couldn't load"
          items={[]}
          status="error"
          error="The recipe queue didn't answer. Check your connection and try again."
          onRetry={() => {}}
        />
        <ModerationQueue<Recipe> {...base} label="Empty" items={[]} empty={{ title: "All caught up", description: "New recipes will show up here." }} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Loading, a queue that couldn't load (with Retry), and an empty queue.",
      },
    },
  },
};
