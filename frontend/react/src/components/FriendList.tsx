import React from "react";
import { Link } from "react-router-dom";
import { Friend } from "../types/friend";
import { useTranslation } from "react-i18next";

type FriendListProps = {
  friends: Friend[];
};

export const FriendList: React.FC<FriendListProps> = ({ friends }) => {
  const { t } = useTranslation();

  if (friends.length === 0) return <div>{t("friendList.noFriends")}</div>;

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-md overflow-y-auto max-h-60 px-2 py-2 border border-gray-200 dark:border-gray-700 rounded">
        <ul className="flex flex-col items-center space-y-2">
          {friends.map((friend) => (
            <li
              key={friend.id}
              className="flex items-center w-full max-w-sm px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            >
              <span
                className={`h-3 w-3 rounded-full mr-2 ${
                  friend.isOnline ? "bg-green-500" : "bg-gray-400"
                }`}
              />
              <span className="sr-only">{friend.isOnline ? "Online" : "Offline"}</span>
              <Link
                to={"/stats/"}
                state={{
                  userId: friend.id,
                  username: friend.username,
                  from: "/pongpals",
                }}
                className="hover:font-bold hover:underline hover:text-amber-200"
              >
                {friend.username}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
