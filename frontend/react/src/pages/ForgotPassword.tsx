import React, { useState } from "react";
import axios from "axios";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useTranslation } from "react-i18next";

const apiUrl = import.meta.env.VITE_API_BASE_URL || "api";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { status } = useAuth();
  const { t } = useTranslation();

  if (status === "loading") return <p>Loading...</p>;
  if (status === "unauthorized") return <Navigate to="/" replace />;

  const handleReturn = () => {
    navigate("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      //await axios.post(apiUrl + '/users/forgot-pwd', { email });
      setSubmitted(true);
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    }
  };

  return (
    <div>
      <h1>{t("forgotPassword.title")}</h1>

      {submitted ? (
        <>
          <p>{t("forgotPassword.successMessage")}</p>
          <button onClick={handleReturn}>
            {t("forgotPassword.returnButton")}
          </button>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">{t("forgotPassword.emailLabel")}</label>
          <input
            type="email"
            id="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit">{t("forgotPassword.submitButton")}</button>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;
