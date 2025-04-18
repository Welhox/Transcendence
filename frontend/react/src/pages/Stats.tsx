import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const Stats: React.FC = () => {
	const { user } = useAuth();
	const navigate = useNavigate();

	if (!user) {
		return <Navigate to="/" replace />;
	}

	const handleReturn = () => {
		navigate('/');
	}

	// api call to fetch users match data

	return (
		<div>
			<h1>{user?.name}'s pong stats</h1>
			<button onClick={handleReturn}>Back</button>
		</div>
	);
};

export default Stats