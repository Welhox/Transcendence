import React, { useState } from 'react';

interface SelectorProps {
	value: string;
	onChange: (lang: string) => void;
}

const languages = [
	{ code: "en", flag: "🇬🇧"},
	{ code: "fi", flag: "🇫🇮"},
	{ code: "se", flag: "🇸🇪"},
];

const LanguageSelector: React.FC<SelectorProps> = ({ value, onChange }) => {
	const [isEditing, setIsEditing] = useState(false);

	return (
		<div>
			<strong>Language:</strong>{" "}
			{!isEditing ? (
				<>
					<span style={{ fontSize: "1.5rem", marginLeft: "0.5rem" }}>
						{languages.find((l) => l.code === value)?.flag}
					</span>{" "}
					<button onClick={() => setIsEditing(true)}>Change</button>
				</>
			) : (
				<div>
					<div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
						{languages.map((lang) => (
							<label key={lang.code} style={{ fontSize: "2rem", cursor: "pointer" }}>
								<input
									type="radio"
									name="language"
									value={lang.code}
									checked={value === lang.code}
									onChange={() => onChange(lang.code)}
									style={{ marginRight: "0.5rem" }}
								/>
								{lang.flag}
							</label>
						))}
					</div>
					<div>
						<button onClick={() => setIsEditing(false)}>Save</button>{" "}
						<button onClick={() => setIsEditing(false)}>Cancel</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default LanguageSelector