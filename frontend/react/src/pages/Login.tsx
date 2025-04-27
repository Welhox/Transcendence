import React, { useState, useEffect } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../auth/AuthContext';

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

	const navigate = useNavigate();
	const { token, checkSession } = useAuth();

	useEffect(() => {
		let timer: ReturnType<typeof setTimeout>;
		if (cooldown > 0) {
			timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
		}
		return () => clearTimeout(timer);
	}, [cooldown]);

	if (token) {
		return <Navigate to="/" replace />;
	}

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
				{ withCredentials: true} // enables HTTP-only cookies
			);

			console.log('Login successful: ', response.data)
			await checkSession();
			setAttempts(0);
			navigate('/');
			return;

		} catch (error: any) {
			console.error('Login failed: ', error);

			setAttempts(prev => prev + 1);

			if (error.response?.status === 400) {
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

  return (
    <div>
      <h1>Player Login</h1>
      <form onSubmit={handleLogin} autoComplete="off">
        <input
          type="text"
          placeholder="Username"
		  value={username}
		  onChange={(e) => setUsername(e.target.value)}
		  autoComplete="username"
		  disabled={cooldown > 0}
        />
        <input
          type="password"
          placeholder="Password"
		  value={password}
		  onChange={(e) => setPassword(e.target.value)}
		  autoComplete="current-password"
		  disabled={cooldown > 0}
        />
        <button type="submit" disabled={cooldown > 0}>
			{cooldown > 0 ? `Wait (${cooldown}s)` : 'Login'}
		</button>
      </form>

      <p>
        No account?{' '}
        <Link to="/register">
          Register here
        </Link>
      </p>

	  {error && <p style={{ color: 'red' }}>{error}</p>}

	  <p><Link to="/forgotpassword">Forgot password</Link></p>
    </div>
  )
}

export default Login;