import "server-only"
import { cookies } from "next/headers"
import { createHmac, timingSafeEqual } from "crypto"

const COOKIE = "billy_admin"
const MAX_AGE = 60 * 60 * 12 // 12 hours

function secret() {
  return process.env.ADMIN_PASSWORD ?? ""
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex")
}

export function verifyPassword(input: string) {
  const pw = secret()
  if (!pw || !input) return false
  const a = Buffer.from(input)
  const b = Buffer.from(pw)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function createSession() {
  const token = `${Date.now()}`
  const value = `${token}.${sign(token)}`
  const store = await cookies()
  store.set(COOKIE, value, {
    httpOnly: true,
    secure: true,
    // "none" is required so the session cookie is stored/sent inside the
    // v0 preview iframe (cross-site context). Works over HTTPS in prod too.
    sameSite: "none",
    path: "/",
    maxAge: MAX_AGE,
  })
}

export async function destroySession() {
  const store = await cookies()
  store.delete(COOKIE)
}

export async function isAuthenticated() {
  const store = await cookies()
  const value = store.get(COOKIE)?.value
  if (!value) return false
  const [token, mac] = value.split(".")
  if (!token || !mac) return false
  const expected = sign(token)
  const a = Buffer.from(mac)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
