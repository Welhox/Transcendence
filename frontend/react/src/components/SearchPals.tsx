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
	const inputStyles = "mx-auto my-5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
	
	return (
		<form onSubmit={handleSubmit}>
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
		</form>
	);
};

export default SearchPals