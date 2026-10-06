const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { PrismaClient } = require("@prisma/client");
const { logAuditEvent } = require("../utils/auditLogger");

const {
  requireAdminAuth,
} = require("../middleware/adminAuth");

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.ADMIN_JWT_SECRET;

if (!JWT_SECRET) {
  console.warn(
    "[ADMIN AUTH] ADMIN_JWT_SECRET is not configured."
  );
}

/*
 * POST /api/admin/login
 *
 * Administrator authentication.
 *
 * Request:
 * {
 *   "username": "admin",
 *   "password": "..."
 * }
 */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      await logAuditEvent({
        eventType: "ADMIN_LOGIN_FAILED",
        actor: username || "UNKNOWN",
        description:
          "Administrator login failed because username or password was missing.",
        ipAddress: req.ip || null,
        userAgent: req.get("user-agent") || null,
        metadata: {
          reason: "MISSING_CREDENTIALS",
        },
      });

      return res.status(400).json({
        success: false,
        error: "MISSING_CREDENTIALS",
        message: "Username and password are required.",
      });
    }

    if (!JWT_SECRET) {
      return res.status(500).json({
        success: false,
        error: "ADMIN_AUTH_CONFIGURATION_ERROR",
        message:
          "Administrator authentication is not configured.",
      });
    }

    const admin = await prisma.admin.findUnique({
      where: {
        username: username.trim(),
      },
    });

    if (!admin || !admin.isActive) {
      await logAuditEvent({
        eventType: "ADMIN_LOGIN_FAILED",
        actor: username.trim(),
        description:
          "Administrator login failed because the administrator account was not found or inactive.",
        ipAddress: req.ip || null,
        userAgent: req.get("user-agent") || null,
        metadata: {
          reason: "ADMIN_NOT_FOUND_OR_INACTIVE",
        },
      });

      return res.status(401).json({
        success: false,
        error: "INVALID_CREDENTIALS",
        message: "Invalid username or password.",
      });
    }

    const passwordValid = await bcrypt.compare(
      password,
      admin.passwordHash
    );

    if (!passwordValid) {
      await logAuditEvent({
        eventType: "ADMIN_LOGIN_FAILED",
        actor: admin.username,
        description:
          "Administrator login failed because the password was invalid.",
        ipAddress: req.ip || null,
        userAgent: req.get("user-agent") || null,
        metadata: {
          reason: "INVALID_PASSWORD",
        },
      });

      return res.status(401).json({
        success: false,
        error: "INVALID_CREDENTIALS",
        message: "Invalid username or password.",
      });
    }

    const token = jwt.sign(
      {
        adminId: admin.id,
        username: admin.username,
        role: admin.role,
      },
      JWT_SECRET,
      {
        expiresIn: "8h",
      }
    );

    await prisma.admin.update({
      where: {
        id: admin.id,
      },
      data: {
        lastLoginAt: new Date(),
      },
    });

    await logAuditEvent({
      eventType: "ADMIN_LOGIN_SUCCESS",
      actor: admin.username,
      description:
        "Administrator logged in successfully.",
      ipAddress: req.ip || null,
      userAgent: req.get("user-agent") || null,
      metadata: {
        adminId: admin.id,
        role: admin.role,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Administrator login successful.",
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error(
      "[ADMIN AUTH] Login error:"
    );

    console.error(error.message);

    return res.status(500).json({
      success: false,
      error: "ADMIN_LOGIN_ERROR",
      message:
        "Administrator authentication failed.",
    });
  }
});

/*
 * GET /api/admin/me
 *
 * Protected administrator profile endpoint.
 *
 * Requires:
 * Authorization: Bearer <JWT_TOKEN>
 */
router.get(
  "/me",
  requireAdminAuth,
  async (req, res) => {
    try {
      const admin = await prisma.admin.findUnique({
        where: {
          id: req.admin.adminId,
        },
        select: {
          id: true,
          username: true,
          name: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
        },
      });

      if (!admin || !admin.isActive) {
        return res.status(403).json({
          success: false,
          error: "ADMIN_ACCESS_DENIED",
          message:
            "Administrator account is inactive or unavailable.",
        });
      }

      return res.status(200).json({
        success: true,
        admin,
      });
    } catch (error) {
      console.error(
        "[ADMIN AUTH] /me error:"
      );

      console.error(error.message);

      return res.status(500).json({
        success: false,
        error: "ADMIN_PROFILE_ERROR",
        message:
          "Unable to load administrator profile.",
      });
    }
  }
);

module.exports = router;