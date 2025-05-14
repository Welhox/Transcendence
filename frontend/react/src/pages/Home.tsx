import React from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

import NavigationHeader from '../components/NavigationHeader';


/* need to add typenames here */
const Home: React.FC = ({status, user}) => {
	return (
		<div className="text-center">
			<div className="flex justify-center"><img className="object-contain max-h-full m-auto" src="assets/pong-placeholder.gif"></img></div>
			<h1 className="text-6xl text-center text-teal-800 dark:text-teal-300 m-3">Welcome!</h1>

			{status === 'loading' ? (
				<p>Checkin session...</p>
			) : status === 'authorized' && user ? (
				<>
					<p className="dark:text-white">Hello, {user.username}</p>
				</>
			) : (
				<>
					<p className="dark:text-white text-center">Please log in to access exclusive Pong content and connect with other registered players!</p>
					<p className="dark:text-white text-center">No account?{' '} <Link className="text-amber-900 dark:text-amber-300 font:semi-bold hover:font-extrabold" to="/register">Register</Link></p>
				</>
			)}
		</div>
	);
};

export default Home;