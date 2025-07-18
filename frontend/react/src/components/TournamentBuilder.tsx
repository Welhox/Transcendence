import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import PlayerRegistrationBox from "./PlayerRegistrationBox";
import api from "../api/axios";
import { isAxiosError } from "axios";
import { useGameSettings } from "../contexts/GameSettingsContext";
import { useTranslation } from "react-i18next";

type RegisteredPlayer = {
  username: string;
  isGuest: boolean;
  userId: number | null;
};

const TournamentBuilder = () => {
  const [playerCount, setPlayerCount] = useState<number>(0);
  const [players, setPlayers] = useState<RegisteredPlayer[]>([]);
  const [registeredPlayers, setRegisteredPlayers] = useState<boolean[]>([]);
  const [tournamentName, setTournamentName] = useState("");
  const [tournamentId, setTournamentId] = useState<number | null>(null);
  const { user } = useAuth();
  const { settings } = useGameSettings();
  const navigate = useNavigate();
  const usernameRegex = /^[a-zA-Z0-9]+$/;
  const { t } = useTranslation();

  useEffect(() => {
    if (playerCount > 0) {
      const initialPlayers: RegisteredPlayer[] = Array(playerCount).fill({
        username: "",
        isGuest: true,
        userId: null,
      });

      if (user) {
        initialPlayers[0] = {
          username: user.username,
          isGuest: false,
          userId: Number(user.id),
        };
      }

      setPlayers(initialPlayers);
      setRegisteredPlayers(initialPlayers.map((p) => !!p.username)); // if username is filled, mark as registered
    }
  }, [playerCount, user]);

  useEffect(() => {
    if (tournamentName === "") {
      setTournamentName(t("tournament.placeholder")); // default name if not provided
    }
    // Create the tournament immediately when the component is mounted
    const createTournament = async () => {
      try {
        const res = await api.post("/tournaments/create", {
          name: tournamentName,
          size: playerCount,
          createdById: user?.id, // use user ID if logged in, otherwise 0
          status: "waiting",
        });
        const id = res.data.id;
        setTournamentId(id); // Store the tournament ID after creation
        console.log("Tournament created with ID:", res.data.id);

        if (user) {
            await api.post(`/tournaments/${id}/register`, {
                userId: user.id,
                alias: user.username,
            });
            console.log(`Player ${user.username} added to tournament ${id}`);

            setPlayers((prev) => {
                const next = [...prev];
                // ensure array length
                if (next.length < playerCount) {
                    next.length = playerCount;
                    next.fill({ username: "", isGuest: true, userId: null });
                }
                next[0] = {
                    username: user.username,
                    isGuest: false,
                    userId: user.id,
                };
                return next;
                });
                setRegisteredPlayers((prev) => {
                const next = [...prev];
                if (next.length < playerCount) {
                    next.length = playerCount;
                    next.fill(false);
                }
                next[0] = true;
                return next;
                });
        }

      } catch (error) {
        console.error("Tournament creation failed.", error);
        alert(t("tournament.errorTournamentCreation"));
      }
    };

    if (playerCount > 0 && !tournamentId) {
      createTournament();
    }
  }, [playerCount, tournamentName, user, tournamentId, t]);

  useEffect(() => {
    // This useEffect should only be triggered when the user changes
    if (user && players.length > 0) {
      const updatedPlayers = [...players];
      const alreadyInSlot = updatedPlayers.some(
        (p) => !p.isGuest && p.username === user.username
      );
      if (alreadyInSlot) return; // prevent duplicates

      const firstGuestIndex = updatedPlayers.findIndex(
        (p) => p.isGuest && !p.username
      );
      if (firstGuestIndex !== -1) {
        updatedPlayers[firstGuestIndex] = {
          username: user.username,
          isGuest: false,
          userId: user.id,
        };
        setPlayers(updatedPlayers); // Only update state here
      }
    }
  }, [user, players]);

  const updatePlayer = async (index: number, player: RegisteredPlayer) => {
    // check for duplicate usernames
    const duplicate = players.some(
        (p) => p.username === player.username && p.userId === player.userId
    );
    if (duplicate) {
        alert(t("tournament.errorUsernameTaken", { username: player.username }));
        return;
    }
    // prevent re-login of logged-in user
    if (user && index !== 0 && player.username === user.username) {
      alert(t("tournament.errorAlreadyLoggedIn", { username: user.username }));
      return;
    }
    // enforce username rules
    if (
      !usernameRegex.test(player.username) ||
      player.username.length < 2 ||
      player.username.length > 20
    ) {
      alert(t("tournament.errorUsernameInvalid"));
      return;
    }

    // Add the player to the tournament in the backend first
    try {
        if (tournamentId) {
            await api.post(`/tournaments/${tournamentId}/register`, {
                userId: player.userId,
                alias: player.username,
            });
            console.log(`Player ${player.username} added to tournament ${tournamentId}`);
        }
    } catch (error) {
        if (isAxiosError(error) && error.response?.status === 429) {
            // silently swallow 429
            return;
        }
        console.error("Error adding player to tournament", error);
        alert(t("tournament.errorAddingPlayer"));
        return;
    }

    setPlayers((prev) => {
        const next = [...prev];
        next[index] = player;
        return next;
    });
    setRegisteredPlayers((prev) => {
        const next = [...prev];
        next[index] = true;
        return next;
    });
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    console.log(t("tournament.consoleCreating"));
    e.preventDefault();

    // basic validation
    if (
      players.some((p, i) => {
        if (user && i === 0) return false; // skip first player if user is logged in
        return !p.username;
      })
    ) {
      alert(t("tournament.errorAllPlayersRequired"));
      return;
    }

   try {
      if (tournamentId) {
      // 1) update name
        await api.post(`/tournaments/${tournamentId}/update-name`, {
            name: tournamentName || t("tournament.placeholder"),
        });

        // 2) now navigate
        navigate(`/tournament/${tournamentId}`, {
            state: { accessKey: "yolo" },
        });
        }
    } catch (err) {
        console.error("Failed to update tournament name", err);
        alert(t("tournament.errorTournamentCreation"));
    }
};

  const inputStyles =
    "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 m-1 w-xs dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500";
  const buttonStyles =
    "px-5 mx-3 py-5 my-2 text-white bg-teal-700 hover:bg-teal-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-semibold rounded-lg text-sm w-full sm:w-auto py-2.5 text-center dark:bg-teal-600 dark:hover:bg-teal-700 dark:focus:ring-teal-800";

  if (playerCount === 0)
    return (
      <div>
        <h1 className="text-6xl text-center text-teal-800 dark:text-teal-300 m-3">
          {t("tournament.createTitle")}
        </h1>
        <div className="flex flex-col">
          <button className={buttonStyles} onClick={() => setPlayerCount(4)}>
            {t("tournament.4playerMode")}
          </button>
          <button className={buttonStyles} onClick={() => setPlayerCount(8)}>
            {t("tournament.8playerMode")}
          </button>
        </div>
      </div>
    );
  else
    return (
      <div className="flex flex-col">
        <h1 className="text-6xl text-center text-teal-800 dark:text-teal-300 m-3">
          {t("tournament.createTitle")}
        </h1>

        <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-teal-700 dark:text-teal-300 mb-2">
            {t("tournament.gameSettings")}
          </h3>

          <div className="grid grid-cols-2 gap-4 dark:text-white">
            <p>
              <strong>{t("tournament.map")}:</strong>{" "}
              {settings.mapType === "classic"
                ? t("tournament.mapClassic")
                : settings.mapType === "corners"
                ? t("tournament.mapCorners")
                : t("tournament.mapCenter")}
            </p>
            <p>
              <strong>{t("tournament.scoreToWin")}:</strong>{" "}
              {settings.scoreToWin}
            </p>
            <p>
              <strong>{t("tournament.powerUps")}:</strong>{" "}
              {settings.powerUpsEnabled
                ? t("tournament.enabled")
                : t("tournament.disabled")}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center mb-4">
          <label
            className="dark:text-white mb-2 font-bold"
            htmlFor="nameTournament"
          >
            {t("tournament.placeholder")}
          </label>
          <input
            id="nameTournament"
            placeholder={t("tournament.placeholder")}
            type="text"
            value={tournamentName}
            className="dark:text-white mb-2 p-2 border rounded w-100"
            onChange={(e) => setTournamentName(e.target.value)}
			maxLength={50}
          />
        </div>
        <p className="dark:text-white">{t("tournament.enterUsernames")}</p>
        <div className="flex flex-col">
          {players.map((player, index) => (
            <div key={index} className="my-2">
              {user && player.username === user.username && !player.isGuest ? (
                <div className="text-center text-teal-800 dark:text-teal-300 font-bold">
                  {t("tournament.playerYou", { username: user.username })}
                </div>
              ) : registeredPlayers[index] ? (
                <div className="text-center text-teal-800 dark:text-teal-300 font-semibold">
                  {t("tournament.player", {
                    index: index + 1,
                    username: player.username,
                  })}
                </div>
              ) : (
                <PlayerRegistrationBox
                  label={`${t("tournament.playerLabel")} ${index + 1}`}
                  onRegister={(p) => updatePlayer(index, p)}
                />
              )}
            </div>
          ))}
          <button className={buttonStyles} onClick={handleCreateTournament}>
            {t("tournament.createButton")}
          </button>
        </div>
      </div>
    );
};
export default TournamentBuilder;
