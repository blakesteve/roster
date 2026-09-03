import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { PasswordInput } from "./PasswordInput";
import "@testing-library/jest-dom";

/** The field has no role of its own while type="password", so query by label. */
const field = () => screen.getByLabelText("Password");

describe("PasswordInput Component", () => {
  describe("rendering", () => {
    it("renders a labelled field", () => {
      render(<PasswordInput label="Password" />);
      expect(field()).toBeInTheDocument();
    });

    it("masks the value by default", () => {
      render(<PasswordInput label="Password" />);
      expect(field()).toHaveAttribute("type", "password");
    });

    it("forwards a ref to the underlying input", () => {
      const ref = createRef<HTMLInputElement>();
      render(<PasswordInput label="Password" ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it("passes helper text through to Input", () => {
      render(<PasswordInput label="Password" helperText="At least 12 characters" />);
      expect(screen.getByText("At least 12 characters")).toBeInTheDocument();
    });

    it("passes the error message through to Input", () => {
      render(<PasswordInput label="Password" errorMessage="Too short" />);
      expect(screen.getByText("Too short")).toBeInTheDocument();
    });

    it("accepts a value like any other input", async () => {
      render(<PasswordInput label="Password" />);
      await userEvent.type(field(), "hunter2");
      expect(field()).toHaveValue("hunter2");
    });
  });

  describe("the reveal toggle", () => {
    it("renders a toggle button", () => {
      render(<PasswordInput label="Password" />);
      expect(screen.getByRole("button", { name: "Show password" })).toBeInTheDocument();
    });

    it("reveals the value when clicked", async () => {
      render(<PasswordInput label="Password" />);
      await userEvent.click(screen.getByRole("button", { name: "Show password" }));
      expect(field()).toHaveAttribute("type", "text");
    });

    it("hides the value again on a second click", async () => {
      render(<PasswordInput label="Password" />);
      await userEvent.click(screen.getByRole("button", { name: "Show password" }));
      await userEvent.click(screen.getByRole("button", { name: "Hide password" }));
      expect(field()).toHaveAttribute("type", "password");
    });

    it("preserves the typed value across a reveal", async () => {
      render(<PasswordInput label="Password" />);
      await userEvent.type(field(), "hunter2");
      await userEvent.click(screen.getByRole("button", { name: "Show password" }));
      expect(field()).toHaveValue("hunter2");
    });

    it("reflects state with aria-pressed", async () => {
      render(<PasswordInput label="Password" />);
      const toggle = screen.getByRole("button");
      expect(toggle).toHaveAttribute("aria-pressed", "false");

      await userEvent.click(toggle);
      expect(toggle).toHaveAttribute("aria-pressed", "true");
    });

    it("is keyboard operable", async () => {
      render(<PasswordInput label="Password" />);
      await userEvent.tab();
      await userEvent.tab();
      expect(screen.getByRole("button")).toHaveFocus();

      await userEvent.keyboard("{Enter}");
      expect(field()).toHaveAttribute("type", "text");
    });

    // A bare <button> inside a form defaults to type="submit", which would
    // submit the login form every time someone peeked at their password.
    it("does not submit the surrounding form", async () => {
      const onSubmit = vi.fn((e) => e.preventDefault());
      render(
        <form onSubmit={onSubmit}>
          <PasswordInput label="Password" />
        </form>,
      );

      expect(screen.getByRole("button")).toHaveAttribute("type", "button");
      await userEvent.click(screen.getByRole("button"));
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("accepts custom toggle labels", async () => {
      render(
        <PasswordInput label="Password" showLabel="Reveal" hideLabel="Conceal" />,
      );
      await userEvent.click(screen.getByRole("button", { name: "Reveal" }));
      expect(screen.getByRole("button", { name: "Conceal" })).toBeInTheDocument();
    });
  });

  describe("revealable", () => {
    it("renders no toggle when revealable is false", () => {
      render(<PasswordInput label="Password" revealable={false} />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("stays masked when the toggle is suppressed", () => {
      render(<PasswordInput label="Password" revealable={false} />);
      expect(field()).toHaveAttribute("type", "password");
    });
  });

  describe("uncontrolled state", () => {
    it("can start revealed", () => {
      render(<PasswordInput label="Password" defaultRevealed />);
      expect(field()).toHaveAttribute("type", "text");
    });

    it("reports changes through onRevealChange", async () => {
      const onRevealChange = vi.fn();
      render(<PasswordInput label="Password" onRevealChange={onRevealChange} />);

      await userEvent.click(screen.getByRole("button"));
      expect(onRevealChange).toHaveBeenCalledWith(true);
    });
  });

  describe("controlled state", () => {
    it("honors the revealed prop", () => {
      render(<PasswordInput label="Password" revealed />);
      expect(field()).toHaveAttribute("type", "text");
    });

    // Controlled means the consumer owns it, so clicking must not self-update.
    it("does not change on its own when controlled", async () => {
      const onRevealChange = vi.fn();
      render(
        <PasswordInput
          label="Password"
          revealed={false}
          onRevealChange={onRevealChange}
        />,
      );

      await userEvent.click(screen.getByRole("button"));
      expect(onRevealChange).toHaveBeenCalledWith(true);
      expect(field()).toHaveAttribute("type", "password");
    });
  });

  describe("disabled", () => {
    it("disables the field", () => {
      render(<PasswordInput label="Password" disabled />);
      expect(field()).toBeDisabled();
    });

    it("disables the toggle alongside it", () => {
      render(<PasswordInput label="Password" disabled />);
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("cannot be revealed while disabled", async () => {
      render(<PasswordInput label="Password" disabled />);
      await userEvent.click(screen.getByRole("button"));
      expect(field()).toHaveAttribute("type", "password");
    });
  });
});

describe("PasswordInput className composition", () => {
  it("keeps the Edge reveal fix when a consumer passes className", () => {
    /* The component composed `[&_input::-ms-reveal]:hidden` with the
       consumer's className and then spread `{...props}` AFTER it. Because
       `className` was read off `props` rather than destructured out, the spread
       overwrote the composed value and took the Edge fix with it — so the one
       consumer who styled a PasswordInput would silently get two reveal
       controls side by side on Edge. Dormant when found; nobody passes one
       today. */
    const { container } = render(<PasswordInput className="rst:max-w-xs" />);
    const wrapper = container.firstElementChild!;
    expect(wrapper).toHaveClass("rst:max-w-xs");
    expect(wrapper.className).toMatch(/ms-reveal/);
  });
});
