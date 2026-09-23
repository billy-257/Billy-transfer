import { NextResponse } from "next/server"
import { or, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { verifyPasswordHash, createUserSession } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const { identifier, password } = await req.json()
    const id = String(identifier ?? "").trim()
    const idLower = id.toLowerCase()
    const pw = String(password ?? "")
    if (!id || !pw) {
      return NextResponse.json({ ok: false, error: "Uzuza ibisabwa vyose." }, { status: 400 })
    }

    const rows = await db.select().from(users).where(or(eq(users.username, idLower), eq(users.phone, id))).limit(1)
    const row = rows[0]
    if (!row || !verifyPasswordHash(pw, row.passwordHash)) {
      return NextResponse.json({ ok: false, error: "Amakuru ntabwo ariyo." }, { status: 401 })
    }

    await createUserSession(row.id)
    return NextResponse.json({
      ok: true,
      user: { id: row.id, username: row.username, phone: row.phone, displayName: row.displayName, avatarUrl: row.avatarUrl, isAdmin: row.isAdmin },
    })
  } catch (err) {
    console.log("[v0] login failed:", (err as Error).message)
    return NextResponse.json({ ok: false, error: "Ntibishoboye. Gerageza kandi." }, { status: 500 })
  }
}
