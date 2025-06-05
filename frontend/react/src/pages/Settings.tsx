import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import DeleteAccountButton from '../components/DeleteAccount';
import EditProfilePic from '../components/EditProfilePic';
import SettingsField from '../components/SettingsField';
import LanguageSelector from '../components/LanguageSelector';
import ToggleSwitch from '../components/ToggleSwitch';
import axios from 'axios';
import ConfirmOtpField from '../components/ConfirmOtpField';

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'api';

const Settings: React.FC = () => {
	const navigate = useNavigate();
	const { status, user, refreshSession } = useAuth();

	// import current settings from backend
	const [email, setEmail] = useState("");
	const [language, setLanguage] = useState("en");
	const [is2FAEnabled, setIs2FAEnabled] = useState(false);
	const [otp, setOtp] = useState('');
	const [showOtpField, setShowOtpField] = useState(false);
	
	//this effect runs twice at the moment as it also triggers on email change
	// this is because the email state is updated after fetching user settings
	// the email state is needed for updating the is2FAEnabled state upon email change
	useEffect(() => {
		// Fetch user settings from the backend
		const fetchUserSettings = async () => {
			try {
				const response = await axios.get(apiUrl + '/users/settings', { withCredentials: true });
				console.log('RESPONSE:', response.data);
				setEmail(response.data.email);
				setLanguage(response.data.language);
				setIs2FAEnabled(response.data.mfaInUse);
			} catch (error) {
				console.error('Error fetching user settings:', error);
			}
		};
		if (status === 'authorized') {
			fetchUserSettings();
		}
	}, [status, email]);

	if (status === 'loading') return <p>Loading...</p>
	if (status === 'unauthorized') return <Navigate to="/" replace />;

	const handleReturn = () => {
		navigate('/');
	}

	const handleDelete = async (password: string) => {
		if (!user?.id) throw new Error('No user ID available');

		try {
			await axios.post(`${apiUrl}/users/delete/${user?.id}`, {password}, { withCredentials: true });
			localStorage.clear();
			sessionStorage.clear();
			await refreshSession();

			alert('Your account has been deleted.');
			navigate('/');
		} catch (error: any) {
			console.error('Failed to delete account:', error);
			alert('Failed to delete account. Please try again later.');
		}
	};

	//toggle mfa on/off
	// send request to backend to update mfa status
	//is a a guard against spamming otps needed?
	const handle2FAToggle = async () => {
		try {
			// send request to backend to update 2FA status
			if(is2FAEnabled === true)
			{
				const response = await axios.post(apiUrl + '/auth/mfa', { mfaInUse: !is2FAEnabled }, { withCredentials: true });
				setIs2FAEnabled(response.data.mfaInUse);
				console.log("2FA toggled!");
			}
			else //check if email is already validated and show the Otp field to validate email if not
			{
				const user = await axios.get(apiUrl + '/users/emailStatus', { withCredentials: true });
				if (user.data.emailVerified === true) {
					const response = await axios.post(apiUrl + '/auth/mfa', { mfaInUse: !is2FAEnabled }, { withCredentials: true });
					setIs2FAEnabled(response.data.mfaInUse);
					console.log("2FA toggled!");
				} else {
				// send otp to email
				try {
					const response = await axios.get(apiUrl + '/auth/otp-wait-time',  { withCredentials: true})
					const waitTime = response.data.secondsLeft
					
					if( waitTime > 0) {
						alert(`Please wait ${waitTime} seconds before requesting a new OTP.`);
					} else {
					await axios.post(apiUrl + '/auth/otp/send-otp', {}, { withCredentials: true });
					setShowOtpField(true);
					}
				}
				catch (error) {
					console.error('Error sending OTP:', error);
					alert('Failed to send OTP. Please try again later.');
				}
			}}
		}
		catch (error) {
			console.error('Error updating 2FA status:', error);
		}
	};
	
	const uploadProfilePic = async (file: File | null) => {
		if (!file) return;

		const formData = new FormData();
		formData.append("file", file);

		try {
			const res = await axios.post(apiUrl + '/user/profile-pic', formData, {
				withCredentials: true,
			});

			await refreshSession();
			console.log(user);
		} catch (error: any) {
			console.error('Error uploading file:', error);
			alert('Upload failed: ' + (error.response?.data?.error || error.message));
		}
	}

	const handleLanguageChange = async (newLang: string) => {
		try {
			const response = await axios.post(
				apiUrl + '/user/language',
				{ language: newLang },
				{ withCredentials: true }
			);

			setLanguage(response.data.language);
			console.log('Language updated to:', response.data.language);
		} catch (error: any) {
			console.error('Failed to update language:', error);
			alert('Failed to update language preference. Please try again.');
		}
	}


	return (
		<div className="p-5 mt-5 text-center max-w-2xl dark:bg-black bg-white mx-auto rounded-lg text-center dark:text-white">
			<h1 className="text-6xl text-center text-teal-800 dark:text-teal-300 m-3">Settings</h1>
			<EditProfilePic
				pic={user?.profilePic ? `${apiUrl}${user.profilePic}` : `${apiUrl}/assets/default_avatar.png`}
				onChange={() => {}}
				onSave={uploadProfilePic} />
			<SettingsField label="Email" type="email" value={email} onUpdate={(newEmail) => setEmail(newEmail)} />
			<SettingsField label="Password" type="password" value="********" />
			<LanguageSelector value={language} onChange={handleLanguageChange} />
			<ToggleSwitch
				label="Enable Two-Factor Authentication"
				enabled={is2FAEnabled}
				onToggle={handle2FAToggle}
			/>
			{showOtpField && <ConfirmOtpField 
				setIs2FAEnabled={setIs2FAEnabled} 
				setShowOtpField={setShowOtpField}
				apiUrl={apiUrl}
				otp={otp}
				setOtp={setOtp} />}
			<DeleteAccountButton onDelete={handleDelete} />
			<button className="font-semibold block mx-auto my-5 px-20 text-white bg-teal-700 hover:bg-teal-800 focus:ring-4 
								  focus:outline-none focus:ring-blue-300 rounded-lg text-sm w-full 
								  sm:w-auto py-2.5 text-center dark:bg-teal-600 dark:hover:bg-teal-700
								  dark:focus:ring-teal-800"
					onClick={handleReturn}>Back</button>
		</div>
	);
};

export default Settings;