import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { waitFor } from "storybook/test";
import { Button } from "../../atoms/Button/Button";
import { Input } from "../../atoms/Input/Input";
import { FileUpload, type FileUploadContext, type FileUploadItem, type FileUploadProps } from "./FileUpload";
import { FileUploadRejection } from "./file-upload-rejection";
import { pickFiles, samplePhoto, sizedFile } from "../../../test/sample-files";

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

/* Every story renders through this, so every control works on every story.
   `preview="dropzone"` holds one file, so with it the field takes one, and
   flipping the control shows the box rather than the rows' fallback. */
function Field(args: FileUploadProps) {
  return (
    <div style={{ maxWidth: 520 }}>
      <FileUpload {...args} maxFiles={args.preview === "dropzone" ? 1 : args.maxFiles} />
    </div>
  );
}

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
          "When your server can tell a file will never go up, reject with a `FileUploadRejection` and it's turned away rather than failed. A picture of each file shows as a thumbnail on its row, or, for one picture, `preview=\"dropzone\"` shows it big in the drop box.",
          "",
          "On phones the picker stays `accept=\"image/*\"` with no `capture`, which is what gets Android's photo picker with albums and cloud photos rather than a file browser. Narrow what's allowed with `types`, checked after picking. Dragging files onto the field works where there's a pointer, and is never the only way in. Every word it shows or says can be replaced through `strings`.",
        ].join("\n"),
      },
    },
  },
  render: Field,
  args: {
    label: "Photos",
    helperText: RULES_HINT,
    types: ["image/jpeg", "image/png"],
    maxFiles: 10,
    maxSize: 15 * 1024 * 1024,
    concurrency: 3,
    disabled: false,
    preview: "row",
    upload: simulatedUpload(),
  },
  argTypes: {
    label: { control: "text" },
    helperText: { control: "text", description: "Help under the drop box, tied to the Choose button." },
    errorMessage: { control: "text" },
    types: { control: "object" },
    accept: { control: "text", table: { defaultValue: { summary: '"image/*"' } } },
    maxFiles: { control: { type: "number", min: 1, step: 1 } },
    maxSize: { control: { type: "number", min: 0, step: 1024 * 1024 } },
    concurrency: { control: { type: "number", min: 1, step: 1 }, table: { defaultValue: { summary: "3" } } },
    disabled: { control: "boolean", table: { defaultValue: { summary: "false" } } },
    preview: {
      control: "inline-radio",
      options: ["row", "dropzone"],
      description:
        "`row`: a thumbnail at the start of each file's row. `dropzone`: one picture, filling the drop box. `dropzone` takes `maxFiles={1}`, which these stories set for you when it's chosen.",
      table: { defaultValue: { summary: "row" } },
    },
    upload: { control: false },
    onChange: { control: false },
    validate: { control: false },
    strings: { control: false },
    className: { control: "text" },
  },
} satisfies Meta<typeof FileUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Choose a few pictures of your own. Each one uploads with its progress, spends a moment finishing on the pretend server, then reads Uploaded. Remove one partway and its upload stops. Every control here works; switch `preview` to `dropzone` to see one picture in the box.",
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
  args: { types: undefined, maxFiles: undefined, concurrency: 2, upload: heldUpload },
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
  args: {
    validate: (file) => (/\.hei[cf]$/i.test(file.name) || /hei[cf]/.test(file.type) ? "Export it as JPEG first." : undefined),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Types, size and count are checked as files arrive, and anything turned away stays in the list with the reason until it's removed. `validate` adds a rule of your own and its reason wins: here a HEIC file from a computer is told to export as JPEG first. Phones already send their photos as JPEG through the picker.",
      },
    },
  },
};

/* The same photo with its picture in each place, so the two can be compared. */
function PicturePlaces(args: FileUploadProps) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start" }}>
      {(["row", "dropzone"] as const).map((preview) => (
        <div key={preview} style={{ width: 340 }} data-picture-place={preview}>
          <p style={{ margin: "0 0 8px", fontSize: 12, opacity: 0.7 }}>preview=&quot;{preview}&quot;</p>
          <FileUpload {...args} label={preview === "row" ? "Photos" : "Cover photo"} preview={preview} maxFiles={preview === "dropzone" ? 1 : args.maxFiles} />
        </div>
      ))}
    </div>
  );
}

export const WhereThePictureShows: Story = {
  render: PicturePlaces,
  args: { helperText: undefined, upload: simulatedUpload({ serverMs: 4000 }) },
  play: async ({ canvasElement }) => {
    for (const place of canvasElement.querySelectorAll("[data-picture-place]")) {
      pickFiles(place.querySelector<HTMLInputElement>("input[type=file]")!, [await samplePhoto("lake-at-sunset.jpg", 20, { size: 320 })]);
    }
  },
  parameters: {
    docs: {
      description: {
        story:
          "The same photo, its picture in each place. `preview=\"row\"`, the default, puts a thumbnail at the start of each file's row, for any number of files. `preview=\"dropzone\"` shows one picture big, filling the drop box, for an avatar or a cover; it takes `maxFiles={1}`, and the row keeps the name, progress, Remove and Try again.",
      },
    },
  },
};

/* A pretend server that only takes JPEG: anything else is turned away for
   good once it arrives, the way a server that decodes the file would. */
const jpegOnlyUpload = async (file: File, context: FileUploadContext) => {
  await wait(400, context.signal);
  context.onProgress(0.5);
  await wait(400, context.signal);
  if (file.type !== "image/jpeg") throw new FileUploadRejection("The server only takes JPEG photos.");
  return simulatedUpload({ steps: 2, stepMs: 200, serverMs: 600 })(file, context);
};

export const TurnedAwayByTheServer: Story = {
  args: { helperText: "Any photo; the server takes JPEG only.", types: undefined, upload: jpegOnlyUpload },
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector<HTMLInputElement>("input[type=file]")!;
    pickFiles(input, [await samplePhoto("beach-house.jpg", 190), await samplePhoto("screenshot.png", 280, { type: "image/png" })]);
  },
  parameters: {
    docs: {
      description: {
        story:
          "Some files can only be turned away once they've been sent: the server can't decode one, or says it isn't a photo. Reject with a `FileUploadRejection` and the file ends as one the rules turned away, \"Not added.\" with your reason and no Try again, instead of failing. Here the pretend server takes JPEG only, so the PNG is turned away halfway. Its place is freed, and the next file waiting starts. A plain `Error` still means it failed and can be tried again.",
      },
    },
  },
};

export const PictureInTheDropBox: Story = {
  args: {
    label: "Cover photo",
    helperText: "JPEG or PNG, up to 15 MB.",
    maxFiles: 1,
    preview: "dropzone",
    strings: { choose: "Choose a photo", dropHint: "or drag it here", dropHere: "Drop to use it", added: () => "Photo added." },
  },
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector<HTMLInputElement>("input[type=file]")!;
    pickFiles(input, [await samplePhoto("lake-at-sunset.jpg", 20, { size: 320 })]);
  },
  parameters: {
    docs: {
      description: {
        story:
          "For one picture, an avatar or a cover, `preview=\"dropzone\"` shows it big, filling the drop box, rather than as the row's thumbnail; the row keeps the name, the progress, Remove and Try again. Choose another, or drop one on the box, and it takes the place of this one, while a file the rules turn away leaves it as it was. The box keeps its height with or without a picture, so nothing below it moves. It takes `maxFiles={1}`.",
      },
    },
  },
};

export const SlowServer: Story = {
  args: { upload: simulatedUpload({ steps: 4, stepMs: 150, serverMs: 5000 }) },
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
  args: { upload: simulatedUpload({ failFirstTry: true }) },
  parameters: {
    docs: {
      description: {
        story:
          "Every file fails halfway on its first try, with the error's message as the reason. Try again sends it once more, and it goes through.",
      },
    },
  },
};

/* The form holds the field's error and disables it while posting, so those
   two come from the form; every other control reaches the field. */
function FormDemo(args: FileUploadProps) {
  const [items, setItems] = useState<FileUploadItem[]>([]);
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
      <FileUpload
        {...args}
        maxFiles={args.preview === "dropzone" ? 1 : args.maxFiles}
        errorMessage={missing}
        disabled={sending}
        onChange={setItems}
      />
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
  render: FormDemo,
  argTypes: {
    errorMessage: { control: false, description: "Set by the form: post with no photos." },
    disabled: { control: false, description: "Set by the form while it posts." },
  },
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
  args: {
    label: "Fotos",
    helperText: "JPEG o PNG, hasta 15 MB cada una.",
    maxFiles: undefined,
    strings: {
      choose: "Elegir fotos",
      replace: "Cambiar foto",
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
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Every word it shows or says, on screen or to a screen reader, comes from `strings`. Nothing is left in English, the drop box's Replace included.",
      },
    },
  },
};
