import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import SearchPals from '../components/SearchPals';
import { FriendList } from '../components/FriendList';
import { PendingRequests } from '../components/PendingRequests';
import { useAuth } from '../auth/AuthProvider';

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'api';

type Friend = {
	id: string;
	username: string;
}

const PongPals: React.FC = () => {
	const navigate = useNavigate();
	const { status, user } = useAuth();
	const [friends, setFriends] = useState<Friend[]>([]);

	if (status === 'loading') return <p>Loading...</p>
	if (status === 'unauthorized') return <Navigate to="/" replace />;

	useEffect(() => {
		if (user) {
			fetch(apiUrl + `/users/${user.id}/friends`, {
				credentials: 'include',
			})
			.then((res) => res.json())
			.then((data) => setFriends(data));
		}
	}, [user]);

	const handleReturn = () => {
		navigate('/');
	}

	const handleFriendAdded = (newFriend: Friend) => {
		setFriends((prev) => [...prev, newFriend]);
	};


	return (
		<div>
			<h1>Pong Pals</h1>
			<button onClick={handleReturn}>Back</button>
			<PendingRequests userId={user!.id.toString()} onFriendAdded={handleFriendAdded} />
			<h2>Search users</h2>
			<SearchPals />
			<h2>Your friends</h2>
			<FriendList friends={friends}/>
		</div>
	);
};

export default PongPals;