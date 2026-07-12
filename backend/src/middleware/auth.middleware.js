const { verifyToken } = require("../utils/jwt");

/**
 * Protects a route by requiring a valid "Authorization: Bearer <token>" header.
 * On success, attaches the decoded payload as req.user and calls next().
 *
 * 401 - missing/malformed/expired/invalid token
 */
module.exports = function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Provide a valid Bearer token."
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    return next();
  } catch (error) {
    const message = error.name === "TokenExpiredError"
      ? "Session expired. Please log in again."
      : "Invalid authentication token.";

    return res.status(401).json({
      success: false,
      message
    });
  }
};
