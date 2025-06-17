import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface StatsHeaderProps {
  username: string;
  from?: string;
}

const StatsHeader: React.FC<StatsHeaderProps> = ({ username, from }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-6xl text-center text-teal-800 dark:text-teal-300 m-5 p-5">
        {t("stats.title", { username })}
      </h1>
      <p className="text-center">
        <button
          className="block mx-auto px-20 text-white bg-teal-700 hover:bg-teal-800 focus:ring-4 
								  focus:outline-none focus:ring-blue-300 font-semibold rounded-lg text-sm w-full 
								  sm:w-auto py-2.5 text-center dark:bg-teal-600 dark:hover:bg-teal-700
								  dark:focus:ring-teal-800"
          onClick={() => navigate(from || "/")}
        >
          {t("statsHeader.back")}
        </button>
      </p>
    </div>
  );
};

export default StatsHeader;
