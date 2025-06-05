import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import axios from 'axios';

import StatsHeader from '../components/StatsHeader';
import MatchHistory from '../components/MatchHistory';
import BefriendButton from '../components/BefriendButton';

const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';

const Stats: React.FC= () => {
	const { status, user } = useAuth();
	const { state } = useLocation();
	const [viewedUserUsername, setViewedUserUsername] = useState<string | null>(state?.username || null);

	const viewedUserId = state?.userId || user?.id;
	const usernameFromState = state?.username;

	useEffect(() => {
		const fetchUsername = async () => {
			if (!viewedUserId || usernameFromState) return;

			try {
				const res = await axios.get(apiUrl + '/users/id', {
					params: { id: viewedUserId },
					headers: {
						"Content-Type": "application/json", // optional but safe
					},
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

	if (status === 'loading') return <p>Loading...</p>;
	if (status === 'unauthorized' || !user) return <Navigate to="/" replace/>;

	return (
		<div className="text-center max-w-2xl dark:bg-black bg-white mx-auto rounded-lg">
			<StatsHeader
				username={
					viewedUserId === user?.id
						? user?.username ?? 'Unknown User'
						: viewedUserUsername ?? 'Unknown User'
				}
				from={state?.from}
			/>

			{viewedUserId !== user.id && (
				<BefriendButton currentUserId={user.id} viewedUserId={viewedUserId} />
			)}

			<MatchHistory userId={viewedUserId} />
		</div>
	);
};

export default Stats;
