import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Login: React.FC = () => {
	const [username, setUsername] = useState(''); // (*)
	const [password, setPassword] = useState(''); // (**)
	const navigate = useNavigate();

	// sends post request to server for credential validation
	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		try {
			const response = await axios.post('http://localhost:8080/api/login/this-also-needs-to-be-protected', {
				username,
				password,
			});
			// insert if-else to check for response
			navigate('/profile');
		} catch (error) {
			// add error handling
			navigate('/profile');
		}
	}

  return (
    <div>
      <h1>Player Login</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
		  value={username}
		  onChange={(e) => setUsername(e.target.value)} // updates username state (*)
        />
        <input
          type="password"
          placeholder="Password"
		  value={password}
		  onChange={(e) => setPassword(e.target.value)} // updates password state (**)
        />
        <button type="submit">Login</button>
      </form>

      <p>
        No account?{' '}
        <Link to="/register">
          Register here
        </Link>
      </p>
    </div>
  )
}

export default Login