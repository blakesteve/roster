import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { waitFor } from "storybook/test";
import { Button } from "../../atoms/Button/Button";
import { Input } from "../../atoms/Input/Input";
import { FileUpload, type FileUploadContext, type FileUploadItem } from "./FileUpload";
import { pickFiles, samplePhoto, sizedFile } from "../../../test/sample-files";

const meta = {
  title: "Molecules/FileUpload",
  component: FileUpload,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "Picks files, uploads each one through your app, and shows where each stands: waiting, uploading with progress, finishing on your server, uploaded, failed with a retry, or turned away with the reason.",
          "",
          "It never sends anything itself. You pass `upload(file, { onProgress, onProcessing, signal })`, which returns a promise; it's called once per file, a few at a time. Report progress if you can, say when your server has the bytes and is working on them, and stop when `signal` aborts, which it does when the file is removed. Whatever the promise resolves with comes back on that file in `onChange`, ready to send with the form.",
          "",
          "```tsx",
          "<FileUpload",
          '  label="Photos"',
          "  types={[\"image/jpeg\", \"image/png\"]}",
          "  maxFiles={10}",
          "  maxSize={15 * 1024 * 1024}",
          "  upload={(file, { onProgress, onProcessing, signal }) => sendPhoto(file, { onProgress, onProcessing, signal })}",
          "  onChange={(items) => setPhotoIds(items.filter((i) => i.status === \"done\").map((i) => i.result))}",
          "/>",
          "```",
          "",
          "On phones the picker stays `accept=\"image/*\"` with no `capture`, which is what gets Android's photo picker with albums and cloud photos rather than a file browser. Narrow what's allowed with `types`, checked after picking. Dragging files onto the field works where there's a pointer, and is never the only way in. Every word it shows or says can be replaced through `strings`.",
        ].join("\n"),
      },
    },
  },
  args: { label: "Photos", upload: async () => undefined },
} satisfies Meta<typeof FileUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Removed", "AbortError"));
    });
  });

/**
 * A pretend upload: progress in steps, then a while on the server. Stands in
 * for the app's own request, which is all `upload` ever is.
 */
function simulatedUpload({ steps = 8, stepMs = 220, serverMs = 900, failFirstTry = false } = {}) {
  const tried = new Set<string>();
  let n = 0;
  return async (file: File, { onProgress, onProcessing, signal }: FileUploadContext) => {
    const first = !tried.has(file.name);
    tried.add(file.name);
    for (let i = 1; i <= steps; i++) {
      await wait(stepMs, signal);
      onProgress(i / steps);
      if (failFirstTry && first && i === Math.ceil(steps / 2)) throw new Error("The connection dropped.");
    }
    onProcessing();
    await wait(serverMs, signal);
    return `photo-${++n}`;
  };
}

const RULES_HINT = "JPEG or PNG, up to 10 photos, 15 MB each.";

export const Default: Story = {
  render: () => (
    <div style={{ maxWidth: 520 }}>
      <FileUpload label="Photos" helperText={RULES_HINT} types={["image/jpeg", "image/png"]} maxFiles={10} maxSize={15 * 1024 * 1024} upload={simulatedUpload()} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Choose a few pictures of your own. Each one uploads with its progress, spends a moment finishing on the pretend server, then reads Uploaded. Remove one partway and its upload stops.",
      },
    },
  },
};

/* One file held in each state, by name. */
const HELD: Record<string, "done" | "fail" | "upload" | "process"> = {
  "harbor-at-dawn.jpg": "done",
  "ridge-trail.jpg": "fail",
  "meadow.jpg": "upload",
  "lighthouse.jpg": "process",
};
const heldUpload = async (file: File, { onProgress, onProcessing, signal }: FileUploadContext) => {
  const hold = () => new Promise<never>((_, reject) => signal.addEventListener("abort", () => reject(new Error("Removed"))));
  switch (HELD[file.name]) {
    case "done":
      onProgress(1);
      return "photo-1";
    case "fail":
      onProgress(0.3);
      throw new Error("The connection dropped.");
    case "upload":
      onProgress(0.6);
      return hold();
    case "process":
      onProgress(1);
      onProcessing();
      return hold();
    default:
      return hold();
  }
};

export const EveryState: Story = {
  render: () => (
    <div style={{ maxWidth: 520 }}>
      <FileUpload label="Photos" helperText={RULES_HINT} maxSize={15 * 1024 * 1024} concurrency={2} upload={heldUpload} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector<HTMLInputElement>("input[type=file]")!;
    pickFiles(input, [
      await samplePhoto("harbor-at-dawn.jpg", 200),
      await samplePhoto("ridge-trail.jpg", 20),
      await samplePhoto("meadow.jpg", 100),
      await samplePhoto("lighthouse.jpg", 260),
      await samplePhoto("orchard-in-october.jpg", 40),
      sizedFile("panorama-full-resolution.jpg", 22 * 1024 * 1024),
    ]);
    await waitFor(() => {
      if (canvasElement.querySelectorAll("[data-file-item]").length !== 6) throw new Error("not yet");
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          "One of each, top to bottom: uploaded; failed, with Try again; uploading at 60%; finishing on the server; waiting, because two upload at a time; and turned away for its size, never sent.",
      },
    },
  },
};

export const Rules: Story = {
  render: () => (
    <div style={{ maxWidth: 520 }}>
      <FileUpload
        label="Photos"
        helperText={RULES_HINT}
        types={["image/jpeg", "image/png"]}
        maxFiles={10}
        maxSize={15 * 1024 * 1024}
        validate={(file) => (/\.hei[cf]$/i.test(file.name) || /hei[cf]/.test(file.type) ? "Export it as JPEG first." : undefined)}
        upload={simulatedUpload()}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Types, size and count are checked as files arrive, and anything turned away stays in the list with the reason until it's removed. `validate` adds a rule of your own and its reason wins: here a HEIC file from a computer is told to export as JPEG first. Phones already send their photos as JPEG through the picker.",
      },
    },
  },
};

export const SlowServer: Story = {
  render: () => (
    <div style={{ maxWidth: 520 }}>
      <FileUpload label="Photos" upload={simulatedUpload({ steps: 4, stepMs: 150, serverMs: 5000 })} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The bytes go up quickly and the server takes its time, resizing, say. After `onProcessing()` the file reads Finishing up, with a bar that doesn't pretend to know how long.",
      },
    },
  },
};

export const FlakyConnection: Story = {
  render: () => (
    <div style={{ maxWidth: 520 }}>
      <FileUpload label="Photos" upload={simulatedUpload({ failFirstTry: true })} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Every file fails halfway on its first try, with the error's message as the reason. Try again sends it once more, and it goes through.",
      },
    },
  },
};

function FormDemo() {
  const [items, setItems] = useState<FileUploadItem<string>[]>([]);
  const [title, setTitle] = useState("Tide pools at low water");
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const done = items.filter((i) => i.status === "done");
  const pending = items.some((i) => i.status === "queued" || i.status === "uploading" || i.status === "processing");
  const missing = tried && done.length === 0 ? "Add at least one photo." : undefined;
  return (
    <form
      style={{ maxWidth: 520, display: "flex", flexDirection: "column", gap: 16 }}
      onSubmit={(e) => {
        e.preventDefault();
        setTried(true);
        if (done.length === 0 || pending) return;
        setSending(true);
        setTimeout(() => {
          setSending(false);
          setSent(`Posted "${title}" with ${done.map((i) => i.result).join(", ")}.`);
        }, 1200);
      }}
    >
      <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <FileUpload label="Photos" helperText={RULES_HINT} errorMessage={missing} disabled={sending} types={["image/jpeg", "image/png"]} maxFiles={10} upload={simulatedUpload()} onChange={setItems} />
      <div>
        <Button type="submit" isLoading={sending} aria-describedby="file-upload-form-note">
          Post
        </Button>
        <p id="file-upload-form-note" style={{ fontSize: 12, marginTop: 6, opacity: 0.75 }}>
          {pending ? "Waiting for photos to finish." : sent ?? "Each photo's id comes back in onChange."}
        </p>
      </div>
    </form>
  );
}

export const InAForm: Story = {
  render: () => <FormDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "A form sends the ids its uploads resolved with, not the files. Post with no photos to see the field's own error; while posting, the field holds still and Post keeps focus as it loads.",
      },
    },
  },
};

export const Translated: Story = {
  render: () => (
    <div style={{ maxWidth: 520 }}>
      <FileUpload
        label="Fotos"
        helperText="JPEG o PNG, hasta 15 MB cada una."
        types={["image/jpeg", "image/png"]}
        maxSize={15 * 1024 * 1024}
        upload={simulatedUpload()}
        strings={{
          choose: "Elegir fotos",
          dropHint: "o arrástralas aquí",
          dropHere: "Suelta para añadirlas",
          queued: "En espera",
          uploading: (p) => (p === null ? "Subiendo" : `Subiendo, ${p} %`),
          processing: "Terminando",
          done: "Subida",
          failed: "No se subió.",
          rejected: "No se añadió.",
          remove: (name) => `Quitar ${name}`,
          retry: (name) => `Reintentar ${name}`,
          wrongType: () => "Ese tipo de archivo no se admite.",
          tooLarge: () => "Pesa más de 15 MB.",
          tooMany: (max) => `Solo se pueden añadir ${max}.`,
          duplicate: () => "Ya está añadida.",
          uploadError: () => "Falló la conexión.",
          size: (bytes) => `${new Intl.NumberFormat("es", { maximumFractionDigits: 1 }).format(bytes / 1024 / 1024)} MB`,
          added: (count) => `${count} ${count === 1 ? "foto añadida" : "fotos añadidas"}.`,
          progress: (done, total) => `${done} de ${total} subidas.`,
          failedNotice: (name, reason) => `${name} no se subió. ${reason}`,
          rejectedNotice: (name, reason) => `${name} no se añadió. ${reason}`,
          removed: (name) => `${name} quitada.`,
        }}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Every word it shows or says, on screen or to a screen reader, comes from `strings`. Nothing is left in English.",
      },
    },
  },
};
