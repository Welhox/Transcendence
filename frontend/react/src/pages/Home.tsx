import React from 'react';
import { Link } from 'react-router-dom';
import { User, AuthContextType } from '../auth/AuthProvider'
import NavigationHeader from '../components/NavigationHeader';
import placeholderImage from '../../assets/pong-placeholder.gif'

interface HomeProps {
	status: AuthContextType["status"];
	user: AuthContextType["user"];
}

/* need to add typenames here */
const Home: React.FC<HomeProps> = ({ status, user }) => {

	return (
		<div className="text-center max-w-2xl dark:bg-black bg-white mx-auto rounded-lg">
			<div className="flex justify-center my-5"><img className="object-contain max-h-full m-auto" src={placeholderImage}></img></div>
			<h1 className="text-6xl text-center text-teal-800 dark:text-teal-300 m-3">Welcome!</h1>

			{status === 'loading' ? (
				<p>Checkin session...</p>
			) : status === 'authorized' && user ? (
				<>
					<p className="dark:text-white pb-10">Hello, {user.username}</p>
				</>
			) : (
				<>
					<p className="dark:text-white text-center">Please log in to access exclusive Pong content and connect with other registered players!</p>
					<p className="dark:text-white text-center font-bold p-5">No account?{' '} <Link className="text-amber-900 dark:text-amber-300 font:bold hover:font-extrabold" to="/register">Register</Link></p>
				</>
			)}
		</div>
	);
};

export default Home;