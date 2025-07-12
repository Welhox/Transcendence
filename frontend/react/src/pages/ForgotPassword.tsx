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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { status } = useAuth();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  if (status === "loading") return <p>Loading...</p>;
  //if (status === 'unauthorized') return <Navigate to="/" replace />;

  const handleReturn = () => {
    navigate("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await axios.post(
        `${apiUrl}/users/request-password-reset`,
        { email },
        {
          headers: { "Content-Type": "application/json" },
          //withCredentials: true,
        }
      );

      setSubmitted(true);
    } catch (error: any) {
      setError(
        error.response?.data?.message || t("forgotPassword.genericError")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-center max-w-md mx-auto bg-white dark:bg-black p-6 rounded-lg shadow-md mt-10">
      <h1 className="text-3xl font-bold text-teal-800 dark:text-teal-300 mb-6">
        {t("forgotPassword.title")}
      </h1>

      {submitted ? (
        <>
          <p className="text-green-600 dark:text-green-400 mb-4">
            {t("forgotPassword.successMessage")}
          </p>
          <button
            onClick={handleReturn}
            className="bg-amber-700 hover:bg-amber-800 text-white font-semibold py-2 px-6 rounded"
          >
            {t("forgotPassword.returnButton")}
          </button>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-white mb-1"
            >
              {t("forgotPassword.emailLabel")}
            </label>
            <input
              type="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-amber-700 hover:bg-amber-800 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {isLoading
              ? t("forgotPassword.submitting")
              : t("forgotPassword.submitButton")}
          </button>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;
