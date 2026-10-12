
const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://attendance-backend-2nky.onrender.com"
).replace(/\/+$/, "");

export async function apiRequest(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const normalizedPath = path.startsWith("/")
    ? path
    : `/${path}`;

  return fetch(`${API_BASE_URL}${normalizedPath}`, options);
}
