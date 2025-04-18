import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import SearchPals from '../components/SearchPals';

const PongPals: React.FC = () => {
	const { user } = useAuth();
	const navigate = useNavigate();

	if (!user) {
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

	return (
		<div>
			<h1>Pong Pals</h1>
			<p>Search users:</p>
			<SearchPals onSearch={handleSearch} />
			<button onClick={handleReturn}>Back</button>
		</div>
	);
};

export default PongPals