import React from "react";
import { Match, Player } from "../types/game";

interface MatchCardProps {
  match: Match;
  onPlay: (match: Match, winner: Player) => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, onPlay }) => {
  const { player1, player2, result, winnerId } = match;

  return (
    <div className="flex justify-between items-center p-3 border rounded mb-2">
      <div>
        <span className="font-semibold">{player1.name}</span> vs{" "}
        <span className="font-semibold">{player2.name}</span>
      </div>
      {result ? (
        <div className="text-green-600 font-semibold">
          Winner: {winnerId === player1.id ? player1.name : player2.name}
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            className="bg-blue-600 text-white px-3 py-1 rounded"
            onClick={() => onPlay(match, player1)}
          >
            {player1.name} Wins
          </button>
          <button
            className="bg-blue-600 text-white px-3 py-1 rounded"
            onClick={() => onPlay(match, player2)}
          >
            {player2.name} Wins
          </button>
        </div>
      )}
    </div>
  );
};

export default MatchCard;
