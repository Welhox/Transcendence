import React from 'react';

const DeleteAccountButton: React.FC<{ onDelete: () => void }> = ({ onDelete }) => (
	<div>
		<button
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