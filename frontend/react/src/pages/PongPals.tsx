import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import SearchPals from '../components/SearchPals';

const PongPals: React.FC = () => {
	const { token } = useAuth();
	const navigate = useNavigate();

	if (!token) {
		return <Navigate to="/" replace />;
	}

	const handleReturn = () => {
		navigate('/');
	}

	const handleSearch = (query: string) => {
		console.log('Searching for:', query);
		// not exactly sure if the backend call for search goes here
	}

	// add api call for user connections data
	// - list of friends and their online statuses
	// - list of pending friend requests

	return (
		<div>
			<h1>Pong Pals</h1>
			<h2>Pending friend requests</h2>
			<h2>Search users</h2>
			<SearchPals onSearch={handleSearch} />
			<h2>Your friends</h2>
			<button onClick={handleReturn}>Back</button>
		</div>
	);
};

export default PongPals