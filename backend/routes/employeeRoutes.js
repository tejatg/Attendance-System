const express = require("express");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

// GET all employees
router.get("/", async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: {
        id: "desc",
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

// GET employee by ID
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const employee = await prisma.employee.findUnique({
      where: {
        id,
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

// POST new employee
router.post("/", async (req, res) => {
  try {
    const {
      employeeId,
      name,
      email,
      department,
      photoUrl,
    } = req.body;

    if (!employeeId || !name || !email || !department) {
      return res.status(400).json({
        success: false,
        message:
          "Employee ID, name, email and department are required.",
      });
    }

    const existingEmployee = await prisma.employee.findFirst({
      where: {
        OR: [
          { employeeId },
          { email },
        ],
      },
    });

    if (existingEmployee) {
      return res.status(409).json({
        success: false,
        message: "Employee ID or email already exists.",
      });
    }

    const employee = await prisma.employee.create({
      data: {
        employeeId,
        name,
        email,
        department,
        photoUrl: photoUrl || null,
      },
    });

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