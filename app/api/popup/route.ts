import { NextResponse } from "next/server"
import { isAuthenticated } from "@/lib/admin-auth"
import { getPopup, savePopup } from "@/lib/popup"
import { sendPushToAllClients } from "@/lib/push"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Public: the currently active popup (or active:false when nothing to show).
export async function GET() {
  const popup = await getPopup()
  if (!popup.active || !popup.body.trim()) {
    return NextResponse.json({ active: false, version: popup.version })
  }
  return NextResponse.json(popup)
}

// Admin only: save the popup. Optionally also push it to phones.
export async function POST(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Ntiwemerewe" }, { status: 401 })
  }
  try {
    const data = await req.json()
    const body = typeof data.body === "string" ? data.body.trim() : ""
    const active = data.active !== false
    if (active && body.length < 1) {
      return NextResponse.json({ ok: false, error: "Andika ubutumwa bwo kwerekana" }, { status: 400 })
    }

    const saved = await savePopup({
      title: typeof data.title === "string" ? data.title.trim() : "",
      body,
      imageUrl: typeof data.imageUrl === "string" && data.imageUrl ? data.imageUrl : null,
      ctaLabel: typeof data.ctaLabel === "string" && data.ctaLabel.trim() ? data.ctaLabel.trim() : null,
      ctaUrl: typeof data.ctaUrl === "string" && data.ctaUrl.trim() ? data.ctaUrl.trim() : null,
      active,
    })

    // If requested, also send it as a phone push notification right now.
    let sent = 0
    if (data.push && active) {
      const result = await sendPushToAllClients({
        title: saved.title || "BILLY FAST TRANSFER",
        body: saved.body.slice(0, 300),
        url: saved.ctaUrl || "/",
        tag: "popup",
      })
      sent = result.sent
    }

    return NextResponse.json({ ok: true, popup: saved, sent })
  } catch {
    return NextResponse.json({ ok: false, error: "Habaye ikibazo" }, { status: 500 })
  }
}
