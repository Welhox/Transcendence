import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'api';

interface User {
	id: number;
	username: string;
}

const SearchPals: React.FC = () => {
	const [query, setQuery] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [results, setResults] = useState<User[]>([]);
	const { user } = useAuth();

	useEffect(() => {
		const delayDebounce = setTimeout(() => {
			const trimmed = query.trim();

			if (!trimmed) {
				setResults([]);
				return;
			}

			const isValid = /^[a-zA-Z0-9]+$/.test(trimmed);

			if (!isValid) {
				setError("Usernames only contain letters and numbers.");
				setResults([]);
				return;
			}

			setError(null);

			const searchUsers = async () => {
				try {
					const response = await axios.get(apiUrl + '/users/search',
						{
							params: {
								query: trimmed,
								excludeUserId: user?.id,
							},
							withCredentials: true,
						}
					);
					const data = response.data;
					setResults(Array.isArray(data) ? data : []);
				} catch (error) {
					console.error();
					setError('Something went wrong while searching.');
				}
			};

			searchUsers();
		}, 300); // debounce for smoother UX

		return () => clearTimeout(delayDebounce);
	}, [query]);

	const inputStyles = "mx-auto my-5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
	
	return (
		<div>
			<input className={inputStyles}
				type="text"
				placeholder="Give username"
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				maxLength={42}
			/>
			<button className="block mx-auto px-20 text-white bg-teal-700 hover:bg-teal-800 focus:ring-4 
								  focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full 
								  sm:w-auto py-2.5 text-center dark:bg-teal-600 dark:hover:bg-teal-700
								  dark:focus:ring-teal-800" type="submit">Search</button>
			{error && <div style={{ color: "red", marginTop: "0.5rem" }}>{error}</div>}

			<ul>
				{results.map((user) => (
					<li key={user.id}>
						<Link to={'/stats/'} state={{ userId: user.id, username: user.username, from: '/pongpals' }}>
							{user.username}
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
};

export default SearchPals;