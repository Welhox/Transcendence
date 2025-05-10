import React from 'react';
import { useNavigate } from 'react-router-dom';

interface StatsHeaderProps {
	username: string;
	from?: string;
}

const StatsHeader: React.FC<StatsHeaderProps> = ({ username, from }) => {
	const navigate = useNavigate();

	return (
		<div>
			<h1>{username}'s Pong Stats</h1>
			<button onClick={() => navigate(from || '/')}>Back</button>
		</div>
	);
};

export default StatsHeader;