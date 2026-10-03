const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { isInsideGeofence } = require("../utils/geofence");

const router = express.Router();
const prisma = new PrismaClient();

// ======================================================
// GET ALL ATTENDANCE RECORDS
// ======================================================
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

// ======================================================
// POST - MARK CHECK-IN
// ======================================================
router.post("/", async (req, res) => {
  try {
    const {
      employeeId,
      status,
      checkIn,
      checkOut,
      latitude,
      longitude,
    } = req.body;

    // --------------------------------------------------
    // 1. Validate Employee ID
    // --------------------------------------------------
    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required.",
      });
    }

    // --------------------------------------------------
    // 2. Validate GPS coordinates
    // --------------------------------------------------
    const userLatitude = Number(latitude);
    const userLongitude = Number(longitude);

    if (
      !Number.isFinite(userLatitude) ||
      !Number.isFinite(userLongitude)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid latitude or longitude.",
      });
    }

    // --------------------------------------------------
    // 3. Check Geofence
    // --------------------------------------------------
    let geofenceResult;

    try {
      geofenceResult = isInsideGeofence(
        userLatitude,
        userLongitude
      );
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    if (!geofenceResult.allowed) {
      return res.status(403).json({
        success: false,
        message: "You are outside the attendance location.",
        distance: Math.round(geofenceResult.distance),
        allowedRadius: geofenceResult.radius,
      });
    }

    // --------------------------------------------------
    // 4. Check Employee Exists
    // --------------------------------------------------
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

    // --------------------------------------------------
    // 5. Get Today's Date Range
    // --------------------------------------------------
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // --------------------------------------------------
    // 6. Prevent Duplicate Check-In
    // --------------------------------------------------
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

    // --------------------------------------------------
    // 7. Create Attendance Record
    // --------------------------------------------------
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

        // Geofence information
        checkInLat: userLatitude,
        checkInLng: userLongitude,
        checkInDistance: geofenceResult.distance,

        // QR verification will be connected later
        // after secure company QR token validation.
        qrVerified: false,
      },

      include: {
        employee: true,
      },
    });

    // --------------------------------------------------
    // 8. Success Response
    // --------------------------------------------------
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

// ======================================================
// PUT - MARK CHECK-OUT
// ======================================================
router.put("/checkout/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;

    // --------------------------------------------------
    // 1. Validate Employee
    // --------------------------------------------------
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

    // --------------------------------------------------
    // 2. Find Active Attendance
    // --------------------------------------------------
    const attendance =
      await prisma.attendance.findFirst({
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
        message:
          "No active attendance record found for this employee.",
      });
    }

    // --------------------------------------------------
    // 3. Update Check-Out
    // --------------------------------------------------
    const updatedAttendance =
      await prisma.attendance.update({
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

    // --------------------------------------------------
    // 4. Success Response
    // --------------------------------------------------
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

// ======================================================
// EXPORT ROUTER
// ======================================================
module.exports = router;