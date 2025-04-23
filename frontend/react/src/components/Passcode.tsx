import React, { useState } from 'react';

interface PasscodeProps {
	onSubmit: (code: string) => void;
}

const Passcode: React.FC<PasscodeProps> = ({ onSubmit }) => {
	const [code, setCode] = useState('');
	const [error, setError] = useState('');

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;

		// allow only digits and max 6 characters
		if (/^\d{0,6}$/.test(value)) {
			setCode(value);
			setError('');
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (code.length !== 6) {
			setError('Code is too short');
			return;
		}
		onSubmit(code);
		setCode('');
	};

	return (

		<form onSubmit={handleSubmit}>
			<label htmlFor="passcode">Enter verification code:</label>
			<input
				id="passcode"
				type="text"
				value={code}
				onChange={handleChange}
				maxLength={6}
				inputMode="numeric"
				pattern="\d{6}"
				placeholder="______"
			/>
			{error && <p style={{ color: 'red' }}>{error}</p>}
			<button type="submit" disabled={code.length !== 6}>Submit</button>
		</form>
	);
};

export default Passcode;