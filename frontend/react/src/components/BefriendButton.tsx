import React, { useEffect, useState } from 'react';
import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';

interface BefriendButtonProps {
	currentUserId: string;
	viewedUserId: string;
}

const BefriendButton: React.FC<BefriendButtonProps> = ({ currentUserId, viewedUserId }) => {
	const [isFriend, setIsFriend] = useState(false);
	const [friendRequestSent, setFriendRequestSent] = useState(false);

	useEffect(() => {

		const checkFriendStatus = async () => {
			if (currentUserId === viewedUserId) return;
			try {
				const res = await axios.get(apiUrl + '/friend-status', {
					params: {
						userId1: currentUserId,
						userId2: viewedUserId,
					},
					headers: {
						"Content-Type": "application/json", // optional but safe
					},
					withCredentials: true,
				});
				setIsFriend(res.data.isFriend);
				setFriendRequestSent(res.data.requestPending);
			} catch (error) {
				console.error('Failed to check friend status', error);
			}
		};

		checkFriendStatus();
	}, [currentUserId, viewedUserId]);


	const handleSendFriendRequest = async () => {
		try {
			await axios.post(apiUrl + '/friend-request', {
				receiverId: viewedUserId,
			}, { 
				headers: {
					"Content-Type": "application/json",
				},
				withCredentials: true,
			});
			setFriendRequestSent(true);
		} catch (error) {
			console.error('Failed to send friend request', error);
		}
	};

	const handleUnfriend = async () => {
		try {
			await axios.post(apiUrl + '/unfriend', {
				userId1: currentUserId,
				userId2: viewedUserId,
			}, {
				headers: {
					"Content-Type": "application/json",
				},
				withCredentials: true,
			});
			setIsFriend(false);
		} catch (error) {
			console.error('Failed to unfriend user', error);
		}
	};

	if (currentUserId === viewedUserId) return null;

	if (isFriend) {
		return (
			<button
				className="block mx-auto px-17 text-white bg-teal-700 hover:bg-teal-800 focus:ring-4 
				focus:outline-none focus:ring-blue-300 font-semibold rounded-lg text-sm w-full 
				sm:w-auto py-2.5 text-center dark:bg-teal-600 dark:hover:bg-teal-700
				dark:focus:ring-teal-800 m-5"
				onClick={handleUnfriend}>
					Unfriend
			</button>
		);
	}
		
	if (friendRequestSent) return <p className="text-4xl text-center text-teal-800 dark:text-teal-300 m-3">Friend request pending...</p>;

	return (
		<button 
			className="block mx-auto px-17 text-white bg-teal-700 hover:bg-teal-800 focus:ring-4 
			focus:outline-none focus:ring-blue-300 font-semibold rounded-lg text-sm w-full 
			sm:w-auto py-2.5 text-center dark:bg-teal-600 dark:hover:bg-teal-700
			dark:focus:ring-teal-800 m-5"
			onClick={handleSendFriendRequest}>
				Befriend
		</button>
	);
};

export default BefriendButton;