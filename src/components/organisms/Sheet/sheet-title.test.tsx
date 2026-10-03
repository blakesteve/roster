import { describe, it, expect } from "vitest";
import { titleSignature } from "./sheet-title";

function NightDate(props: { date: string; short?: boolean; className?: string; style?: object }) {
  return <time dateTime={props.date}>{props.date}</time>;
}
function Day(props: { value: Date }) {
  return <>{props.value.toDateString()}</>;
}
function Other(props: { value: Date }) {
  return <>{props.value.toISOString()}</>;
}

describe("titleSignature", () => {
  it("is a string title itself", () => {
    expect(titleSignature("Today")).toBe("Today");
    expect(titleSignature(7)).toBe("7");
  });

  it("is the text of markup, without its styling", () => {
    expect(
      titleSignature(
        <span className="a">
          Night of <em className="b">2 Oct</em>
        </span>,
      ),
    ).toBe("Night of 2 Oct");
    // A class is styling, not content.
    expect(titleSignature(<span className="other">Night of 2 Oct</span>)).toBe("Night of 2 Oct");
  });

  it("includes a component's name and plain props, so a change with no children still counts", () => {
    expect(titleSignature(<NightDate date="2026-10-02" />)).toBe("<NightDate date=2026-10-02>");
    expect(titleSignature(<NightDate date="2026-10-03" short />)).toBe("<NightDate date=2026-10-03,short=true>");
  });

  it("reads a Date prop, which is an object", () => {
    const at = (iso: string) => titleSignature(<Day value={new Date(iso)} />);
    expect(at("2026-10-02T00:00:00Z")).not.toBe(at("2026-10-03T00:00:00Z"));
    expect(at("2026-10-02T00:00:00Z")).toBe("<Day value=2026-10-02T00:00:00.000Z>");
  });

  it("tells two components with the same props apart", () => {
    expect(titleSignature(<Day value={new Date(0)} />)).not.toBe(titleSignature(<Other value={new Date(0)} />));
  });

  it("does not count a component's className or style", () => {
    expect(titleSignature(<NightDate date="2026-10-02" className="a" />)).toBe(
      titleSignature(<NightDate date="2026-10-02" className="b" style={{ color: "red" }} />),
    );
  });

  it("skips nothing, null and booleans, and joins a list", () => {
    expect(titleSignature(null)).toBe("");
    expect(titleSignature(false)).toBe("");
    expect(titleSignature(["Song ", 3])).toBe("Song 3");
  });
});
