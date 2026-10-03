const express = require("express");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

// GET all attendance records
router.get("/", async (req, res) => {
  try {
    const attendance = await prisma.attendance.findMany({
      include: {
        employee: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    res.json({
      success: true,
      attendance,
    });
  } catch (error) {
    console.error("ATTENDANCE GET ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance records.",
      error: error.message,
    });
  }
});

// POST attendance
router.post("/", async (req, res) => {
  try {
    const {
      employeeId,
      status,
      checkIn,
      checkOut,
    } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required.",
      });
    }

    // 1. Check employee exists
    const employee = await prisma.employee.findUnique({
      where: {
        employeeId,
      },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    // 2. Get today's date range
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // 3. Prevent duplicate check-in
    const existingAttendance =
      await prisma.attendance.findFirst({
        where: {
          employeeId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

    if (existingAttendance) {
      return res.status(409).json({
        success: false,
        message:
          "Employee has already marked attendance today.",
        attendance: existingAttendance,
      });
    }

    // 4. Create attendance record
    const attendance = await prisma.attendance.create({
      data: {
        employeeId,
        status: status || "Present",
        checkIn: checkIn
          ? new Date(checkIn)
          : new Date(),
        checkOut: checkOut
          ? new Date(checkOut)
          : null,
      },
      include: {
        employee: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Attendance marked successfully.",
      attendance,
    });
  } catch (error) {
    console.error("ATTENDANCE POST ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to mark attendance.",
      error: error.message,
    });
  }
});

// PUT - Mark check-out
router.put("/checkout/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;

    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employeeId,
        checkOut: null,
      },
      orderBy: {
        date: "desc",
      },
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "No active attendance record found for this employee.",
      });
    }

    const updatedAttendance = await prisma.attendance.update({
      where: {
        id: attendance.id,
      },
      data: {
        checkOut: new Date(),
      },
      include: {
        employee: true,
      },
    });

    res.json({
      success: true,
      message: "Check-out marked successfully.",
      attendance: updatedAttendance,
    });
  } catch (error) {
    console.error("CHECKOUT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to mark check-out.",
      error: error.message,
    });
  }
});

module.exports = router;

