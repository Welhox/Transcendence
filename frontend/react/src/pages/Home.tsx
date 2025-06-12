import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { User, AuthContextType } from "../auth/AuthProvider";
import NavigationHeader from "../components/NavigationHeader";
import PongGame from "../components/PongGame";
import PongGameWithRegistration from "../components/PongGameWithRegistration";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import ChoosePlayMode from "../components/ChoosePlayMode";

interface HomeProps {
  status: AuthContextType["status"];
  user: AuthContextType["user"];
}

const Home: React.FC<HomeProps> = ({ status, user }) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (status !== "authorized") {
      i18n.changeLanguage("en");
    }
  }, [status, user]);

  return (
    <div className="text-center max-w-2xl dark:bg-black bg-white mx-auto rounded-lg my-5">
      <div className="flex justify-center">
        <ChoosePlayMode />
        {/* <PongGameWithRegistration /> */}
      </div>
      <h1 className="text-6xl text-center text-teal-800 dark:text-teal-300 m-3">
        {t("home.welcome")}
      </h1>

      {status === "loading" ? (
        <p>{t("home.checkingSession")}</p>
      ) : status === "authorized" && user ? (
        <>
          <p className="dark:text-white pb-10">
            {t("home.hello")}, {user.username}
          </p>
        </>
      ) : (
        <>
          <p className="dark:text-white text-center">{t("home.pleaseLogin")}</p>
          <p className="dark:text-white text-center font-bold p-5">
            {t("home.noAccount")}{" "}
            <Link
              className="text-amber-900 dark:text-amber-300 font:bold hover:font-extrabold"
              to="/register"
            >
              {t("home.register")}
            </Link>
          </p>
        </>
      )}
    </div>
  );
};

export default Home;
