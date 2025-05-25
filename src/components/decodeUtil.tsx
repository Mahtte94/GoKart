export function decodeJwt<T = unknown>(token: string): T | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid token format");
    }

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
    const json = window.atob(padded);
    return JSON.parse(json) as T;
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
}