import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { Timeline, type TimelineStep } from "./Timeline";
import "@testing-library/jest-dom";

const WEEKS: TimelineStep[] = [
  { id: "w1", when: "Week 1", title: "Soil and compost", content: "What a bed needs.", actions: <button type="button">Edit week 1</button> },
  { id: "w2", when: "Week 2", title: "Sowing in rows", actions: <button type="button">Edit week 2</button> },
  { id: "w3", when: "Week 3", title: "Water and mulch" },
  { id: "w4", when: "Week 4", title: "Pests without poison", actions: <button type="button">Edit week 4</button> },
  { id: "w5", when: "Week 5", title: "No topic yet", marker: "hollow" },
];

const steps = () => [...document.querySelectorAll<HTMLElement>("li[data-step]")];
const states = () => steps().map((li) => li.dataset.step);
const rails = (li: Element) => [...li.querySelectorAll<HTMLElement>("[data-timeline-rail]")].map((r) => r.dataset.timelineRail);

describe("Timeline", () => {
  describe("the list", () => {
    it("is an ordered list named by its label, an item for each step", () => {
      render(<Timeline label="The course" steps={WEEKS} current={3} />);
      const list = screen.getByRole("list", { name: "The course" });
      expect([list.tagName, within(list).getAllByRole("listitem").length]).toEqual(["OL", 5]);
    });

    it("takes its name from a heading instead with aria-labelledby", () => {
      render(
        <>
          <h2 id="course">The course</h2>
          <Timeline aria-labelledby="course" label="ignored" steps={WEEKS} />
        </>,
      );
      expect(screen.getByRole("list", { name: "The course" })).not.toHaveAttribute("aria-label");
    });

    it("renders nothing for no steps", () => {
      const { container } = render(<Timeline label="Empty" steps={[]} />);
      expect(container).toBeEmptyDOMElement();
    });

    it("keeps buttons in a step in reading order", async () => {
      const user = userEvent.setup();
      render(<Timeline label="The course" steps={WEEKS} current={3} />);
      const reached: string[] = [];
      for (let i = 0; i < 3; i++) {
        await user.tab();
        reached.push(document.activeElement!.textContent!);
      }
      expect(reached).toEqual(["Edit week 1", "Edit week 2", "Edit week 4"]);
    });
  });

  describe("states", () => {
    it("has the steps before current done, current current, and the rest upcoming", () => {
      render(<Timeline label="The course" steps={WEEKS} current={3} />);
      expect(states()).toEqual(["done", "done", "current", "upcoming", "upcoming"]);
    });

    it("marks only the current step aria-current, as a step", () => {
      render(<Timeline label="The course" steps={WEEKS} current={3} />);
      expect(steps().map((li) => li.getAttribute("aria-current"))).toEqual([null, null, "step", null, null]);
    });

    it("says done after a finished step's title, and nothing after the others", () => {
      render(<Timeline label="The course" steps={WEEKS} current={3} />);
      const titles = steps().map((li) => li.querySelector("[data-timeline-body] > div")!.textContent);
      expect(titles).toEqual(["Soil and compost, done", "Sowing in rows, done", "Water and mulch", "Pests without poison", "No topic yet"]);
    });

    it("starts with none begun, and takes past the last as every step done", () => {
      const { rerender } = render(<Timeline label="The course" steps={WEEKS} />);
      const none = states();
      rerender(<Timeline label="The course" steps={WEEKS} current={6} />);
      expect([none, states()]).toEqual([
        ["upcoming", "upcoming", "upcoming", "upcoming", "upcoming"],
        ["done", "done", "done", "done", "done"],
      ]);
    });

    it("takes a current out of range as the nearest end", () => {
      const read = (current: number) => {
        const { unmount } = render(<Timeline label="The course" steps={WEEKS} current={current} />);
        const out = states().join(",");
        unmount();
        return out;
      };
      expect([read(-3), read(99), read(Number.NaN), read(2.7)]).toEqual([
        "upcoming,upcoming,upcoming,upcoming,upcoming",
        "done,done,done,done,done",
        "upcoming,upcoming,upcoming,upcoming,upcoming",
        "done,current,upcoming,upcoming,upcoming",
      ]);
    });
  });

  describe("markers", () => {
    it("shows a step's number, a check once done, and a hollow ring when asked, all hidden from assistive technology", () => {
      render(<Timeline label="The course" steps={WEEKS} current={3} />);
      const markers = steps().map((li) => li.querySelector("[data-timeline-marker]")!);
      const shown = markers.map((m) => (m.querySelector("svg") ? "check" : m.querySelector("[data-timeline-hollow]") ? "hollow" : m.textContent));
      expect([shown, markers.every((m) => m.getAttribute("aria-hidden") === "true")]).toEqual([["check", "check", "3", "4", "hollow"], true]);
    });

    it("puts a mark of the consumer's own on the line", () => {
      render(<Timeline label="The course" steps={[{ id: "a", title: "A", marker: <span data-own-mark="">★</span> }]} />);
      expect(screen.getByText("★")).toHaveAttribute("data-own-mark");
    });

    it("numbers and says done in the consumer's words", () => {
      render(<Timeline label="Kurs" steps={WEEKS.slice(0, 3)} current={2} labels={{ done: "erledigt", number: (n) => `#${n}` }} />);
      const li = steps();
      expect([li[0].textContent, li[1].querySelector("[data-timeline-marker]")!.textContent]).toEqual(["Week 1Soil and compost, erledigtWhat a bed needs.Edit week 1", "#2"]);
    });
  });

  describe("the line", () => {
    it("runs from the first marker to the last, filled up to the step reached", () => {
      render(<Timeline label="The course" steps={WEEKS} current={3} />);
      /* Each step's stretches: the one into its marker, then the one onward. */
      expect(steps().map(rails)).toEqual([["done"], ["done", "done"], ["done", "ahead"], ["ahead", "ahead"], ["ahead"]]);
    });

    it("draws none for a single step", () => {
      render(<Timeline label="One" steps={WEEKS.slice(0, 1)} current={1} />);
      expect(rails(steps()[0])).toEqual([]);
    });
  });

  describe("the now divider", () => {
    const divider = () => document.querySelector<HTMLElement>("[data-timeline-now]");

    it("sits just before the step it's given, hidden from assistive technology, in the consumer's word", () => {
      render(<Timeline label="The course" steps={WEEKS} current={3} nowBefore={4} labels={{ now: "Today" }} />);
      const now = divider()!;
      expect([
        now.tagName,
        now.getAttribute("aria-hidden"),
        now.textContent,
        now.nextElementSibling!.textContent!.includes("Pests without poison"),
        rails(now),
      ]).toEqual(["LI", "true", "Today", true, ["ahead"]]);
    });

    it("isn't drawn out of range, and draws no line above the first step", () => {
      const { rerender } = render(<Timeline label="The course" steps={WEEKS} nowBefore={0} />);
      const zero = divider();
      rerender(<Timeline label="The course" steps={WEEKS} nowBefore={6} />);
      const six = divider();
      rerender(<Timeline label="The course" steps={WEEKS} nowBefore={1} />);
      expect([zero, six, rails(divider()!), rails(steps()[0])]).toEqual([null, null, [], ["ahead"]]);
    });
  });

  describe("columns", () => {
    const wide = () => document.querySelector("ol")!.className.match(/rst:@\[40rem\]:grid-cols-\S+/)?.[0] ?? "none";

    it("makes room for when and actions only where some step has them", () => {
      const read = (s: TimelineStep[]) => {
        const { unmount } = render(<Timeline label="L" steps={s} />);
        const out = wide();
        unmount();
        return out;
      };
      const without = (keys: Partial<TimelineStep>) => WEEKS.map((s) => ({ ...s, ...keys }));
      expect([
        read(WEEKS),
        read(without({ actions: undefined })),
        read(without({ when: undefined })),
        read(without({ when: undefined, actions: undefined })),
      ]).toEqual([
        "rst:@[40rem]:grid-cols-[fit-content(12rem)_minmax(2rem,max-content)_minmax(0,1fr)_auto]",
        "rst:@[40rem]:grid-cols-[fit-content(12rem)_minmax(2rem,max-content)_minmax(0,1fr)]",
        "rst:@[40rem]:grid-cols-[minmax(2rem,max-content)_minmax(0,1fr)_auto]",
        "none",
      ]);
    });

    it("puts the classes for each part where they go", () => {
      render(
        <Timeline
          label="The course"
          steps={WEEKS}
          current={2}
          nowBefore={3}
          className="mine"
          stepClassName="s"
          whenClassName="w"
          markerClassName="m"
          titleClassName="t"
          contentClassName="c"
          actionsClassName="a"
          nowClassName="n"
        />,
      );
      const first = steps()[0];
      expect([
        document.querySelector("[data-timeline]")!.classList.contains("mine"),
        first.classList.contains("s"),
        first.querySelector("[data-timeline-when]")!.classList.contains("w"),
        first.querySelector("[data-timeline-marker]")!.classList.contains("m"),
        first.querySelector("[data-timeline-body] > div")!.classList.contains("t"),
        first.querySelector("[data-timeline-body] > div + div")!.classList.contains("c"),
        first.querySelector("[data-timeline-actions]")!.classList.contains("a"),
        document.querySelector("[data-timeline-now]")!.classList.contains("n"),
      ]).toEqual([true, true, true, true, true, true, true, true]);
    });
  });
});
