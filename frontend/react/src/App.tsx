import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from './auth/ProtectedRoute';
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
        <button onClick={showDatabase}>show Database (for dev use only)</button>
		<AuthProvider>
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/register" element={<Register />} />
				<Route path="/login" element={<Login />} />
				<Route path="/forgotpassword" element={<ForgotPassword />} />
				<Route path="/verifyemail" element={<VerifyEmail />} />
				<Route path="/pongpals"
					element={
						<ProtectedRoute>
							<PongPals />
						</ProtectedRoute>
					}
				/>
				<Route path="/settings"
					element={
						<ProtectedRoute>
							<Settings />
						</ProtectedRoute>
					}
				/>
				<Route path="/stats"
					element={
						<ProtectedRoute>
							<Stats />
						</ProtectedRoute>
					}
				/>
			</Routes>
		</AuthProvider>
    </Router>
  )
}

export default App