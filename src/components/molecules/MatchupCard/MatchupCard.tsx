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

const teamWrapperVariants = cva("rst:flex rst:items-center rst:gap-2 rst:transition-all", {
  variants: {
    state: {
      default: "",
      winner: "",
      loser: "rst:opacity-50 rst:grayscale",
      tie: "",
    },
  },
  defaultVariants: { state: "default" },
});

const logoVariants = cva("rst:h-8 rst:w-8 rst:object-contain rst:transition-all rst:rounded-full", {
  variants: {
    state: {
      default: "",
      winner: "rst:ring-2 rst:ring-success-500 rst:bg-success-200/25",
      loser: "",
      tie: "rst:ring-2 rst:ring-gray-400",
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
          "rst:flex rst:items-center rst:gap-3 rst:rounded-lg rst:p-2 rst:text-left rst:transition rst:hover:bg-gray-100 rst:dark:hover:bg-slate-800",
          className,
        )}
        {...props}
      >
        {/* --- AWAY TEAM --- */}
        <div className={teamWrapperVariants({ state: awayState })}>
          <div className="rst:relative">
            <img
              src={awayTeam.logoSrc}
              alt={awayTeam.name || `Team ${awayTeam.id}`}
              className={logoVariants({ state: awayState })}
            />
          </div>
          <div className="rst:flex rst:flex-col rst:items-end">
            {awayTeam.accessory && (
              <span
                className={cn(
                  "rst:text-sm rst:text-gray-800 rst:dark:text-gray-300",
                  awayTeam.isWinner && "rst:font-bold",
                )}
              >
                {awayTeam.accessory}
              </span>
            )}
            {isCompleted && awayTeam.score !== undefined && (
              <span className="rst:text-xs rst:font-mono rst:font-semibold rst:text-gray-900 rst:dark:text-white">
                {awayTeam.score}
              </span>
            )}
          </div>
        </div>

        {/* --- SEPARATOR --- */}
        <span className="rst:text-xs rst:font-medium rst:text-gray-500 rst:self-center rst:px-1">
          {isCompleted ? "-" : "@"}
        </span>

        {/* --- HOME TEAM --- */}
        <div className={teamWrapperVariants({ state: homeState })}>
          <div className="rst:flex rst:flex-col rst:items-start">
            {homeTeam.accessory && (
              <span
                className={cn(
                  "rst:text-sm rst:text-gray-800 rst:dark:text-gray-300",
                  homeTeam.isWinner && "rst:font-bold",
                )}
              >
                {homeTeam.accessory}
              </span>
            )}
            {isCompleted && homeTeam.score !== undefined && (
              <span className="rst:text-xs rst:font-mono rst:font-semibold rst:text-gray-900 rst:dark:text-white">
                {homeTeam.score}
              </span>
            )}
          </div>
          <div className="rst:relative">
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
