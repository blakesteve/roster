import { createContext, useContext, useRef, useState, type ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Pagination, type PaginationLinkProps } from "./Pagination";

const meta = {
  title: "Molecules/Pagination",
  component: Pagination,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "Moves through pages of a list, on a phone as well as a desk.",
          "",
          "**Controlled.** You hold `page` and `pageCount`. Without `getPageHref`, every control is a button that calls `onPageChange(page)`: page in your own state. With `getPageHref(page)`, every control is a real link, crawlable and openable in a new tab: use it when your pages are URLs, and pass your router's link as `linkComponent`.",
          "",
          "```tsx",
          "<Pagination page={page} pageCount={79} onPageChange={setPage} />",
          "<Pagination page={page} pageCount={79} getPageHref={(p) => `/games?page=${p}`} linkComponent={NextLink} navigate={router.push} />",
          "```",
          "",
          "**Where it has room**, it shows numbers: previous, the first page, the current one with a neighbor each side, the last, gaps between, and next. That's seven slots wherever you are, so the buttons don't move under the pointer as you page. **Where it doesn't**, previous, a page picker (\"Page 40 of 79\") and next: any page is two taps away, and the phone's own picker does the scrolling. The pager's own width decides, not the screen's, so it's right in a sidebar too.",
          "",
          "Every control is a 44px target. The current page is `aria-current=\"page\"`, every control's name says the page it goes to, and a new page is said politely. Focus stays on the control that was pressed; to take a reader to the top of the new page, focus your list's heading in `onPageChange`. Every word is a `labels` entry.",
        ].join("\n"),
      },
    },
  },
  args: { page: 1, pageCount: 79 },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

function Paged(props: Partial<ComponentProps<typeof Pagination>> & { start?: number; pageCount: number }) {
  const { start = 1, ...rest } = props;
  const [page, setPage] = useState(start);
  return <Pagination page={page} onPageChange={setPage} {...rest} />;
}

export const SeventyNinePages: Story = {
  render: (args) => <Paged key={args.page} start={args.page} pageCount={args.pageCount} />,
  args: { page: 40 },
  parameters: {
    docs: {
      description: {
        story:
          "A catalog of 79 pages. Wide, it's numbers with gaps. Narrow the canvas below 448px and it becomes the compact form with the page picker.",
      },
    },
  },
};

export const AShortList: Story = {
  render: () => <Paged pageCount={6} start={2} />,
  parameters: { docs: { description: { story: "Seven pages or fewer and every number shows; there's nothing to skip." } } },
};

export const CompactOnAPhone: Story = {
  render: () => (
    <div style={{ width: 320, maxWidth: "100%", border: "1px dashed rgba(127,127,127,.4)", padding: "8px 0" }}>
      <Paged pageCount={79} start={40} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "At 320px wide: previous, the picker and next. The first and last arrows join from 384px. On a phone the picker opens the system's own list, so page 79 is a flick away.",
      },
    },
  },
};

/* A stand-in for a router's link: it follows the href itself, inside the
   story, so the URL form can be clicked through without leaving the page.
   Defined once, out here: a link component made during render is a new
   component every render, and React would remount every link. */
const GoTo = createContext<(href: string) => void>(() => {});
const pageOf = (href: string) => Number(new URL(href, "https://example.test").searchParams.get("page"));

function StoryLink({ href, className, children, onClick, ...aria }: PaginationLinkProps) {
  const go = useContext(GoTo);
  return (
    <a
      href={href}
      className={className}
      aria-label={aria["aria-label"]}
      aria-current={aria["aria-current"]}
      aria-disabled={aria["aria-disabled"]}
      onClick={(e) => {
        onClick(e);
        if (e.defaultPrevented) return;
        e.preventDefault();
        go(href);
      }}
    >
      {children}
    </a>
  );
}

function UrlDemo() {
  const [page, setPage] = useState(12);
  const navigate = (href: string) => setPage(pageOf(href));
  return (
    <GoTo.Provider value={navigate}>
      <div style={{ display: "grid", gap: 12 }}>
        <Pagination page={page} pageCount={79} getPageHref={(p) => `?page=${p}`} linkComponent={StoryLink} navigate={navigate} />
        <code style={{ fontSize: 12, opacity: 0.75 }}>Each control is an &lt;a href=&quot;?page=N&quot;&gt;. Showing ?page={page}</code>
      </div>
    </GoTo.Provider>
  );
}

export const AsLinks: Story = {
  render: () => <UrlDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "With `getPageHref`, every control is a link: hover one to see its address, or open it in a new tab. Inside a router, pass its link as `linkComponent` and its push as `navigate`, which the compact form's picker uses since it has no link to follow.",
      },
    },
  },
};

export const ArrowsBesideItsOwnCount: Story = {
  render: () => {
    function Demo() {
      const [page, setPage] = useState(3);
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14 }}>
            Showing {page * 20 - 19}–{Math.min(page * 20, 140)} of 140 members
          </span>
          <Pagination layout="arrows" page={page} pageCount={7} onPageChange={setPage} />
        </div>
      );
    }
    return <Demo />;
  },
  parameters: {
    docs: {
      description: {
        story: "`layout=\"arrows\"`: first, previous, next and last, for a list that says where it is itself. It sizes to fit, so it sits in a row.",
      },
    },
  },
};

function FocusDemo() {
  const [page, setPage] = useState(1);
  const heading = useRef<HTMLHeadingElement>(null);
  const items = Array.from({ length: 5 }, (_, i) => `Trail ${(page - 1) * 5 + i + 1}`);
  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 520 }}>
      <h3 ref={heading} tabIndex={-1} style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
        Trails, page {page}
      </h3>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      {/* announce={false}: the heading says the new page as it takes focus. */}
      <Pagination
        page={page}
        pageCount={12}
        announce={false}
        onPageChange={(p) => {
          setPage(p);
          heading.current?.focus();
        }}
      />
    </div>
  );
}

export const TakingFocusToTheList: Story = {
  render: () => <FocusDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "By default focus stays on the control that was pressed. This app moves it to the list's heading in `onPageChange` instead, so a keyboard or screen reader user starts at the top of the new page.",
      },
    },
  },
};

export const Translated: Story = {
  render: () => (
    <Paged
      pageCount={79}
      start={40}
      labels={{
        nav: "Páginas",
        page: (p) => `Página ${p}`,
        previous: "Anterior",
        next: "Siguiente",
        previousPage: (t) => (t === null ? "Página anterior" : `Página anterior (${t})`),
        nextPage: (t) => (t === null ? "Página siguiente" : `Página siguiente (${t})`),
        firstPage: (t) => (t === null ? "Primera página" : `Primera página (${t})`),
        lastPage: (t) => (t === null ? "Última página" : `Última página (${t})`),
        picker: "Página",
        of: (c) => `de ${c}`,
        status: (p, c) => `Página ${p} de ${c}`,
      }}
    />
  ),
  parameters: { docs: { description: { story: "Every word, shown or spoken, is a `labels` entry." } } },
};
