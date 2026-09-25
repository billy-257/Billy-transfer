import "server-only"
import { cookies } from "next/headers"
import { createHmac, timingSafeEqual, randomBytes, scryptSync } from "crypto"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { users, type User } from "@/lib/db/schema"

const COOKIE = "billy_user"
const MAX_AGE = 60 * 60 * 24 * 30 // 30 days

function secret() {
  return process.env.ADMIN_PASSWORD ?? "billy-fallback-secret"
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex")
}

// ---- password hashing (scrypt, salt embedded) ----
export function hashPassword(pw: string) {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(pw, salt, 64).toString("hex")
  return `${salt}:${hash}`
}

export function verifyPasswordHash(pw: string, stored: string) {
  const [salt, hash] = stored.split(":")
  if (!salt || !hash) return false
  const calc = scryptSync(pw, salt, 64)
  const known = Buffer.from(hash, "hex")
  if (calc.length !== known.length) return false
  return timingSafeEqual(calc, known)
}

// ---- session cookie ----
export async function createUserSession(userId: number) {
  const token = `${userId}.${Date.now()}`
  const value = `${token}.${sign(token)}`
  const store = await cookies()
  store.set(COOKIE, value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  })
}

export async function destroyUserSession() {
  const store = await cookies()
  store.delete(COOKIE)
}

function readUserIdFromCookieValue(value: string | undefined): number | null {
  if (!value) return null
  const parts = value.split(".")
  if (parts.length !== 3) return null
  const [userId, ts, mac] = parts
  const expected = sign(`${userId}.${ts}`)
  const a = Buffer.from(mac)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  const id = Number(userId)
  return Number.isFinite(id) ? id : null
}

export type SafeUser = Omit<User, "passwordHash">

function toSafe(u: User): SafeUser {
  const { passwordHash: _drop, ...rest } = u
  return rest
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  const store = await cookies()
  const id = readUserIdFromCookieValue(store.get(COOKIE)?.value)
  if (id == null) return null
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1)
  return rows[0] ? toSafe(rows[0]) : null
}
