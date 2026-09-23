import { NextResponse } from "next/server"
import { and, ilike, ne, or } from "drizzle-orm"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { getCurrentUser } from "@/lib/auth"
import { friendshipBetween } from "@/lib/social"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ ok: false }, { status: 401 })

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? ""
  if (q.length < 1) return NextResponse.json({ ok: true, results: [] })

  const like = `%${q}%`
  const rows = await db
    .select()
    .from(users)
    .where(and(ne(users.id, me.id), or(ilike(users.username, like), ilike(users.displayName, like), ilike(users.phone, like))))
    .limit(20)

  const results = await Promise.all(
    rows.map(async (u) => {
      const rel = await friendshipBetween(me.id, u.id)
      let status: "none" | "friends" | "incoming" | "outgoing" = "none"
      if (rel) {
        if (rel.status === "accepted") status = "friends"
        else if (rel.addresseeId === me.id) status = "incoming"
        else status = "outgoing"
      }
      return { id: u.id, username: u.username, displayName: u.displayName, avatarUrl: u.avatarUrl, status }
    }),
  )
  return NextResponse.json({ ok: true, results })
}
