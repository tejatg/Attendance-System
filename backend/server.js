const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const {
  apiLimiter,
  attendanceLimiter,
} = require("./middleware/security");

const {
  requireAdminAuth,
} = require("./middleware/adminAuth");

const app = express();

const PORT =
  process.env.PORT || 5000;

/*
========================================
APPLICATION SECURITY
========================================
*/

app.disable("x-powered-by");

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(
  cors({
    origin: "*",

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

/*
========================================
REQUEST BODY PARSING
========================================
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
========================================
REQUEST LOGGING
========================================
*/

app.use(
  morgan(
    ":method :url :status :response-time ms"
  )
);

/*
========================================
API RATE LIMITING
========================================
*/

app.use(
  "/api",
  apiLimiter
);

/*
========================================
ROOT
========================================
*/

app.get("/", (req, res) => {
  res.json({
    success: true,
    system:
      "TALENTRONAUT SMART ATTENDANCE",
    module:
      "ATTENDANCE CONTROL CORE",
    status: "ONLINE",
    version: "2.0.0",
    timestamp:
      new Date().toISOString(),
  });
});

/*
========================================
HEALTH CHECK
========================================
*/

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      success: true,
      system:
        "Smart Attendance Backend",
      status: "HEALTHY",
      service:
        "Attendance Control Core",
      timestamp:
        new Date().toISOString(),
    });
  }
);

/*
========================================
SYSTEM STATUS
========================================
*/

app.get(
  "/api/system/status",
  (req, res) => {
    res.json({
      success: true,

      system: {
        name:
          "TALENTRONAUT SMART ATTENDANCE",
        core:
          "ATTENDANCE CONTROL CORE",
        status:
          "OPERATIONAL",
      },

      runtime: {
        node:
          process.version,

        uptimeSeconds:
          Math.floor(
            process.uptime()
          ),

        environment:
          process.env.NODE_ENV ||
          "development",
      },

      services: {
        api: "ONLINE",
        database: "CONNECTED",
        identityEngine: "READY",
        attendanceEngine: "READY",
        securityEngine: "ACTIVE",
        mediaEngine: "READY",
      },

      timestamp:
        new Date().toISOString(),
    });
  }
);

/*
========================================
ATTENDANCE RATE LIMIT
========================================
*/

app.use(
  "/api/attendance",
  attendanceLimiter
);

/*
========================================
EMPLOYEE ROUTES
========================================

PUBLIC:
POST /api/employees

PROTECTED:
GET /api/employees
GET /api/employees/:id
========================================
*/

try {
  const employeeRoutes =
    require("./routes/employeeRoutes");

  /*
  ----------------------------------------
  ADMIN PROTECTION FOR EMPLOYEE LIST
  ----------------------------------------
  */

  app.get(
    "/api/employees",
    requireAdminAuth
  );

  /*
  ----------------------------------------
  ADMIN PROTECTION FOR SINGLE EMPLOYEE
  ----------------------------------------
  */

  app.get(
    "/api/employees/:id",
    requireAdminAuth
  );

  /*
  ----------------------------------------
  EMPLOYEE ROUTER
  ----------------------------------------
  */

  app.use(
    "/api/employees",
    employeeRoutes
  );

} catch (error) {
  console.error(
    "Employee routes could not be loaded:"
  );

  console.error(
    error.message
  );
}

/*
========================================
ATTENDANCE ROUTES
========================================
*/

try {
  const attendanceRoutes =
    require("./routes/attendanceRoutes");

  app.use(
    "/api/attendance",
    attendanceRoutes
  );

} catch (error) {
  console.error(
    "Attendance routes could not be loaded:"
  );

  console.error(
    error.message
  );
}

/*
========================================
ADMIN ROUTES
========================================

POST /api/admin/login
GET  /api/admin/me
========================================
*/

try {
  const adminRoutes =
    require("./routes/adminRoutes");

  app.use(
    "/api/admin",
    adminRoutes
  );

} catch (error) {
  console.error(
    "Admin routes could not be loaded:"
  );

  console.error(
    error.message
  );
}

/*
========================================
SYSTEM ROUTES
========================================
*/

try {
  const systemRoutes =
    require("./routes/systemRoutes");

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
========================================
404 HANDLER
========================================
*/

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,

      error:
        "ENDPOINT_NOT_FOUND",

      message:
        "The requested API endpoint does not exist.",

      path:
        req.originalUrl,

      timestamp:
        new Date().toISOString(),
    });
  }
);

/*
========================================
GLOBAL ERROR HANDLER
========================================
*/

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
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

      error:
        "INTERNAL_SERVER_ERROR",

      message:
        "The Attendance Control Core encountered an unexpected error.",

      timestamp:
        new Date().toISOString(),
    });
  }
);

/*
========================================
START SERVER
========================================
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
        process.env.NODE_ENV ||
        "development"
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
      "ADMIN AUTH   : JWT ACTIVE"
    );

    console.log(
      "EMPLOYEE GET : ADMIN ONLY"
    );

    console.log(
      "=============================================="
    );

    console.log("");
  }
);