import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'

const App: React.FC = () => {
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