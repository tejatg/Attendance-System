const express = require("express");
const multer = require("multer");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const cloudinary = require("../utils/cloudinary");
const { requireAdminAuth } = require("../middleware/adminAuth");
const { logAuditEvent } = require("../utils/auditLogger");

const router = express.Router();
const prisma = new PrismaClient();

/* PHOTO UPLOAD CONFIGURATION */

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error("Only JPG, PNG, and WEBP employee photos are allowed.")
      );
    }

    cb(null, true);
  },
});

/* CLOUDINARY UPLOAD HELPER */

function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "talentronaut/smart-attendance/employees",
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);

        if (!result || !result.secure_url) {
          return reject(
            new Error("Cloudinary did not return a photo URL.")
          );
        }

        resolve(result);
      }
    );

    stream.end(buffer);
  });
}

/* STANDARD EMPLOYEE RESPONSE FIELDS */

const employeeSelect = {
  id: true,
  employeeId: true,
  name: true,
  email: true,
  department: true,
  location: true,
  photoUrl: true,
  createdAt: true,
  updatedAt: true,
};

/*
========================================
EMPLOYEE LOGIN
POST /api/employees/login
========================================
*/

router.post("/login", async (req, res) => {
  try {
    const employeeId =
      typeof req.body?.employeeId === "string"
        ? req.body.employeeId.trim()
        : "";

    const password =
      typeof req.body?.password === "string"
        ? req.body.password
        : "";

    if (!employeeId || !password) {
      return res.status(400).json({
        success: false,
        message: "Employee ID and password are required.",
      });
    }

    const secret = process.env.EMPLOYEE_JWT_SECRET;

    if (!secret) {
      console.error("EMPLOYEE_JWT_SECRET is not configured.");

      return res.status(500).json({
        success: false,
        message: "Employee authentication is not configured.",
      });
    }

    const employee = await prisma.employee.findUnique({
      where: { employeeId },
      select: {
        employeeId: true,
        name: true,
        email: true,
        department: true,
        passwordHash: true,
      },
    });

    if (
      !employee ||
      !employee.passwordHash ||
      !(await bcrypt.compare(password, employee.passwordHash))
    ) {
      try {
        await logAuditEvent({
          eventType: "EMPLOYEE_LOGIN_FAILED",
          actor: employeeId,
          description: "Employee login failed.",
          ipAddress: req.ip || null,
          userAgent: req.get("user-agent") || null,
          metadata: { reason: "INVALID_CREDENTIALS" },
        });
      } catch (auditError) {
        console.error("Login failure audit error:", auditError);
      }

      return res.status(401).json({
        success: false,
        message: "Invalid employee ID or password.",
      });
    }

    const token = jwt.sign(
      {
        employeeId: employee.employeeId,
        role: "EMPLOYEE",
      },
      secret,
      { expiresIn: "8h" }
    );

    try {
      await logAuditEvent({
        eventType: "EMPLOYEE_LOGIN",
        employeeId: employee.employeeId,
        actor: employee.employeeId,
        description: "Employee successfully logged in.",
        ipAddress: req.ip || null,
        userAgent: req.get("user-agent") || null,
        metadata: { source: "employee-login" },
      });
    } catch (auditError) {
      console.error("Login success audit error:", auditError);
    }

    return res.status(200).json({
      success: true,
      message: "Employee login successful.",
      token,
      employee: {
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        department: employee.department,
      },
    });
  } catch (error) {
    console.error("EMPLOYEE LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Employee login failed.",
    });
  }
});

/*
========================================
GET ALL EMPLOYEES
ADMIN ONLY
========================================
*/

router.get("/", requireAdminAuth, async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      select: employeeSelect,
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      employees,
    });
  } catch (error) {
    console.error("Error fetching employees:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch employees.",
    });
  }
});

/*
========================================
GET EMPLOYEE BY DATABASE ID
ADMIN ONLY
========================================
*/

router.get("/:id", requireAdminAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee database ID.",
      });
    }

    const employee = await prisma.employee.findUnique({
      where: { id },
      select: employeeSelect,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    return res.status(200).json({
      success: true,
      employee,
    });
  } catch (error) {
    console.error("Error fetching employee:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch employee.",
    });
  }
});

/*
========================================
CREATE EMPLOYEE
ADMIN ONLY
========================================
*/

router.post(
  "/",
  requireAdminAuth,
  upload.single("photo"),
  async (req, res) => {
    let uploadedPhotoPublicId = null;

    try {
      const employeeId =
        typeof req.body.employeeId === "string"
          ? req.body.employeeId.trim()
          : "";

      const name =
        typeof req.body.name === "string"
          ? req.body.name.trim()
          : "";

      const email =
        typeof req.body.email === "string"
          ? req.body.email.trim().toLowerCase()
          : "";

      const department =
        typeof req.body.department === "string"
          ? req.body.department.trim()
          : "";

      const location =
        typeof req.body.location === "string"
          ? req.body.location.trim()
          : "";

      const password =
        typeof req.body.password === "string"
          ? req.body.password
          : "";

      const confirmPassword =
        typeof req.body.confirmPassword === "string"
          ? req.body.confirmPassword
          : "";

      if (!employeeId || !name || !email || !department || !location) {
        return res.status(400).json({
          success: false,
          message:
            "Employee ID, name, email, department, and location are required.",
        });
      }

      if (employeeId.length > 50) {
        return res.status(400).json({
          success: false,
          message: "Employee ID must not exceed 50 characters.",
        });
      }

      if (name.length > 150) {
        return res.status(400).json({
          success: false,
          message: "Employee name must not exceed 150 characters.",
        });
      }

      if (
        email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid employee email address.",
        });
      }

      if (department.length > 100 || location.length > 150) {
        return res.status(400).json({
          success: false,
          message: "Department or location exceeds the allowed length.",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Employee photo is required.",
        });
      }

      if (!password || password.length < 8) {
        return res.status(400).json({
          success: false,
          message: "Password must contain at least 8 characters.",
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: "Password and confirmation do not match.",
        });
      }

      const existingEmployee = await prisma.employee.findFirst({
        where: {
          OR: [{ employeeId }, { email }],
        },
        select: { id: true },
      });

      if (existingEmployee) {
        return res.status(409).json({
          success: false,
          message: "Employee ID or email already exists.",
        });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      let cloudinaryResult;

      try {
        cloudinaryResult = await uploadToCloudinary(req.file.buffer);
        uploadedPhotoPublicId = cloudinaryResult.public_id;
      } catch (uploadError) {
        console.error("Cloudinary photo upload failed:", uploadError);

        return res.status(502).json({
          success: false,
          message:
            "Employee photo upload failed. The employee was not registered.",
        });
      }

      const employee = await prisma.employee.create({
        data: {
          employeeId,
          name,
          email,
          department,
          location,
          passwordHash,
          photoUrl: cloudinaryResult.secure_url,
        },
        select: employeeSelect,
      });

      try {
        await logAuditEvent({
          eventType: "EMPLOYEE_REGISTERED",
          employeeId: employee.employeeId,
          actor:
            req.admin?.username ||
            String(req.admin?.adminId || "ADMIN"),
          description:
            `Employee ${employee.name} was registered by an administrator.`,
          ipAddress: req.ip || null,
          userAgent: req.get("user-agent") || null,
          metadata: {
            source: "admin-employee-registration",
            department: employee.department,
            hasPhoto: Boolean(employee.photoUrl),
            hasLocation: Boolean(employee.location),
          },
        });
      } catch (auditError) {
        console.error("Employee audit logging failed:", auditError);
      }

      return res.status(201).json({
        success: true,
        message: "Employee registered successfully.",
        employee,
      });
    } catch (error) {
      console.error("Error creating employee:", error);

      if (uploadedPhotoPublicId) {
        try {
          await cloudinary.uploader.destroy(
            uploadedPhotoPublicId,
            { resource_type: "image" }
          );
        } catch (cleanupError) {
          console.error("Photo cleanup failed:", cleanupError);
        }
      }

      if (error.code === "P2002") {
        return res.status(409).json({
          success: false,
          message: "Employee ID or email already exists.",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to register employee.",
      });
    }
  }
);

/*
========================================
UPLOAD ERROR HANDLER
========================================
*/

router.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "Employee photo must be 5 MB or smaller.",
      });
    }

    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Upload only one employee photo.",
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Invalid employee photo upload.",
    });
  }

  return next();
});

module.exports = router;
