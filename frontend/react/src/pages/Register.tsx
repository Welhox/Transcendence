import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios, { AxiosError } from "axios";

const apiUrl = import.meta.env.VITE_API_BASE_URL || "api";

// tells TypeScript to expect string type values for these attributes
interface SignUpState {
  username: string;
  email: string;
  password: string;
  verifypassword: string;
}

const Register: React.FC = () => {
  // declares a hook assigning empty values to the object
  const [signupData, setSignupData] = useState<SignUpState>({
    username: "",
    email: "",
    password: "",
    verifypassword: "",
  });

  const [errorMessage, setErrorMsg] = useState<string>(""); // custom error message
  const fileInputRef = useRef<HTMLInputElement>(null); // to reset input
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const [liveMessage, setLiveMessage] = useState<string | null>(null); // for screen reader aria announcements
  useEffect(() => {
    if (errorMessage) {
      setLiveMessage(null); // force remount
      setTimeout(() => {
        setLiveMessage(errorMessage);
        // Give React time to render it
        setTimeout(() => {
          liveRegionRef.current?.focus();
        }, 10);
      }, 100); // wait for file input focus shift to complete
    }
  }, [errorMessage]);

  const usernameRegex = /^[a-zA-Z0-9]{2,20}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const pwdValidationRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,42}$/;
  const navigate = useNavigate();

  // saves data to the object
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignupData((prevData) => ({ ...prevData, [name]: value }));
    setErrorMsg(""); // clears error when user starts typing
  };

  // handles button click: performs password validation and makes post request to db API
  const handleSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!usernameRegex.test(signupData.username)) {
      setErrorMsg(
        "Username must contain only letters and numbers and be between 2 and 20 characters long."
      );
      return;
    }

    if (!emailRegex.test(signupData.email)) {
      setErrorMsg("Email must be a valid email address.");
      return;
    }

    if (!pwdValidationRegex.test(signupData.password)) {
      setErrorMsg(
        "Password must be at least 8 and no more than 42 characters, including at least one uppercase, lowercase, number and special character."
      );
      return;
    }

    let confirmed: boolean = signupData.password === signupData.verifypassword;
    if (!confirmed) {
      setErrorMsg("Passwords don't match. Please try again.");
      return;
    }

    try {
      const response = await axios.post(apiUrl + "/users/register", signupData);
      console.log("Response: ", response);
      if (response.status === 200) {
        // const otpResponse = await axios.post(apiUrl + '/auth/send-otp', {
        // 	email: signupData.email
        // 	});
        // 	console.log('OTP Response: ', otpResponse);
        // navigate('/verifyemail', {
        navigate("/", {
          state: {
            email: signupData.email,
          },
        });
      }
      return;
    } catch (error) {
      console.log(error);
      if (axios.isAxiosError(error)) {
        if (error.response && error.response.status === 409) {
          setErrorMsg(error.response.data.error);
        } else {
          setErrorMsg("An error occurred. Please try again.");
        }
      }
    }
  };
  const labelStyles =
    "block mb-2 text-sm font-medium text-gray-900 dark:text-white";
  const inputStyles =
    "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500";
  return (
    <div className="m-5 p-5 text-center max-w-2xl dark:bg-black bg-white mx-auto rounded-lg">
      <h1 className="text-6xl text-center text-teal-800 dark:text-teal-300 pb-5">
        Create an account
      </h1>
      <div>
        <form className="max-w-sm mx-auto" onSubmit={handleSubmit} noValidate>
          <div className="mb-5">
            <label className={labelStyles} htmlFor="username">
              Username:{" "}
            </label>
            <input
              className={inputStyles}
              type="text"
              id="username"
              name="username"
              placeholder="Username"
              onChange={handleChange}
              value={signupData.username}
              required
              maxLength={20} // no longer enforced by browser for accessibility reasons
              minLength={2} // no longer enforced by browser for accessibility reasons
            />
          </div>
          <div className="mb-5">
            <label className={labelStyles} htmlFor="email">
              Email:{" "}
            </label>
            <input
              className={inputStyles}
              type="email"
              id="email"
              name="email"
              placeholder="Email"
              onChange={handleChange}
              value={signupData.email}
              required
              maxLength={42} // no longer enforced by browser for accessibility reasons
            />
          </div>
          <div className="mb-5">
            <label className={labelStyles} htmlFor="password">
              Password:
            </label>
            <input
              className={inputStyles}
              type="password"
              id="password"
              name="password"
              placeholder="Password"
              onChange={handleChange}
              value={signupData.password}
              required
              maxLength={42} // no longer enforced by browser for accessibility reasons
              minLength={8} // no longer enforced by browser for accessibility reasons
            />
          </div>
          <div className="mb-5">
            <label className={labelStyles} htmlFor="verifypassword">
              Confirm Password:
            </label>
            <input
              className={inputStyles}
              type="password"
              id="verifypassword"
              name="verifypassword"
              placeholder="Confirm password"
              onChange={handleChange}
              value={signupData.verifypassword}
              required
              maxLength={42}
              minLength={8}
            />
          </div>

          {errorMessage && (
            <p className="m-5 text-red-600 dark:text-red-500">{errorMessage}</p>
          )}
          {/* This next part is a secret div, visible only to screen readers, which ensures that the error
	  or success messages get announced using aria. */}
          {liveMessage && (
            <div
              ref={liveRegionRef}
              tabIndex={-1}
              aria-live="assertive"
              aria-atomic="true"
              className="sr-only"
            >
              {liveMessage}
            </div>
          )}
          <button
            className="block mx-auto px-20 text-white bg-teal-700 hover:bg-teal-800 focus:ring-4 
								  focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full 
								  sm:w-auto py-2.5 text-center dark:bg-teal-600 dark:hover:bg-teal-700
								  dark:focus:ring-teal-800 hover:font-bold hover:underline hover:text-amber-200"
            type="submit"
          >
            Register
          </button>
        </form>
      </div>

      <p className="m-5 text-center dark:text-white">
        Already have an account?{" "}
        <Link
          className="text-white bg-amber-700 hover:bg-amber-800 
										 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium 
										 rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 mx-3 text-center
										  dark:bg-amber-600 dark:hover:bg-amber-700 dark:focus:ring-amber-800 hover:font-bold hover:underline hover:text-amber-100"
          to="/login"
        >
          Login
        </Link>
      </p>
    </div>
  );
};

export default Register;
