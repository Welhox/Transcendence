import React from 'react';
import { Link } from 'react-router-dom'

const Login: React.FC = () => {
  return (
    <div>
      <h1>Player Login</h1>
      <form>
        <input
          type="text"
          placeholder="Username"
        />
        <input
          type="password"
          placeholder="Password"
        />
        <button
          type="submit"
        >
          Login
        </button>
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