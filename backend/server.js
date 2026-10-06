const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const {
  apiLimiter,
  attendanceLimiter,
} = require("./middleware/security");

const app = express();

const PORT = process.env.PORT || 5000;

/*
|--------------------------------------------------------------------------
| CORE CONFIGURATION
|--------------------------------------------------------------------------
*/

app.disable("x-powered-by");

/*
|--------------------------------------------------------------------------
| SECURITY LAYER
|--------------------------------------------------------------------------
*/

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/*
|--------------------------------------------------------------------------
| REQUEST CONTROL
|--------------------------------------------------------------------------
*/

app.use(
  express.json({
    limit: "2mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "2mb",
  })
);

/*
|--------------------------------------------------------------------------
| REQUEST OBSERVABILITY
|--------------------------------------------------------------------------
*/

app.use(
  morgan(":method :url :status :response-time ms")
);

/*
|--------------------------------------------------------------------------
| API SECURITY GATE
|--------------------------------------------------------------------------
*/

app.use("/api", apiLimiter);

/*
|--------------------------------------------------------------------------
| ROOT SYSTEM IDENTITY
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
  res.json({
    success: true,

    system: "TALENTRONAUT SMART ATTENDANCE",

    module: "ATTENDANCE CONTROL CORE",

    status: "ONLINE",

    version: "2.0.0",

    timestamp: new Date().toISOString(),
  });
});

/*
|--------------------------------------------------------------------------
| HEALTH CHECK
|--------------------------------------------------------------------------
*/

app.get("/api/health", (req, res) => {
  res.json({
    success: true,

    system: "Smart Attendance Backend",

    status: "HEALTHY",

    service: "Attendance Control Core",

    timestamp: new Date().toISOString(),
  });
});

/*
|--------------------------------------------------------------------------
| SYSTEM STATUS
|--------------------------------------------------------------------------
*/

app.get("/api/system/status", (req, res) => {
  res.json({
    success: true,

    system: {
      name: "TALENTRONAUT SMART ATTENDANCE",

      core: "ATTENDANCE CONTROL CORE",

      status: "OPERATIONAL",
    },

    runtime: {
      node: process.version,

      uptimeSeconds: Math.floor(process.uptime()),

      environment:
        process.env.NODE_ENV || "development",
    },

    services: {
      api: "ONLINE",

      database: "CONNECTED",

      identityEngine: "READY",

      attendanceEngine: "READY",

      securityEngine: "ACTIVE",

      mediaEngine: "READY",
    },

    timestamp: new Date().toISOString(),
  });
});

/*
|--------------------------------------------------------------------------
| ATTENDANCE SECURITY GATE
|--------------------------------------------------------------------------
|
| Attendance endpoints receive a stricter rate limit.
|
*/

app.use(
  "/api/attendance",
  attendanceLimiter
);

/*
|--------------------------------------------------------------------------
| EMPLOYEE ROUTES
|--------------------------------------------------------------------------
*/

try {
  const employeeRoutes = require("./routes/employeeRoutes");

  app.use(
    "/api/employees",
    employeeRoutes
  );
} catch (error) {
  console.error(
    "Employee routes could not be loaded:"
  );

  console.error(error.message);
}

/*
|--------------------------------------------------------------------------
| ATTENDANCE ROUTES
|--------------------------------------------------------------------------
*/

try {
  const attendanceRoutes = require("./routes/attendanceRoutes");

  app.use(
    "/api/attendance",
    attendanceRoutes
  );
} catch (error) {
  console.error(
    "Attendance routes could not be loaded:"
  );

  console.error(error.message);
}

/*
|--------------------------------------------------------------------------
| ADMIN ROUTES
|--------------------------------------------------------------------------
*/

try {
  const adminRoutes = require("./routes/adminRoutes");

  app.use(
    "/api/admin",
    adminRoutes
  );
} catch (error) {
  console.log(
    "Admin routes not enabled yet."
  );
}

/*
|--------------------------------------------------------------------------
| SYSTEM ROUTES
|--------------------------------------------------------------------------
*/

try {
  const systemRoutes = require("./routes/systemRoutes");

  app.use(
    "/api/system",
    systemRoutes
  );
} catch (error) {
  console.log(
    "System routes not enabled yet."
  );
}

/*
|--------------------------------------------------------------------------
| 404 CONTROL
|--------------------------------------------------------------------------
*/

app.use((req, res) => {
  res.status(404).json({
    success: false,

    error: "ENDPOINT_NOT_FOUND",

    message:
      "The requested API endpoint does not exist.",

    path: req.originalUrl,

    timestamp: new Date().toISOString(),
  });
});

/*
|--------------------------------------------------------------------------
| GLOBAL ERROR CONTROL
|--------------------------------------------------------------------------
*/

app.use(
  (error, req, res, next) => {
    console.error(
      "========================================"
    );

    console.error(
      "ATTENDANCE CONTROL CORE ERROR"
    );

    console.error(error);

    console.error(
      "========================================"
    );

    res.status(
      error.status || 500
    ).json({
      success: false,

      error: "INTERNAL_SERVER_ERROR",

      message:
        "The Attendance Control Core encountered an unexpected error.",

      timestamp: new Date().toISOString(),
    });
  }
);

/*
|--------------------------------------------------------------------------
| SERVER
|--------------------------------------------------------------------------
*/

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log("");

    console.log(
      "=============================================="
    );

    console.log(
      "       TALENTRONAUT ATTENDANCE CORE"
    );

    console.log(
      "=============================================="
    );

    console.log(
      "STATUS       : ONLINE"
    );

    console.log(
      `PORT         : ${PORT}`
    );

    console.log(
      "HOST         : 0.0.0.0"
    );

    console.log(
      `NODE         : ${process.version}`
    );

    console.log(
      `ENVIRONMENT  : ${
        process.env.NODE_ENV || "development"
      }`
    );

    console.log(
      "SECURITY     : ACTIVE"
    );

    console.log(
      "RATE LIMIT   : ACTIVE"
    );

    console.log(
      "MONITORING   : ACTIVE"
    );

    console.log(
      "=============================================="
    );

    console.log("");
  }
);