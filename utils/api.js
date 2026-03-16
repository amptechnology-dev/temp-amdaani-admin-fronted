import Cookies from "js-cookie";

export const apiCall = async ({
  endpoint,
  method = "GET",
  headers = {},
  body = null,
  token = true, // ✅ Default true, automatically fetch from cookie
}) => {
  try {
    const finalHeaders = { ...headers };

    // Auto-fetch token from cookies if `token` is true
    if (token) {
      const authToken = Cookies.get("token");
      if (authToken) {
        finalHeaders["Authorization"] = `Bearer ${authToken}`;
      }
    }

    // Add Content-Type only if body is not FormData
    if (!(body instanceof FormData)) {
      finalHeaders["Content-Type"] = "application/json";
    }

    const response = await fetch(endpoint, {
      method,
      headers: finalHeaders,
      body:
        body instanceof FormData ? body : body ? JSON.stringify(body) : null,
    });

    const contentType = response.headers.get("content-type");

    const data = contentType?.includes("application/json")
      ? await response.json()
      : await response.text();

    // Return the data for the component to handle success/failure
    return data;
  } catch (error) {
    console.error("API Error:", error.message);
    throw error;
  }
};
