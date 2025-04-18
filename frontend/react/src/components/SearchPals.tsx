import React, { useState } from 'react';

interface SearchProps {
	onSearch: (query: string) => void;
}

const SearchPals: React.FC<SearchProps> = ({ onSearch }) => {
	const [query, setQuery] = useState('');

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = query.trim(); // get rid of 'em white space

		if (trimmed) {
			onSearch(trimmed);
			setQuery('');
		}
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
		</form>
	);
};

export default SearchPals