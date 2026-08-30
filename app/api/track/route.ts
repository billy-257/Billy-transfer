import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { visits } from "@/lib/db/schema"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const h = req.headers
    const referrer = typeof body.referrer === "string" ? body.referrer.slice(0, 300) : null
    const rawSource = typeof body.source === "string" ? body.source.slice(0, 60) : null

    // Flag WhatsApp arrivals: explicit ?ref=wa/whatsapp, or a WhatsApp referrer.
    const ref = (referrer ?? "").toLowerCase()
    const src = (rawSource ?? "").toLowerCase()
    const fromWhatsApp =
      src.includes("wa") ||
      src.includes("whatsapp") ||
      ref.includes("whatsapp") ||
      ref.includes("wa.me") ||
      ref.includes("chat.whatsapp")
    const source = fromWhatsApp ? "whatsapp" : rawSource || null

    await db.insert(visits).values({
      path: typeof body.path === "string" ? body.path.slice(0, 200) : null,
      referrer,
      source,
      country: h.get("x-vercel-ip-country"),
      city: h.get("x-vercel-ip-city"),
      userAgent: h.get("user-agent")?.slice(0, 300) ?? null,
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
