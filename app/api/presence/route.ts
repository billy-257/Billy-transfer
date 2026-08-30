import { NextResponse } from "next/server"
import { heartbeat, isAdminOnline } from "@/lib/presence"
import { isAuthenticated } from "@/lib/admin-auth"

export const runtime = "nodejs"

// Heartbeat + status. Clients POST { clientId }, admin POSTs nothing (authed).
export async function POST(req: Request) {
  const admin = await isAuthenticated()
  if (admin) {
    await heartbeat("admin", "admin")
    return NextResponse.json({ ok: true, role: "admin" })
  }

  let clientId = ""
  try {
    const parsed = await req.json()
    clientId = typeof parsed?.clientId === "string" ? parsed.clientId.slice(0, 100) : ""
  } catch {
    /* ignore */
  }
  if (clientId) await heartbeat(clientId, "client")

  // Tell the visitor whether the agent (admin) is online right now.
  const adminOnline = await isAdminOnline()
  return NextResponse.json({ ok: true, adminOnline })
}
