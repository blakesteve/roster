import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MatchupCard, type TeamMatchupData } from "./MatchupCard";

describe("MatchupCard Component", () => {
  const mockAwayTeam: TeamMatchupData = {
    id: "away-1",
    name: "Away Team",
    logoSrc: "/away-logo.png",
    accessory: "(12)",
    score: 14,
    isWinner: false,
  };

  const mockHomeTeam: TeamMatchupData = {
    id: "home-1",
    name: "Home Team",
    logoSrc: "/home-logo.png",
    accessory: "(4)",
    score: 28,
    isWinner: true,
  };

  it("renders an upcoming game correctly (isCompleted = false)", () => {
    render(<MatchupCard awayTeam={mockAwayTeam} homeTeam={mockHomeTeam} />);

    // Should show the "@" separator
    expect(screen.getByText("@")).toBeInTheDocument();

    // Should render accessories
    expect(screen.getByText("(12)")).toBeInTheDocument();
    expect(screen.getByText("(4)")).toBeInTheDocument();

    // Should NOT render scores when not completed
    expect(screen.queryByText("14")).not.toBeInTheDocument();
    expect(screen.queryByText("28")).not.toBeInTheDocument();
  });

  it("renders a completed game with a winner and loser correctly", () => {
    render(
      <MatchupCard
        awayTeam={mockAwayTeam}
        homeTeam={mockHomeTeam}
        isCompleted={true}
      />,
    );

    // Should show the "-" separator
    expect(screen.getByText("-")).toBeInTheDocument();

    // Should render scores
    expect(screen.getByText("14")).toBeInTheDocument();
    expect(screen.getByText("28")).toBeInTheDocument();

    // Check visual states
    const awayLogo = screen.getByAltText("Away Team");
    const homeLogo = screen.getByAltText("Home Team");

    // Home team is the winner (isWinner: true)
    expect(homeLogo).toHaveClass("ring-success-500");

    // Away team is the loser (isWinner: false).
    // The grayscale class is applied to the wrapper, which is the parent of the logo
    const awayWrapper = awayLogo.closest("div.flex.items-center.gap-2");
    expect(awayWrapper).toHaveClass("opacity-50");
    expect(awayWrapper).toHaveClass("grayscale");
  });

  it("renders a tied game correctly when isTie is true", () => {
    render(
      <MatchupCard
        awayTeam={{ ...mockAwayTeam, score: 24 }}
        homeTeam={{ ...mockHomeTeam, score: 24, isWinner: false }}
        isCompleted={true}
        isTie={true}
      />,
    );

    const awayLogo = screen.getByAltText("Away Team");
    const homeLogo = screen.getByAltText("Home Team");

    // Both logos should have the neutral tie ring
    expect(awayLogo).toHaveClass("ring-gray-400");
    expect(homeLogo).toHaveClass("ring-gray-400");

    // Neither should have the loser grayscale wrapper
    const awayWrapper = awayLogo.closest("div.flex.items-center.gap-2");
    expect(awayWrapper).not.toHaveClass("grayscale");
  });

  it("allows clicking the card and triggers the onClick handler", () => {
    const onClickMock = vi.fn();
    render(
      <MatchupCard
        awayTeam={mockAwayTeam}
        homeTeam={mockHomeTeam}
        onClick={onClickMock}
      />,
    );

    // Grab the button itself (the MatchupCard is a <button>)
    const cardButton = screen.getByRole("button");
    fireEvent.click(cardButton);

    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it("renders custom ReactNodes in the accessory slot", () => {
    const customAccessory = <span data-testid="custom-odds">+150</span>;

    render(
      <MatchupCard
        awayTeam={{ ...mockAwayTeam, accessory: customAccessory }}
        homeTeam={mockHomeTeam}
      />,
    );

    expect(screen.getByTestId("custom-odds")).toBeInTheDocument();
    expect(screen.getByText("+150")).toBeInTheDocument();
  });
});
