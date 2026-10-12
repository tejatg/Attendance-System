
import { apiRequest } from "@/util/api";

const TOKEN_KEY = "employeeToken";
const ID_KEY = "employeeId";
const NAME_KEY = "employeeName";

export class AuthError extends Error {
  constructor(message = "Your session has expired. Please sign in again.") {
    super(message);
    this.name = "AuthError";
  }
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function getEmployeeToken(): string | null {
  return read(TOKEN_KEY);
}

export function getEmployeeName(): string {
  return read(NAME_KEY) || read(ID_KEY) || "";
}

export function saveEmployeeSession(
  token: string,
  employee: { employeeId: string; name?: string }
) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(ID_KEY, employee.employeeId);
    localStorage.setItem(NAME_KEY, employee.name || "");
  } catch {
    throw new Error(
      "Your browser is blocking storage, so sign-in cannot be kept. Disable private mode and try again."
    );
  }
}

export function clearEmployeeSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ID_KEY);
    localStorage.removeItem(NAME_KEY);
  } catch {
    // Storage may be unavailable.
  }
}

/** Only allow redirects back into this app's employee pages. */
export function safeNextPath(value: string | null | undefined): string {
  if (
    value &&
    /^\/(attendance(\/(check-in|check-out))?|my-attendance)$/.test(value)
  ) {
    return value;
  }

  return "/attendance";
}

/**
 * Authenticated request. The employee identity always comes from the
 * token verified by the server, never from anything the browser chooses.
 */
export async function authedRequest(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getEmployeeToken();

  if (!token) {
    throw new AuthError("Please sign in to continue.");
  }

  const response = await apiRequest(path, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    clearEmployeeSession();
    throw new AuthError();
  }

  return response;
}
