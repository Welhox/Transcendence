import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'
import  axios from 'axios'

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'api';

// tells TypeScript to expect string type values for these attributes
interface SignUpState {
	username: string;
	email: string;
	password: string;
	verifypassword: string;
}

const Register: React.FC = () => {

	// declares a hook assigning empty values to the object
	const [signupData, setSignupData] = useState<SignUpState> ({
		username: '',
		email: '',
		password: '',
		verifypassword: ''
	})

	const [errorMessage, setErrorMsg] = useState<string>(''); // custom error message
	const usernameRegex = /^[a-zA-Z0-9]+$/;
	const pwdValidationRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
	const navigate = useNavigate();

	// saves data to the object
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const {name, value} = e.target;
		setSignupData(prevData => ({...prevData, [name]: value}))
		setErrorMsg(''); // clears error when user starts typing
	}

	// handles button click: performs password validation and makes post request to db API
	const handleSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!usernameRegex.test(signupData.username)) {
			setErrorMsg('Username must contain only letters and numbers.');
			return;
		}

		if (!pwdValidationRegex.test(signupData.password)) {
			setErrorMsg('Password must be at least 8 characters, including uppercase, lowercase, number and special character.');
			return;
		}

		let confirmed: boolean = signupData.password === signupData.verifypassword;
		if (!confirmed) {
			setErrorMsg('Passwords don\'t match. Please try again.');
			return ;
		}

		try {

			const response = await axios.post(apiUrl + '/users/register', signupData);
			console.log('Response: ', response);
			if (response.status === 200) {
			// const otpResponse = await axios.post(apiUrl + '/auth/send-otp', {
			// 	email: signupData.email
			// 	});
			// 	console.log('OTP Response: ', otpResponse);	
				// navigate('/verifyemail', {
				navigate('/', {
					state: {
						email: signupData.email
					}
				});
			}
			return;

		} catch (error) {
			console.log(error);
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
				<input
					type="password"
					name="verifypassword"
					placeholder="Confirm password"
					onChange={handleChange}
					value={signupData.verifypassword}
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
				Already have an account? <Link to="/login">Login</Link>
			</p>
		</div>
	)
}

export default Register
