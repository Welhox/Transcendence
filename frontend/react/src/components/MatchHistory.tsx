import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useTranslation } from 'react-i18next';

interface MatchHistoryItem {
  date: string;
  result: string;
  opponent: string;
}

interface UserStats {
  totalWins: number;
  totalLosses: number;
  totalTournamentsWon: number;
  matchHistory: MatchHistoryItem[];
}

interface OpponentMatches {
  opponent: string;
  matches: MatchHistoryItem[];
  wins: number;
  losses: number;
}

interface MatchHistoryProps {
  userId: string;
}

const MatchHistory: React.FC<MatchHistoryProps> = ({ userId }) => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [opponentMatches, setOpponentMatches] = useState<OpponentMatches[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOpponent, setSelectedOpponent] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get(`/stats/${userId}`, {
          headers: { "Content-Type": "application/json" },
        });
        const data = response.data;
        
        const statsData = {
          totalWins: data.totalWins || 0,
          totalLosses: data.totalLosses || 0,
          totalTournamentsWon: data.totalTournamentsWon || 0,
          matchHistory: Array.isArray(data.matchHistory) ? data.matchHistory : [], 
        };
        
        setStats(statsData);
        
        // Group matches by opponent
        const matchesByOpponent: { [opponent: string]: MatchHistoryItem[] } = {};
        statsData.matchHistory.forEach((match: MatchHistoryItem) => {
          if (!matchesByOpponent[match.opponent]) {
            matchesByOpponent[match.opponent] = [];
          }
          matchesByOpponent[match.opponent].push(match);
        });
        
        // Convert to array with win/loss counts
        const opponentMatchesArray: OpponentMatches[] = Object.entries(matchesByOpponent).map(([opponent, matches]) => {
          const wins = matches.filter(match => match.result === 'Win').length;
          const losses = matches.filter(match => match.result === 'Loss').length;
          
          return {
            opponent,
            matches: matches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            wins,
            losses
          };
        });
        
        // Sort by opponent name
        opponentMatchesArray.sort((a, b) => a.opponent.localeCompare(b.opponent));
        setOpponentMatches(opponentMatchesArray);
      } catch (error) {
        console.error(error);
        setError(t('matchHistory.errorFetching'));
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchStats();
  }, [userId, t]);

  if (loading) return <div>{t("matchHistory.loadingStats")}</div>;
  if (error) return <div>{error}</div>;
  if (!stats) return null;

  // When a specific opponent is selected
  if (selectedOpponent) {
    const opponent = opponentMatches.find(o => o.opponent === selectedOpponent);
    
    if (!opponent) return null;
    
    return (
      <div className="pb-5">
        <div className="mt-5 mb-4 flex justify-between items-center mx-5">
          <button 
            onClick={() => setSelectedOpponent(null)}
            className="bg-teal-700 hover:bg-teal-800 text-white py-2 px-4 rounded"
          >
            ← {t("matchHistory.backToSummary")}
          </button>
          <h3 className="text-2xl font-bold text-teal-800 dark:text-teal-300">
            {t("matchHistory.matchesVs")} {opponent.opponent}
          </h3>
          <div className="text-sm">
            <span className="text-green-600 font-bold">{opponent.wins} {t("matchHistory.wins")}</span> / 
            <span className="text-red-600 font-bold"> {opponent.losses} {t("matchHistory.losses")}</span>
          </div>
        </div>
        
        <div className="mx-5 mt-2 overflow-y-auto max-h-96 border border-gray-200 dark:border-gray-700 rounded">
          <ul className="space-y-3 p-3">
            {opponent.matches.map((match, index) => (
              <li
                key={index}
                className="text-center text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 p-3 rounded shadow"
              >
                {new Date(match.date).toLocaleDateString()} - {" "}
                <span className={match.result === 'Win' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                  {t(`results.${match.result}`)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-5">
      <div className="mt-5 text-center dark:text-white">
        <p>
          {t("matchHistory.totalWins")}: {stats?.totalWins}
        </p>
        <p>
          {t("matchHistory.totalLosses")}: {stats?.totalLosses}
        </p>
        <p>
          {t("matchHistory.totalTournamentsWon")}: {stats?.totalTournamentsWon}
        </p>
      </div>

      <h2 className="text-4xl mt-5 text-center text-teal-800 dark:text-teal-300">
        {t("matchHistory.matchHistoryTitle")}
      </h2>

      {opponentMatches.length > 0 ? (
        <div className="flex justify-center mt-4">
          <div className="w-full max-w-lg overflow-y-auto max-h-80 px-2 py-2 border border-gray-200 dark:border-gray-700 rounded">
            <div className="flex flex-col items-center space-y-3">
              {opponentMatches.map((opponentData) => (
                <div 
                  key={opponentData.opponent}
                  className="bg-gray-100 dark:bg-gray-800 p-4 rounded shadow hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer transition-colors w-full max-w-sm"
                  onClick={() => setSelectedOpponent(opponentData.opponent)}
                >
                  <h3 className="font-bold text-lg mb-2">{opponentData.opponent}</h3>
                  <div className="flex justify-between">
                    <span>
                      {t("matchHistory.matches")}: {opponentData.matches.length}
                    </span>
                    <span>
                      <span className="text-green-600 font-bold">{opponentData.wins} W</span> / 
                      <span className="text-red-600 font-bold"> {opponentData.losses} L</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-center text-gray-600 dark:text-gray-400">
          {t("matchHistory.noHistory")}
        </p>
      )}
    </div>
  );
};

export default MatchHistory;
