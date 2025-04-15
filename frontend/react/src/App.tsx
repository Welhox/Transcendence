import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import showDatabase from './components/showDatabase'
const apiUrl = import.meta.env.VITE_API_BASE_URL || 'api';


const App: React.FC = () => {
  fetch(apiUrl + '/app/data')
  .then(response => response.json())
  .then(data => {
    console.log(data); // actual response data
  })
  .catch(error => {
    console.error('Error fetching:', error);
  });

  return (
    <Router>
        <button onClick={showDatabase}>show Database</button>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} /> {'./pages/Register.tsx'}
        <Route path="/profile" element={<Profile />} /> {'./pages/Profile.tsx'}
      </Routes>
    </Router>
  )
}

export default App