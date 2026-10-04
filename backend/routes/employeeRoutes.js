const express = require("express");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const router = express.Router();
const prisma = new PrismaClient();

// ======================================================
// GET ALL EMPLOYEES
// ======================================================
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

// ======================================================
// GET EMPLOYEE BY DATABASE ID
// ======================================================
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

// ======================================================
// POST - REGISTER NEW EMPLOYEE
// ======================================================
router.post("/", async (req, res) => {
  try {
    const {
      employeeId,
      name,
      email,
      department,
      password,
      confirmPassword,
      photoUrl,
    } = req.body;

    // --------------------------------------------------
    // 1. Validate required fields
    // --------------------------------------------------
    if (!employeeId || !name || !email || !department) {
      return res.status(400).json({
        success: false,
        message:
          "Employee ID, name, email and department are required.",
      });
    }

    // --------------------------------------------------
    // 2. Password is compulsory
    // --------------------------------------------------
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

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Employee Password and Confirm Password do not match.",
      });
    }

    // --------------------------------------------------
    // 3. Check duplicate employee
    // --------------------------------------------------
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

    // --------------------------------------------------
    // 4. Hash password
    // --------------------------------------------------
    const passwordHash = await bcrypt.hash(password, 12);

    // --------------------------------------------------
    // 5. Create employee
    // --------------------------------------------------
    const employee = await prisma.employee.create({
      data: {
        employeeId: employeeId.trim(),
        name: name.trim(),
        email: email.trim(),
        department: department.trim(),
        passwordHash,
        photoUrl: photoUrl || null,
      },
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        department: true,
        photoUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // --------------------------------------------------
    // 6. Success response
    // --------------------------------------------------
    res.status(201).json({
      success: true,
      message: "Employee registered successfully.",
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

module.exports = router;