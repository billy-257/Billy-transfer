import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { createUserSession } from "@/lib/auth"
import { isOwnerPhone } from "@/lib/owner"
import { generateCode, makeOtpToken, verifyOtpToken } from "@/lib/otp"
import { sendWhatsAppText, whatsappConfigured } from "@/lib/whatsapp"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const OTP_COOKIE = "billy_otp"

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

// Phone-number login with a best-effort WhatsApp one-time code.
//
//   step 1 (action "request"): we generate a 6-digit code and try to WhatsApp it
//   to the number. If WhatsApp delivers, we ask the user to type the code. If it
//   CANNOT deliver (not configured, or the number never messaged the business),
//   we log the user straight in so nobody is ever locked out. The owner always
//   skips the code.
//
//   step 2 (action "verify"): we validate the typed code against the signed
//   cookie and finish the login.
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const action = String(body.action ?? "request")
    const p = String(body.phone ?? "").trim()
    const digits = p.replace(/[^0-9]/g, "")
    if (digits.length < 7) {
      return NextResponse.json({ ok: false, error: "Andika inomero ya telefone nyayo." }, { status: 400 })
    }

    const store = await cookies()

    if (action === "verify") {
      const code = String(body.code ?? "").replace(/[^0-9]/g, "")
      const token = store.get(OTP_COOKIE)?.value
      if (!verifyOtpToken(token, p, code)) {
        return NextResponse.json({ ok: false, error: "Kode ntiyabaye nyayo canke yararengeje igihe." }, { status: 400 })
      }
      const user = await completeLogin(p)
      if (!user) return NextResponse.json({ ok: false, error: "Ntibishoboye. Gerageza kandi." }, { status: 500 })
      store.delete(OTP_COOKIE)
      return NextResponse.json({ ok: true, step: "done", user })
    }

    // action === "request"
    // The owner never needs a code — always full access straight away.
    if (isOwnerPhone(p)) {
      const user = await completeLogin(p)
      if (!user) return NextResponse.json({ ok: false, error: "Ntibishoboye. Gerageza kandi." }, { status: 500 })
      return NextResponse.json({ ok: true, step: "done", sent: false, user })
    }

    // Try to WhatsApp a one-time code from the admin business number.
    let sent = false
    if (whatsappConfigured()) {
      const code = generateCode()
      sent = await sendWhatsAppText(
        digits,
        `IWACU PAY: Kode yawe yo kwinjira ni ${code}. Ntuyihe umuntu.`,
      )
      if (sent) {
        store.set(OTP_COOKIE, makeOtpToken(p, code), {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          path: "/",
          maxAge: 10 * 60,
        })
        return NextResponse.json({ ok: true, step: "code", sent: true })
      }
    }

    // WhatsApp not configured or delivery failed → let them in (no lock-out).
    const user = await completeLogin(p)
    if (!user) return NextResponse.json({ ok: false, error: "Ntibishoboye. Gerageza kandi." }, { status: 500 })
    return NextResponse.json({ ok: true, step: "done", sent: false, user })
  } catch (err) {
    console.log("[v0] login failed:", (err as Error).message)
    return NextResponse.json({ ok: false, error: "Ntibishoboye. Gerageza kandi." }, { status: 500 })
  }
}
