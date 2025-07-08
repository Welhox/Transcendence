import api from '../api/axios';
import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  otp: string;
  setOtp: (otp: string) => void;
  setIs2FAEnabled: (isEnabled: boolean) => void;
  setShowOtpField: (show: boolean) => void;
}

const ConfirmOtpField: React.FC<Props> = ({
  otp,
  setOtp,
  setIs2FAEnabled,
  setShowOtpField,
}) => {
  const [message, setMessage] = useState<string>("");
  const [isError, setIsError] = useState<boolean>(true);
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const [liveMessage, setLiveMessage] = useState<string | null>(null); // for screen reader aria announcements
  
  const { t } = useTranslation();
  useEffect(() => {
    if (message) {
      setLiveMessage(null); // force remount
      setTimeout(() => {
        setLiveMessage(message);
        // Give React time to render it
        setTimeout(() => {
          liveRegionRef.current?.focus();
        }, 10);
      }, 100); // wait for file input focus shift to complete
    }
  }, [message]);

  const handleSubmit = async () => {
    if (otp.length !== 6) {
      setIsError(true);
      setMessage(t("confirmOtp.invalid_otp_format"));
      return;
    }
    try {
      // send request to backend to verify OTP
      console.log("Verifying OTP:", otp);
      const response = await api.post("/auth/otp/verify",
        { code: otp },
      );
      if (response.status === 200) {
        // OTP verified successfully, enable 2FA
        setIs2FAEnabled(true);
        setOtp("");
        api.post("/users/emailActivation",
          { emailVerified: true },
        );
        api.post(
          "/auth/mfa",
          { mfaInUse: true },
        );
        setIsError(false);
        setMessage(t("confirmOtp.email_verified_success"));
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for 2 seconds
        setMessage(""); // Clear the message after 5 seconds
        setShowOtpField(false);
        console.log("OTP verified and 2FA enabled!");
      } else {
        setIsError(true);
        setMessage(t("confirmOtp.otp_invalid"));
      }
    } catch (message) {
      setIsError(true);
      setMessage(t("confirmOtp.otp_invalid"));
      // console.error('error verifying OTP:', error);
    }
  };
  const inputStyles =
    "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 m-1 w-xs dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500";

  const buttonStyles =
    "px-5 mx-3 my-2 text-white bg-teal-700 hover:bg-teal-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-semibold rounded-lg text-sm w-full sm:w-auto py-2.5 text-center dark:bg-teal-600 dark:hover:bg-teal-700 dark:focus:ring-teal-800";

  return (
    <>
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
    <div className="mt-4 flex flex-col justify-center items-center">
      <input
        type="text"
        inputMode="numeric"
        pattern="\d{6}"
        maxLength={6}
        aria-label="Enter your 6-digit One time password"
        placeholder={t("confirmOtp.otp_placeholder")}
        value={otp}
        onChange={(e) => {
          setOtp(e.target.value.replace(/\D/g, "")); // Allow only digits
          if (e.target.value.length > 6) {
            setOtp(e.target.value.slice(0, 6)); // Limit to 6 digits
          }
        }}
        className={inputStyles}
      />

      {message && (
        <p className={isError ? "text-red-500 mt-2" : "text-green-500 mt-2"}>
          {message}
        </p>
      )}
      <button className={buttonStyles} onClick={handleSubmit}>
        {t("confirmOtp.confirm")}
      </button>
    </div></>
  );
};
export default ConfirmOtpField;
