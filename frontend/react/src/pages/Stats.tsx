import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import axios from "axios";
import { useTranslation } from "react-i18next";

import StatsHeader from "../components/StatsHeader";
import MatchHistory from "../components/MatchHistory";
import BefriendButton from "../components/BefriendButton";

const apiUrl = import.meta.env.VITE_API_BASE_URL || "/api";

const Stats: React.FC = () => {
  const { status, user } = useAuth();
  const { state } = useLocation();
  const [viewedUserUsername, setViewedUserUsername] = useState<string | null>(
    state?.username || null
  );
  const { t } = useTranslation();

  const viewedUserId = state?.userId || user?.id;
  const usernameFromState = state?.username;

  useEffect(() => {
    const fetchUsername = async () => {
      if (!viewedUserId || usernameFromState) return;

      try {
        const res = await axios.get(apiUrl + "/users/id", {
          params: { id: viewedUserId },
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        });
        setViewedUserUsername(res.data.username);
      } catch (error) {
        console.error(t("stats.fetchError"), error);
        setViewedUserUsername(null);
      }
    };

    if (status === "authorized") fetchUsername();
  }, [status, viewedUserId, usernameFromState, t]);

  if (status === "loading") return <p>{t("stats.loading")}</p>;
  if (status === "unauthorized" || !user) return <Navigate to="/" replace />;

  return (
    <div className="text-center max-w-2xl dark:bg-black bg-white mx-auto rounded-lg">
      <StatsHeader
        username={
          viewedUserId === user?.id
            ? user?.username ?? t("stats.unknownUser")
            : viewedUserUsername ?? t("stats.unknownUser")
        }
        from={state?.from}
      />

      {viewedUserId !== user.id && (
        <BefriendButton currentUserId={user.id} viewedUserId={viewedUserId} />
      )}

      <MatchHistory userId={viewedUserId} />
    </div>
  );
};

export default Stats;
