import React from "react";
import PongGame from "./PongGame";
import { useAuth } from "../auth/AuthProvider";
import { useGameSettings } from "../contexts/GameSettingsContext";

const PongGameAI: React.FC = () => {
  const { user } = useAuth();
  const { settings } = useGameSettings();

  // Default player setup for AI game
  const player1 = user 
    ? { username: user.username, isGuest: false }
    : { username: "Player", isGuest: true };
  
  const player2 = { username: "AI Opponent", isGuest: true };

  const getDifficultyDisplayName = () => {
    switch (settings.aiDifficulty) {
      case 'easy': return 'Easy';
      case 'medium': return 'Medium';
      case 'hard': return 'Hard';
      case 'expert': return 'Expert';
      default: return 'Medium';
    }
  };

  const getMapDisplayName = () => {
    switch (settings.mapType) {
      case 'classic': return 'Classic';
      case 'corners': return 'Corner Walls';
      case 'center-wall': return 'Center Wall';
      default: return 'Classic';
    }
  };

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold text-teal-700 dark:text-teal-300 mb-2">
        Single Player vs AI
      </h2>
      
      <div className="mb-4 text-center dark:text-white space-y-1">
        <p><strong>Map:</strong> {getMapDisplayName()}</p>
        <p><strong>AI Difficulty:</strong> {getDifficultyDisplayName()}</p>
        <p><strong>Score to Win:</strong> {settings.scoreToWin}</p>
        <p><strong>Power-ups:</strong> {settings.powerUpsEnabled ? 'Enabled' : 'Disabled'}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Use W/S keys to control your paddle</p>
      </div>
      
      <PongGame 
        player1={player1} 
        player2={player2} 
        isAIGame={true}
      />
    </div>
  );
};

export default PongGameAI;
