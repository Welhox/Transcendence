import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import PongPals from "./pages/PongPals";
import Settings from "./pages/Settings";
import ForgotPassword from "./pages/ForgotPassword";
import Stats from "./pages/Stats";
import VerifyEmail from "./pages/VerifyEmail";
import showDatabase from "./components/showDatabase";
import NavigationHeader from "./components/NavigationHeader";
import { AuthContextType, User, useAuth } from "./auth/AuthProvider";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Mfa from "./pages/Mfa";
import i18n from "./i18n";

const App: React.FC = () => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL || "/api";

  const logout = async () => {
    try {
      await axios.post(
        apiUrl + "/users/logout",
        {},
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      i18n.changeLanguage("en");
      localStorage.removeItem("language");
      await refreshSession();
    } catch (error) {
      console.error("Error logging out: ", error);
    }
  };
  const { status, user, refreshSession } = useAuth();
  return (
    <>
      <Router>
        <NavigationHeader handleLogout={logout} status={status} user={user} />
        <Routes>
          <Route path="/" element={<Home status={status} user={user} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgotpassword" element={<ForgotPassword />} />
          <Route path="/verifyemail" element={<VerifyEmail />} />
          <Route path="/pongpals" element={<PongPals />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/mfa" element={<Mfa />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route
            path="/stats/:anything"
            element={<Navigate to="/stats" replace />}
          />
        </Routes>
        <div className="flex justify-center my-4">
          <button
            className="border bg-teal-500 font-semibold hover:font-extrabold 
					  hover:underline uppercase text-white p-4 mx-4 rounded-2xl"
            onClick={showDatabase}
          >
            show Database (for dev use only)
          </button>
        </div>
      </Router>
    </>
  );
};

export default App;
