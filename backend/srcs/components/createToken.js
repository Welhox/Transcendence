

export function createToken(fastify, user) {
//credentials are valid, so we can create a JWT token
	const token = fastify.jwt.sign(
		{
		id: user.id,
		username: user.username,
		},
		{
			expiresIn: '1h', // token expiration time
		}
	);
	return (token)
}

export function createMFAToken(fastify, id) {
//credentials are valid, but MFA still required
	const mfaToken = createToken(
		{
		id: id,
		mfaPending: true,
		},
		{
			expiresIn: '1h', // token expiration time
		}
	);
	return (mfaToken)
}


export function makeCookie(reply, token) {
	// store JWT in cookie (httpOnly)
	// httpOnly means the cookie cannot be accessed via JavaScript, which helps mitigate XSS attacks
	// secure means the cookie will only be sent over HTTPS connections
	reply.setCookie('token', token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict', // means the cookie won’t be sent if someone embeds your site in an iframe or from another domain 
			path: '/',
			maxAge: 60 * 60, // 1 hour in seconds, same as JWT expiration
	})
	// send response with without token (token is in the cookie)
	// return reply.code(200).send({message: 'Login successful'});
}

export function makeMFACookie(reply, mfaToken) {
	// store JWT in cookie (httpOnly)
	// httpOnly means the cookie cannot be accessed via JavaScript, which helps mitigate XSS attacks
	// secure means the cookie will only be sent over HTTPS connections
	if (!mfaToken) {
		console.warn('⚠️ Tried to set mfa cookie with undefined token!');
		return;
	  }
	reply.setCookie('mfaToken', mfaToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict', // means the cookie won’t be sent if someone embeds your site in an iframe or from another domain 
			path: '/',
			maxAge: 60 * 5, // 5min in seconds
	})
	// send response with without token (token is in the cookie)
	// return reply.code(200).send({message: 'Login successful'});
}