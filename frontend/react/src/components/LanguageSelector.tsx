import React, { useState, useEffect } from "react";
import i18n from "../i18n";
import { useTranslation } from "react-i18next";

interface SelectorProps {
  value: string;
  onChange: (lang: string) => void;
}

const languages = [
  { code: "en", flag: "🇬🇧" },
  { code: "fi", flag: "🇫🇮" },
  { code: "se", flag: "🇸🇪" },
];

const buttonStyles =
  "px-5 mx-3 my-2 text-white bg-teal-700 hover:bg-teal-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-semibold rounded-lg text-sm w-full sm:w-auto py-2.5 text-center dark:bg-teal-600 dark:hover:bg-teal-700 dark:focus:ring-teal-800";

/*
Displays three radio buttons for language options displaying the current setting selected by default.
Detects changes if user selects a new language and offers a save button if previously saved language
has changed.
*/
const LanguageSelector: React.FC<SelectorProps> = ({ value, onChange }) => {
  const [selectedLang, setSelectedLang] = useState(value);
  const { t } = useTranslation();

  useEffect(() => {
    setSelectedLang(value);
  }, [value]);

  const handleSave = () => {
    if (selectedLang !== value) {
      i18n.changeLanguage(selectedLang);
      localStorage.setItem("language", selectedLang);
      onChange(selectedLang);
    }
  };

  const hasChanges = selectedLang !== value;

  return (
    <div className="block">
      <strong>{t("settings.language")}:</strong>{" "}
      <div className="flex flex-row justify-center items-center">
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {languages.map((lang) => (
            <label
              key={lang.code}
              style={{ fontSize: "2rem", cursor: "pointer" }}
            >
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
            <button className={buttonStyles} onClick={handleSave}>
              {t("settings.save")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LanguageSelector;
