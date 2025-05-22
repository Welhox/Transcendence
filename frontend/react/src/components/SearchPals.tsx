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
	const [hasSearched, setHasSearched] = useState(false);
	const { user } = useAuth();

	useEffect(() => {
		const delayDebounce = setTimeout(() => {
			const trimmed = query.trim();

			if (!trimmed) {
				setResults([]);
				setHasSearched(false);
				return;
			}

			const isValid = /^[a-zA-Z0-9]+$/.test(trimmed);

			if (!isValid) {
				setError("Usernames only contain letters and numbers.");
				setResults([]);
				setHasSearched(false);
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
							headers: {
								"Content-Type": "application/json", // optional but safe
							},
							withCredentials: true,
						}
					);
					const data = response.data;
					setResults(Array.isArray(data) ? data : []);
					setHasSearched(true);
				} catch (error) {
					console.error('Search failed:', error);
					setError('Something went wrong while searching.');
					setHasSearched(false);
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

			{error && <div style={{ color: "red", marginTop: "0.5rem" }}>{error}</div>}

			{hasSearched && results.length === 0 && !error && query.toLowerCase() !== user?.username.toLowerCase() && (
				<p className="text-center text-gray-600 dark:text-gray-300 mt-4">No matching users found.</p>
			)}

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