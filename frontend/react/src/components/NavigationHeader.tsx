const NavigationHeader = ({handleStats, handlePals, handleSettings, logout}) => {
	const handleReturn = () => {
		navigate('/');
	}
	const NavButton = ({insideText, handler}) => {
		return <button className="border bg-teal-500 font-semibold hover:font-extrabold 
					  hover:underline uppercase text-white p-4 mx-4 rounded-2xl" onClick={handler}>{insideText}</button>
	}
	const LoginButton = ({insideText, handler}) => {
		return <button className="border bg-amber-900 font-semibold hover:font-extrabold 
					  hover:underline uppercase text-white p-4 mx-4 rounded-2xl" onClick={handler}>{insideText}</button>
	
	}
	return (
	<nav class="flex justify-between bg-teal-800 p-2">
		<NavButton insideText="Home" handler={handleReturn}></NavButton>
		<NavButton insideText="My Stats" handler={handleStats}></NavButton>
		<NavButton insideText="Pong pals" handler={handlePals}></NavButton>
		<NavButton insideText="Settings" handler={handleSettings}></NavButton>
		<LoginButton insideText="Login" handler={logout}></LoginButton>
	</nav>
)
};

export default NavigationHeader;