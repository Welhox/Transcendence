import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'
import  axios from 'axios'

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'api';

// tells TypeScript to expect string type values for these attributes
interface SignUpState {
	username: string;
	email: string;
	password: string
}

const Register: React.FC = () => {

	// declares a hook assigning empty values to the object
	const [signupData, setSignupData] = useState<SignUpState> ({
		username: '',
		email: '',
		password: ''
	})

	const [errorMessage, setErrorMsg] = useState<string>(''); // custom error message
	const pwdValidationRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
	const navigate = useNavigate();

	// saves data to the object
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const {name, value} = e.target;
		setSignupData(prevData => ({...prevData, [name]: value}))
		setErrorMsg(''); // clears error when user starts typing
	}

	// handles button click: performs password validation and makes a mock post request to db API
	const handleSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {
		e.preventDefault();

		// if (!signupData.username.trim()) { adds custom error message if form input validation params are disabled
		// 	setErrorMsg('Username is required.');
		// 	return;
		// }

		// if (!signupData.email.trim()) {
		// 	setErrorMsg('Please give valid email address.');
		// 	return;
		// }

		if (!pwdValidationRegex.test(signupData.password)) {
			setErrorMsg('Password must be at least 8 characters, including uppercase, lowercase, number and special character.')
			//alert('Yo password is shiiiittt');
			return;
		}
		try {
			const response = await axios.post(apiUrl + '/users/register', signupData);
			console.log('Response: ', response)
			if (response.status === 200)
			{
				navigate('/profile');
			}
			else
			{
				return;
				//do something
			}

		}catch (error) {
			console.log(error);
			//navigate('/profile');
		}
	}

  return (
    <div>
      <h1>Create an account</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
		  name="username"
          placeholder="Username"
		  onChange={handleChange}
		  value={signupData.username}
		  required
		  maxLength={20}
		  minLength={2}
        />
		<input
          type="email"
		  name="email"
          placeholder="Email"
		  onChange={handleChange}
		  value={signupData.email}
		  required
		  maxLength={42}
        />
        <input
          type="password"
		  name="password"
          placeholder="Password"
		  onChange={handleChange}
		  value={signupData.password}
		  required
		  maxLength={42}
		  minLength={8}
        />

		{errorMessage && (
			<p style={{ color: 'red', marginTop: '8px'}}>{errorMessage}</p>
		)}

        <button type="submit">Register</button>
      </form>

      <p>
        Already have an account? <Link to="/">Login</Link>
      </p>
    </div>
  )
}

export default Register
