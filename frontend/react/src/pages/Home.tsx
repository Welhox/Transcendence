import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const Home: React.FC = () => {
	const navigate = useNavigate();
	const { user, isLoggedIn, logout } = useAuth();

	const handleLogin = () => {
		navigate('/login');
	}

	const handleStats = () => {
		navigate('/stats');
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
			 {isLoggedIn ? (
				<>
					<p>Hello, {user?.name}</p>
					<button onClick={logout}>Logout</button>
					<button onClick={handleStats}>My stats</button>
					<button onClick={handlePals}>Pong pals</button>
					<button onClick={handleSettings}>Settings</button>
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

export default Home