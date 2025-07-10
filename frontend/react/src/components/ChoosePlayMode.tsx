import React, { useEffect, useState } from "react";
import PongGameWithRegistration from "./PongGameWithRegistration";
import PongGameAI from "./PongGameAI";
import TournamentBuilder from "./TournamentBuilder";
import GameCustomization from "./GameCustomization";

const ChoosePlayMode = () => {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  useEffect(() => {
    if (selectedMode) {
      console.log("selectedMode: ", selectedMode);
    }
  }, [selectedMode]);
  const buttonStyles =
    "px-5 mx-3 py-5 my-2 text-white bg-teal-700 hover:bg-teal-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-semibold rounded-lg text-sm w-full sm:w-auto py-2.5 text-center dark:bg-teal-600 dark:hover:bg-teal-700 dark:focus:ring-teal-800";

  const handleSinglePlayer = () => {
    console.log("Selected Single Player mode");
    setSelectedMode("single-player-customize");
  };

  const handleTwoPlayer = () => {
    console.log("Selected Two Player mode");
    setSelectedMode("two-player-customize");
  };

  const handleCreateTournament = () => {
    console.log("Selected Tournament mode");
    setSelectedMode("tournament-customize");
  };

  const handleJoinTournament = () => {
    console.log("Selected Join Tournament mode");
    setSelectedMode("join-tournament");
  };

  // Added logging to debug transitions
  useEffect(() => {
    console.log(`Mode changed to: ${selectedMode}`);
  }, [selectedMode]);

  if (selectedMode === "two-player-single-game") {
    console.log("Rendering PongGameWithRegistration");
    return <PongGameWithRegistration />;
  } else if (selectedMode === "single-player") {
    console.log("Rendering PongGameAI");
    return <PongGameAI />;
  }  else if (selectedMode === "single-player-customize") {
    return <GameCustomization 
      isAIGame={true} // This is an AI game, show difficulty settings
      onStartGame={() => {
        console.log("Starting single player game");
        setSelectedMode("single-player");
      }}
      onBack={() => setSelectedMode(null)}
    />;
  } else if (selectedMode === "two-player-customize") {
    return <GameCustomization 
      isAIGame={false} // This is a player vs player game, hide difficulty settings
      onStartGame={() => {
        console.log("Starting two player game");
        setSelectedMode("two-player-single-game");
      }}
      onBack={() => setSelectedMode(null)}
    />;
  } else if (selectedMode === "tournament-customize") {
    return <GameCustomization 
      isAIGame={false} // This is a tournament, hide difficulty settings
      onStartGame={() => {
        console.log("Starting tournament creation");
        setSelectedMode("create-tournament");
      }}
      onBack={() => setSelectedMode(null)}
    />;
  } else if (selectedMode === "create-tournament") {
    console.log("Rendering TournamentBuilder");
    return <TournamentBuilder />;
  }
  return (
    <div>
      <div>
        <h1 className="text-6xl text-center text-teal-800 dark:text-teal-300 m-3">
          Choose Play Mode
        </h1>
        <div className="flex">
          <button className={buttonStyles} onClick={handleSinglePlayer}>
            Single Player vs AI
          </button>
          <button className={buttonStyles} onClick={handleTwoPlayer}>
            2 Player Single Game
          </button>
          <button className={buttonStyles} onClick={handleCreateTournament}>
            Create Tournament
          </button>
          {/* <button className={buttonStyles} onClick={handleJoinTournament}>Join Tournament</button> */}
        </div>
      </div>
    </div>
  );
};
export default ChoosePlayMode;
