import React, { useEffect, useState } from "react";
import PongGameWithRegistration from "./PongGameWithRegistration";
import TournamentBuilder from "./TournamentBuilder";

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
    setSelectedMode("single-player");
  };

  const handleTwoPlayer = () => {
    setSelectedMode("two-player-single-game");
  };

  const handleCreateTournament = () => {
    setSelectedMode("create-tournament");
  };

  const handleJoinTournament = () => {
    setSelectedMode("join-tournament");
  };

  if (selectedMode === "two-player-single-game") {
    return <PongGameWithRegistration />;
  } else if (selectedMode === "create-tournament") {
    return <TournamentBuilder />;
  } else if (selectedMode === "single-player") {
    return (
      <h1 className="text-6xl text-center text-teal-800 dark:text-teal-300 m-3">
        Single player mode will live here someday
      </h1>
    );
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
