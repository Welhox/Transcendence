import React, { useState, useEffect } from 'react';

interface SelectorProps {
	value: string;
	onChange: (lang: string) => void;
}

const languages = [
	{ code: "en", flag: "🇬🇧"},
	{ code: "fi", flag: "🇫🇮"},
	{ code: "se", flag: "🇸🇪"},
];

/*
Displays three radio buttons for language options displaying the current setting selected by default.
Detects changes if user selects a new language and offers a save button if previously saved language
has changed.
*/
const LanguageSelector: React.FC<SelectorProps> = ({ value, onChange }) => {
	const [selectedLang, setSelectedLang] = useState(value);

	useEffect(() => {
		setSelectedLang(value);
	}, [value]);

	const handleSave = () => {
		if (selectedLang !== value) {
			onChange(selectedLang);
		}
	};

	const hasChanges = selectedLang !== value;

	return (
		<div className="block">
			<strong>Language:</strong>{" "}
			<div className="flex flex-row justify-center items-center">
				<div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
					{languages.map((lang) => (
						<label key={lang.code} style={{ fontSize: "2rem", cursor: "pointer" }}>
							<input
								type="radio"
								name="language"
								value={lang.code}
								checked={selectedLang === lang.code}
								onChange={() => setSelectedLang(lang.code)}
								style={{ marginRight: "0.5rem" }}
							/>
							{lang.flag}
						</label>
					))}
				</div>
				{hasChanges && (
					<div>
						<button onClick={handleSave}>Save</button>
					</div>
				)}
			</div>
		</div>
	);
};

export default LanguageSelector;