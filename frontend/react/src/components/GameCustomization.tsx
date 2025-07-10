import React from 'react';
import { useGameSettings } from '../contexts/GameSettingsContext';
import { useTranslation } from 'react-i18next';

interface GameCustomizationProps {
  onStartGame: () => void;
  onBack: () => void;
  isAIGame?: boolean; // New prop to control whether to show AI difficulty
}

const GameCustomization: React.FC<GameCustomizationProps> = ({ onStartGame, onBack, isAIGame = false }) => {
  const { settings, updateSettings, resetToDefaults } = useGameSettings();
  const { t } = useTranslation();

  const handleScoreChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    updateSettings({ scoreToWin: value });
  };

  const handleDifficultyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    updateSettings({ aiDifficulty: event.target.value as any });
  };

  const handleMapChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    updateSettings({ mapType: event.target.value as any });
  };

  const togglePowerUps = () => {
    updateSettings({ powerUpsEnabled: !settings.powerUpsEnabled });
  };

  const togglePaddleEnlarge = () => {
    updateSettings({ paddleEnlargePowerUp: !settings.paddleEnlargePowerUp });
  };

  const buttonStyles = "px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded font-semibold transition-colors";
  const inputStyles = "px-3 py-2 border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700 dark:text-white";
  const labelStyles = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2";

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold text-center text-teal-700 dark:text-teal-300 mb-6">
        Game Customization
      </h2>
      
      <div className="space-y-6">
        {/* Score to Win */}
        <div>
          <label className={labelStyles}>
            Score to Win: {settings.scoreToWin}
          </label>
          <input
            type="range"
            min="1"
            max="20"
            value={settings.scoreToWin}
            onChange={handleScoreChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>1</span>
            <span>10</span>
            <span>20</span>
          </div>
        </div>

        {/* AI Difficulty - only shown for AI games */}
        {isAIGame && (
          <div>
            <label className={labelStyles}>
              AI Difficulty
            </label>
            <select 
              value={settings.aiDifficulty} 
              onChange={handleDifficultyChange}
              className={inputStyles + " w-full"}
            >
              <option value="easy">Easy - AI makes many mistakes</option>
              <option value="medium">Medium - Balanced gameplay</option>
              <option value="hard">Hard - Challenging opponent</option>
              <option value="expert">Expert - Nearly perfect AI</option>
            </select>
          </div>
        )}

        {/* Map Selection */}
        <div>
          <label className={labelStyles}>
            Map Type
          </label>
          <select 
            value={settings.mapType} 
            onChange={handleMapChange}
            className={inputStyles + " w-full"}
          >
            <option value="classic">Classic - Standard Pong</option>
            <option value="corners">Corner Walls - Score only through center</option>
            <option value="center-wall">Center Wall - Ball goes top/bottom only</option>
          </select>
        </div>

        {/* Power-ups Section */}
        <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              Power-ups
            </span>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.powerUpsEnabled}
                onChange={togglePowerUps}
                className="sr-only"
              />
              <div className={`relative w-11 h-6 rounded-full transition-colors ${
                settings.powerUpsEnabled ? 'bg-teal-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.powerUpsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}></div>
              </div>
            </label>
          </div>

          {settings.powerUpsEnabled && (
            <div className="ml-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">🏓 Big Paddle</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Enlarges paddle for 8 seconds</p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.paddleEnlargePowerUp}
                    onChange={togglePaddleEnlarge}
                    className="sr-only"
                  />
                  <div className={`relative w-8 h-4 rounded-full transition-colors ${
                    settings.paddleEnlargePowerUp ? 'bg-teal-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}>
                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${
                      settings.paddleEnlargePowerUp ? 'translate-x-4' : 'translate-x-0'
                    }`}></div>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={() => {
              console.log("GameCustomization: Reset settings to defaults");
              resetToDefaults();
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Reset to Defaults
          </button>
          
          <div className="space-x-3">
            <button
              onClick={() => {
                console.log("GameCustomization: Back button clicked");
                onBack();
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => {
                console.log("GameCustomization: Start Game button clicked with settings:", settings);
                onStartGame();
              }}
              className={buttonStyles}
            >
              Start Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameCustomization;
