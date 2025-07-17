import React, { useState } from "react";
import PlayerRegistrationBox from "./PlayerRegistrationBox.tsx";
import PongGame from "./PongGame";
import { useAuth } from "../auth/AuthProvider";
import { useGameSettings } from "../contexts/GameSettingsContext";
import { useTranslation } from "react-i18next";

const GAME_WIDTH = 500;
const GAME_HEIGHT = 300;

interface PongGameWithRegistrationProps {
  onReturnToMenu?: () => void;
}

const PongGameWithRegistration: React.FC<PongGameWithRegistrationProps> = ({
  onReturnToMenu,
}) => {
  const { status, user } = useAuth();
  const { settings } = useGameSettings();
  const { t } = useTranslation();
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
      case "classic":
        return t("pongGameWithRegistration.map.classic");
      case "corners":
        return t("pongGameWithRegistration.map.corners");
      case "center-wall":
        return t("pongGameWithRegistration.map.centerWall");
      default:
        return t("pongGameWithRegistration.map.classic");
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
            <PlayerRegistrationBox
              label={t("pongGameWithRegistration.player1")}
              onRegister={setPlayer1}
              playerId={1}
            />
          )}
          {player1 && <span className="text-white">{player1.username}</span>}
        </div>
        <div className="flex-1 flex items-center justify-center">
          {!player2 && (
            <PlayerRegistrationBox
              label={t("pongGameWithRegistration.player2")}
              onRegister={setPlayer2}
              playerId={2}
            />
          )}
        </div>
      </div>
    );
  }

  console.log("PongGameWithRegistration: Ready to render PongGame", {
    player1,
    player2,
    settings,
  });

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold text-teal-700 dark:text-teal-300 mb-2">
        {t("pongGameWithRegistration.title")}
      </h2>

      <div className="mb-4 text-center dark:text-white space-y-1">
        <p>
          <strong>{t("pongGameWithRegistration.labels.map")}:</strong>
          {getMapDisplayName()}
        </p>
        <p>
          <strong>{t("pongGameWithRegistration.labels.scoreToWin")}:</strong>
          {settings.scoreToWin}
        </p>
        <p>
          <strong>{t("pongGameWithRegistration.labels.powerUps")}:</strong>
          {settings.powerUpsEnabled
            ? t("pongGameWithRegistration.enabled")
            : t("pongGameWithRegistration.disabled")}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          {t("pongGameWithRegistration.instructions")}
        </p>
      </div>

      <PongGame
        player1={player1}
        player2={player2}
        onReturnToMenu={onReturnToMenu}
      />
    </div>
  );
};

export default PongGameWithRegistration;
