import React, { useState } from 'react';
import axios from 'axios';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'api';

const ForgotPassword: React.FC = () => {
	const [email, setEmail] = useState('');
	const [submitted, setSubmitted] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const navigate = useNavigate();
	const { status } = useAuth();
	
	if (status === 'loading') return <p>Loading...</p>
	if (status === 'unauthorized') return <Navigate to="/" replace />;

	const handleReturn = () => {
		navigate('/');
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		try {

			//await axios.post(apiUrl + '/users/forgot-pwd', { email });
			setSubmitted(true);

		} catch (error: any) {
			setError(
				error.response?.data?.message || 'Something went wrong. Please try again.'
			);
		}
	};

	return (
		<div>
			<h1>Reset Password</h1>

			{submitted ? (
				<>
					<p>If that email is registered, you'll receive password reset instructions shortly.</p>
					<button onClick={handleReturn}>Return</button>
				</>
			) : (
				<form onSubmit={handleSubmit}>
					<label htmlFor="email">Email address:</label>
					<input
						type="email"
						id="email"
						required
						value={email}
						onChange={(e) => setEmail(e.target.value)}	
					/>
					<button type="submit">Send Reset Link</button>
					{error && <p style={{ color: 'red'}}>{error}</p>}
				</form>
			)}
		</div>
	);
};

export default ForgotPassword