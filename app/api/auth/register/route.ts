import { NextResponse } from "next/server"
import { or, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { hashPassword, createUserSession } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const { username, phone, password, displayName } = await req.json()
    const u = String(username ?? "").trim().toLowerCase()
    const p = String(phone ?? "").trim()
    const pw = String(password ?? "")
    const name = String(displayName ?? "").trim() || u

    if (!/^[a-z0-9_]{3,20}$/.test(u)) {
      return NextResponse.json({ ok: false, error: "Izina ry'ukoresha ribe n'inyuguti 3-20 (a-z, 0-9, _)." }, { status: 400 })
    }
    if (p.replace(/[^0-9]/g, "").length < 7) {
      return NextResponse.json({ ok: false, error: "Andika inomero ya telefone nyayo." }, { status: 400 })
    }
    if (pw.length < 6) {
      return NextResponse.json({ ok: false, error: "Ijambo ry'ibanga ribe n'inyuguti 6 canke zirenga." }, { status: 400 })
    }

    const existing = await db.select().from(users).where(or(eq(users.username, u), eq(users.phone, p))).limit(1)
    if (existing[0]) {
      return NextResponse.json({ ok: false, error: "Iyi konte isanzwe iriho. Injira." }, { status: 409 })
    }

    const [row] = await db
      .insert(users)
      .values({ username: u, phone: p, displayName: name, passwordHash: hashPassword(pw) })
      .returning()

    await createUserSession(row.id)
    return NextResponse.json({
      ok: true,
      user: { id: row.id, username: row.username, phone: row.phone, displayName: row.displayName, avatarUrl: row.avatarUrl, isAdmin: row.isAdmin },
    })
  } catch (err) {
    console.log("[v0] register failed:", (err as Error).message)
    return NextResponse.json({ ok: false, error: "Ntibishoboye. Gerageza kandi." }, { status: 500 })
  }
}
