import React, { useState } from "react";
import PlayerRegistrationBox from "./PlayerRegistrationBox.tsx";
import PongGame from "./PongGame";
import { useAuth } from "../auth/AuthProvider";
import { useGameSettings } from "../contexts/GameSettingsContext";

const GAME_WIDTH = 500;
const GAME_HEIGHT = 300;

const PongGameWithRegistration: React.FC = () => {
  const { status, user } = useAuth();
  const { settings } = useGameSettings();
  const [player1, setPlayer1] = useState<{
    username: string;
    isGuest: boolean;
  } | null>(null);
  const [player2, setPlayer2] = useState<{
    username: string;
    isGuest: boolean;
  } | null>(null);

  // If logged in, set player1 automatically
  React.useEffect(() => {
    if (status === "authorized" && user && !player1) {
      setPlayer1({ username: user.username, isGuest: false });
    }
  }, [status, user, player1]);

  const getMapDisplayName = () => {
    switch (settings.mapType) {
      case 'classic': return 'Classic';
      case 'corners': return 'Corner Walls';
      case 'center-wall': return 'Center Wall';
      default: return 'Classic';
    }
  };

  if (!player1 || !player2) {
    return (
      <div
        className="flex border rounded shadow-lg bg-gray-900"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
      >
        <div className="flex-1 flex items-center justify-center border-r border-gray-700">
          {!player1 && status !== "authorized" && (
            <PlayerRegistrationBox label="Player 1" onRegister={setPlayer1} />
          )}
          {player1 && <span className="text-white">{player1.username}</span>}
        </div>
        <div className="flex-1 flex items-center justify-center">
          {!player2 && (
            <PlayerRegistrationBox label="Player 2" onRegister={setPlayer2} />
          )}
        </div>
      </div>
    );
  }

  console.log("PongGameWithRegistration: Ready to render PongGame", { player1, player2, settings });
  
  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold text-teal-700 dark:text-teal-300 mb-2">
        2 Player Game
      </h2>
      
      <div className="mb-4 text-center dark:text-white space-y-1">
        <p><strong>Map:</strong> {getMapDisplayName()}</p>
        <p><strong>Score to Win:</strong> {settings.scoreToWin}</p>
        <p><strong>Power-ups:</strong> {settings.powerUpsEnabled ? 'Enabled' : 'Disabled'}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Player 1: W/S keys | Player 2: Arrow Up/Down</p>
      </div>
      
      <PongGame player1={player1} player2={player2} />
    </div>
  );
};

export default PongGameWithRegistration;
