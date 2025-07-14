import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import PlayerRegistrationBox from "./PlayerRegistrationBox";
import api from "../api/axios";
import { useGameSettings } from "../contexts/GameSettingsContext";

type RegisteredPlayer = {
  username: string;
  isGuest: boolean;
};

const TournamentBuilder = () => {
  const [playerCount, setPlayerCount] = useState<number>(0);
  const [players, setPlayers] = useState<RegisteredPlayer[]>([]);
  const [registeredPlayers, setRegisteredPlayers] = useState<boolean[]>([]);
  const { user } = useAuth();
  const { settings } = useGameSettings();
  const navigate = useNavigate();
  const usernameRegex = /^[a-zA-Z0-9]+$/;

  useEffect(() => {
    if (playerCount > 0) {
      const initialPlayers: RegisteredPlayer[] = Array(playerCount).fill({
        username: "",
        isGuest: true,
      });

      if (user) {
        initialPlayers[0] = {
          username: user.username,
          isGuest: false,
        };
      }

      setPlayers(initialPlayers);
      // initialize registeredPlayers: first player is registered if logged in, otherwise false
      setRegisteredPlayers(
        initialPlayers.map((_, idx) => (user && idx === 0 ? true : false))
      );
    }
  }, [playerCount, user]);

  const updatePlayer = (index: number, player: RegisteredPlayer) => {
    // check for duplicate usernames
    const duplicate = players.some(
      (p, i) => i !== index && p.username === player.username
    );
    if (duplicate) {
      alert(`Username "${player.username}" is already taken.`);
      return;
    }
    // prevent re-login of logged-in user
    if (user && index !== 0 && player.username === user.username) {
      alert(`You're already logged in as ${user.username}.`);
      return;
    }
    // enforce username rules
    if (
      !usernameRegex.test(player.username) ||
      player.username.length < 2 ||
      player.username.length > 20
    ) {
      alert("Username must be alphanumeris and between 2 and 20 characters.");
      return;
    }
    const updatedPlayers = [...players];
    updatedPlayers[index] = player;
    setPlayers(updatedPlayers);

    // mark this player as registered (hides input fields from them)
    const updatedRegistered = [...registeredPlayers];
    updatedRegistered[index] = true;
    setRegisteredPlayers(updatedRegistered);
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    console.log(`Let's make a tournament`);
    e.preventDefault();

    // ensure logged in user is counted in all checks
    if (user) {
      players[0] = {
        username: user.username,
        isGuest: false,
      };
    }

    // basic validation
    if (
      players.some((p, i) => {
        if (user && i === 0) return false; // skip first player if user is logged in
        return !p.username;
      })
    ) {
      alert("All players must enter a username.");
      return;
    }

    try {
      // create a tournament
        const res = await api.post("/tournaments/create", {
        name: "Pong Tournament",
        size: playerCount,
        createdById: user?.id, // use user ID if logged in, otherwise 0
        status: "waiting",
      });
      // console.log("Missing tournament saving API");

      const tournamentId = res.data.id;
      // const tournamentId = 0; // for testing without backend

      // add participants
      await Promise.all(
        players.map((player, index) =>
          api.post(`/tournaments/${tournamentId}/register`, {
            userId: player.isGuest ? null : (user?.username === player.username ? user.id : null),
            alias: player.isGuest ? player.username : "",
          })
        )
      );
      // console.log("Missing tournament players init API");
      //navigate(`/tournament/${tournamentId}`); production
      navigate(`/tournament/${tournamentId}`, { state: { players } }); // for testing without backend
    } catch (error) {
      console.error("Tournament creation failed.");
      alert("Error creating tournament.");
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
          Create Tournament
        </h1>
        <div className="flex flex-col">
          <button className={buttonStyles} onClick={() => setPlayerCount(4)}>
            4 player mode
          </button>
          <button className={buttonStyles} onClick={() => setPlayerCount(8)}>
            8 player mode
          </button>
        </div>
      </div>
    );
  else
    return (
      <div className="flex flex-col">
        <h1 className="text-6xl text-center text-teal-800 dark:text-teal-300 m-3">
          Create Tournament
        </h1>
        
        <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-teal-700 dark:text-teal-300 mb-2">
            Game Settings
          </h3>
          
          <div className="grid grid-cols-2 gap-4 dark:text-white">
            <p><strong>Map:</strong> {settings.mapType === 'classic' ? 'Classic' : 
                             settings.mapType === 'corners' ? 'Corner Walls' : 'Center Wall'}</p>
            <p><strong>Score to Win:</strong> {settings.scoreToWin}</p>
            <p><strong>Power-ups:</strong> {settings.powerUpsEnabled ? 'Enabled' : 'Disabled'}</p>
          </div>
        </div>
        
        <p className="dark:text-white">
          Enter the usernames or register as a guest.
        </p>
        <div className="flex flex-col">
          {players.map((player, index) => (
            <div key={index} className="my-2">
              {user && index === 0 ? (
                <div className="text-center text-teal-800 dark:text-teal-300 font-bold">
                  Player 1 (You): {user.username}
                </div>
              ) : registeredPlayers[index] ? (
                <div className="text-center text-teal-800 dark:text-teal-300 font-semibold">
                  Player {index + 1}: {player.username}
                </div>
              ) : (
                <PlayerRegistrationBox
                  label={`Player ${index + 1}`}
                  onRegister={(p) => updatePlayer(index, p)}
                />
              )}
            </div>
          ))}
          <button className={buttonStyles} onClick={handleCreateTournament}>
            Create Tournament
          </button>
        </div>
      </div>
    );
};
export default TournamentBuilder;
