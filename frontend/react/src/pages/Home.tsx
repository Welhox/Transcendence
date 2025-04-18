import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const Home: React.FC = () => {
	const navigate = useNavigate();
	const { user, isLoggedIn, logout } = useAuth();

	const handleLogin = () => {
		navigate('/login');
	}

	return (
		<div>
			<h1>Welcome!</h1>
			 {isLoggedIn ? (
				<>
					<p>Hello, {user?.name}</p>
					<button onClick={logout}>Logout</button>
					<button>Your stats</button>
					<button>Pong pals</button>
					<button>Settings</button>
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