import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'api';

export interface User {
	id: string;
	username: string;
	email?: string;
	profilePic?: string;
}

export interface AuthContextType {
	status: 'loading' | 'authorized' | 'unauthorized';
	user: User | null;
	refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [status, setStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');
	const [user, setUser] = useState<User | null>(null);

	const refreshSession = async () => {
		try {
			const response = await axios.get<User>(apiUrl + '/session/user', {
				headers: {
					"Content-Type": "application/json", // optional but safe
				},
				withCredentials: true,
			});
			if (response.status === 200 && response.data.id) {
				setUser(response.data);
				setStatus('authorized');
			} else {
				setUser(null);
				setStatus('unauthorized');
			}
		} catch {
			setUser(null);
			setStatus('unauthorized');
		}
	};

	useEffect(() => {
		refreshSession();
	}, []);

	return (
		<AuthContext.Provider value={{ status, user, refreshSession }}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) throw new Error('useAuth must be used within AuthProvider');
	return context;
};