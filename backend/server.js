const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 5000;

/*
 * CORS
 * Allows the Vercel frontend and mobile browsers
 * to communicate with this backend.
 */
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*
 * Health check
 */
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Smart Attendance Backend is running",
    status: "OK",
    port: PORT,
  });
});

/*
 * API health check
 */
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Smart Attendance API is healthy",
  });
});

/*
 * Load application routes
 */
try {
  const employeeRoutes = require("./routes/employeeRoutes");
  app.use("/api/employees", employeeRoutes);
} catch (error) {
  console.error("Employee routes could not be loaded:");
  console.error(error.message);
}

try {
  const attendanceRoutes = require("./routes/attendanceRoutes");
  app.use("/api/attendance", attendanceRoutes);
} catch (error) {
  console.error("Attendance routes could not be loaded:");
  console.error(error.message);
}

/*
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
    path: req.originalUrl,
  });
});

/*
 * Global error handler
 */
app.use((error, req, res, next) => {
  console.error("Server error:", error);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

/*
 * IMPORTANT:
 * Use process.env.PORT for cloud deployment.
 * Listen on 0.0.0.0 so cloud hosting platforms
 * can reach the application.
 */
app.listen(PORT, "0.0.0.0", () => {
  console.log("========================================");
  console.log("Smart Attendance Backend");
  console.log(`Server running on port ${PORT}`);
  console.log("Host: 0.0.0.0");
  console.log("========================================");
});