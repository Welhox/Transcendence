import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { createAxiosInstance } from '../auth/axiosInstance';

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'api';

interface MatchHistory {
	date: string;
	result: string;
	opponent: string;
}

interface UserStats {
	totalWins: number;
	totalLosses: number;
	totalTournamentsWon: number;
	matchHistory: MatchHistory[];
}

const Stats: React.FC= () => {
	const { user, token, login } = useAuth();
	const navigate = useNavigate();
	const { userId: paramUserId } = useParams();
	const userId = paramUserId || user?.id;

	const [stats, setStats] = useState<UserStats | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	if (!paramUserId) {
		return <Navigate to="/" replace/>
	}

	useEffect(() => {
		const fetchStats = async () => {
			if (!token || (!userId)) {
				setError('Unauthorized');
				setLoading(false);
				return;
			}

			const idToFetch = userId || user?.id;

			const api = createAxiosInstance(token, login);

			try {
				const response = await api.get(apiUrl + `/stats/${idToFetch}`);
				setStats(response.data);
				console.log('Stats response:', response.data);
			} catch (error) {
				console.error(error);
				setError('Failed to fetch stats');
			} finally {
				setLoading(false);
			}
		};

		fetchStats();
	}, [userId, token, user?.id]);

	const handleReturn = () => {
		navigate('/');
	}

	if (!user || !token) {
		return <Navigate to="/" replace />;
	}

	if (loading) {
		return <div>Loading stats...</div>;
	}

	if (error) {
		return <div>Error: {error}</div>;
	}

	return (
		<div>
			<h1>{userId ? 'User': user.name}'s Pong Stats</h1>
			<button onClick={handleReturn}>Back</button>

			<div style={{ marginTop: '20px' }}>
				<p>Total Wins: {stats?.totalWins}</p>
				<p>Total Losses: {stats?.totalLosses}</p>
				<p>Total Tournaments Won: {stats?.totalTournamentsWon}</p>

				<h2>Match History</h2>
				<ul>
					{stats?.matchHistory?.length ? (
						stats.matchHistory.map((match, index) => (
							<li key={index}>
								{new Date(match.date).toLocaleDateString()} -
								{match.result.charAt(0).toUpperCase() + match.result.slice(1)} vs {match.opponent}
							</li>
						))
					) : (
						<p>No match history available</p>
					)}
				</ul>
			</div>
		</div>
	);
};

export default Stats;