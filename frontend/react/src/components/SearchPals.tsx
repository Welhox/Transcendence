import React, { useState } from 'react';

interface SearchProps {
	onSearch: (query: string) => void;
}

const SearchPals: React.FC<SearchProps> = ({ onSearch }) => {
	const [query, setQuery] = useState('');
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = query.trim(); // get rid of 'em white space

		const isValid = /^[a-zA-Z0-9]+$/.test(trimmed);

		if (!trimmed) {
			setError("Please enter a username.");
			return;
		}

		if (!isValid) {
			setError("Usernames only contain letters and numbers.");
			return;
		}

		setError(null);
		onSearch(trimmed);
		setQuery('');
		// api call for data to display a user profile -> create another custom react component
	};

	return (
		<form onSubmit={handleSubmit}>
			<input
				type="text"
				placeholder="Give username"
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				maxLength={42}
			/>
			<button type="submit">Search</button>
			{error && <div style={{ color: "red", marginTop: "0.5rem" }}>{error}</div>}
		</form>
	);
};

export default SearchPals