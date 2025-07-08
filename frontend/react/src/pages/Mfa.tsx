import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from '../api/axios';
import { isAxiosError } from "axios";
import { useAuth } from "../auth/AuthProvider";
import { useTranslation } from "react-i18next";
import i18n from "../i18n"; // make sure this is imported

const Mfa: React.FC = () => {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { status, refreshSession } = useAuth();
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const [liveMessage, setLiveMessage] = useState<string | null>(null); // for screen reader aria announcements
  const { t } = useTranslation();

  useEffect(() => {
        if (status === "authorized"){
          setSuccess("Login successful, redirecting to main page");
          setTimeout(() => {
          navigate("/");
        }, 3000);
    }
  }, [navigate, status]);

  // This is a workaround for an issue with voiceover moving focus to the wrong place
  // (to the entire website window) after exiting a native file upload dialog.
  useEffect(() => {
    if (error || success) {
      setLiveMessage(null); // force remount
      setTimeout(() => {
        setLiveMessage(success ? success : error);
        setTimeout(() => {
          liveRegionRef.current?.focus();
        }, 10);
      }, 100);
    }
  }, [error, success]);

  if (status === "loading") return <p>{t("mfa.loading")}</p>;

  // sends post request to server for credential validation
  const handleMfaSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await api.post("/auth/verify-otp",
        { code },
        { headers: { "Content-Type": "application/json" } },
      );
      if (response.status === 200) {
        await refreshSession();
        setSuccess("Login successful, redirecting to main page");

        //navigate("/");
      }
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        if (error.response.status === 401) {
        setError(t("mfa.invalidOtp"));
        } else if (error.response.status === 403) {
        setError(t("mfa.otpExpired"));
        } else {
        setError(t("mfa.invalidOtp"));
        }
      } else {
        setError(t("mfa.generalError"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await api.get("/auth/otp-wait-time");
      const waitTime = response.data.secondsLeft;

      if (waitTime > 0) {
        setError(t("mfa.waitTime", { count: waitTime }));
      } else {
        await api.post("/auth/resend-otp",
          {},
        );
        setError(t("mfa.otpResent"));
      }
    } catch (error) {
      console.error("Error resending OTP:", error);
      setError(t("mfa.resendError"));
    } finally {
      setIsLoading(false);
    }
  };
  const inputStyles =
    "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 m-1 w-xs dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500";

  const buttonStyles = `my-2 text-white bg-teal-700 hover:bg-teal-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-semibold rounded-lg text-sm w-xs sm:w-auto py-2.5 text-center dark:bg-teal-600 dark:hover:bg-teal-700 dark:focus:ring-teal-800 ${
    isLoading ? "opacity-50 cursor-not-allowed" : ""
  }`;

  return (
    <div className="flex flex-col items-center justify-center my-5 max-w-2xl bg-white text-center dark:bg-black mx-auto rounded-lg">
      <h1 className="text-6xl m-4 text-teal-800 dark:text-teal-300">
        {t("mfa.heading")}
      </h1>
      <form
        onSubmit={handleMfaSubmit}
        className="flex flex-col bg-white dark:bg-gray-800 p-6 mb-10 rounded shadow-md w-full max-w-sm"
      >
        <div className="mb-4 text-center font-semibold">
          <label
            htmlFor="code"
            className="text-md text-center text-teal-800 dark:text-teal-300 m-3"
          >
            {t("mfa.otpLabel")}
          </label>
          <input
            type="text"
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mt-1 w-full border text-black dark:text-white border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        {/* This next part is a secret div, visible only to screen readers, which ensures that the error
	  or success messages get announced using aria. */}
        {liveMessage && (
          <div
            ref={liveRegionRef}
            tabIndex={-1}
            aria-live="assertive"
            aria-atomic="true"
            className="sr-only"
          >
            {liveMessage}
          </div>
        )}
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {success && <p className="text-green-500 text-sm mb-4">{success}</p>}
        <button type="submit" className={buttonStyles} disabled={isLoading}>
          {isLoading ? t("mfa.verifying") : t("mfa.verify")}
        </button>
        <button
          onClick={handleResendOtp}
          type="submit"
          className={buttonStyles}
          disabled={isLoading}
        >
          {t("mfa.resend")}
        </button>
      </form>
    </div>
  );
};

export default Mfa;
