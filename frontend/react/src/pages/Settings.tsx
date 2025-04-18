import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const Settings: React.FC = () => {
	const { user } = useAuth();
	const navigate = useNavigate();

	if (!user) {
		return <Navigate to="/" replace />;
	}

	const handleReturn = () => {
		navigate('/');
	}

	// add fields for user customization:
	// - change password
	// - change email address
	// - change language preference
	// - upload avatar / choose a default one
	// - remove user data and delete account

	return (
		<div>
			<h1>Settings</h1>
			<button onClick={handleReturn}>Back</button>
		</div>
	);
};

export default Settings