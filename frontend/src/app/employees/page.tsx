"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";

const API_BASE_URL =
  "https://attendance-backend-2nky.onrender.com";

type Employee = {
  id: number;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function EmployeesPage() {
  const [employeeId, setEmployeeId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ======================================================
  // FETCH EMPLOYEES
  // ======================================================

  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);

      const response = await fetch(
        `${API_BASE_URL}/api/employees`
      );

      const data = await response.json();

      if (data.success) {
        setEmployees(data.employees || []);
      } else {
        setError(
          data.message || "Failed to load employees."
        );
      }
    } catch (err) {
      console.error("FETCH EMPLOYEES ERROR:", err);

      setError(
        "Unable to connect to the attendance backend."
      );
    } finally {
      setLoadingEmployees(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // ======================================================
  // PHOTO CHANGE
  // ======================================================

  const handlePhotoChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      setPhoto(null);
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setPhoto(null);
      event.target.value = "";

      setError(
        "Only JPG, PNG and WebP image files are allowed."
      );

      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setPhoto(null);
      event.target.value = "";

      setError(
        "Employee Photo must be 5 MB or smaller."
      );

      return;
    }

    setError("");
    setPhoto(selectedFile);
  };

  // ======================================================
  // REGISTER EMPLOYEE
  // ======================================================

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setMessage("");
    setError("");

    // --------------------------------------------------
    // Frontend validation
    // --------------------------------------------------

    if (!employeeId.trim()) {
      setError("Employee ID is required.");
      return;
    }

    if (!name.trim()) {
      setError("Employee Name is required.");
      return;
    }

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!department.trim()) {
      setError("Department is required.");
      return;
    }

    if (!password) {
      setError("Employee Password is required.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Employee Password must be at least 6 characters."
      );
      return;
    }

    if (!confirmPassword) {
      setError("Confirm Password is required.");
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Employee Password and Confirm Password do not match."
      );
      return;
    }

    if (!photo) {
      setError("Employee Photo is required.");
      return;
    }

    try {
      setLoading(true);

      // ------------------------------------------------
      // Multipart form data
      // ------------------------------------------------

      const formData = new FormData();

      formData.append(
        "employeeId",
        employeeId.trim()
      );

      formData.append("name", name.trim());

      formData.append("email", email.trim());

      formData.append(
        "department",
        department.trim()
      );

      formData.append("password", password);

      formData.append(
        "confirmPassword",
        confirmPassword
      );

      formData.append("photo", photo);

      // ------------------------------------------------
      // Send to backend
      // ------------------------------------------------

      const response = await fetch(
        `${API_BASE_URL}/api/employees`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to register employee."
        );
      }

      // ------------------------------------------------
      // Success
      // ------------------------------------------------

      setMessage(
        "Employee registered successfully with photo."
      );

      // Clear form

      setEmployeeId("");
      setName("");
      setEmail("");
      setDepartment("");
      setPassword("");
      setConfirmPassword("");
      setPhoto(null);

      const photoInput =
        document.getElementById(
          "employeePhoto"
        ) as HTMLInputElement | null;

      if (photoInput) {
        photoInput.value = "";
      }

      // Refresh employee list

      await fetchEmployees();
    } catch (err) {
      console.error(
        "REGISTER EMPLOYEE ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to register employee."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        background: "#f5f7fb",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontSize: "32px",
            fontWeight: 700,
            marginBottom: "8px",
          }}
        >
          Employee Registration
        </h1>

        <p
          style={{
            color: "#555",
            marginBottom: "30px",
          }}
        >
          Register employees with secure password
          authentication and Cloudinary photo storage.
        </p>

        {/* ==================================================
            REGISTRATION FORM
        ================================================== */}

        <form
          onSubmit={handleSubmit}
          style={{
            background: "#ffffff",
            padding: "30px",
            borderRadius: "12px",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.08)",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
            }}
          >
            {/* Employee ID */}

            <div>
              <label>
                Employee ID *
              </label>

              <input
                type="text"
                value={employeeId}
                onChange={(e) =>
                  setEmployeeId(e.target.value)
                }
                placeholder="Enter Employee ID"
                required
                style={inputStyle}
              />
            </div>

            {/* Employee Name */}

            <div>
              <label>
                Employee Name *
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="Enter Employee Name"
                required
                style={inputStyle}
              />
            </div>

            {/* Email */}

            <div>
              <label>
                Email *
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="Enter Email"
                required
                style={inputStyle}
              />
            </div>

            {/* Department */}

            <div>
              <label>
                Department *
              </label>

              <select
                value={department}
                onChange={(e) =>
                  setDepartment(e.target.value)
                }
                required
                style={inputStyle}
              >
                <option value="">
                  Select Department
                </option>

                <option value="Production">
                  Production
                </option>

                <option value="Quality">
                  Quality
                </option>

                <option value="Maintenance">
                  Maintenance
                </option>

                <option value="Operations">
                  Operations
                </option>

                <option value="HR">
                  HR
                </option>

                <option value="IT">
                  IT
                </option>

                <option value="Finance">
                  Finance
                </option>
              </select>
            </div>

            {/* Password */}

            <div>
              <label>
                Employee Password *
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Minimum 6 characters"
                required
                style={inputStyle}
              />
            </div>

            {/* Confirm Password */}

            <div>
              <label>
                Confirm Employee Password *
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
                placeholder="Confirm Password"
                required
                style={inputStyle}
              />
            </div>

            {/* Employee Photo */}

            <div
              style={{
                gridColumn: "1 / -1",
              }}
            >
              <label>
                Employee Photo *
              </label>

              <input
                id="employeePhoto"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                required
                style={inputStyle}
              />

              <p
                style={{
                  marginTop: "6px",
                  fontSize: "13px",
                  color: "#666",
                }}
              >
                JPG, PNG or WebP. Maximum size: 5 MB.
              </p>

              {photo && (
                <p
                  style={{
                    fontSize: "14px",
                    color: "green",
                  }}
                >
                  Selected: {photo.name}
                </p>
              )}
            </div>
          </div>

          {/* Messages */}

          {error && (
            <div
              style={{
                marginTop: "20px",
                padding: "12px",
                background: "#fee2e2",
                color: "#991b1b",
                borderRadius: "8px",
              }}
            >
              {error}
            </div>
          )}

          {message && (
            <div
              style={{
                marginTop: "20px",
                padding: "12px",
                background: "#dcfce7",
                color: "#166534",
                borderRadius: "8px",
              }}
            >
              {message}
            </div>
          )}

          {/* Register button */}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "25px",
              padding: "13px 25px",
              border: "none",
              borderRadius: "8px",
              background:
                loading ? "#999" : "#2563eb",
              color: "#ffffff",
              fontSize: "16px",
              fontWeight: 600,
              cursor: loading
                ? "not-allowed"
                : "pointer",
            }}
          >
            {loading
              ? "Registering Employee..."
              : "Register Employee"}
          </button>
        </form>

        {/* ==================================================
            REGISTERED EMPLOYEES
        ================================================== */}

        <section
          style={{
            background: "#ffffff",
            padding: "30px",
            borderRadius: "12px",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.08)",
          }}
        >
          <h2
            style={{
              fontSize: "24px",
              fontWeight: 700,
              marginBottom: "20px",
            }}
          >
            Registered Employees
          </h2>

          {loadingEmployees ? (
            <p>Loading employees...</p>
          ) : employees.length === 0 ? (
            <p>No employees registered yet.</p>
          ) : (
            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr>
                    <th style={thStyle}>
                      Photo
                    </th>

                    <th style={thStyle}>
                      Employee ID
                    </th>

                    <th style={thStyle}>
                      Name
                    </th>

                    <th style={thStyle}>
                      Email
                    </th>

                    <th style={thStyle}>
                      Department
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {employees.map(
                    (employee) => (
                      <tr
                        key={employee.id}
                      >
                        <td style={tdStyle}>
                          {employee.photoUrl ? (
                            <img
                              src={
                                employee.photoUrl
                              }
                              alt={
                                employee.name
                              }
                              width={60}
                              height={60}
                              style={{
                                width: "60px",
                                height: "60px",
                                objectFit:
                                  "cover",
                                borderRadius:
                                  "50%",
                              }}
                            />
                          ) : (
                            "No Photo"
                          )}
                        </td>

                        <td style={tdStyle}>
                          {
                            employee.employeeId
                          }
                        </td>

                        <td style={tdStyle}>
                          {employee.name}
                        </td>

                        <td style={tdStyle}>
                          {employee.email}
                        </td>

                        <td style={tdStyle}>
                          {
                            employee.department
                          }
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  marginTop: "8px",
  padding: "12px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  fontSize: "15px",
  boxSizing: "border-box" as const,
};

const thStyle = {
  textAlign: "left" as const,
  padding: "12px",
  borderBottom: "2px solid #e5e7eb",
};

const tdStyle = {
  padding: "12px",
  borderBottom: "1px solid #e5e7eb",
};