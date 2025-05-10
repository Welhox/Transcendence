import React from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'api';

const Home: React.FC = () => {
	const navigate = useNavigate();
	const { status, user, refreshSession } = useAuth();

	const logout = async () => {
		try {
			await axios.post(apiUrl + '/users/logout', {}, { withCredentials: true });
			await refreshSession();
			navigate('/');
		} catch (error) {
			console.error("Error logging out: ", error);
		}
	}

	const handleLogin = () => {
		navigate('/login');
	}

	const handleStats = () => {
		if (user?.id) {
			navigate('/stats', { state: { from: '/' } });
		}
	}

	const handlePals = () => {
		navigate('/pongpals');
	}

	const handleSettings = () => {
		navigate('/settings');
	}

	return (
		<div>
			<h1>Welcome!</h1>

			{status === 'loading' ? (
				<p>Checkin session...</p>
			) : status === 'authorized' && user ? (
				<>
					<p>Hello, {user.username}</p>
					<button onClick={handleStats}>My stats</button>
					<button onClick={handlePals}>Pong pals</button>
					<button onClick={handleSettings}>Settings</button>
					<button onClick={logout}>Logout</button>
				</>
			) : (
				<>
					<p>Please log in to access exclusive Pong content and connect with other registered players!</p>
					<button onClick={handleLogin}>Login</button>
					<p>No account?{' '} <Link to="/register">Register</Link></p>
				</>
			)}
		</div>
	);
};

export default Home;