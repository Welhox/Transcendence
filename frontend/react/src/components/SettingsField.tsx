import React, { useState } from "react";

interface FieldProps {
	label: string;
	type?: "text" | "email" | "password";
	value: string;
	onSave: (val: string) => void;
	mask?: boolean; // for password
}

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
		onSave(inputValue);
		setIsEditing(false);
	};

	return (
		<div>
			<strong>{label}:</strong>{" "}
			{!isEditing ? (
				<>
					<span style={{ marginLeft: "0.5rem" }}>{displayValue}</span>{" "}
					<button onClick={() => {
						setInputValue(value);
						setIsEditing(true);
					}}>Change</button>
				</>
			) : (
				<div>
					<input
						type={type}
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
					/>
					<div>
						<button onClick={handleSave}>Save</button>{" "}
						<button onClick={() => setIsEditing(false)}>Cancel</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default SettingsField;