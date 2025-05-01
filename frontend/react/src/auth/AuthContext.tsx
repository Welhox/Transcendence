import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'api';

// define token contents
interface JwtPayload {
	id: string; // user ID
	name: string; // username
	exp: number; // expiration time stamp != expiresIn
}

// definition of context type
interface AuthContextType {
	user: JwtPayload | null;
	token: string | null;
	login: (token: string) => void;
	logout: () => void;
	checkSession: () => Promise<void>;
}

// creates a context that is either AuthCntextType object or undefined, real value is defined later in AuthProvider
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [user, setUser] = useState<JwtPayload | null>(null);
	const [token, setToken] = useState<string | null>(null);

	const login = (newToken: string) => { // newToken = JWT sstring (typically from a login API) following header.payload.signature format
		const decoded = jwtDecode<JwtPayload>(newToken); // decodes payload part and returns it as a JS object (as JwtPayload, defined earlier)
		setToken(newToken);
		setUser(decoded);
	}

	const logout = async () => {
		try {
			await axios.post(apiUrl + '/users/logout', {}, { withCredentials: true });
		} catch (error) {
			console.error("Error logging out: ", error);
		}
		setToken(null);
		setUser(null);
	}

	const checkSession = async () => {
		try {
			const res = await axios.get(apiUrl + '/refresh', {
				withCredentials: true,
			});

			if (!user && res.data.accessToken) {
				login(res.data.accessToken);
				return;
			}
		} catch (error) {
			console.log("No active session");
			//logout(); -> could be used to clear out client state (optional)
		}
	};

	// on mount, checks for an existing session
	useEffect(() => {
		checkSession();
	}, []);

	return ( // these variables become available through useAuth() call
		<AuthContext.Provider value={{ user, token, login, logout, checkSession }}> 
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => { // protects against cases where context is missing
	const context = useContext(AuthContext);
	if (!context) throw new Error("useAuth must be used within AuthProvider");
	return context;
};