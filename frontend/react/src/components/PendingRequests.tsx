import React, { useEffect, useState } from "react";

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'api';

type Request = {
	id: number;
	senderId: string;
	username: string;
}

type Props = {
	userId: string;
	onFriendAdded: (newFriend: { id: string; username: string }) => void;
}

export const PendingRequests: React.FC<Props> = ({ userId, onFriendAdded }) => {
	const [requests, setRequests] = useState<Request[]>([]);
	const [message, setMessage] = useState<string | null>(null);

	useEffect(() => {
		const fetchRequests = async () => {
			const res = await fetch(apiUrl + `/users/${userId}/requests`);
			const data = await res.json();
			setRequests(data);
		};

		fetchRequests();
	}, [userId]);

	const handleAction = async (
		requestId: number,
		username: string,
		senderId: string,
		action: "accept" | "decline"
	) => {
		const res = await fetch(apiUrl + `/friends/${action}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ requestId }),
			credentials: "include",
		});

		if (res.ok) {
			setRequests((prev) => prev.filter((r) => r.id !== requestId));
			if (action === "accept") {
				setMessage(`You're now friends with ${username}`);
				onFriendAdded({ id: senderId, username });
			} else {
				setMessage('Request declined');
			}

			setTimeout(() => setMessage(null), 3000);
		}
	};

	if (requests.length === 0) return;

	return (
		<div>
			<h2 className="text-3xl text-center text-teal-800 dark:text-teal-300 m-3">Pending friend requests:</h2>
			{message && <p>{message}</p>}
			<ul>
				{requests.map((req) => (
					<li key={req.id}>
						{req.username} wants to be your friend{" "}
						<button onClick={() => handleAction(req.id, req.username, req.senderId, "accept")}>
							accept
						</button>{" "}
						<button onClick={() => handleAction(req.id, req.username, req.senderId, "decline")}>
							decline
						</button>
					</li>
				))}
			</ul>
		</div>
	);
};