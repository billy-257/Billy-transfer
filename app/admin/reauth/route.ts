import { NextResponse } from "next/server"
import { destroySession } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

// Clicking the profile photo always lands here first: we clear any existing
// admin session so the password screen is shown on every single click.
export async function GET(req: Request) {
  await destroySession()
  return NextResponse.redirect(new URL("/admin", req.url))
}
