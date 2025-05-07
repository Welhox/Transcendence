const NavigationHeader = ({handleStats, handlePals, handleSettings, logout}) => {
	return (
		<>
	<button onClick={handleStats}>My stats</button>
	<button onClick={handlePals}>Pong pals</button>
	<button onClick={handleSettings}>Settings</button>
	<button onClick={logout}>Logout</button></>
)
};

export default NavigationHeader;