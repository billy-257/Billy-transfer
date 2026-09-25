import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { createUserSession } from "@/lib/auth"
import { isOwnerPhone } from "@/lib/owner"
import { sendWhatsAppText, whatsappConfigured } from "@/lib/whatsapp"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Finds an existing account by phone or creates one, keeps the owner's admin
// flag in sync, starts the session, and returns the safe user payload.
async function completeLogin(p: string) {
  const digits = p.replace(/[^0-9]/g, "")
  const owner = isOwnerPhone(p)

  let row = (await db.select().from(users).where(eq(users.phone, p)).limit(1))[0]

  if (!row) {
    try {
      ;[row] = await db
        .insert(users)
        .values({ username: `user_${digits}`, phone: p, displayName: p, passwordHash: "", isAdmin: owner })
        .returning()
    } catch {
      // Unique-constraint race: someone/something created it — re-read.
      row = (await db.select().from(users).where(eq(users.phone, p)).limit(1))[0]
    }
  }

  if (!row) return null

  // Keep the owner's admin flag in sync (and make sure nobody else is admin).
  if (row.isAdmin !== owner) {
    await db.update(users).set({ isAdmin: owner }).where(eq(users.id, row.id))
    row.isAdmin = owner
  }

  await createUserSession(row.id)
  return {
    id: row.id,
    username: row.username,
    phone: row.phone,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    isAdmin: row.isAdmin,
  }
}

// Phone-number login. Entering a valid number ALWAYS signs the user in straight
// away — no code, no waiting — so nobody can ever get stuck on login. If a
// WhatsApp business number is configured we fire off a best-effort "welcome"
// notification in the background, but it never blocks or delays the login.
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const p = String(body.phone ?? "").trim()
    const digits = p.replace(/[^0-9]/g, "")
    if (digits.length < 7) {
      return NextResponse.json({ ok: false, error: "Andika inomero ya telefone nyayo." }, { status: 400 })
    }

    const user = await completeLogin(p)
    if (!user) return NextResponse.json({ ok: false, error: "Ntibishoboye. Gerageza kandi." }, { status: 500 })

    // Best-effort WhatsApp notification — never blocks login, never throws.
    if (!isOwnerPhone(p) && whatsappConfigured()) {
      sendWhatsAppText(digits, "IWACU PAY: Winjiye neza. Murakoze gukoresha IWACU PAY.").catch(() => {})
    }

    return NextResponse.json({ ok: true, step: "done", user })
  } catch (err) {
    console.log("[v0] login failed:", (err as Error).message)
    return NextResponse.json({ ok: false, error: "Ntibishoboye. Gerageza kandi." }, { status: 500 })
  }
}
