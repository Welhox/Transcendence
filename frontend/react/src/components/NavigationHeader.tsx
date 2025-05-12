const NavigationHeader = ({handleStats, handlePals, handleSettings, logout, handleLogin, status}) => {
	const handleReturn = () => {
		navigate('/');
	}
	const NavButton = ({insideText, handler}) => {
		return <button className="border bg-teal-900 font-semibold hover:font-extrabold 
					  hover:underline hover:text-amber-200 uppercase text-white p-4 mx-4 rounded-2xl" onClick={handler}>{insideText}</button>
	}
	const LoginButton = ({insideText, handler}) => {
		return <button className="border bg-teal-500 font-semibold hover:font-extrabold 
					  hover:underline  hover:text-amber-200 uppercase text-white p-4 mx-4 
					  rounded-2xl" onClick={handler}>{insideText}</button>
	
	}
	if (status === 'authorized')
		return (
	<nav className="flex justify-between bg-teal-700 p-2">
		<NavButton insideText="Home" handler={handleReturn}></NavButton>
		<NavButton insideText="My Stats" handler={handleStats}></NavButton>
		<NavButton insideText="Pong pals" handler={handlePals}></NavButton>
		<NavButton insideText="Settings" handler={handleSettings}></NavButton>

		<LoginButton insideText="Logout" handler={logout}></LoginButton>
	</nav>
)
	else
		return(
			<nav className="flex justify-between bg-teal-700 p-2">
			<NavButton insideText="Home" handler={handleReturn}></NavButton>
			<LoginButton insideText="Login" handler={handleLogin}></LoginButton>
			</nav>
		)
};

export default NavigationHeader;