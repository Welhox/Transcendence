import React from 'react';

interface Match {
	date: string;
	result: string;
	opponent: string;
}

interface MatchHistoryProps {
	history: Match[];
}

const MatchHistory: React.FC<MatchHistoryProps> = ({ history }) => (
	<div style={{ marginTop: '20px' }}>
		<h2>Match History</h2>
		{history.length ? (
			<ul>
				{history.map((match, index) => (
					<li key={index}>
						{new Date(match.date).toLocaleDateString()} -{' '}
						{match.result.charAt(0).toUpperCase() + match.result.slice(1)} vs {match.opponent}
					</li>
				))}
			</ul>
		) : (
			<p>No match history available</p>
		)}
	</div>
);

export default MatchHistory;