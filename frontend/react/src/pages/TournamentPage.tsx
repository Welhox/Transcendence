import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../api/axios";
import Bracket from "../components/Bracket";
import Victory from "../components/Victory";
import PongGame from "../components/PongGame";
import { formatPlayers, formatMatches } from "../utils/initTournament";
import { Match, Player } from "../types/game";
import { useGameSettings } from "../contexts/GameSettingsContext";
import { getTop3FromMatches } from "../utils/getTop3FromMatches";
import { mapToPongPlayer } from "../utils/mapToPongPlayer";

const TournamentPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const tournamentId = parseInt(id || "0", 10);
  const [tournamentName, setTournamentName] = useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();
  const hasStartedRef = useRef(false);
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const [liveMessage, setLiveMessage] = useState<string | null>(null);
  const [announceReady, setAnnounceReady] = useState(false); // for screen reader aria announcements
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [finalStandings, setFinalStandings] = useState<Player[]>([]);
  const { settings } = useGameSettings();

  useEffect(() => {
    if (announceReady && finalStandings.length > 0) {
      setLiveMessage(null); // force remount
      setTimeout(() => {
        setLiveMessage(
          `${t("victory.tournamentFinished")} ${t("victory.first")} ${
            finalStandings[0]?.name
          }, ${t("victory.second")} ${finalStandings[1]?.name}, ${t(
            "victory.third"
          )} ${finalStandings[2]?.name}`
        );
        // Give React time to render it
        setTimeout(() => {
          liveRegionRef.current?.focus();
        }, 10);
      }, 100);
    }
  }, [t, finalStandings, announceReady]);

  useEffect(() => {
    if (!location.state) {
      navigate("/", { replace: true });
    } else {
      fetchTournamentData();
    }
  }, []);

  const handleLaunch = (match: Match) => {
    setCurrentMatch(match);
  };

  const handleGameEnd = async (data: {
    winnerId: number;
    winnerAlias: string;
  }) => {
    if (!currentMatch) return;
    try {
      await api.post(
        `/tournaments/${currentMatch.tournamentId}/match/${currentMatch.id}/update`,
        {
          winnerId: data.winnerId,
          winnerAlias: data.winnerAlias,
        }
      );
      // reset and re-fetch
      setCurrentMatch(null);
      await fetchTournamentData();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTournamentData = async () => {
    setIsLoading(true);
    try {
      console.log("Tournament id:", id);

      // Re-fetch after starting
      const tournamentRes = await api.get(`/tournaments/${id}`);
      let tournament = tournamentRes.data;

      setTournamentName(tournament.name);

      if (tournament.status === "waiting" && !hasStartedRef.current) {
        hasStartedRef.current = true;
        await api.post(`/tournaments/${id}/start`);
        const updatedTournament = await api.get(`/tournaments/${id}`);
        tournament = updatedTournament.data;
        setTournamentName(tournament.name);
      }

      const playersData = formatPlayers(tournament.participants);
      const formattedMatches = formatMatches(tournament.tournamentMatches);

      setPlayers(playersData);
      setMatches(formattedMatches);

      if (tournament.status === "completed") {
        const top3 = getTop3FromMatches(formattedMatches);
        setFinalStandings(top3);
        console.log("Final standings", top3);
        if (!announceReady) setAnnounceReady(true);
      }
    } catch (error) {
      console.error("Failed to fetch tournament data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (finalStandings.length === 0) return;

    const timer = setTimeout(async () => {
      alert(t("tournament.overMessage")); // e.g. "Tournament over! Redirecting home."
      try {
        await api.delete(
          `/tournaments/${tournamentId}/${encodeURIComponent(tournamentName)}`
        );
      } catch (err) {
        console.error("Failed to delete tournament:", err);
      }
      navigate("/", { replace: true });
    }, 15_000); // ← 15 seconds

    return () => clearTimeout(timer);
  }, [finalStandings, tournamentId, tournamentName, navigate /*t*/]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white py-8 px-4 flex flex-col items-center">
      <h1 className="text-4xl font-bold text-teal-700 dark:text-teal-300 mb-6">
        {tournamentName}
      </h1>

      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md w-full max-w-md">
        <h3 className="text-xl font-semibold text-teal-700 dark:text-teal-300 mb-2">
          {t("tournamentPage.settings")}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <p>
            <strong>{t("tournamentPage.map")}:</strong>{" "}
            {t(`map.${settings.mapType}`)}
          </p>
          <p>
            <strong>{t("tournamentPage.scoreToWin")}:</strong>{" "}
            {settings.scoreToWin}
          </p>
          <p>
            <strong>{t("tournamentPage.powerUps")}:</strong>{" "}
            {settings.powerUpsEnabled
              ? t("tournamentPage.enabled")
              : t("tournamentPage.disabled")}
          </p>
        </div>
      </div>

      {isLoading ? (
        <p>{t("tournamentPage.loading")}</p>
      ) : currentMatch ? (
        <PongGame
          player1={mapToPongPlayer(currentMatch.player1)}
          player2={mapToPongPlayer(currentMatch.player2)}
          onGameEnd={handleGameEnd}
        />
      ) : finalStandings.length > 0 ? (
        <>
          {/* This next part is a secret div, visible only to screen readers, which ensures that the error
	  or success messages get announced using aria. */}
          {
            <div
              ref={liveRegionRef}
              tabIndex={-1}
              aria-live="assertive"
              aria-atomic="true"
              className="sr-only"
            >
              {liveMessage}
            </div>
          }
          <Victory standings={finalStandings} />
        </>
      ) : (
        <Bracket matches={matches} onLaunch={handleLaunch} />
      )}
    </div>
  );
};

export default TournamentPage;
