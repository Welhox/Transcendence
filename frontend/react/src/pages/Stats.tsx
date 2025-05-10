import React, { useEffect, useState } from 'react';
import { Navigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import axios from 'axios';

import StatsHeader from '../components/StatsHeader';
import MatchHistory from '../components/MatchHistory';
import BefriendButton from '../components/BefriendButton';

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'api';

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

/*
Needs logic review on who has access to whose stats. Currently if user accesses stats
by URL, the header shows "User's Stats"
*/
const Stats: React.FC= () => {
	const { status, user } = useAuth();
	const { state } = useLocation();

	const viewedUserId = state?.userId || user?.id;
	const usernameFromState = state?.username;

	const [stats, setStats] = useState<UserStats | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	const [viewedUserUsername, setViewedUserUsername] = useState<string | null>(state?.username || null);

	useEffect(() => {
		const fetchUsername = async () => {
			if (!viewedUserId || usernameFromState) return;

			try {
				const res = await axios.get(apiUrl + '/users/id', {
					params: { id: viewedUserId },
					withCredentials: true,
				});
				setViewedUserUsername(res.data.username);
			} catch (error) {
				console.error('Failed to fetch username for viewed user', error);
				setViewedUserUsername(null);
			}
		};

		if (status === 'authorized') fetchUsername(); 
	}, [status, viewedUserId, usernameFromState]);

	useEffect(() => {
		const fetchStats = async () => {
			if (!viewedUserId) {
				setError('User ID not found');
				setLoading(false);
				return;
			}

			try {
				const response = await axios.get(apiUrl + `/stats/${viewedUserId}`, {
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

		if (status === 'authorized') fetchStats();
	}, [status, viewedUserId]);

	if (status === 'loading') return <p>Loading...</p>;
	if (status === 'unauthorized' || !user) return <Navigate to="/" replace/>;
	if (loading) return <div>Loading stats...</div>;
	if (error) return <div>Error: {error}</div>;

	return (
		<div>
			<StatsHeader
				username={
					viewedUserId === user?.id
						? user?.username ?? 'Unknown User'
						: viewedUserUsername ?? 'Unknown User'
				}
				from={state?.from}
			/>

			{viewedUserId && user?.id && (
				<BefriendButton currentUserId={user.id} viewedUserId={viewedUserId} />
			)}

			<div>
				<p>Total Wins: {stats?.totalWins}</p>
				<p>Total Losses: {stats?.totalLosses}</p>
				<p>Total Tournaments Won: {stats?.totalTournamentsWon}</p>
			</div>

			<MatchHistory history={stats?.matchHistory || []} />
		</div>
	);
};

export default Stats;
