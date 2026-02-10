import { NextRequest } from "next/server";

/**
 * Validates the API token from headers.
 * Supports:
 * 1. x-api-token: <token>
 * 2. Authorization: <token> OR Authorization: Bearer <token>
 * 3. Same-origin fallback (allows the website to work even if build variables fail)
 */
export function validateApiToken(req: NextRequest): boolean {
    const clientToken = req.headers.get("x-api-token") || req.headers.get("Authorization");
    const serverToken = process.env.API_AUTH_TOKEN;

    if (!serverToken) {
        console.error("CRITICAL: API_AUTH_TOKEN is not set on the server.");
        return false;
    }

    // 1. If a token is provided, verify it
    if (clientToken) {
        const cleanToken = clientToken.startsWith("Bearer ") ? clientToken.split(" ")[1] : clientToken;
        if (cleanToken === serverToken) {
            return true;
        }
    }

    // 2. Same-Origin Fallback (For the Website)
    // Trusts requests that come from our own host.
    const host = req.headers.get("host"); // e.g., virtual-try-on.deannafashion.com
    const referer = req.headers.get("referer");

    if (referer && host && referer.includes(host)) {
        return true;
    }

    return false;
}
