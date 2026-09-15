import crypto from "crypto";

export const OPERATOR_SECRET_KEY = process.env.OPERATOR_SECRET_KEY || "okwin_secret_key_prod_888";
export const OPERATOR_API_KEY = process.env.OPERATOR_API_KEY || "okwin_api_key_777";

/**
 * Generate HMAC-SHA256 hex signature for request body payload
 */
export function generateHmacSignature(payload: string, secret: string = OPERATOR_SECRET_KEY): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Verify HMAC-SHA256 signature
 */
export function verifyHmacSignature(payload: string, signature: string, secret: string = OPERATOR_SECRET_KEY): boolean {
  if (!signature) return false;
  try {
    const expected = generateHmacSignature(payload, secret);
    return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

/**
 * Validate API Key header
 */
export function validateApiKey(apiKey: string | null): boolean {
  if (!apiKey) return false;
  return apiKey === OPERATOR_API_KEY;
}
