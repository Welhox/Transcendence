import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from './AuthContext';

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'api';

/*
Creates Axios Interceptor for safe API request making. Google interceptors for context.
Example usage:

const { token, login } = useAuth();
const api = createAxiosInstance(token, login);

// use api like normal axios
await api.get('/users/allInfo');
*/
export const createAxiosInstance = (token: string | null, login: (token: string) => void) => {
	const instance = axios.create({
		baseURL: apiUrl,
		withCredentials: true,
	});

	// Add request inceptor
	instance.interceptors.request.use(async (config) => {
		if (token) {
			const decoded = jwtDecode<any>(token);
			const now = Date.now() / 1000;
			const willExpireSoon = decoded.exp - now < 60;

			if (willExpireSoon) {
				try {
					const res = await axios.get(apiUrl + '/refresh', { withCredentials: true });
					login(res.data.accessToken); // updates context data
					config.headers.Authorization = `Bearer ${res.data.accessToken}`; // sets a default header
				} catch (error) {
					console.error("Session expired, please log in again.");
				}
			} else {
				config.headers.Authorization = `Bearer ${token}`;
			}
		}
		return config;
	});
	return instance;
};
