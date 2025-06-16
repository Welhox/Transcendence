import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../auth/AuthProvider';
import i18n from '../i18n';

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'api';

const MAX_ATTEMPTS = 5;
const COOLDOWN_SECONDS = 30;

const isValidUsername = (username: string) => /^[a-zA-Z0-9]{2,20}$/.test(username);

const isValidPassword = (password: string) => {
	const pwdValidationRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
	const lengthOK = password.length >= 8 && password.length <= 42;
	const matchesSpecs = pwdValidationRegex.test(password);
	return lengthOK && matchesSpecs;
};

const Login: React.FC = () => {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [attempts, setAttempts] = useState(0);
	const [cooldown, setCooldown] = useState(0);
	//const [sessionExpired, setSessionExpired] = useState(false);

	const navigate = useNavigate();
	//const location = useLocation();
	const { status, refreshSession } = useAuth();

	/* useEffect(() => {
		// check for "reason=expired" in URL query params
		const params = new URLSearchParams(location.search);
		if (params.get('reason') === 'expired') {
			setSessionExpired(true);
		}
	}, [location.search]); */

	useEffect(() => {
		let timer: ReturnType<typeof setTimeout>;
		if (cooldown > 0) {
			timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
		}
		return () => clearTimeout(timer);
	}, [cooldown]);

	useEffect(() => {
		if (status === 'authorized') {
			navigate('/');
		}
	}, [status]);

	if (status === 'loading') return <p>Loading...</p>

	// sends post request to server for credential validation
	const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);

		if (cooldown > 0) {
			setError(`Please wait ${cooldown} seconds before trying again.`);
			return;
		}

		if (!isValidUsername(username)) {
			setError('Invalid username syntax.');
			return;
		}

		// enable for production
		/* if (!isValidPassword(password)) {
			setError('Invalid password syntax.');
			return;
		} */

		let response
		try {
			response = await axios.post(
				apiUrl + '/users/login',
				{ username, password },
				{
					headers: {
						"Content-Type": "application/json",
					},
					withCredentials: true,
			});

			const data = response.data;
			const userLang = response.data.language ?? 'en';

    		// Change language immediately
    		if (i18n.language !== userLang) {
      			await i18n.changeLanguage(userLang);
      			localStorage.setItem('language', userLang);
    		}
			
			if (data.mfaRequired) {
				navigate('/mfa');
				return;	
			}
			console.log('Login successful: ', response.data);

			await refreshSession();
			setAttempts(0);
			return;

		} catch (error: any) {
			console.error('Login failed: ', error);

			setAttempts(prev => prev + 1);

			if (error.response?.status === 401) {
				console.error('Invalid username or password');
			} else {
				console.log('Epic failure: ', response);
			}

			if (attempts + 1 >= MAX_ATTEMPTS) {
				setCooldown(COOLDOWN_SECONDS);
				setAttempts(0);
			}
		}
	}
	const labelStyles = "block mb-2 text-sm font-medium text-gray-900 dark:text-white"
	const inputStyles = "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
	
  return (
    <div className="text-center max-w-2xl dark:bg-black bg-white mx-auto rounded-lg">
      <h1 className="text-6xl text-center text-teal-800 dark:text-teal-300 m-5 p-5">Player Login</h1>
	  {/*{sessionExpired && (
		<p className="text-red-600 font-bold mb-4">
			Your session has expired. Please log in again.
		</p>
	  )}*/}
	  <form className="max-w-sm mx-auto" onSubmit={handleLogin} autoComplete="off">
	  <div className="mb-5"><label className={labelStyles} htmlFor="username">Username:</label>
	  <input className={inputStyles}
          type="text"
		  id="username"
          placeholder="Username"
		  value={username}
		  onChange={(e) => setUsername(e.target.value)}
		  autoComplete="username"
		  disabled={cooldown > 0}
        /></div>
		<div className="mb-5">
		<label className={labelStyles} htmlFor="password">Password:</label>
        <input className={inputStyles}
          type="password"
		  id="password"
          placeholder="Password"
		  value={password}
		  onChange={(e) => setPassword(e.target.value)}
		  autoComplete="current-password"
		  disabled={cooldown > 0}
        /></div>
        <button className="block mx-auto my-5 px-20 text-white bg-teal-700 hover:bg-teal-800 focus:ring-4 
								  focus:outline-none focus:ring-blue-300 font-semibold rounded-lg text-sm w-full 
								  sm:w-auto py-2.5 text-center dark:bg-teal-600 dark:hover:bg-teal-700
								  dark:focus:ring-teal-800" 
								  type="submit" disabled={cooldown > 0}>
			{cooldown > 0 ? `Wait (${cooldown}s)` : 'Login'}
		</button>
      </form>
	  
      <p className="text-amber-700 dark:text-amber-300 font-bold text-center mb-5">
        No account?{' '}
        <Link to="/register">
          Register here
        </Link>
      </p>

	  {error && <p style={{ color: 'red' }}>{error}</p>}

	  <p className="pt-3 pb-8 text-center"><Link className="text-white bg-amber-700 hover:bg-amber-800 
						  focus:ring-4 focus:outline-none focus:ring-blue-300 font-semibold 
						  rounded-lg text-sm w-full sm:w-auto px-11 py-3 mx-3 my-3 text-center
						  dark:bg-amber-600 dark:hover:bg-amber-700 dark:focus:ring-amber-800"
						  to="/forgotpassword">Forgot password</Link></p>
    </div>
  )
}

export default Login;