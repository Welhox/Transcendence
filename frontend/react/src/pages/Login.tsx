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
		let response
		try {
			response = await axios.post('http://localhost:3000/users/login', {
				username,
				password,
			});
			console.log('Response: ', response)
			if (response.status === 200)
				{
					navigate('/profile');
					return;
				}
				else
				{
					console.log('why not here?')
					return;
					//do something
				}
			} catch (error) {
				console.log('Response: ', response)
				console.log('try failed')
			// add error handling
			// navigate('/profile');
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