const jwt = require("jsonwebtoken");

function requireEmployeeAuth(req, res, next) {
  try {
    const authHeader = req.get("authorization");

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Employee login is required.",
      });
    }

    const parts = authHeader.split(" ");

    if (
      parts.length !== 2 ||
      parts[0].toLowerCase() !== "bearer"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format.",
      });
    }

    const secret = process.env.EMPLOYEE_JWT_SECRET;

    if (!secret) {
      console.error(
        "EMPLOYEE_JWT_SECRET is not configured."
      );

      return res.status(500).json({
        success: false,
        message: "Employee authentication is not configured.",
      });
    }

    const decoded = jwt.verify(parts[1], secret);

    if (
      !decoded ||
      decoded.role !== "EMPLOYEE" ||
      typeof decoded.employeeId !== "string" ||
      !decoded.employeeId.trim()
    ) {
      return res.status(403).json({
        success: false,
        message: "Valid employee access is required.",
      });
    }

    req.employee = {
      employeeId: decoded.employeeId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Employee session is invalid or expired.",
    });
  }
}

module.exports = {
  requireEmployeeAuth,
};
