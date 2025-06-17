import React, { useState, useEffect } from "react";
import axios from "axios";
import { Navigate, useNavigate } from "react-router-dom";
import SearchPals from "../components/SearchPals";
import { FriendList } from "../components/FriendList";
import { PendingRequests } from "../components/PendingRequests";
import { useAuth } from "../auth/AuthProvider";
import { Friend } from "../types/friend";
import { useTranslation } from "react-i18next";

const apiUrl = import.meta.env.VITE_API_BASE_URL || "api";

const PongPals: React.FC = () => {
  const navigate = useNavigate();
  const { status, user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    if (user) {
      const fetchFriends = async () => {
        try {
          const response = await axios.get(
            apiUrl + `/users/${user.id}/friends`,
            {
              withCredentials: true,
              headers: {
                "Content-Type": "application/json", // optional but safe
              },
            }
          );
          setFriends(response.data);
        } catch (error) {
          console.error("Failed to fetch friends:", error);
        }
      };

      fetchFriends();
    }
  }, [user]);

  const handleReturn = () => {
    navigate("/");
  };

  const handleFriendAdded = (newFriend: Omit<Friend, "isOnline">) => {
    setFriends((prev) => [...prev, { ...newFriend, isOnline: false }]);
  };

  const inputStyles =
    "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500";

  if (status === "loading") return <p>Loading...</p>;
  if (status === "unauthorized") return <Navigate to="/" replace />;

  // add friend request header to component
  return (
    <div className="mt-5 py-5 text-center max-w-2xl dark:bg-black bg-white mx-auto rounded-lg dark:text-white">
      <h1 className="text-6xl text-center text-teal-800 dark:text-teal-300 m-3">
        {t("pongPals.title")}
      </h1>
      <PendingRequests
        userId={user!.id.toString()}
        onFriendAdded={handleFriendAdded}
      />
      <h2 className="text-3xl text-center text-teal-800 dark:text-teal-300 m-3">
        {t("pongPals.searchUsers")}
      </h2>
      <SearchPals />
      <h2 className="text-3xl text-center text-teal-800 dark:text-teal-300 m-3">
        {t("pongPals.yourFriends")}
      </h2>
      <FriendList friends={friends} />
      <button
        className="block mx-auto px-20 text-white bg-teal-700 hover:bg-teal-800 focus:ring-4 
							   focus:outline-none focus:ring-blue-300 rounded-lg text-sm w-full 
							   sm:w-auto py-2.5 text-center dark:bg-teal-600 dark:hover:bg-teal-700
							   dark:focus:ring-teal-800 font-semibold mt-5"
        onClick={handleReturn}
      >
        {t("pongPals.back")}
      </button>
    </div>
  );
};

export default PongPals;
