import React, { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import Passcode from "../components/Passcode";
import { useAuth } from "../auth/AuthProvider";
import axios from "axios";

const VerifyEmail: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // This effect will handle the email check and redirects
  useEffect(() => {
    console.log("arrived at verify email");

    // If the user is logged in, redirect
    if (user) {
      navigate("/");
      return;
    }

    // Get email from location state, otherwise set error
    const locationEmail = location.state?.email;
    if (locationEmail) {
      setEmail(locationEmail);
    } else {
      setError("No email provided in state");
      console.log("No email provided in state");
      navigate("/");
    }
  }, [user, location, navigate]);

  // Handle the passcode submission
  const handlePasscode = async (code: string) => {
    console.log("Passcode submitted:", code);

    if (!email) {
      console.log("No email available for verification");
      alert("No email available for verification");
      return;
    }

    try {
      const response = await axios.post("/auth/verify-otp", { code, email });

      if (response.status === 200) {
        console.log("Passcode verified");
        alert("Passcode verified");
        navigate("/");
      } else {
        alert("Passcode not verified");
        console.log("Passcode not verified");
      }
    } catch (error) {
      console.log("Error verifying passcode:", error);
      alert("Error verifying passcode");
    }
  };

  // Show error and redirect if no email is found
  if (error) {
    alert(error); // Optionally show an alert before redirecting
    return <Navigate to="/" replace />;
  }

  // Return the main UI only when the email is found and no errors exist
  return (
    <div>
      <h1>Verify Your Email Address</h1>
      <Passcode onSubmit={handlePasscode} />
    </div>
  );
};

export default VerifyEmail;
