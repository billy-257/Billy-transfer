import { NextResponse } from "next/server"
import { heartbeat } from "@/lib/presence"
import { getCurrentUser } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Logged-in social users ping this to keep their "last seen" fresh.
export async function POST() {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ ok: false }, { status: 401 })
  await heartbeat(`u${me.id}`, "client")
  return NextResponse.json({ ok: true })
}
