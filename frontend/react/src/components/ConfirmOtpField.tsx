import react from "react";
import axios from "axios";

interface Props {
	apiUrl: string;
	otp: string;
	setOtp: (otp: string) => void;
	setIs2FAEnabled: (isEnabled: boolean) => void;
	setShowOtpField: (show: boolean) => void;
}

const ConfirmOtpField: React.FC<Props> = ({apiUrl, otp, setOtp, setIs2FAEnabled, setShowOtpField}) => {
	return (
		<div className="mt-4">
			<input
				type="text"
				placeholder="Enter OTP"
				value={otp}
				onChange={(e) => setOtp(e.target.value)}
				className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
			<button
				className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
				onClick={async () => {
					try {
						// send request to backend to verify OTP
						console.log("Verifying OTP:", otp);
						const response = await axios.post(apiUrl + '/auth/otp/verify', { code: otp }, { withCredentials: true });
						if (response.status === 200) {
							// OTP verified successfully, enable 2FA
							setIs2FAEnabled(true);
							setShowOtpField(false);
							setOtp('');
							axios.post(apiUrl + '/users/emailActivation', { emailVerified: true}, { withCredentials: true });
							console.log("OTP verified and 2FA enabled!");
						} else {
							alert("Invalid or expired OTP. Please try again.");
						}
					} catch (error) {
						console.error('Error verifying OTP:', error);
					}
				}}>
					Confirm
				</button>
		</div>
	);
}
export default ConfirmOtpField;
