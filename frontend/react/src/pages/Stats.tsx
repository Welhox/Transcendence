import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const Stats: React.FC = () => {
	const { user, token } = useAuth();
	const navigate = useNavigate();

	if (!user || !token) {
		return <Navigate to="/" replace />;
	}

	const handleReturn = () => {
		navigate('/');
	}

	// api call to fetch user's match data:
	// - total wins
	// - total losses
	// - total tournaments won
	// - history of all the matches with date, result and opponent

	return (
		<div>
			<h1>{user?.name}'s pong stats</h1>
			<button onClick={handleReturn}>Back</button>
		</div>
	);
};

export default Stats