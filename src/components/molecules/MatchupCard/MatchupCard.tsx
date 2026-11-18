import React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import { withLabels } from "../../../lib/labels";

export interface TeamMatchupData {
  id: string | number;
  logoSrc: string;
  name?: string;
  score?: number;
  isWinner?: boolean;
  /** Generic slot for extra info like pick counts "(5)", records "(10-2)", or odds */
  accessory?: React.ReactNode;
}

/* The losing side's fade is on its logo alone. A logo is exempt from
   contrast as a mark, and faded beside the winner's ring it still reads as
   lost. Its words take Roster's quiet ink instead: faded with the logo, the
   score painted 3.35:1 and the accessory 3.10. */
const logoVariants = /* @__PURE__ */ cva("rst:h-8 rst:w-8 rst:object-contain rst:transition-all rst:rounded-full", {
  variants: {
    state: {
      default: "",
      winner: "rst:ring-2 rst:ring-success-500 rst:bg-success-200/25",
      loser: "rst:grayscale rst:opacity-50",
      tie: "rst:ring-2 rst:ring-gray-400",
    },
  },
  defaultVariants: { state: "default" },
});

const TEAM = "rst:flex rst:items-center rst:gap-2 rst:transition-all";
const QUIET = "rst:text-gray-500 rst:dark:text-gray-400";

/** Every word MatchupCard says of its own. Pass any of them in `labels` to replace it. */
export interface MatchupCardLabels {
  /** Heard after the winning team's name, once the game is completed. */
  won: string;
  /** Heard after the losing team's name. */
  lost: string;
  /** Heard after each team's name on a tie. */
  tied: string;
}

const LABELS: MatchupCardLabels = { won: "won", lost: "lost", tied: "tied" };

export interface MatchupCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  awayTeam: TeamMatchupData;
  homeTeam: TeamMatchupData;
  /** Determines if scores should be shown and if win/loss styles apply */
  isCompleted?: boolean;
  isTie?: boolean;
  /**
   * The component's own words, replaced; any left out stay English. A result
   * is shown by a ring and a fade, so each team's is also said, hidden, after
   * its name.
   */
  labels?: Partial<MatchupCardLabels>;
}

const MatchupCard = React.forwardRef<HTMLButtonElement, MatchupCardProps>(
  (
    {
      awayTeam,
      homeTeam,
      isCompleted = false,
      isTie = false,
      labels,
      className,
      ...props
    },
    ref,
  ) => {
    const l = withLabels(LABELS, labels);
    // Determine visual states
    const getTeamState = (team: TeamMatchupData) => {
      if (!isCompleted) return "default";
      if (isTie) return "tie";
      return team.isWinner ? "winner" : "loser";
    };

    const awayState = getTeamState(awayTeam);
    const homeState = getTeamState(homeTeam);

    const result = (state: ReturnType<typeof getTeamState>) => {
      const word = state === "winner" ? l.won : state === "loser" ? l.lost : state === "tie" ? l.tied : null;
      return word && <span className="rst:sr-only">{`, ${word}`}</span>;
    };
    const accessoryClass = (team: TeamMatchupData, state: ReturnType<typeof getTeamState>) =>
      cn("rst:text-sm", state === "loser" ? QUIET : "rst:text-gray-800 rst:dark:text-gray-300", team.isWinner && "rst:font-bold");
    const scoreClass = (state: ReturnType<typeof getTeamState>) =>
      cn("rst:text-xs rst:font-mono rst:font-semibold", state === "loser" ? QUIET : "rst:text-gray-900 rst:dark:text-white");

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "rst:flex rst:items-center rst:gap-3 rst:rounded-lg rst:p-2 rst:text-left rst:transition rst:hover:bg-gray-100 rst:dark:hover:bg-gray-800 rst:focus:outline-hidden rst:focus-visible:ring-2 rst:focus-visible:ring-ring",
          className,
        )}
        {...props}
      >
        {/* --- AWAY TEAM --- */}
        <div className={TEAM}>
          <div className="rst:relative">
            <img
              src={awayTeam.logoSrc}
              alt={awayTeam.name || `Team ${awayTeam.id}`}
              className={logoVariants({ state: awayState })}
            />
            {result(awayState)}
          </div>
          <div className="rst:flex rst:flex-col rst:items-end">
            {awayTeam.accessory && <span className={accessoryClass(awayTeam, awayState)}>{awayTeam.accessory}</span>}
            {isCompleted && awayTeam.score !== undefined && (
              <span className={scoreClass(awayState)}>{awayTeam.score}</span>
            )}
          </div>
        </div>

        {/* --- SEPARATOR --- */}
        <span className={cn("rst:text-xs rst:font-medium rst:self-center rst:px-1", QUIET)}>
          {isCompleted ? "-" : "@"}
        </span>

        {/* --- HOME TEAM --- */}
        <div className={TEAM}>
          <div className="rst:flex rst:flex-col rst:items-start">
            {homeTeam.accessory && <span className={accessoryClass(homeTeam, homeState)}>{homeTeam.accessory}</span>}
            {isCompleted && homeTeam.score !== undefined && (
              <span className={scoreClass(homeState)}>{homeTeam.score}</span>
            )}
          </div>
          <div className="rst:relative">
            <img
              src={homeTeam.logoSrc}
              alt={homeTeam.name || `Team ${homeTeam.id}`}
              className={logoVariants({ state: homeState })}
            />
            {result(homeState)}
          </div>
        </div>
      </button>
    );
  },
);

MatchupCard.displayName = "MatchupCard";

export { MatchupCard };
