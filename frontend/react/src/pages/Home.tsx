import React from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

import NavigationHeader from '../components/NavigationHeader';


/* need to add typenames here */
const Home: React.FC = ({status, user}) => {
	return (
		<div>
			<div className="flex justify-center"><img className="object-contain max-h-full m-auto" src="assets/pong-placeholder.gif"></img></div>
			<h1 className="text-6xl text-center text-teal-800 m-3">Welcome!</h1>

			{status === 'loading' ? (
				<p>Checkin session...</p>
			) : status === 'authorized' && user ? (
				<>
					<p>Hello, {user.username}</p>
					
					
					
				</>
			) : (
				<>
					<p className="text-center">Please log in to access exclusive Pong content and connect with other registered players!</p>
					<button className="border bg-amber-900 font-semibold hover:font-extrabold
					  hover:underline uppercase text-white p-4 mx-4 rounded-2xl" onClick={handleLogin}>Login</button>
					<p className="text-center">No account?{' '} <Link className="text-amber-900 font:semi-bold hover:font-extrabold" to="/register">Register</Link></p>
				</>
			)}
		</div>
	);
};

export default Home;