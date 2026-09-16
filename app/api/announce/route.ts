import { NextResponse } from "next/server"
import { isAuthenticated } from "@/lib/admin-auth"
import { sendPushToAllClients } from "@/lib/push"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Admin only: broadcast a push notification to every subscribed client.
export async function POST(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Ntiwemerewe" }, { status: 401 })
  }
  try {
    const { title, body, url } = await req.json()
    const t = typeof title === "string" ? title.trim().slice(0, 80) : ""
    const b = typeof body === "string" ? body.trim().slice(0, 300) : ""
    if (b.length < 1) {
      return NextResponse.json({ ok: false, error: "Andika itangazo" }, { status: 400 })
    }
    const result = await sendPushToAllClients({
      title: t || "BILLY FAST TRANSFER",
      body: b,
      url: typeof url === "string" && url ? url.slice(0, 200) : "/",
      tag: "announcement",
    })
    return NextResponse.json({ ok: true, sent: result.sent })
  } catch {
    return NextResponse.json({ ok: false, error: "Habaye ikibazo" }, { status: 500 })
  }
}
