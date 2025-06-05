import React from 'react';

interface ToggleSwitchProps {
	label: string;
	enabled: boolean;
	onToggle: (newValue: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, enabled, onToggle }) => {
	return (
		<div className="flex justify-between items-center max-w-sm mx-auto my-4">
			<label htmlFor='toggleSwitch' className='font-bold'>{label}:</label>
			<button id='toggleSwitch'
				onClick={() => onToggle(!enabled)}
				className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${
					enabled ? 'bg-teal-600' : 'bg-gray-300'
				}`}
			>
				<div
					className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
						enabled ? 'translate-x-5' : ''
					}`}
				/>
			</button>
		</div>
	);
};

export default ToggleSwitch;