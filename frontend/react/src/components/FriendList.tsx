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
    <div className="flex flex-col justify-center items-center">
      <ul className="m-5 flex flex-col">
        {friends.map((friend) => (
          <li
            key={friend.id}
            className="flex items-center space-x-2 hover:font-bold hover:underline hover:text-amber-200"
          >
            <span
              className={`h-3 w-3 rounded-full ${
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
            >
              {friend.username}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
