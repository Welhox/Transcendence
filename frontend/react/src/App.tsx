import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import PongPals from './pages/PongPals';
import Settings from './pages/Settings';
import ForgotPassword from './pages/ForgotPassword';
import Stats from './pages/Stats';
import VerifyEmail from './pages/VerifyEmail';
import showDatabase from './components/showDatabase';

const App: React.FC = () => {

  return (
    <Router>
        
		<Routes>
			<Route path="/" element={<Home />} />
			<Route path="/register" element={<Register />} />
			<Route path="/login" element={<Login />} />
			<Route path="/forgotpassword" element={<ForgotPassword />} />
			<Route path="/verifyemail" element={<VerifyEmail />} />
			<Route path="/pongpals" element={<PongPals />} />
			<Route path="/settings" element={<Settings />} />
			<Route path="/stats/:userId" element={<Stats />} />
		</Routes>
		<div className="flex justify-center my-4"><button className="border bg-teal-500 font-semibold hover:font-extrabold 
					  hover:underline uppercase text-white p-4 mx-4 rounded-2xl" 
					  onClick={showDatabase}>show Database (for dev use only)</button></div>
    </Router>
  )
}

export default App