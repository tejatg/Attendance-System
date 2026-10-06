const express = require("express");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const multer = require("multer");
const cloudinary = require("../utils/cloudinary");
const { logAuditEvent } = require("../utils/auditLogger");

const router = express.Router();
const prisma = new PrismaClient();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error(
          "Only JPG, PNG and WebP image files are allowed."
        )
      );
    }

    cb(null, true);
  },
});

function uploadToCloudinary(fileBuffer) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "smart-attendance/employees",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
}

/*
  GET ALL EMPLOYEES
*/
router.get("/", async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: {
        id: "desc",
      },
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        department: true,
        location: true,
        photoUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      employees,
    });
  } catch (error) {
    console.error("Error fetching employees:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch employees",
      error: error.message,
    });
  }
});

/*
  GET EMPLOYEE BY DATABASE ID
*/
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID.",
      });
    }

    const employee = await prisma.employee.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        department: true,
        location: true,
        photoUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    res.json({
      success: true,
      employee,
    });
  } catch (error) {
    console.error("Error fetching employee:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch employee",
      error: error.message,
    });
  }
});

/*
  REGISTER NEW EMPLOYEE
*/
router.post("/", upload.single("photo"), async (req, res) => {
  try {
    const {
      employeeId,
      name,
      email,
      department,
      location,
      password,
      confirmPassword,
    } = req.body;

    /*
      REQUIRED FIELD VALIDATION
    */

    if (!employeeId || !employeeId.trim()) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required.",
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Employee name is required.",
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Employee email is required.",
      });
    }

    if (!department || !department.trim()) {
      return res.status(400).json({
        success: false,
        message: "Department is required.",
      });
    }

    if (!location || !location.trim()) {
      return res.status(400).json({
        success: false,
        message: "Employee Location is required.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Employee Photo is required.",
      });
    }

    if (!password || !password.trim()) {
      return res.status(400).json({
        success: false,
        message: "Employee Password is required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Employee Password must be at least 6 characters.",
      });
    }

    if (
      confirmPassword === undefined ||
      confirmPassword === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Confirm Password is required.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Employee Password and Confirm Password do not match.",
      });
    }

    /*
      CHECK DUPLICATE EMPLOYEE
    */

    const existingEmployee = await prisma.employee.findFirst({
      where: {
        OR: [
          {
            employeeId: employeeId.trim(),
          },
          {
            email: email.trim(),
          },
        ],
      },
    });

    if (existingEmployee) {
      return res.status(409).json({
        success: false,
        message: "Employee ID or email already exists.",
      });
    }

    /*
      HASH PASSWORD
    */

    const passwordHash = await bcrypt.hash(password, 12);

    /*
      UPLOAD EMPLOYEE PHOTO TO CLOUDINARY
    */

    let cloudinaryResult;

    try {
      cloudinaryResult = await uploadToCloudinary(
        req.file.buffer
      );
    } catch (uploadError) {
      console.error(
        "Cloudinary employee photo upload failed:",
        uploadError
      );

      return res.status(500).json({
        success: false,
        message:
          "Employee photo upload failed. Employee was not registered.",
      });
    }

    /*
      CREATE EMPLOYEE
    */

    const employee = await prisma.employee.create({
      data: {
        employeeId: employeeId.trim(),
        name: name.trim(),
        email: email.trim(),
        department: department.trim(),
        location: location.trim(),
        passwordHash,
        photoUrl: cloudinaryResult.secure_url,
      },
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        department: true,
        location: true,
        photoUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    /*
      AUDIT EVENT
    */

    await logAuditEvent({
      eventType: "EMPLOYEE_REGISTERED",
      employeeId: employee.employeeId,
      actor: "EMPLOYEE_REGISTRATION",
      description:
        `Employee ${employee.name} was registered successfully.`,
      ipAddress: req.ip || null,
      userAgent: req.get("user-agent") || null,
      metadata: {
        source: "employee-registration",
        department: employee.department,
        email: employee.email,
        hasPhoto: Boolean(employee.photoUrl),
        hasLocation: Boolean(employee.location),
      },
    });

    /*
      SUCCESS RESPONSE
    */

    res.status(201).json({
      success: true,
      message:
        "Employee registered successfully with photo and location.",
      employee,
    });
  } catch (error) {
    console.error("Error creating employee:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create employee",
      error: error.message,
    });
  }
});

/*
  MULTER / UPLOAD ERROR HANDLER
*/
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message:
          "Employee Photo must be 5 MB or smaller.",
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
      message: error.message,
    });
  }

  next();
});

module.exports = router;