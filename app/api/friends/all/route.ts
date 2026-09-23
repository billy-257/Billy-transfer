import { NextResponse } from "next/server"
import { desc, eq, ne, or } from "drizzle-orm"
import { db } from "@/lib/db"
import { users, friendships } from "@/lib/db/schema"
import { getCurrentUser } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Lists every registered person (except me) together with my friendship status
// toward each one, so the Abagenzi tab can show everyone without searching.
export async function GET() {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ ok: false }, { status: 401 })

  const [people, rels] = await Promise.all([
    db.select().from(users).where(ne(users.id, me.id)).orderBy(desc(users.id)).limit(500),
    db
      .select()
      .from(friendships)
      .where(or(eq(friendships.requesterId, me.id), eq(friendships.addresseeId, me.id))),
  ])

  const statusByUser = new Map<number, "friends" | "incoming" | "outgoing">()
  for (const r of rels) {
    const other = r.requesterId === me.id ? r.addresseeId : r.requesterId
    if (r.status === "accepted") statusByUser.set(other, "friends")
    else if (r.addresseeId === me.id) statusByUser.set(other, "incoming")
    else statusByUser.set(other, "outgoing")
  }

  const results = people.map((u) => ({
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    location: u.location,
    status: statusByUser.get(u.id) ?? "none",
  }))

  return NextResponse.json({ ok: true, results })
}
