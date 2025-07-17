import React from "react";
import PongGame from "./PongGame";
import { useAuth } from "../auth/AuthProvider";
import { useGameSettings } from "../contexts/GameSettingsContext";
import { useTranslation } from "react-i18next";

interface PongGameAIProps {
  onReturnToMenu?: () => void;
}

const PongGameAI: React.FC<PongGameAIProps> = ({ onReturnToMenu }) => {
  const { user } = useAuth();
  const { settings } = useGameSettings();
  const { t } = useTranslation();

  // Default player setup for AI game
  const player1 = user 
    ? { username: user.username, isGuest: false }
    : { username: t("pongGameAI.defaultPlayer"), isGuest: true };
  
  const player2 = { username: t("pongGameAI.aiOpponent"), isGuest: true };

  const getDifficultyDisplayName = () => {
    switch (settings.aiDifficulty) {
      case 'easy': return t("pongGameAI.difficulty.easy");
      case 'medium': return t("pongGameAI.difficulty.medium");
      case 'hard': return t("pongGameAI.difficulty.hard");
      case 'expert': return t("pongGameAI.difficulty.expert");
      default: return t("pongGameAI.difficulty.medium");
    }
  };

  const getMapDisplayName = () => {
    switch (settings.mapType) {
      case 'classic': return t("pongGameAI.map.classic");
      case 'corners': return t("pongGameAI.map.corners");
      case 'center-wall': return t("pongGameAI.map.centerWall");
      default: return t("pongGameAI.map.classic");
    }
  };

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold text-teal-700 dark:text-teal-300 mb-2">
        {t("pongGameAI.title")}
      </h2>
      
      <div className="mb-4 text-center dark:text-white space-y-1">
        <p><strong>{t("pongGameAI.labels.map")}:</strong> {getMapDisplayName()}</p>
        <p><strong>{t("pongGameAI.labels.difficulty")}:</strong> {getDifficultyDisplayName()}</p>
        <p><strong>{t("pongGameAI.labels.scoreToWin")}:</strong> {settings.scoreToWin}</p>
        <p><strong>{t("pongGameAI.labels.powerUps")}:</strong> {settings.powerUpsEnabled ? t("pongGameAI.enabled") : t("pongGameAI.disabled")}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{t("pongGameAI.instructions")}</p>
      </div>
      
      <PongGame 
        player1={player1} 
        player2={player2} 
        isAIGame={true}
        onReturnToMenu={onReturnToMenu}
      />
    </div>
  );
};

export default PongGameAI;
