import React from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import NavigationHeader from '../components/NavigationHeader';

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
			navigate(`/stats/${user.id}`);
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
			<NavigationHeader handleStats={handleStats}
									  handlePals={handlePals}
									  handleSettings={handleSettings}
									  logout={logout} />
			<div class="flex justify-center"><img class="object-contain max-h-full m-auto" src="assets/pong-placeholder.gif"></img></div>
			<h1 class="text-6xl text-center text-teal-800 m-3">Welcome!</h1>

			{status === 'loading' ? (
				<p>Checkin session...</p>
			) : status === 'authorized' && user ? (
				<>
					<p>Hello, {user.username}</p>
					
					
					
				</>
			) : (
				<>
					<p class="text-center">Please log in to access exclusive Pong content and connect with other registered players!</p>
					{/*<button class="border bg-amber-900 font-semibold hover:font-extrabold
					  hover:underline uppercase text-white p-4 mx-4 rounded-2xl" onClick={handleLogin}>Login</button>*/}
					<p class="text-center">No account?{' '} <Link class="text-amber-900 font:semi-bold hover:font-extrabold" to="/register">Register</Link></p>
				</>
			)}
		</div>
	);
};

export default Home;