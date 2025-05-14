import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import SearchPals from '../components/SearchPals';
//import { useAuthCheck } from '../auth/useAuthCheck'
import { useAuth } from '../auth/AuthProvider';


const PongPals: React.FC = () => {
	const navigate = useNavigate();
	const { status } = useAuth();

	if (status === 'loading') return <p>Loading...</p>
	if (status === 'unauthorized') return <Navigate to="/" replace />;

	const handleReturn = () => {
		navigate('/');
	}

	const handleSearch = (query: string) => {
		console.log('Searching for:', query);
		// not exactly sure if the backend call for search goes here
	}

	// add api call for user connections data
	// - list of friends and their online statuses
	// - list of pending friend requests
	const inputStyles = "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
	
	return (
		<div className="dark:text-white text-center">
			<h1 className="text-6xl text-center text-teal-800 dark:text-teal-300 m-3">Pong Pals</h1>
			<h2 className="text-3xl text-center text-teal-800 dark:text-teal-300 m-3">Pending friend requests</h2>
			<h2 className="text-3xl text-center text-teal-800 dark:text-teal-300 m-3">Search users</h2>
			<SearchPals onSearch={handleSearch} />
			<h2 className="text-3xl text-center text-teal-800 dark:text-teal-300 m-3">Your friends</h2>
			<button className="block mx-auto px-20 text-white bg-teal-700 hover:bg-teal-800 focus:ring-4 
							   focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full 
							   sm:w-auto py-2.5 text-center dark:bg-teal-600 dark:hover:bg-teal-700
							   dark:focus:ring-teal-800" onClick={handleReturn}>Back</button>
		</div>
	);
};

export default PongPals