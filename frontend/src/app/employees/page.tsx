"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";

type Employee = {
  id: number;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  photoUrl: string | null;
};

// Public backend URL
const API_URL = "https://attendance-backend-2nky.onrender.com";

export default function EmployeeRegistration() {
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [formData, setFormData] = useState({
    employeeId: "",
    name: "",
    email: "",
    department: "",
  });

  const [photo, setPhoto] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch employees from backend
  const fetchEmployees = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/employees`
      );

      const data = await response.json();

      if (data.success) {
        setEmployees(data.employees);
      } else {
        setMessage("Failed to fetch employees.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  // Load employees when page opens
  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePhotoChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0] ?? null;
    setPhoto(file);
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setMessage("Registering employee...");

    try {
      const response = await fetch(
        `${API_URL}/api/employees`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            employeeId: formData.employeeId,
            name: formData.name,
            email: formData.email,
            department: formData.department,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message || "Failed to register employee."
        );
        return;
      }

      setMessage("Employee registered successfully.");

      // Clear form
      setFormData({
        employeeId: "",
        name: "",
        email: "",
        department: "",
      });

      setPhoto(null);

      // Refresh employee list
      fetchEmployees();
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to backend.");
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-10">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Employee Registration
          </h1>

          <p className="mt-2 text-gray-600">
            Register and manage employees in the Smart Attendance System.
          </p>
        </div>

        {/* Registration Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-xl bg-white p-8 shadow"
        >
          <h2 className="mb-6 text-xl font-bold text-gray-900">
            Register New Employee
          </h2>

          {/* Employee ID */}
          <div className="mb-6">
            <label
              htmlFor="employeeId"
              className="mb-2 block font-medium text-gray-700"
            >
              Employee ID
            </label>

            <input
              id="employeeId"
              name="employeeId"
              type="text"
              placeholder="Example: EMP005"
              value={formData.employeeId}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          {/* Name */}
          <div className="mb-6">
            <label
              htmlFor="name"
              className="mb-2 block font-medium text-gray-700"
            >
              Employee Name
            </label>

            <input
              id="name"
              name="name"
              type="text"
              placeholder="Enter employee name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          {/* Email */}
          <div className="mb-6">
            <label
              htmlFor="email"
              className="mb-2 block font-medium text-gray-700"
            >
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="employee@company.com"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          {/* Department */}
          <div className="mb-6">
            <label
              htmlFor="department"
              className="mb-2 block font-medium text-gray-700"
            >
              Department
            </label>

            <select
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
            >
              <option value="">Select department</option>
              <option value="Production">Production</option>
              <option value="Quality">Quality</option>
              <option value="Maintenance">Maintenance</option>
              <option value="HR">HR</option>
              <option value="IT">IT</option>
              <option value="Finance">Finance</option>
            </select>
          </div>

          {/* Photo */}
          <div className="mb-8">
            <label
              htmlFor="photo"
              className="mb-2 block font-medium text-gray-700"
            >
              Employee Photo
            </label>

            <input
              id="photo"
              name="photo"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="w-full rounded-lg border border-gray-300 p-3"
            />

            {photo && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {photo.name}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Register Employee
          </button>

          {/* Message */}
          {message && (
            <div className="mt-5 rounded-lg bg-blue-50 p-4 text-blue-700">
              {message}
            </div>
          )}
        </form>

        {/* Employee List */}
        <div className="mt-8 overflow-hidden rounded-xl bg-white shadow">

          <div className="border-b px-6 py-5">
            <h2 className="text-xl font-bold text-gray-900">
              Registered Employees
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Employees fetched from the backend database.
            </p>
          </div>

          {loading ? (
            <div className="p-6 text-gray-600">
              Loading employees...
            </div>
          ) : employees.length === 0 ? (
            <div className="p-6 text-gray-600">
              No employees found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">

                <thead className="bg-gray-50 text-sm text-gray-600">
                  <tr>
                    <th className="px-6 py-4">Employee ID</th>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Department</th>
                  </tr>
                </thead>

                <tbody>
                  {employees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 font-semibold">
                        {employee.employeeId}
                      </td>

                      <td className="px-6 py-4">
                        {employee.name}
                      </td>

                      <td className="px-6 py-4">
                        {employee.email}
                      </td>

                      <td className="px-6 py-4">
                        {employee.department}
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}