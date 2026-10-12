const express = require("express");
const multer = require("multer");

const prisma = require("../lib/prisma");
const cloudinary = require("../utils/cloudinary");
const { logAuditEvent } = require("../utils/auditLogger");
const { requireAdminAuth } = require("../middleware/adminAuth");
const { requireEmployeeAuth } = require("../middleware/employeeAuth");

const router = express.Router();

/*
========================================
CONFIGURATION
========================================
Business "day" boundaries are calculated in the
business time zone, not in the server (UTC) zone.
Default: India Standard Time, UTC+05:30 (330 minutes).
Override with ATTENDANCE_TZ_OFFSET_MINUTES.
*/

const TZ_OFFSET_MINUTES = Number.isFinite(
  Number(process.env.ATTENDANCE_TZ_OFFSET_MINUTES)
) && process.env.ATTENDANCE_TZ_OFFSET_MINUTES !== undefined
  ? Number(process.env.ATTENDANCE_TZ_OFFSET_MINUTES)
  : 330;

function businessDayRange(now = new Date()) {
  const offsetMs = TZ_OFFSET_MINUTES * 60 * 1000;
  const shifted = new Date(now.getTime() + offsetMs);

  const startShifted = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate()
  );

  const start = new Date(startShifted - offsetMs);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return { start, end };
}

const attendanceEmployeeSelect = {
  id: true,
  employeeId: true,
  name: true,
  email: true,
  department: true,
  location: true,
  photoUrl: true,
};

/*
========================================
PHOTO UPLOAD
========================================
*/

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PHOTO_BYTES, files: 1, fields: 10 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];

    if (!allowed.includes(file.mimetype)) {
      const error = new Error("Only JPG, PNG or WEBP photos are allowed.");
      error.code = "INVALID_PHOTO_TYPE";
      return cb(error);
    }

    cb(null, true);
  },
});

function photoUpload(req, res, next) {
  upload.single("photo")(req, res, (error) => {
    if (!error) return next();

    let message = "Invalid photo upload.";

    if (error.code === "LIMIT_FILE_SIZE") {
      message = "Photo is too large. The maximum size is 5 MB.";
    } else if (error.code === "INVALID_PHOTO_TYPE") {
      message = error.message;
    }

    return res.status(400).json({ success: false, message });
  });
}

/* Verify the file really is an image (not just a client-supplied MIME type). */
function hasImageSignature(buffer) {
  if (!buffer || buffer.length < 12) return false;

  const jpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

  const png =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;

  const webp =
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP";

  return jpeg || png || webp;
}

function uploadToCloudinary(buffer, kind) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `talentronaut/smart-attendance/attendance/${kind}`,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);

        if (!result || !result.secure_url) {
          return reject(new Error("Cloudinary did not return a photo URL."));
        }

        resolve(result);
      }
    );

    stream.end(buffer);
  });
}

function parseCoordinate(value, min, max) {
  if (value === undefined || value === null || value === "") return null;

  const number = Number(value);

  if (!Number.isFinite(number) || number < min || number > max) return null;

  return number;
}

function requestMeta(req) {
  return {
    ipAddress: req.ip || null,
    userAgent: req.get("user-agent") || null,
  };
}

/*
Validates the uploaded photo and sends it to Cloudinary.
Returns { ok: true, result } or { ok: false, status, message }.
*/
async function storePhoto(req, kind) {
  if (!req.file) {
    return { ok: false, status: 400, message: "A photo is required." };
  }

  if (!hasImageSignature(req.file.buffer)) {
    return {
      ok: false,
      status: 400,
      message: "The uploaded file is not a valid image.",
    };
  }

  try {
    const result = await uploadToCloudinary(req.file.buffer, kind);
    return { ok: true, result };
  } catch (error) {
    console.error("ATTENDANCE PHOTO UPLOAD ERROR:", error.message);

    return {
      ok: false,
      status: 502,
      message: "Photo upload failed. Attendance was not recorded. Please try again.",
    };
  }
}

/*
========================================
GET MY ATTENDANCE
EMPLOYEE JWT REQUIRED
GET /api/attendance/my
========================================
The employee is taken from the verified token only.
*/

router.get("/my", requireEmployeeAuth, async (req, res) => {
  try {
    const attendance = await prisma.attendance.findMany({
      where: { employeeId: req.employee.employeeId },
      orderBy: { date: "desc" },
      take: 200,
    });

    return res.status(200).json({ success: true, attendance });
  } catch (error) {
    console.error("MY ATTENDANCE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your attendance records.",
    });
  }
});

/*
========================================
GET ALL ATTENDANCE
ADMIN JWT REQUIRED
GET /api/attendance
========================================
*/

router.get("/", requireAdminAuth, async (req, res) => {
  try {
    const attendance = await prisma.attendance.findMany({
      include: { employee: { select: attendanceEmployeeSelect } },
      orderBy: { date: "desc" },
      take: 1000,
    });

    return res.json({ success: true, attendance });
  } catch (error) {
    console.error("ATTENDANCE GET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch attendance records.",
    });
  }
});

/*
========================================
CHECK IN
POST /api/attendance
EMPLOYEE JWT + multipart "photo"
optional fields: latitude, longitude
========================================
*/

router.post("/", requireEmployeeAuth, photoUpload, async (req, res) => {
  const { employeeId } = req.employee;

  try {
    const employee = await prisma.employee.findUnique({
      where: { employeeId },
      select: { employeeId: true, name: true, department: true },
    });

    if (!employee) {
      return res.status(403).json({
        success: false,
        message: "Employee account no longer exists.",
      });
    }

    const { start, end } = businessDayRange();

    const existing = await prisma.attendance.findFirst({
      where: {
        employeeId,
        OR: [
          { date: { gte: start, lt: end } },
          { checkOut: null, checkIn: { not: null } },
        ],
      },
      orderBy: { date: "desc" },
    });

    if (existing) {
      const stillOpen = !existing.checkOut;

      await logAuditEvent({
        eventType: "ATTENDANCE_CHECK_IN_FAILED",
        employeeId,
        actor: employeeId,
        description: "Check-In rejected: attendance already exists.",
        ...requestMeta(req),
        metadata: { reason: "DUPLICATE_ATTENDANCE", attendanceId: existing.id },
      });

      return res.status(409).json({
        success: false,
        message: stillOpen
          ? "You are already checked in. Please check out first."
          : "You have already completed attendance for today.",
      });
    }

    const stored = await storePhoto(req, "check-in");

    if (!stored.ok) {
      return res
        .status(stored.status)
        .json({ success: false, message: stored.message });
    }

    const latitude = parseCoordinate(req.body?.latitude, -90, 90);
    const longitude = parseCoordinate(req.body?.longitude, -180, 180);

    const attendance = await prisma.attendance.create({
      data: {
        employeeId,
        status: "Present",
        checkIn: new Date(),
        checkOut: null,
        latitude,
        longitude,
        checkInPhotoUrl: stored.result.secure_url,
      },
      include: { employee: { select: attendanceEmployeeSelect } },
    });

    await logAuditEvent({
      eventType: "ATTENDANCE_CHECK_IN",
      employeeId,
      actor: employeeId,
      description: `Employee ${employee.name} checked in.`,
      ...requestMeta(req),
      metadata: { attendanceId: attendance.id, hasLocation: latitude !== null },
    });

    return res.status(201).json({
      success: true,
      message: "Check-In recorded successfully.",
      attendance,
    });
  } catch (error) {
    console.error("ATTENDANCE CHECK-IN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark attendance.",
    });
  }
});

/*
========================================
CHECK OUT
PUT /api/attendance/checkout
EMPLOYEE JWT + multipart "photo"
optional fields: latitude, longitude
========================================
*/

router.put("/checkout", requireEmployeeAuth, photoUpload, async (req, res) => {
  const { employeeId } = req.employee;

  try {
    const open = await prisma.attendance.findFirst({
      where: { employeeId, checkIn: { not: null }, checkOut: null },
      orderBy: { date: "desc" },
    });

    if (!open) {
      await logAuditEvent({
        eventType: "ATTENDANCE_CHECK_OUT_FAILED",
        employeeId,
        actor: employeeId,
        description: "Check-Out rejected: no active check-in.",
        ...requestMeta(req),
        metadata: { reason: "NO_ACTIVE_ATTENDANCE" },
      });

      return res.status(409).json({
        success: false,
        message: "No active check-in found. Please check in first.",
      });
    }

    const stored = await storePhoto(req, "check-out");

    if (!stored.ok) {
      return res
        .status(stored.status)
        .json({ success: false, message: stored.message });
    }

    const latitude = parseCoordinate(req.body?.latitude, -90, 90);
    const longitude = parseCoordinate(req.body?.longitude, -180, 180);

    /* Conditional update prevents double check-out from concurrent requests. */
    const updated = await prisma.attendance.updateMany({
      where: { id: open.id, checkOut: null },
      data: {
        checkOut: new Date(),
        checkOutPhotoUrl: stored.result.secure_url,
        ...(latitude !== null && longitude !== null
          ? { latitude, longitude }
          : {}),
      },
    });

    if (updated.count === 0) {
      return res.status(409).json({
        success: false,
        message: "This attendance session was already checked out.",
      });
    }

    const attendance = await prisma.attendance.findUnique({
      where: { id: open.id },
      include: { employee: { select: attendanceEmployeeSelect } },
    });

    await logAuditEvent({
      eventType: "ATTENDANCE_CHECK_OUT",
      employeeId,
      actor: employeeId,
      description: "Employee checked out.",
      ...requestMeta(req),
      metadata: { attendanceId: open.id },
    });

    return res.json({
      success: true,
      message: "Check-Out recorded successfully.",
      attendance,
    });
  } catch (error) {
    console.error("ATTENDANCE CHECK-OUT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark Check-Out.",
    });
  }
});

module.exports = router;
module.exports.businessDayRange = businessDayRange;
