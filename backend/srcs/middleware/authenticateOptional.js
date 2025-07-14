export async function authenticateOptional(request, reply) {
  console.log("running optional authenticate middleware");
  try {

    const token = request.cookies?.token;
    if (!token) {
      // No token present, set user to undefined
      request.user = undefined;
      return;
    }

    // Decode the JWT token from the request
    // This will not throw an error if the token is invalid or missing
    // It will simply return undefined if the token is not present or invalid
    try {
      await request.jwtDecode();
    } catch (error) {
      console.error("JWT decode error:", error);
      // If decoding fails, we assume no token is present
      request.user = undefined;
      return;
    }
    // const decoded = request.jwtDecode();
    // if (!decoded || typeof decoded !== "object") {
    //   request.user = undefined;
    //   return;
    // }
    // Check if the request has a valid JWT token and store it for time validation
    const currentToken = await request.jwtVerify();

    if (!currentToken?.id || !currentToken?.username) {
      request.user = undefined;
      return;
    }

    request.user = {
      id: currentToken.id,
      username: currentToken.username,
    };

    const now = Math.floor(Date.now() / 1000); // Get the current time in seconds
    const timeLeft = currentToken.exp - now; // Calculate the time left until expiration

    if (timeLeft <= 0) {
      request.user = undefined;
      return reply.code(419).send({ error: "Session expired" });
    }
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
  } catch (error) {
    console.error("Optional authentication error:", error);
    // invalid or no token - no need to throw
    request.user = undefined;
  }
}
