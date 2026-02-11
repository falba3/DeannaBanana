import { NextRequest } from "next/server";

/**
 * Validates the API token.
 * Supports: Headers (standard), Body (backup), and Same-Origin (safety net).
 */
export function validateApiToken(req: NextRequest, tokenFromBody?: string): boolean {
    const clientToken = tokenFromBody || req.headers.get("x-api-token") || req.headers.get("Authorization");
    const serverToken = process.env.API_AUTH_TOKEN;

    if (!serverToken) {
        console.error("AUTH ERROR: API_AUTH_TOKEN is not set on the server.");
        return false;
    }

    // 1. Token Check (Header or Body)
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

    // Debugging: Log what we ARE receiving to see if CloudFront is stripping headers
    const receivedHeaders = Array.from(req.headers.keys()).join(", ");
    console.warn("AUTH FAIL: No valid token found.", {
        receivedHeaders,
        hasReferer: !!referer,
        host,
        serverTokenLength: serverToken.length
    });

    return false;
}
