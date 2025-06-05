import React, { useState, useEffect, useRef } from "react";
import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'api';

interface FieldProps {
	label: "Email" | "Password"
	type?: "email" | "password";
	value: string;
	onUpdate?: (newValue: string) => void;
}

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
			return "New values don't match.";
		}

		if (type === "password") {
			if (inputValue.length < 8 || inputValue.length > 42) {
				return "Password must be between 8 and 42 characters.";
			}
			const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
			if (!pwdRegex.test(inputValue)) {
				return "Password must be at least 8 characters, including uppercase, lowercase, number and special character.";
			}
		} else if (type === "email") {
			if (inputValue.length > 42) return "Email must be 42 characters of less.";
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(inputValue)) {
				return "Please enter a valid email address.";
			}
		} 

		if (!currentPassword/* || currentPassword.length < 8*/) { // COMMENT BACK IN FOR FINAL PRODUCT!!
			return "Current password required.";
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
			const endpoint = type === "email" ? apiUrl + "/user/email" : apiUrl + "/user/password";
			await axios.put(endpoint, {
				newValue: inputValue.trim(),
				currentPassword: currentPassword.trim(),
			}, { withCredentials: true });

			setSuccess(`${label} updated successfully.`);
			setError(null);
			setIsEditing(false);
			onUpdate?.(inputValue.trim());
		} catch (error: any) {
			setError(error?.response?.data?.message || "Update failed.");
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

  const button_aria_label = "update " + label;

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
                // this is necessary to workaround a known issue in Voiceover, which moves the focus to the full window
                inputRef.current?.focus();
              }, 10);
              setInputValue("");
              setIsEditing(true);
            }}
          >
            Update
          </button>
        </>
      ) : (
        <>
          <br />
          <input
            type={type}
            ref={inputRef}
            value={inputValue}
            placeholder={`New ${label}`}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <br />
          <input
            type={type}
            ref={confirmRef}
            value={confirmInput}
            placeholder={`Confirm ${label}`}
            onChange={(e) => setConfirmInput(e.target.value)}
          />
          <br />
          <input
            type="password"
            ref={currentPasswordRef}
            value={currentPassword}
            placeholder="Current password"
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <div>
            <button
              className={buttonStyles}
              onClick={handleSave}
            >
              Save
            </button>{" "}
            <button className={buttonStyles} onClick={handleCancel}>
              Cancel
            </button>
          </div>
          {error && (
            <div style={{ color: "red", marginTop: "0.5rem" }}>{error}</div>
          )}
          {success && (
            <div className="text-green-600">{success}</div>
          )}
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
