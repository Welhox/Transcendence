import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

import axios from 'axios';

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

/*
Needs logic review on who has access to whose stats. Currently if user accesses stats
by URL, the header shows "User's Stats"
*/
const Stats: React.FC= () => {
	const navigate = useNavigate();
	const { status, user} = useAuth();
	const { userId: paramUserId } = useParams();
	const { state } = useLocation();
	const passedUsername = state?.username;

	const userIdToFetch = paramUserId || user?.id;

	const [stats, setStats] = useState<UserStats | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchStats = async () => {
			if (!userIdToFetch) {
				setError('User ID not found');
				setLoading(false);
				return;
			}

			try {
				const response = await axios.get(apiUrl + `/stats/${userIdToFetch}`, {
					withCredentials: true,
				});
				setStats(response.data);
				console.log('Stats response:', response.data);
			} catch (error) {
				console.error(error);
				setError('Failed to fetch stats');
			} finally {
				setLoading(false);
			}
		};

		if (status === 'authorized')
			fetchStats();
	}, [status, userIdToFetch]);

	if (status === 'loading') return <p>Loading...</p>;
	if (status === 'unauthorized') return <Navigate to="/" replace/>;
	if (loading) return <div>Loading stats...</div>;
	if (error) return <div>Error: {error}</div>;

	const handleReturn = () => {
		const from = state?.from;
		navigate(from || '/');
	}

	return (
		<div>
			<h1>
				{passedUsername
					? `${passedUsername}'s Pong Stats`
					: !paramUserId || paramUserId === String(user?.id)
						? `${user?.username}'s Pong Stats`
						: `User's Pong Stats`}
			</h1>
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

/* import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

import axios from 'axios';

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
	const navigate = useNavigate();
	const { status, user} = useAuth();
	const { userId: paramUserId } = useParams();

	const userIdToFetch = paramUserId || user?.id;

	const [stats, setStats] = useState<UserStats | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchStats = async () => {
			if (!userIdToFetch) {
				setError('User ID not found');
				setLoading(false);
				return;
			}

			try {
				const response = await axios.get(apiUrl + `/stats/${userIdToFetch}`, {
					withCredentials: true,
				});
				setStats(response.data);
				console.log('Stats response:', response.data);
			} catch (error) {
				console.error(error);
				setError('Failed to fetch stats');
			} finally {
				setLoading(false);
			}
		};

		if (status === 'authorized')
			fetchStats();
	}, [status, userIdToFetch]);

	if (status === 'loading') return <p>Loading...</p>;
	if (status === 'unauthorized') return <Navigate to="/" replace/>;
	if (loading) return <div>Loading stats...</div>;
	if (error) return <div>Error: {error}</div>;

	const handleReturn = () => {
		navigate('/');
	}

	return (
		<div>
			<h1>{paramUserId ? `User ${paramUserId}` : `${user?.username}'s`} Pong Stats</h1>
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

export default Stats; */