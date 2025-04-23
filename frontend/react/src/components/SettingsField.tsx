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

	const displayValue = mask ? "*".repeat(value.length) : value;

	const handleSave = () => {
		if (inputValue.trim()) {
			onSave(inputValue);
		}
		setIsEditing(false);
		setInputValue(""); // reset field after save
	};

	const handleCancel = () => {
		setIsEditing(false);
		setInputValue("");
	};

	return (
		<div>
			<strong>{label}:</strong>{" "}{displayValue}{" "}
			{!isEditing ? (
				<>
					<button onClick={() => {
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
				</>
			)}
		</div>
	);
};

export default SettingsField;