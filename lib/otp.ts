import "server-only"
import { createHmac, timingSafeEqual } from "crypto"

// Stateless one-time-code tokens. We never store the code itself in the cookie —
// only an HMAC of (phone + code + expiry). On verify we recompute the HMAC from
// the phone + the code the user typed and compare. This keeps the flow
// serverless-friendly (no DB row, no shared memory) and the code stays secret
// from the browser that holds the cookie.

const TTL_MS = 10 * 60 * 1000 // codes are valid for 10 minutes

function secret() {
  return process.env.ADMIN_PASSWORD ?? "billy-fallback-secret"
}

export function generateCode(): string {
  // 6-digit numeric code, zero-padded.
  return String(Math.floor(100000 + Math.random() * 900000))
}

export function makeOtpToken(phone: string, code: string): string {
  const exp = Date.now() + TTL_MS
  const mac = createHmac("sha256", secret()).update(`${phone}.${code}.${exp}`).digest("hex")
  return `${exp}.${mac}`
}

export function verifyOtpToken(token: string | undefined, phone: string, code: string): boolean {
  if (!token) return false
  const parts = token.split(".")
  if (parts.length !== 2) return false
  const [expStr, mac] = parts
  const exp = Number(expStr)
  if (!Number.isFinite(exp) || Date.now() > exp) return false
  const expected = createHmac("sha256", secret()).update(`${phone}.${code}.${exp}`).digest("hex")
  const a = Buffer.from(mac)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
