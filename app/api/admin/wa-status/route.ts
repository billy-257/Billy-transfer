import { NextResponse } from "next/server"
import { isAuthenticated } from "@/lib/admin-auth"
import { whatsappConfigured } from "@/lib/whatsapp"

export const runtime = "nodejs"

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  return NextResponse.json({
    ok: true,
    connected: whatsappConfigured(),
    verifyTokenSet: Boolean(process.env.WHATSAPP_VERIFY_TOKEN),
  })
}
