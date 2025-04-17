import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'api';

// define token contents
interface JwtPayload {
	sub: string; // subject (usually user ID)
	name: string; // username?
	exp: number; // expiration time stamp
}

// definition of context type
interface AuthContextType {
	user: JwtPayload | null;
	token: string | null;
	login: (token: string) => void;
	logout: () => void;
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

	const logout = () => {
		setToken(null);
		setUser(null);
	}

	// on mount, checks for an existing session
	useEffect(() => {
		const checkSession = async () => {
			try {
				const res = await fetch(apiUrl + '/users/session', {
					method: "GET",
					credentials: "include", // needed for cookies, yummy
				});

				if (res.ok) {
					const data = await res.json();
					if (data.token) {
						login(data.token);
					}
				}

			} catch (error) {
				console.error("Session check failed", error);
			}
		};

		checkSession();
	}, []);

	return ( // these variables become available through useAuth() call
		<AuthContext.Provider value={{ user, token, login, logout }}> 
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => { // protects against cases where context is missing
	const context = useContext(AuthContext);
	if (!context) throw new Error("useAuth must be used within AuthProvider");
	return context;
};