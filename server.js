const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const employeeRoutes = require("./routes/employeeRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");

app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);

// Home API
app.get("/", (req, res) => {
  res.json({
    message: "Smart Attendance Backend is running",
  });
});

// Health check API
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Smart Attendance API is healthy",
  });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend server running on port ${PORT}`);
});