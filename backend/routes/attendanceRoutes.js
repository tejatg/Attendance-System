const express = require("express");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const router = express.Router();
const prisma = new PrismaClient();

/*
========================================
GET ALL ATTENDANCE
========================================
*/

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

/*
========================================
CHECK IN
Employee Name + Department + Password
========================================
*/

router.post("/", async (req, res) => {
  try {
    const {
      name,
      department,
      password,
      status,
      checkIn,
      checkOut,
      latitude,
      longitude,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Employee Name is required.",
      });
    }

    if (!department || !department.trim()) {
      return res.status(400).json({
        success: false,
        message: "Employee Department is required.",
      });
    }

    if (!password || !password.trim()) {
      return res.status(400).json({
        success: false,
        message: "Employee Password is required.",
      });
    }

    const employee = await prisma.employee.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: "insensitive",
        },
        department: {
          equals: department.trim(),
          mode: "insensitive",
        },
      },
    });

    if (!employee) {
      return res.status(401).json({
        success: false,
        message: "Invalid Employee Name or Department.",
      });
    }

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
        message:
          "Invalid Employee Name, Department or Password.",
      });
    }

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

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

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

/*
========================================
CHECK OUT
Employee Name + Department + Password
Employee ID removed
========================================
*/

router.put("/checkout", async (req, res) => {
  try {
    const {
      name,
      department,
      password,
      latitude,
      longitude,
    } = req.body;

    /*
    VALIDATE EMPLOYEE NAME
    */

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Employee Name is required.",
      });
    }

    /*
    VALIDATE DEPARTMENT
    */

    if (!department || !department.trim()) {
      return res.status(400).json({
        success: false,
        message: "Employee Department is required.",
      });
    }

    /*
    VALIDATE PASSWORD
    */

    if (!password || !password.trim()) {
      return res.status(400).json({
        success: false,
        message: "Employee Password is required.",
      });
    }

    /*
    FIND EMPLOYEES
    */

    const employees = await prisma.employee.findMany({
      where: {
        name: {
          equals: name.trim(),
          mode: "insensitive",
        },
        department: {
          equals: department.trim(),
          mode: "insensitive",
        },
      },
    });

    /*
    EMPLOYEE NOT FOUND
    */

    if (employees.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid Employee Name or Department.",
      });
    }

    /*
    VERIFY PASSWORD
    */

    const matchingEmployees = [];

    for (const employee of employees) {
      if (!employee.passwordHash) {
        continue;
      }

      const passwordValid = await bcrypt.compare(
        password,
        employee.passwordHash
      );

      if (passwordValid) {
        matchingEmployees.push(employee);
      }
    }

    /*
    PASSWORD DOES NOT MATCH
    */

    if (matchingEmployees.length === 0) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid Employee Name, Department or Password.",
      });
    }

    /*
    MORE THAN ONE EMPLOYEE MATCHES
    */

    if (matchingEmployees.length > 1) {
      return res.status(409).json({
        success: false,
        message:
          "Multiple employees have the same Name and Department. Please use a unique employee record.",
      });
    }

    const employee = matchingEmployees[0];

    /*
    OPTIONAL GPS
    */

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

    /*
    FIND ACTIVE ATTENDANCE
    */

    const attendance =
      await prisma.attendance.findFirst({
        where: {
          employeeId: employee.employeeId,
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
          "No active attendance record found for this employee. Please Check In first.",
      });
    }

    /*
    UPDATE CHECK-OUT
    */

    const updatedAttendance =
      await prisma.attendance.update({
        where: {
          id: attendance.id,
        },

        data: {
          checkOut: new Date(),

          latitude:
            userLatitude !== null
              ? userLatitude
              : attendance.latitude,

          longitude:
            userLongitude !== null
              ? userLongitude
              : attendance.longitude,
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

    res.json({
      success: true,
      message: "Check-Out marked successfully.",
      attendance: updatedAttendance,
    });
  } catch (error) {
    console.error("CHECKOUT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to mark Check-Out.",
      error: error.message,
    });
  }
});

module.exports = router;