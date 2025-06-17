import React, { useEffect, useState } from "react";

const TournamentBuilder = () => {
  const [playerCount, setPlayerCount] = useState<number>(0);
  useEffect(() => {
    {
      console.log("playerCount: ", playerCount);
    }
  }, [playerCount]);
  const inputStyles =
    "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 m-1 w-xs dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500";
  const buttonStyles =
    "px-5 mx-3 py-5 my-2 text-white bg-teal-700 hover:bg-teal-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-semibold rounded-lg text-sm w-full sm:w-auto py-2.5 text-center dark:bg-teal-600 dark:hover:bg-teal-700 dark:focus:ring-teal-800";

  type PlayerInputProps = { playerNumber: number };
  const PlayerInput = ({ playerNumber }: PlayerInputProps) => {
    return (
      <div className="p-5 text-center max-w-2xl dark:bg-black bg-white mx-auto rounded-lg dark:text-white">
        <label htmlFor={playerNumber.toString()}>
          Player {playerNumber.toString()}:{" "}
        </label>
        <input id={playerNumber.toString()} className={inputStyles} />
      </div>
    );
  };
  const handlePlayers = (players: number) => {
    // <input className={inputStyles}></input>;
    setPlayerCount(players);
  };
  const handleCreateTournament = () => {
    console.log(`Let's make a tournament`);
  };

  if (playerCount === 0)
    return (
      <div>
        <h1 className="text-6xl text-center text-teal-800 dark:text-teal-300 m-3">
          Create Tournament
        </h1>
        <div className="flex flex-col">
          <button className={buttonStyles} onClick={() => handlePlayers(4)}>
            4 player mode
          </button>
          <button className={buttonStyles} onClick={() => handlePlayers(8)}>
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
        <p className="dark:text-white">
          Enter the usernames of all tournament participants.
        </p>
        <form className="flex flex-col">
          {Array.from({ length: playerCount }, (element, index) => (
            <PlayerInput playerNumber={index + 1} key={index} />
          ))}
          <button className={buttonStyles} type="submit">
            Create Tournament
          </button>
        </form>
      </div>
    );
};
export default TournamentBuilder;
