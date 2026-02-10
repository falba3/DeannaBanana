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
        console.error("AUTH ERROR: API_AUTH_TOKEN is not set on the server.");
        return false;
    }

    // 1. Token Check
    if (clientToken) {
        const cleanToken = clientToken.startsWith("Bearer ") ? clientToken.split(" ")[1] : clientToken;
        if (cleanToken === serverToken) {
            return true;
        }
        console.warn("AUTH WARN: Provided token does not match server token.");
    }

    // 2. Same-Origin Fallback
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const referer = req.headers.get("referer");

    if (referer && host && referer.includes(host)) {
        return true;
    }

    console.warn("AUTH FAIL: No valid token and origin check failed.", {
        hasReferer: !!referer,
        hostHeader: host,
        refererHeader: referer
    });

    return false;
}
