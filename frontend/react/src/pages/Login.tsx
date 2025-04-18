import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../auth/AuthContext';

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'api';

const Login: React.FC = () => {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const navigate = useNavigate();
	const { user, checkSession } = useAuth();

	if (user) {
		return <Navigate to="/" replace />;
	}

	// sends post request to server for credential validation
	const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		let response
		try {

			response = await axios.post(
				apiUrl + '/users/login',
				{ username, password },
				{ withCredentials: true} // enables HTTP-only cookies
			);

			console.log('Login successful: ', response.data)
			await checkSession();
			navigate('/');
			return;

		} catch (error: any) {

			console.error('Login failed: ', error);
			if (error.response?.status === 401) {
				console.error('Invalid username or password');
			} else {
				console.log('Epic failure: ', response);
			}
		}
	}

  return (
    <div>
      <h1>Player Login</h1>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
		  value={username}
		  onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
		  value={password}
		  onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>

      <p>
        No account?{' '}
        <Link to="/register">
          Register here
        </Link>
      </p>

	  <p><Link to="/forgotpassword">Forgot password</Link></p>
    </div>
  )
}

export default Login