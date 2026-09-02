import { NextResponse } from "next/server"
import { isAuthenticated } from "@/lib/admin-auth"
import { checkAiHealth, getLastAiError } from "@/lib/ai-reply"

export const runtime = "nodejs"
export const maxDuration = 30

// Admin-only: verifies the AI model responds from this deployment.
export async function GET() {
  if (!(await isAuthenticated())) return NextResponse.json({ ok: false }, { status: 401 })
  const health = await checkAiHealth()
  return NextResponse.json({ ...health, lastError: getLastAiError() })
}
