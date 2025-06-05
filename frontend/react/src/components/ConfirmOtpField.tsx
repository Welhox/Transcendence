import react from "react";
import axios from "axios";
import React, { useState } from "react";

interface Props {
	apiUrl: string;
	otp: string;
	setOtp: (otp: string) => void;
	setIs2FAEnabled: (isEnabled: boolean) => void;
	setShowOtpField: (show: boolean) => void;
}

const ConfirmOtpField: React.FC<Props> = ({apiUrl, otp, setOtp, setIs2FAEnabled, setShowOtpField}) => {
	const [error, setError] = useState<string>('');

	const handleSubmit = async () => {
		if (otp.length !== 6) {
			setError("Please enter a valid 6-digit OTP.");
			return;
		}
		try {
			// send request to backend to verify OTP
			console.log("Verifying OTP:", otp);
			const response = await axios.post(apiUrl + '/auth/otp/verify', { code: otp }, { withCredentials: true });
			if (response.status === 200) {
				// OTP verified successfully, enable 2FA
				setIs2FAEnabled(true);
				setOtp('');
				axios.post(apiUrl + '/users/emailActivation', { emailVerified: true}, { withCredentials: true });
				setError('Email verified and 2FA enabled successfully!');
				await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds
				setError(''); // Clear the error message after 2 seconds
				setShowOtpField(false);
				console.log("OTP verified and 2FA enabled!");
			} else {
				setError("Invalid or expired OTP. Please try again.");
			}
		} catch (error) {
			setError("Invalid or expired OTP. Please try again.");
			// console.error('Error verifying OTP:', error);
		}
	}

	return (
		<div className="mt-4">
			<input
				type="text"
				inputMode="numeric"
				pattern="\d{6}"
				maxLength={6}
				aria-label="OTP Input"
				placeholder="Verifiy by entering the 6-digit OTP sent to your email"
				value={otp}
				onChange={(e) => {
					setOtp(e.target.value.replace(/\D/g, '')); // Allow only digits
					if (e.target.value.length > 6) {
						setOtp(e.target.value.slice(0, 6)); // Limit to 6 digits
					}
				}}
				className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>

			{error && <p className="text-red-500 mt-2">{error}</p>}

			<button
				className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
				onClick={handleSubmit}
				>
				Confirm
			</button>
		</div>
	);
}
export default ConfirmOtpField;
