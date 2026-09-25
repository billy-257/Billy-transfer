import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { createUserSession } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Phone-number-only login. The visitor just enters their phone number; if it is
// new we create the account automatically, otherwise we sign them straight in.
// No username, no password.
export async function POST(req: Request) {
  try {
    const { phone } = await req.json()
    const p = String(phone ?? "").trim()
    const digits = p.replace(/[^0-9]/g, "")
    if (digits.length < 7) {
      return NextResponse.json({ ok: false, error: "Andika inomero ya telefone nyayo." }, { status: 400 })
    }

    let row = (await db.select().from(users).where(eq(users.phone, p)).limit(1))[0]

    if (!row) {
      try {
        ;[row] = await db
          .insert(users)
          .values({ username: `user_${digits}`, phone: p, displayName: p, passwordHash: "" })
          .returning()
      } catch {
        // Unique-constraint race: someone/something created it — re-read.
        row = (await db.select().from(users).where(eq(users.phone, p)).limit(1))[0]
      }
    }

    if (!row) {
      return NextResponse.json({ ok: false, error: "Ntibishoboye. Gerageza kandi." }, { status: 500 })
    }

    await createUserSession(row.id)
    return NextResponse.json({
      ok: true,
      user: {
        id: row.id,
        username: row.username,
        phone: row.phone,
        displayName: row.displayName,
        avatarUrl: row.avatarUrl,
        isAdmin: row.isAdmin,
      },
    })
  } catch (err) {
    console.log("[v0] login failed:", (err as Error).message)
    return NextResponse.json({ ok: false, error: "Ntibishoboye. Gerageza kandi." }, { status: 500 })
  }
}
