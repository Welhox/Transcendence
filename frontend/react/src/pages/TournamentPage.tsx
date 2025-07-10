import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";
import Bracket from "../components/Bracket";
import { Match, Player } from "../types/game";
import { useGameSettings } from "../contexts/GameSettingsContext";

const TournamentPage = () => {
  const { id } = useParams<{ id: string }>();
  const tournamentId = parseInt(id || "0", 10);
  const navigate = useNavigate();
  const location = useLocation(); // for testing without backend
  const state = location.state as {
    players?: { username: string; isGuest: boolean }[];
  };

  const [players, setPlayers] = useState<Player[]>([]);
  const [matchesFromBackend, setMatchesFromBackend] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { settings } = useGameSettings();

  useEffect(() => {
    if (state?.players && state.players.length > 0) {
      const generatedPlayers: Player[] = state.players.map((p, index) => ({
        id: p.isGuest ? null : index + 1,
        name: p.username,
      }));

      setPlayers(generatedPlayers);
      generateInitialMatches(generatedPlayers);
      setIsLoading(false);
    } else {
      fetchTournamentData();
    }
  }, [tournamentId, state]);

  const fetchTournamentData = async () => {
    setIsLoading(true);
    try {
      /* const [participantsRes, matchesRes] = await Promise.all([
        api.get(`/tournament/${tournamentId}/participants`),
        api.get(`/tournament/${tournamentId}/matches`),
      ]); */
      console.log("Missing API call for tournament participants and matches");

      /* const playersData = participantsRes.data.map((p: any) => ({
        id: p.userId ?? null,
        name: p.user?.username ?? p.alias,
      }));
      setPlayers(playersData);

      const backendMatches = matchesRes.data.map((m: any) => ({
        id: m.id,
        player1: { id: m.player.id, name: m.player.username },
        player2: { id: m.opponent.id, name: m.opponent.username },
        result: m.result,
        winnerId:
          m.result === "win"
            ? m.player.id
            : m.result === "loss"
            ? m.opponent.id
            : null,
        round: m.round,
        saved: true,
      }));

      setMatchesFromBackend(backendMatches);
      if (backendMatches.length === 0) {
        generateInitialMatches(playersData);
      } */
    } catch (error) {
      console.error("Failed to fetch tournament data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateInitialMatches = (players: Player[]): void => {
    const newMatches: Match[] = [];
    for (let i = 0; i < players.length; i += 2) {
      const p1 = players[i];
      const p2 = players[i + 1];
      if (p2) {
        newMatches.push({
          player1: p1,
          player2: p2,
          result: null,
          winnerId: null,
          round: 1,
          saved: false,
        });
      }
    }
    setUpcomingMatches(newMatches);
  };

  const handleMatchPlayed = async (
    match: Match,
    winner: Player
  ): Promise<void> => {
    const result: "win" | "loss" =
      winner.id === match.player1.id ? "win" : "loss";

    const updatedMatch: Match = {
      ...match,
      result,
      winnerId: winner.id,
      saved: true,
      id: match.id ?? Math.random(), // temp ID
    };

    const updatedMatches = [
      ...matchesFromBackend,
      ...upcomingMatches.filter((m) => m !== match),
      updatedMatch,
    ];

    // update both sources of truth
    if (match.saved) {
      setMatchesFromBackend((prev) =>
        prev.map((m) => (m.id === match.id ? updatedMatch : m))
      );
    } else {
      setMatchesFromBackend((prev) => [...prev, updatedMatch]);
      setUpcomingMatches((prev) => prev.filter((m) => m !== match));
    }

    // check if the current round is complete
    const currentRoundMatches = updatedMatches.filter(
      (m) => m.round === match.round
    );

    const allFinished = currentRoundMatches.every((m) => m.result);

    if (allFinished) {
      const winners: Player[] = currentRoundMatches.map((m) =>
        m.result === "win" ? m.player1 : m.player2
      );
      const nextRoundMatches: Match[] = [];

      for (let i = 0; i < winners.length; i += 2) {
        const p1 = winners[i];
        const p2 = winners[i + 1];
        if (p2) {
          nextRoundMatches.push({
            player1: p1,
            player2: p2,
            result: null,
            winnerId: null,
            round: match.round + 1,
            saved: false,
          });
        }
      }
      // add next round matches to upcoming
      setUpcomingMatches((prev) => [...prev, ...nextRoundMatches]);
    }
  };

  /* const handleMatchPlayed = async (
    match: Match,
    winner: Player
  ): Promise<void> => {
    const result: "win" | "loss" =
      winner.id === match.player1.id ? "win" : "loss";

    if (match.saved && match.id) {
      //await api.patch(`/match/${match.id}`, { result });
      console.log("Missing API for saving a match result");
      setMatchesFromBackend((prev) =>
        prev.map((m) =>
          m.id === match.id ? { ...m, result, winnerId: winner.id } : m
        )
      );
    } else {
      /* await api.post(`/tournament/${tournamentId}/matches`, {
        tournamentId,
        playerId: match.player1.id,
        opponentId: match.player2.id,
        round: match.round,
        result,
      });
      console.log("Missing API call for saving tournament match data");

      const savedMatch: Match = {
        ...match,
        result,
        winnerId: winner.id,
        saved: true,
        id: Math.random(), // temp for re-render
      };

      setMatchesFromBackend((prev) => [...prev, savedMatch]);
      setUpcomingMatches((prev) => prev.filter((m) => m !== match));
    }

    const currentRound = match.round;
    const roundMatches = [...matchesFromBackend, ...upcomingMatches].filter(
      (m) => m.round === currentRound
    );

    const allFinished = roundMatches.every((m) => m.result);
    if (allFinished) {
      const winners: Player[] = roundMatches.map((m) =>
        m.result === "win" ? m.player1 : m.player2
      );
      const nextRoundMatches: Match[] = [];

      for (let i = 0; i < winners.length; i += 2) {
        const p1 = winners[i];
        const p2 = winners[i + 1];
        if (p2) {
          nextRoundMatches.push({
            player1: p1,
            player2: p2,
            result: null,
            winnerId: null,
            round: currentRound + 1,
            saved: false,
          });
        }
      }
      setUpcomingMatches((prev) => [...prev, ...nextRoundMatches]);
    }
  }; */

  const allMatches = [...matchesFromBackend, ...upcomingMatches];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white py-8 px-4 flex flex-col items-center">
      <h1 className="text-4xl font-bold text-teal-700 dark:text-teal-300 mb-6">
        Tournament #{tournamentId}
      </h1>

      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md w-full max-w-md">
        <h3 className="text-xl font-semibold text-teal-700 dark:text-teal-300 mb-2">
          Tournament Settings
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <p><strong>Map:</strong> {settings.mapType === 'classic' ? 'Classic' : 
                           settings.mapType === 'corners' ? 'Corner Walls' : 'Center Wall'}</p>
          <p><strong>Score to Win:</strong> {settings.scoreToWin}</p>
          <p><strong>Power-ups:</strong> {settings.powerUpsEnabled ? 'Enabled' : 'Disabled'}</p>
        </div>
      </div>
      
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <Bracket matches={allMatches} onPlay={handleMatchPlayed} />
      )}
    </div>
  );
};

export default TournamentPage;
