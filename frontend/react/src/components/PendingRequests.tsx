import React, { useEffect, useState } from "react";
import axios from "axios";
import { Friend } from "../types/friend";
import { useTranslation } from "react-i18next";

const apiUrl = import.meta.env.VITE_API_BASE_URL || "api";

type Request = {
  id: number;
  senderId: string;
  username: string;
};

type Props = {
  userId: string;
  onFriendAdded: (newFriend: Friend) => void;
};

const buttonStyle =
  "font-semibold hover:font-extrabold hover:underline  hover:text-amber-200 mx-auto my-5 px-8 text-white bg-teal-700 hover:bg-teal-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto py-2.5 text-center dark:bg-teal-600 dark:hover:bg-teal-700 dark:focus:ring-teal-800";

export const PendingRequests: React.FC<Props> = ({ userId, onFriendAdded }) => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await axios.get(apiUrl + `/users/${userId}/requests`, {
          headers: {
            "Content-Type": "application/json", // optional but safe
          },
          withCredentials: true,
        });
        setRequests(response.data);
      } catch (error) {
        console.error("Failed to fetch requests:", error);
      }
    };

    fetchRequests();
  }, [userId]);

  const handleAction = async (
    requestId: number,
    username: string,
    senderId: string,
    action: "accept" | "decline"
  ) => {
    try {
      await axios.post(
        apiUrl + `/friends/${action}`,
        { requestId },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      if (action === "accept") {
        setMessage(t("friendRequests.accepted", { username }));
        onFriendAdded({ id: senderId, username, isOnline: false });
      } else {
        setMessage(t("friendRequests.declined"));
      }

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error(`Failed to &{action} request:`, error);
      setMessage(t("friendRequests.error"));
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (requests.length === 0) return;

  return (
    <div>
      <h2 className="text-3xl text-center text-teal-800 dark:text-teal-300 m-3">
        {t("friendRequests.title")}
      </h2>
      {message && <p>{message}</p>}
      <ul>
        {requests.map((req) => (
          <li key={req.id}>
            {t("friendRequests.request", { username: req.username })}
            <br />
            <button
              className={buttonStyle}
              onClick={() =>
                handleAction(req.id, req.username, req.senderId, "accept")
              }
            >
              {t("friendRequests.accept")}
            </button>{" "}
            <button
              className={buttonStyle}
              onClick={() =>
                handleAction(req.id, req.username, req.senderId, "decline")
              }
            >
              {t("friendRequests.decline")}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
