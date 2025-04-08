import React from 'react';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
	const navigate = useNavigate();
	
	// takes you back to home page when button is clicked
	const handleLogout = () => {
		// clear up resources if needed
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