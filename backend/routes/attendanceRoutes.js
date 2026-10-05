const express = require("express");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const router = express.Router();
const prisma = new PrismaClient();

// ======================================================
// GET ALL ATTENDANCE RECORDS
// ======================================================

router.get("/", async (req, res) => {
  try {
    const attendance = await prisma.attendance.findMany({
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            name: true,
            email: true,
            department: true,
            location: true,
            photoUrl: true,
          },
        },
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
      password,
      status,
      checkIn,
      checkOut,
      latitude,
      longitude,
    } = req.body;

    // --------------------------------------------------
    // 1. Validate Employee ID
    // --------------------------------------------------

    if (!employeeId || !employeeId.trim()) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required.",
      });
    }

    // --------------------------------------------------
    // 2. Validate Employee Password
    // --------------------------------------------------

    if (!password || !password.trim()) {
      return res.status(400).json({
        success: false,
        message: "Employee Password is required.",
      });
    }

    // --------------------------------------------------
    // 3. Find Employee
    // --------------------------------------------------

    const employee = await prisma.employee.findUnique({
      where: {
        employeeId: employeeId.trim(),
      },
    });

    if (!employee) {
      return res.status(401).json({
        success: false,
        message: "Invalid Employee ID or Password.",
      });
    }

    // --------------------------------------------------
    // 4. Verify Employee Password
    // --------------------------------------------------

    if (!employee.passwordHash) {
      return res.status(403).json({
        success: false,
        message:
          "Employee password is not configured. Please contact your administrator.",
      });
    }

    const passwordValid = await bcrypt.compare(
      password,
      employee.passwordHash
    );

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid Employee ID or Password.",
      });
    }

    // --------------------------------------------------
    // 5. OPTIONAL GPS LOCATION
    // --------------------------------------------------
    // Location is NOT compulsory.
    //
    // If latitude and longitude are provided,
    // they are saved.
    //
    // If they are not provided, NULL is saved.
    //
    // There is NO geofence.
    // There is NO radius restriction.
    // --------------------------------------------------

    let userLatitude = null;
    let userLongitude = null;

    if (
      latitude !== undefined &&
      latitude !== null &&
      latitude !== ""
    ) {
      const parsedLatitude = Number(latitude);

      if (Number.isFinite(parsedLatitude)) {
        userLatitude = parsedLatitude;
      }
    }

    if (
      longitude !== undefined &&
      longitude !== null &&
      longitude !== ""
    ) {
      const parsedLongitude = Number(longitude);

      if (Number.isFinite(parsedLongitude)) {
        userLongitude = parsedLongitude;
      }
    }

    // --------------------------------------------------
    // 6. Get Today's Date Range
    // --------------------------------------------------

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // --------------------------------------------------
    // 7. Prevent Duplicate Check-In
    // --------------------------------------------------

    const existingAttendance =
      await prisma.attendance.findFirst({
        where: {
          employeeId: employee.employeeId,
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
    // 8. Create Attendance Record
    // --------------------------------------------------

    const attendance =
      await prisma.attendance.create({
        data: {
          employeeId: employee.employeeId,

          status: status || "Present",

          checkIn: checkIn
            ? new Date(checkIn)
            : new Date(),

          checkOut: checkOut
            ? new Date(checkOut)
            : null,

          latitude: userLatitude,
          longitude: userLongitude,
        },

        include: {
          employee: {
            select: {
              id: true,
              employeeId: true,
              name: true,
              email: true,
              department: true,
              location: true,
              photoUrl: true,
            },
          },
        },
      });

    // --------------------------------------------------
    // 9. Success Response
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

router.put(
  "/checkout/:employeeId",
  async (req, res) => {
    try {
      const { employeeId } = req.params;

      // ------------------------------------------------
      // 1. Validate Employee
      // ------------------------------------------------

      const employee =
        await prisma.employee.findUnique({
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

      // ------------------------------------------------
      // 2. Find Active Attendance
      // ------------------------------------------------

      const attendance =
        await prisma.attendance.findFirst({
          where: {
            employeeId,
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

      // ------------------------------------------------
      // 3. Update Check-Out
      // ------------------------------------------------

      const updatedAttendance =
        await prisma.attendance.update({
          where: {
            id: attendance.id,
          },

          data: {
            checkOut: new Date(),
          },

          include: {
            employee: {
              select: {
                id: true,
                employeeId: true,
                name: true,
                email: true,
                department: true,
                location: true,
                photoUrl: true,
              },
            },
          },
        });

      // ------------------------------------------------
      // 4. Success Response
      // ------------------------------------------------

      res.json({
        success: true,
        message:
          "Check-out marked successfully.",
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
  }
);

// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;