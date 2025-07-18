import React, { useState, useEffect, useRef } from "react";
import api from "../api/axios";
import { useTranslation } from "react-i18next";

interface FieldProps {
  label: string;
  type?: string;
  value: string;
  onUpdate?: (newValue: string) => void;
}
const inputStyles =
  "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 m-1 w-xs dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500";

const buttonStyles =
  "px-5 mx-3 my-2 text-white bg-teal-700 hover:bg-teal-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-semibold rounded-lg text-sm w-full sm:w-auto py-2.5 text-center dark:bg-teal-600 dark:hover:bg-teal-700 dark:focus:ring-teal-800";
/*
Displays the name of the setting, it's current value next to it (passwords are masked with '*') and
Update button. When button is clicked, input field opens up with save and cancel option.
*/
const SettingsField: React.FC<FieldProps> = ({
  label,
  type = "text",
  value,
  onUpdate,
}) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [confirmInput, setConfirmInput] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const currentPasswordRef = useRef<HTMLInputElement>(null);
  const [liveMessage, setLiveMessage] = useState<string | null>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null); // for screen reader aria announcements

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (error) {
      setLiveMessage(null); // force remount
      setTimeout(() => {
        setLiveMessage(error);
        // Give React time to render it
        setTimeout(() => {
          liveRegionRef.current?.focus();
        }, 10);
      }, 100); // wait for file input focus shift to complete
    }
  }, [error]);

  const validateInput = () => {
    if (inputValue.trim() !== confirmInput.trim()) {
      return t("settings.valuesMismatch");
    }

    if (type === "password") {
      if (inputValue.length < 8 || inputValue.length > 42) {
        return t("settings.passwordErrorLength");
      }
      const pwdRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
      if (!pwdRegex.test(inputValue)) {
        return t("settings.passwordErrorFormat");
      }
    } else if (type === "email") {
      if (inputValue.length > 42) return t("settings.emailErrorLength");
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(inputValue)) {
        return t("settings.emailErrorFormat");
      }
    }

    if (!currentPassword /* || currentPassword.length < 8*/) {
      // COMMENT BACK IN FOR FINAL PRODUCT!!
      return t("settings.currentPasswordRequired");
    }

    return null;
  };

  const handleSave = async () => {
    const validationError = validateInput();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const endpoint = type === "email" ? "/user/email" : "/user/password";
      await api.put(endpoint, {
        newValue: inputValue.trim(),
        currentPassword: currentPassword.trim(),
      });

      setSuccess(t("settings.updateSuccess", { label }));
	  setConfirmInput("");
	  setCurrentPassword("");
      setError(null);
      setIsEditing(false);
      onUpdate?.(inputValue.trim());
    } catch (error: any) {
      setError(error?.response?.data?.message || t("settings.updateFailed"));
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setInputValue("");
    setConfirmInput("");
    setCurrentPassword("");
    setError(null);
    setSuccess(null);
  };

  const button_aria_label = t("settings.updateButton") + " " + label;

  return (
    <div>
      <label className="font-bold" htmlFor={label + "btn"}>
        {label}:
      </label>{" "}
      {value}{" "}
      {!isEditing ? (
        <>
          <button
            className={buttonStyles}
            id={label + "btn"}
            aria-label={button_aria_label}
            onClick={() => {
              setTimeout(() => {
                inputRef.current?.focus();
              }, 10);
              setInputValue("");
              setIsEditing(true);
            }}
          >
            {t("settings.updateButton")}
          </button>
        </>
      ) : (
        <>
          <div className="flex flex-col justify-center items-center">
            <input
              type={type}
              className={inputStyles}
              ref={inputRef}
              value={inputValue}
              placeholder={t("settings.newLabel", { label })}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <input
              type={type}
              className={inputStyles}
              ref={confirmRef}
              value={confirmInput}
              placeholder={t("settings.confirmLabel", { label })}
              onChange={(e) => setConfirmInput(e.target.value)}
            />
            <input
              type="password"
              className={inputStyles}
              ref={currentPasswordRef}
              value={currentPassword}
              placeholder={t("settings.currentPassword")}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div>
            <button className={buttonStyles} onClick={handleSave}>
              {t("settings.save")}
            </button>{" "}
            <button className={buttonStyles} onClick={handleCancel}>
              {t("settings.cancel")}
            </button>
          </div>
          {error && (
            <div style={{ color: "red", marginTop: "0.5rem" }}>{error}</div>
          )}
          {success && <div className="text-green-600">{success}</div>}
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
        </>
      )}
    </div>
  );
};

export default SettingsField;
