import React, { useState } from 'react';

const DeleteAccountButton: React.FC<{ onDelete: (password: string) => void }> = ({ onDelete }) => {
	const [showForm, setShowForm] = useState(false);
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');

	const handleSubmit = () => {
		if (!password) {
			setError('Please enter your password');
			return;
		}
		setError('');
		onDelete(password);
	}

	return (
		<div className="my-4">
			{showForm ? (
				<div className="flex flex-col gap-2 items-center">
					<input
						type="password"
						placeholder="Enter your password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="px-3 py-2 border rounded w-64 dark:bg-gray-800 dark:text-white"
					/>
					{error && <p className="text-red-500 text-sm">{error}</p>}
					<div className="flex gap-2">
						<button className="px-5 mx-3 my-2 text-white bg-amber-700 hover:bg-amber-800 focus:ring-4 
										focus:outline-none focus:ring-blue-300 font-semibold rounded-lg text-sm w-full 
										sm:w-auto py-2.5 text-center dark:bg-amber-600 dark:hover:bg-amber-700
										dark:focus:ring-amber-800"
								onClick={handleSubmit}
						>Confirm Delete
						</button>
						<button className="px-5 mx-3 my-2 text-white bg-amber-700 hover:bg-amber-800 focus:ring-4 
										focus:outline-none focus:ring-blue-300 font-semibold rounded-lg text-sm w-full 
										sm:w-auto py-2.5 text-center dark:bg-amber-600 dark:hover:bg-amber-700
										dark:focus:ring-amber-800"
								onClick={() => setShowForm(false)}
						>Cancel
						</button>
					</div>
				</div>
			) : (
				<button className="px-5 mx-3 my-2 text-white bg-amber-700 hover:bg-amber-800 focus:ring-4 
									focus:outline-none focus:ring-blue-300 font-semibold rounded-lg text-sm w-full 
									sm:w-auto py-2.5 text-center dark:bg-amber-600 dark:hover:bg-amber-700
									dark:focus:ring-amber-800"
						onClick={() => setShowForm(true)}
				>Delete Account
				</button>
			)}
		</div>
	);
};

export default DeleteAccountButton;