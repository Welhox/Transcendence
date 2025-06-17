export async function authenticateOptional(request, reply) {
  console.log("running optional authenticate middleware");
  try {
    // Check if the request has a valid JWT token and store it for time validation
    const currentToken = await request.jwtVerify();

    if (!currentToken?.id || !currentToken?.username) {
      return;
    }

    request.user = {
      id: currentToken.id,
      username: currentToken.username,
    };

    const now = Math.floor(Date.now() / 1000); // Get the current time in seconds
    const timeLeft = currentToken.exp - now; // Calculate the time left until expiration
    // If the token is about to expire (less than 15 minutes left), refresh it
    if (timeLeft < 15 * 60) {
      // Create a new token with the same payload and a new expiration time
      const newToken = await request.jwtSign(
        { id: currentToken.id, username: currentToken.username },
        { expiresIn: "1h" }
      );
      // Set the new token in the cookie
      reply.setCookie("token", newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60, // 1 hour in seconds
      });
    }
  } catch (err) {
    // invalid or no token - no need to throw
    return;
  }
}
