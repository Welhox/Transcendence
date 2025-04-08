import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'

const App: React.FC = () => {
  fetch('http://localhost:3000/app/data')
  .then(response => response.json())
  .then(data => {
    console.log(data); // actual response data
  })
  .catch(error => {
    console.error('Error fetching:', error);
  });

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
		<Route path="/register" element={<Register />} /> {'./pages/Register.tsx'}
		<Route path="/profile" element={<Profile />} /> {'./pages/Profile.tsx'}
      </Routes>
    </Router>
  )
}

export default App