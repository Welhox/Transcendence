import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import DeleteAccountButton from '../components/DeleteAccount';
import EditProfilePic from '../components/EditProfilePic';
import SettingsField from '../components/SettingsField';
import LanguageSelector from '../components/LanguageSelector';

// add fields for user customization:
	// - change password
	// - change email address: needs to trigger email verification process
	// - change language preference
	// - upload avatar / choose a default one: set up max size 2MB
	// - remove user data and delete account

const Settings: React.FC = () => {
	const { token } = useAuth();
	const navigate = useNavigate();

	// import current settings from backend
	const [email, setEmail] = useState("users.current@email.com");
	const [password, setPassword] = useState("teehee");
	const [profilePic, setProfilePic] = useState<File | null>(null);
	const [language, setLanguage] = useState("en");

	if (!token) {
		return <Navigate to="/" replace />;
	}

	const handleReturn = () => {
		navigate('/');
	}

	const handleDelete = () => {
		// delete user from database
		// make all credentials invalid
		// redirect user to "/"
		console.log("Account deleted!");
	};

	// INTEGRATE SAVING OF SETTINGS HERE

	return (
		<div>
			<h1>Settings</h1>

			<EditProfilePic pic={profilePic} onChange={setProfilePic} />
			<SettingsField label="Email" type="email" value={email} onSave={setEmail} />
			<SettingsField label="Password" type="password" value={password} onSave={setPassword} mask />
			<LanguageSelector value={language} onChange={setLanguage} />
			<DeleteAccountButton onDelete={handleDelete} />
			<button onClick={handleReturn}>Back</button>
		</div>
	);
};

export default Settings