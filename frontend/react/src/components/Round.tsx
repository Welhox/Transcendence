import React from "react";
import MatchCard from "./MatchCard";
import { Match, Player } from "../types/game";

interface RoundProps {
  round: number;
  matches: Match[];
  onPlay: (match: Match, winner: Player) => void;
}

const Round: React.FC<RoundProps> = ({ round, matches, onPlay }) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-xl font-bold text-teal-700 dark:text-teal-300 mb-2">
        Round {round}
      </h2>
      <div className="flex flex-row gap-8">
        {matches.map((match, i) => (
          <MatchCard key={match.id || i} match={match} onPlay={onPlay} />
        ))}
      </div>
    </div>
  );
};

export default Round;
