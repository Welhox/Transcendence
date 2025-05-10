import React, { useEffect, useState } from 'react';
import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'api';

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
			}, { withCredentials: true });
			setFriendRequestSent(true);
		} catch (error) {
			console.error('Failed to send friend request', error);
		}
	};

	if (currentUserId === viewedUserId) return null;

	if (isFriend) return <p>You are friends.</p>;
	if (friendRequestSent) return <p>Friend request sent!</p>;

	return <button onClick={handleSendFriendRequest}>Befriend</button>;
};

export default BefriendButton;