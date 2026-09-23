import { NextResponse } from "next/server"
import { desc } from "drizzle-orm"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { isAuthenticated } from "@/lib/admin-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Ntabwo winjiye nk'umuyobozi." }, { status: 401 })
  }
  const rows = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      username: users.username,
      phone: users.phone,
      location: users.location,
      avatarUrl: users.avatarUrl,
      isAdmin: users.isAdmin,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
  return NextResponse.json({ ok: true, users: rows })
}
