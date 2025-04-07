import React, { useState } from 'react';
import { Link } from 'react-router-dom'
import  axios from 'axios'

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

	const pwdValidationRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

	// saves data to the object
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const {name, value} = e.target;
		setSignupData(prevData => ({...prevData, [name]: value}))
	}

	// handles button click: performs password validation and makes a mock post request to db API
	const handleSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!pwdValidationRegex.test(signupData.password)) {
			alert('Yo password is shiiiittt');
			return;
		}
		try {
			const response = await axios.post('http://localhost:8080/userapi/signup/this-path-should-be-protected', signupData);
			console.log(response);
		}catch (error) {
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
        />
		<input
          type="email"
		  name="email"
          placeholder="Email"
		  onChange={handleChange}
		  value={signupData.email}
		  required
		  maxLength={40}
        />
        <input
          type="password"
		  name="password"
          placeholder="Password"
		  onChange={handleChange}
		  value={signupData.password}
		  required
		  maxLength={16}
        />
        <button
          type="submit"
        >
          Register
        </button>
      </form>

      <p>
        Already have an account?{' '}
        <Link to="/">
          Login
        </Link>
      </p>
    </div>
  )
}

export default Register
