import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'api';

type Friend = {
	id: string;
	username: string;
}

type FriendListProps = {
	friends: Friend[];
}

export const FriendList: React.FC<FriendListProps> = ({ friends }) => {

	if (friends.length === 0) return <div>You don't have any pals yet</div>;

	return (
		<ul className="m-5">
			{friends.map((friend) => (
				<li key={friend.id}>
					<Link to={'/stats/'} state={{ userId: friend.id, username: friend.username, from: '/pongpals' }}>{friend.username}</Link>
				</li>
			))}
		</ul>
	);
};