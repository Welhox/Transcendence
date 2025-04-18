import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Passcode from '../components/Passcode'

const VerifyEmail: React.FC = () => {
	const { user } = useAuth();

	if (user) {
		return <Navigate to="/" replace />;
	}

	const handlePasscode = (code: string) => {
		console.log('Passcode submitted:', code);
		// send to backend
	}

	return (
		<div>
			<h1>Verify Your Email Address</h1>
			<Passcode onSubmit={handlePasscode} />
		</div>
	);
};

export default VerifyEmail