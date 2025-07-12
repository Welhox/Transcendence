import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const apiUrl = import.meta.env.VITE_API_BASE_URL || "api";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const isValidPassword = (password: string) => {
  const pwdValidationRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
  const lengthOK = password.length >= 8 && password.length <= 42;
  const matchesSpecs = pwdValidationRegex.test(password);
  return lengthOK && matchesSpecs;
};

const ResetPassword: React.FC = () => {
  const query = useQuery();
  const token = query.get("token");
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);
  const [validating, setValidating] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setInvalidToken(true);
        setValidating(false);
        return;
      }
      try {
        await axios.post(`${apiUrl}/users/validate-reset-token`, { token });
        setInvalidToken(false);
      } catch {
        setInvalidToken(true);
      } finally {
        setValidating(false);
      }
    };
    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setInvalidToken(true);
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError(t("resetPassword.fillBothFields"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("resetPassword.passwordsDontMatch"));
      return;
    }

    if (!isValidPassword(newPassword)) {
      setError(t("resetPassword.invalidPassword"));
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${apiUrl}/users/reset-password`,
        { token, newPassword },
        { headers: { "Content-Type": "application/json" } }
      );
      setSuccess(true);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error;
      if (errorMsg === "Invalid or expired token") {
        setInvalidToken(true);
      } else {
        setError(errorMsg || t("resetPassword.failed"));
      }
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <p className="text-center mt-10">{t("resetPassword.validatingToken")}</p>
    );
  }

  if (invalidToken) {
    return (
      <div className="text-center max-w-md mx-auto bg-white dark:bg-black p-6 rounded-lg shadow-md mt-10">
        <h1 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-4">
          {t("resetPassword.invalidOrExpiredToken")}
        </h1>
        <p className="mb-4">{t("resetPassword.requestNew")}</p>
        <button
          onClick={() => navigate("/forgotpassword")}
          className="bg-teal-700 hover:bg-teal-800 text-white font-semibold py-2 px-6 rounded"
        >
          {t("resetPassword.requestNewLink")}
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center max-w-md mx-auto bg-white dark:bg-black p-6 rounded-lg shadow-md mt-10">
        <h1 className="text-3xl font-bold text-teal-800 dark:text-teal-300 mb-6">
          {t("resetPassword.successTitle")}
        </h1>
        <button
          onClick={() => navigate("/login")}
          className="bg-amber-700 hover:bg-amber-800 text-white font-semibold py-2 px-6 rounded"
        >
          {t("resetPassword.goToLogin")}
        </button>
      </div>
    );
  }

  return (
    <div className="text-center max-w-md mx-auto bg-white dark:bg-black p-6 rounded-lg shadow-md mt-10">
      <h1 className="text-3xl font-bold text-teal-800 dark:text-teal-300 mb-6">
        {t("resetPassword.title")}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
            {t("resetPassword.newPasswordLabel")}
          </label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
            {t("resetPassword.confirmPasswordLabel")}
          </label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-700 hover:bg-amber-800 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading
            ? t("resetPassword.submitting")
            : t("resetPassword.submitButton")}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
