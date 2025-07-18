import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/AuthProvider";
import { isAxiosError } from "axios";
import i18n from "../i18n";

interface PlayerBoxProps {
  label: string;
  onRegister: (player: {
    username: string;
    isGuest: boolean;
    userId: number | null;
  }) => void;
}

const PlayerRegistrationBox: React.FC<PlayerBoxProps> = ({
  label,
  onRegister,
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const { t } = useTranslation();
  const { user, refreshSession } = useAuth();
  const [confirmMFA, setConfirmMFA] = useState(false);
  const [confirmPlayer2MFA, setConfirmPlayer2MFA] = useState(false);

  const handleMfaPlayer2Submit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setError("");

    try {
      console.log("Trying with code:", code, "Email", email);
      const response = await api.post(
        "/auth/verify-tournamentOtp",
        { code, email },
        { headers: { "Content-Type": "application/json" } }
      );
      if (response.status === 200) {
        console.log("MFA verification successful");
        await refreshSession();
        setConfirmPlayer2MFA(false);
        onRegister({ username, isGuest: false, userId: response?.data.id });
      }
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        if (error.response.status === 401) {
          setError(t("mfa.invalidOtp"));
        } else if (error.response.status === 403) {
          setError(t("mfa.otpExpired"));
        } else {
          setError(t("mfa.invalidOtp"));
        }
      } else {
        setError(t("mfa.generalError"));
      }
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      const response = await api.post(
        "/auth/verify-otp",
        { code },
        { headers: { "Content-Type": "application/json" } }
      );
      if (response.status === 200) {
        console.log("MFA verification successful");
        await refreshSession();
      }
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        if (error.response.status === 401) {
          setError(t("mfa.invalidOtp"));
        } else if (error.response.status === 403) {
          setError(t("mfa.otpExpired"));
        } else {
          setError(t("mfa.invalidOtp"));
        }
      } else {
        setError(t("mfa.generalError"));
      }
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) {
      setError(t("playerBox.usernameRequired"));
      return;
    }
    if (user && username === user.username && password) {
      setError("You're already logged in with this username.");
      return;
    }
    if (!password) {
      // Guest registration: allow any alias, no backend check
      onRegister({ username, isGuest: true, userId: null });
    } else {
      // Registered user login
      let response;
      let player2Response;
      try {
        if (!user) {
          response = await api.post(
            "/users/login",
            { username, password },
            {
              headers: { "Content-Type": "application/json" },
            }
          );

          const data = response.data;
          const userLang = response.data.language ?? "en";
          console.log("USERID IN MAIN USER LOGIN:", response.data.id);

          // Change language immediately
          if (i18n.language !== userLang) {
            await i18n.changeLanguage(userLang);
            localStorage.setItem("language", userLang);
          }
          if (data.mfaRequired) {
            //setEmail(data.email);
            setConfirmMFA(true);
            return;
          }
          await refreshSession();
        } else {
          console.log("Implement custom two player login API here");
          player2Response = await api.post("/users/player-2-login", {
            username,
            password,
          });
          console.log("USERID IN 2PLAYER:", player2Response.data.id);
          if (player2Response.data.mfaRequired) {
            console.log(player2Response);
            setEmail(player2Response.data.email);
            setConfirmPlayer2MFA(true);
            return;
          }
          onRegister({
            username,
            isGuest: false,
            userId: player2Response?.data.id,
          });
        }
        onRegister({ username, isGuest: false, userId: response?.data.id });
      } catch {
        setError(t("playerBox.loginFailed"));
      }
    }
  };

  if (confirmMFA === true) {
    return (
      <form
        onSubmit={handleMfaSubmit}
        className="flex flex-col items-center w-full bg-white dark:bg-black dark:text-teal-200"
      >
        <label className="mb-2 font-bold">{t("mfa.heading")}</label>
        <input
          className="mb-2 p-2 border rounded w-48"
          type="password"
          placeholder={t("mfa.otpLabel")}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button
          className="bg-teal-700 text-white px-4 py-2 rounded"
          type="submit"
        >
          {t("playerBox.continue")}
        </button>
        {error && <div className="text-red-500 mt-2">{error}</div>}
      </form>
    );
  } else if (confirmPlayer2MFA === true) {
    return (
      <form
        onSubmit={handleMfaPlayer2Submit}
        className="flex flex-col items-center w-full bg-white dark:bg-black dark:text-teal-200"
      >
        <label className="mb-2 font-bold">{t("mfa.heading")}</label>
        <input
          className="mb-2 p-2 border rounded w-48"
          type="password"
          placeholder={t("mfa.otpLabel")}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button
          className="bg-teal-700 text-white px-4 py-2 rounded"
          type="submit"
        >
          {t("playerBox.continue")}
        </button>
        {error && <div className="text-red-500 mt-2">{error}</div>}
      </form>
    );
  } else {
    return (
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center w-full bg-white dark:bg-black dark:text-teal-200"
      >
        <label className="mb-2 font-bold">{label}</label>
        <input
          className="mb-2 p-2 border rounded w-48"
          placeholder={t("playerBox.usernamePlaceholder")}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
		  maxLength={20}
        />
        <input
          className="mb-2 p-2 border rounded w-48"
          type="password"
          placeholder={t("playerBox.passwordPlaceholder")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
		  maxLength={42}
        />
        <button
          className="bg-teal-700 text-white px-4 py-2 rounded"
          type="submit"
        >
          {t("playerBox.continue")}
        </button>
        <span className="text-xs mt-1 text-gray-500">
          {t("playerBox.guestHint")}
        </span>
        {error && <div className="text-red-500 mt-2">{error}</div>}
      </form>
    );
  }
};

export default PlayerRegistrationBox;
