// Chaos Creatures Admin Dashboard — Auth Helpers
// Validates admin session cookie for middleware and server components.

const SESSION_TOKEN = process.env.ADMIN_JWT_SECRET || 'chaos-admin-session';
const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

export function validateSession(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;

  try {
    const decoded = Buffer.from(cookieValue, 'base64').toString('utf-8');
    const [timestampStr, secret] = decoded.split(':');
    const timestamp = parseInt(timestampStr, 10);

    if (isNaN(timestamp)) return false;
    if (secret !== SESSION_TOKEN) return false;

    // Check if session has expired (8 hours)
    const now = Date.now();
    if (now - timestamp > SESSION_MAX_AGE_MS) return false;

    return true;
  } catch {
    return false;
  }
}
