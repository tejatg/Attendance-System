const jwt = require("jsonwebtoken");

function requireAdminAuth(req, res, next) {
  try {
    const authHeader = req.get("authorization");

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "AUTHORIZATION_REQUIRED",
        message: "Administrator authorization is required.",
      });
    }

    const parts = authHeader.split(" ");

    if (
      parts.length !== 2 ||
      parts[0].toLowerCase() !== "bearer"
    ) {
      return res.status(401).json({
        success: false,
        error: "INVALID_AUTHORIZATION_FORMAT",
        message:
          "Authorization must use the Bearer token format.",
      });
    }

    const token = parts[1];

    const jwtSecret = process.env.ADMIN_JWT_SECRET;

    if (!jwtSecret) {
      console.error(
        "[ADMIN AUTH] ADMIN_JWT_SECRET is not configured."
      );

      return res.status(500).json({
        success: false,
        error: "AUTH_CONFIGURATION_ERROR",
        message:
          "Administrator authentication is not configured.",
      });
    }

    const decoded = jwt.verify(
      token,
      jwtSecret
    );

    if (
      !decoded ||
      !decoded.adminId ||
      decoded.role !== "ADMIN"
    ) {
      return res.status(403).json({
        success: false,
        error: "ADMIN_ACCESS_REQUIRED",
        message:
          "Valid administrator access is required.",
      });
    }

    req.admin = decoded;

    next();
  } catch (error) {
    console.error(
      "[ADMIN AUTH] Token verification failed:",
      error.message
    );

    return res.status(401).json({
      success: false,
      error: "INVALID_OR_EXPIRED_TOKEN",
      message:
        "Administrator session is invalid or expired.",
    });
  }
}

module.exports = {
  requireAdminAuth,
};