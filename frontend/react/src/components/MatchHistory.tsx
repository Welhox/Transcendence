import React, { useEffect, useState } from 'react';
import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';

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

interface MatchHistoryProps {
	userId: string;
}

const MatchHistory: React.FC<MatchHistoryProps> = ({ userId }) => {
	const [stats, setStats] = useState<UserStats | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchStats = async () => {
			try {
				const response = await axios.get(apiUrl + `/stats/${userId}`, {
					headers: {
						"Content-Type": "application/json", // optional but safe
					},
					withCredentials: true,
				});
				const data = response.data;
				setStats({
					totalWins: data.totalWins || 0,
					totalLosses: data.totalLosses || 0,
					totalTournamentsWon: data.totalTournamentsWon || 0,
					matchHistory: Array.isArray(data.matchHistory) ? data.matchHistory : [], 
				});
			} catch (error) {
				console.error(error);
				setError('Failed to fetch stats');
			} finally {
				setLoading(false);
			}
		};

		if (userId) fetchStats();
	}, [userId]);

	if (loading) return <div>Loading stats...</div>;
	if (error) return <div>Error: {error}</div>;
	if (!stats) return null;

	return (
		<div className="pb-5">
			<div className="mt-5 text-center dark:text-white">
				<p>Total Wins: {stats?.totalWins}</p>
				<p>Total Losses: {stats?.totalLosses}</p>
				<p>Total Tournaments Won: {stats?.totalTournamentsWon}</p>
			</div>

			<h2 className="text-4xl mt-5 text-center text-teal-800 dark:text-teal-300">Match History</h2>

			{stats.matchHistory?.length ? (
				<ul className="mt-4 space-y-3">
					{stats.matchHistory.map((match, index) => (
						<li
							key={index}
							className="text-center text-gray-700 mx-5 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 p-3 rounded shadow"
						>
							{new Date(match.date).toLocaleDateString()} -{' '}
							{match.result.charAt(0).toUpperCase() + match.result.slice(1)} vs {match.opponent}
						</li>
					))}
				</ul>
			) : (
				<p className="mt-4 text-center text-gray-600 dark:text-gray-400">No match history available</p>
			)}
		</div>
	);
};

export default MatchHistory;