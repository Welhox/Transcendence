import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from './auth/ProtectedRoute';
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import showDatabase from './components/showDatabase'
const apiUrl = import.meta.env.VITE_API_BASE_URL || 'api';


const App: React.FC = () => {
  fetch(apiUrl + '/app/data') // test for backend connection
  .then(response => response.json())
  .then(data => {
    console.log(data);
  })
  .catch(error => {
    console.error('Error fetching:', error);
  });

  return (
    <Router>
        <button onClick={showDatabase}>show Database</button>
		<AuthProvider>
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/register" element={<Register />} />
				<Route path="/login" element={<Login />} />
				{/* <Route path="/profile"
					element={
						<ProtectedRoute>
							<Profile />
						</ProtectedRoute>
					}
				/> */}
			</Routes>
		</AuthProvider>
    </Router>
  )
}

export default App