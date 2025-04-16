import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const Profile: React.FC = () => {
	const navigate = useNavigate();
	const { logout } = useAuth();
	
	const handleLogout = () => {
		logout();
		navigate('/');
	}

  return (
    <div>
      <h1>Welcome to user profile!</h1>
	  <form>
        <button
          type="button"
		  onClick={handleLogout}
        >
          Logout
        </button>
      </form>
    </div>
  )
}

export default Profile