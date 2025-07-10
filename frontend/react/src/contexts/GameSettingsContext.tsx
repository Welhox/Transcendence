import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface PowerUp {
  id: string;
  name: string;
  description: string;
  duration: number; // in milliseconds
  icon: string;
}

export interface GameSettings {
  scoreToWin: number;
  aiDifficulty: 'easy' | 'medium' | 'hard' | 'expert';
  mapType: 'classic' | 'corners' | 'center-wall';
  powerUpsEnabled: boolean;
  paddleEnlargePowerUp: boolean;
}

interface GameSettingsContextType {
  settings: GameSettings;
  updateSettings: (newSettings: Partial<GameSettings>) => void;
  resetToDefaults: () => void;
}

const defaultSettings: GameSettings = {
  scoreToWin: 11,
  aiDifficulty: 'medium',
  mapType: 'classic',
  powerUpsEnabled: true,
  paddleEnlargePowerUp: true,
};

const GameSettingsContext = createContext<GameSettingsContextType | undefined>(undefined);

export const GameSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<GameSettings>(defaultSettings);

  const updateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
  };

  return (
    <GameSettingsContext.Provider value={{ settings, updateSettings, resetToDefaults }}>
      {children}
    </GameSettingsContext.Provider>
  );
};

export const useGameSettings = () => {
  const context = useContext(GameSettingsContext);
  if (context === undefined) {
    throw new Error('useGameSettings must be used within a GameSettingsProvider');
  }
  return context;
};

export const POWER_UPS: Record<string, PowerUp> = {
  PADDLE_ENLARGE: {
    id: 'PADDLE_ENLARGE',
    name: 'Big Paddle',
    description: 'Enlarges your paddle for 8 seconds',
    duration: 8000,
    icon: '🏓'
  }
};

export interface DifficultySettings {
  accuracy: number;
  reactionTime: number;
  idleChance: number;
  randomMoveChance: number;
}

export const getDifficultySettings = (difficulty: GameSettings['aiDifficulty']): DifficultySettings => {
  switch (difficulty) {
    case 'easy':
      return { 
        accuracy: 0.3, 
        reactionTime: 0.8, 
        idleChance: 0.4,
        randomMoveChance: 0.15 
      };
    case 'medium':
      return { 
        accuracy: 0.6, 
        reactionTime: 0.6, 
        idleChance: 0.2,
        randomMoveChance: 0.08 
      };
    case 'hard':
      return { 
        accuracy: 0.85, 
        reactionTime: 0.3, 
        idleChance: 0.05,
        randomMoveChance: 0.03 
      };
    case 'expert':
      return { 
        accuracy: 0.95, 
        reactionTime: 0.1, 
        idleChance: 0.01,
        randomMoveChance: 0.01 
      };
    default:
      return getDifficultySettings('medium');
  }
};
