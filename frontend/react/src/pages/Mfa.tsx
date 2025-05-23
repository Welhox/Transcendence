import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../auth/AuthProvider';

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'api';

const Mfa: React.FC = () => {
	const [code, setCode] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const navigate = useNavigate();
	const { status, refreshSession } = useAuth();

	useEffect(() => {
		if (status === 'authorized') {
			navigate('/');
		}
	}, [status]);

	if (status === 'loading') return <p>Loading...</p>

	// sends post request to server for credential validation
	const handleMfaSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);
		setIsLoading(true);

		try {
			const response = await axios.post(apiUrl + '/auth/verify-otp', { code }, {
				headers: {
					"Content-Type": "application/json",
				},
				withCredentials: true,
			});
			if (response.status === 200) {
				await refreshSession();
				navigate('/');
			}
		} catch (error) {
			if (axios.isAxiosError(error) && error.response) {
				if (error.response.status === 401) {
					setError('Invalid OTP. Please try again.');
				} else if (error.response.status === 403) {
					setError('OTP expired. Please request a new one.');
				} else {
					setError('An error occurred. Please try again later.');
				}
			} else {
				setError('An error occurred');
			}
		} finally {
			setIsLoading(false);
		}
	};
	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
			<h1 className="text-2xl font-bold mb-4">Multi-Factor Authentication</h1>
			<form onSubmit={handleMfaSubmit} className="bg-white p-6 rounded shadow-md w-full max-w-sm">
				<div className="mb-4">
					<label htmlFor="code" className="block text-sm font-medium text-gray-700">OTP</label>
					<input
						type="text"
						id="code"
						value={code}
						onChange={(e) => setCode(e.target.value)}
						className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
						required
					/>
				</div>
				{error && <p className="text-red-500 text-sm mb-4">{error}</p>}
				<button
					type="submit"
					className={`w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
					disabled={isLoading}
				>
					{isLoading ? 'Verifying...' : 'Verify'}
				</button>
			</form>
		</div>
	);
}
export default Mfa;