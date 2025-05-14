import { Link } from 'react-router-dom';
type NavigationHeaderProps = {
  	handleLogout: (React.MouseEventHandler<HTMLButtonElement>);
  	status: string;
	user: any; // fix this
}
type NavigationLinkProps = {
	target: string;
	text: string;
}
type LogoutButtonProps = {
	insideText: string;
	handler: (React.MouseEventHandler<HTMLButtonElement>);
}
const NavigationHeader = ({ handleLogout, status, user }: NavigationHeaderProps) => {

	const NavLink = ({target, text}: NavigationLinkProps) => {
		return <Link to={target} 
					 className="border bg-teal-900 font-semibold hover:font-extrabold 
								hover:underline hover:text-amber-200 uppercase
								text-white p-4 rounded-2xl">{text}</Link>				
	}

	const LogoutButton = ({insideText, handler}: LogoutButtonProps) => {
		return <button className="border bg-teal-500 font-semibold hover:font-extrabold 
					  hover:underline  hover:text-amber-200 uppercase text-white p-4 mx-2 
					  rounded-2xl" onClick={handler}>{insideText}</button>
	}
	if (status === 'authorized')
		return (
	<nav className="flex justify-between bg-teal-700 p-2">
		<NavLink target='/' text='Home'/>
		<NavLink target={`/stats/${user.id}`} text='My Stats'/>
		<NavLink target='pongpals' text='Pong Pals'/>
		<NavLink target='/settings' text='Settings'/>
		<LogoutButton insideText="Logout" handler={handleLogout}></LogoutButton>
	</nav>
)
	else
		return(
			<nav className="flex justify-between bg-teal-700 p-2">
				<NavLink target='/' text='Home'/>
				<NavLink target='/login' text='Login'/>
			</nav>
		)
};

export default NavigationHeader;