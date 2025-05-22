import React from 'react';

const DeleteAccountButton: React.FC<{ onDelete: () => void }> = ({ onDelete }) => (
	<div>
		<button className="px-5 mx-3 my-2 text-white bg-amber-700 hover:bg-amber-800 focus:ring-4 
								  focus:outline-none focus:ring-blue-300 font-semibold rounded-lg text-sm w-full 
								  sm:w-auto py-2.5 text-center dark:bg-amber-600 dark:hover:bg-amber-700
								  dark:focus:ring-amber-800"
			onClick={() => {
				if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
					onDelete();
				} 
			}}
		>
			Delete Account
		</button>
	</div>
);

export default DeleteAccountButton;