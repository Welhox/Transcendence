import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type NavigationHeaderProps = {
  handleLogout: () => Promise<void>;
  status: string;
  user: any;
};
type NavigationLinkProps = {
  target: string;
  text: string;
};
type LogoutButtonProps = {
  insideText: string;
  handler: React.MouseEventHandler<HTMLButtonElement>;
};
const NavigationHeader = ({
  handleLogout,
  status,
  user,
}: NavigationHeaderProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const navigate = useNavigate();

  const { t } = useTranslation();

  const NavLink = ({ target, text }: NavigationLinkProps) => {
    return (
      <Link
        to={target}
        className="border bg-teal-900 font-semibold hover:font-extrabold 
								hover:underline hover:text-amber-200 uppercase
								text-white p-4 rounded-2xl"
      >
        {text}
      </Link>
    );
  };

  const onLogoutClick = async () => {
    try {
      await handleLogout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const LogoutButton = ({ insideText, handler }: LogoutButtonProps) => {
    return (
      <button
        className="border bg-teal-500 font-semibold hover:font-extrabold 
					  hover:underline  hover:text-amber-200 uppercase text-white p-4 mx-2 
					  rounded-2xl"
        onClick={handler}
      >
        {insideText}
      </button>
    );
  };

  if (status === "authorized")
    return (
      <>
        <nav className="hidden sm:flex justify-between bg-teal-700 p-2">
          <NavLink target="/" text={t("navigation.home")} />
          <NavLink
            target={`/stats/${user.id}`}
            text={t("navigation.myStats")}
          />
          <NavLink target="pongpals" text={t("navigation.pongPals")} />
          <NavLink target="/settings" text={t("navigation.settings")} />
          <LogoutButton
            insideText={t("navigation.logout")}
            handler={onLogoutClick}
          ></LogoutButton>
        </nav>
        <nav className="sm:hidden flex justify-between bg-teal-700 p-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="focus:outline-none border bg-teal-900 font-semibold hover:font-extrabold 
				   hover:underline hover:text-amber-200 uppercase
		           text-white text-4xl p-2 rounded-2xl"
          >
            ≡
          </button>
        </nav>

        {isOpen && (
          <nav className="sm:hidden flex flex-col space-y-4 px-4 pt-2 pb-4">
            <NavLink target="/" text={t("navigation.home")} />
            <NavLink
              target={`/stats/${user.id}`}
              text={t("navigation.myStats")}
            />
            <NavLink target="pongpals" text={t("navigation.pongPals")} />
            <NavLink target="/tournaments" text={t("navigation.tournaments")} />
            <NavLink target="/settings" text={t("navigation.settings")} />
            <LogoutButton
              insideText={t("navigation.logout")}
              handler={onLogoutClick}
            ></LogoutButton>
          </nav>
        )}
      </>
    );
  else
    return (
      <>
        <nav className="hidden sm:flex justify-between bg-teal-700 p-2">
          <NavLink target="/" text={t("navigation.home")} />
          <NavLink target="/login" text={t("navigation.login")} />
        </nav>
        <nav className="sm:hidden flex justify-between bg-teal-700 p-2">
          <NavLink target="/login" text={t("navigation.login")} />
        </nav>
      </>
    );
};

export default NavigationHeader;
