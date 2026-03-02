import React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../../lib/utils";

export interface TeamMatchupData {
  id: string | number;
  logoSrc: string;
  name?: string;
  score?: number;
  isWinner?: boolean;
  /** Generic slot for extra info like pick counts "(5)", records "(10-2)", or odds */
  accessory?: React.ReactNode;
}

const teamWrapperVariants = cva("flex items-center gap-2 transition-all", {
  variants: {
    state: {
      default: "",
      winner: "",
      loser: "opacity-50 grayscale",
      tie: "",
    },
  },
  defaultVariants: { state: "default" },
});

const logoVariants = cva("h-8 w-8 object-contain transition-all rounded-full", {
  variants: {
    state: {
      default: "",
      winner: "ring-2 ring-success-500 bg-success-200/25",
      loser: "",
      tie: "ring-2 ring-gray-400",
    },
  },
  defaultVariants: { state: "default" },
});

export interface MatchupCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  awayTeam: TeamMatchupData;
  homeTeam: TeamMatchupData;
  /** Determines if scores should be shown and if win/loss styles apply */
  isCompleted?: boolean;
  isTie?: boolean;
}

const MatchupCard = React.forwardRef<HTMLButtonElement, MatchupCardProps>(
  (
    {
      awayTeam,
      homeTeam,
      isCompleted = false,
      isTie = false,
      className,
      ...props
    },
    ref,
  ) => {
    // Determine visual states
    const getTeamState = (team: TeamMatchupData) => {
      if (!isCompleted) return "default";
      if (isTie) return "tie";
      return team.isWinner ? "winner" : "loser";
    };

    const awayState = getTeamState(awayTeam);
    const homeState = getTeamState(homeTeam);

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "flex items-center gap-3 rounded-lg p-2 text-left transition hover:bg-gray-100 dark:hover:bg-slate-800",
          className,
        )}
        {...props}
      >
        {/* --- AWAY TEAM --- */}
        <div className={teamWrapperVariants({ state: awayState })}>
          <div className="relative">
            <img
              src={awayTeam.logoSrc}
              alt={awayTeam.name || `Team ${awayTeam.id}`}
              className={logoVariants({ state: awayState })}
            />
          </div>
          <div className="flex flex-col items-end">
            {awayTeam.accessory && (
              <span
                className={cn(
                  "text-sm text-gray-800 dark:text-gray-300",
                  awayTeam.isWinner && "font-bold",
                )}
              >
                {awayTeam.accessory}
              </span>
            )}
            {isCompleted && awayTeam.score !== undefined && (
              <span className="text-xs font-mono font-semibold text-gray-900 dark:text-white">
                {awayTeam.score}
              </span>
            )}
          </div>
        </div>

        {/* --- SEPARATOR --- */}
        <span className="text-xs font-medium text-gray-500 self-center px-1">
          {isCompleted ? "-" : "@"}
        </span>

        {/* --- HOME TEAM --- */}
        <div className={teamWrapperVariants({ state: homeState })}>
          <div className="flex flex-col items-start">
            {homeTeam.accessory && (
              <span
                className={cn(
                  "text-sm text-gray-800 dark:text-gray-300",
                  homeTeam.isWinner && "font-bold",
                )}
              >
                {homeTeam.accessory}
              </span>
            )}
            {isCompleted && homeTeam.score !== undefined && (
              <span className="text-xs font-mono font-semibold text-gray-900 dark:text-white">
                {homeTeam.score}
              </span>
            )}
          </div>
          <div className="relative">
            <img
              src={homeTeam.logoSrc}
              alt={homeTeam.name || `Team ${homeTeam.id}`}
              className={logoVariants({ state: homeState })}
            />
          </div>
        </div>
      </button>
    );
  },
);

MatchupCard.displayName = "MatchupCard";

export { MatchupCard };
