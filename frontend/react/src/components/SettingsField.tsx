import React, { useState } from "react";

interface FieldProps {
	label: string;
	type?: "text" | "email" | "password";
	value: string;
	onSave: (val: string) => void;
	mask?: boolean; // for password
}

/*
Displays the name of the setting, it's current value next to it (passwords are masked with '*') and
Update button. When button is clicked, input field opens up with save and cancel option.
*/
const SettingsField: React.FC<FieldProps> = ({
	label,
	type = "text",
	value,
	onSave,
	mask = false,
}) => {
	const [isEditing, setIsEditing] = useState(false);
	const [inputValue, setInputValue] = useState(value);
	const [error, setError] = useState<string | null>(null);

	const mocPwd = "password";

	const displayValue = mask ? "*".repeat(mocPwd.length) : value;

	const validateInput = (input: string) => {
		const trimmed = input.trim();
		if (type === "password") {
			if (trimmed.length < 8 || trimmed.length > 42) {
				return "Password must be between 8 and 42 characters.";
			}
			const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
			if (!pwdRegex.test(trimmed)) {
				return "Password must be at least 8 characters, including uppercase, lowercase, number and special character.";
			}
		} else if (type === "email") {
			if (trimmed.length > 42) {
				return "Email must be 42 characters of less.";
			}
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(trimmed)) {
				return "Please enter a valid email address.";
			}
		} else {
			if (trimmed.length > 42) {
				return "Value must be less than 42 characters.";
			}
		}
		return null;
	};

	const handleSave = () => {
		const validationError = validateInput(inputValue);

		if (validationError) {
			setError(validationError);
			return;
		}
		onSave(inputValue.trim());
		setIsEditing(false);
		setInputValue(""); // reset field after save
		setError(null);
	};

	const handleCancel = () => {
		setIsEditing(false);
		setInputValue("");
		setError(null);
	};

	return (
		<div>
			<strong>{label}:</strong>{" "}{displayValue}{" "}
			{!isEditing ? (
				<>
					<button className="px-5 mx-3 my-2 text-white bg-teal-700 hover:bg-teal-800 focus:ring-4 
								  focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full 
								  sm:w-auto py-2.5 text-center dark:bg-teal-600 dark:hover:bg-teal-700
								  dark:focus:ring-teal-800"
						    onClick={() => {
						setInputValue("");
						setIsEditing(true);
					}}>Update</button>
				</>
			) : (
				<>
					<br/>
					<input
						type={type}
						value={inputValue}
						placeholder={`Enter new ${label.toLowerCase()}`}
						onChange={(e) => setInputValue(e.target.value)}
					/>
					<div>
						<button onClick={handleSave} disabled={!inputValue.trim()}>Save</button>{" "}
						<button onClick={handleCancel}>Cancel</button>
					</div>
					{error && <div style={{ color: "red", marginTop: "0.5rem" }}>{error}</div>}
				</>
			)}
		</div>
	);
};

export default SettingsField;