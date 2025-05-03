import React, { useState, useEffect } from 'react';

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'api';

interface User {
	id: number;
	username: string;
}

const SearchPals: React.FC = () => {
	const [query, setQuery] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [results, setResults] = useState<User[]>([]);

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
			fetch(apiUrl + `/users/search?query=${trimmed}`)
				.then((res) => res.json())
				.then((data) => {
					if (Array.isArray(data)) {
						setResults(data);
					} else {
						console.error("Unexpected response:", data);
						setResults([]);
						setError("Unexpected respone from server.");
					}
				})
				.catch((error) => {
					console.error(error);
					setError("Something went wrong while searching.");
				});
		}, 300); // debounce for smoother UX

		return () => clearTimeout(delayDebounce);
	}, [query]);

	return (
		<div>
			<input
				type="text"
				placeholder="Give username"
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				maxLength={42}
			/>
			{error && <div style={{ color: "red", marginTop: "0.5rem" }}>{error}</div>}

			<ul>
				{results.map((user) => (
					<li key={user.id}>{user.username}</li>
				))}
			</ul>

		</div>
	);
};

export default SearchPals;