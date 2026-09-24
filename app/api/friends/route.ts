import { NextResponse } from "next/server"
import { eq, inArray, or } from "drizzle-orm"
import { db } from "@/lib/db"
import { friendships, users } from "@/lib/db/schema"
import { getCurrentUser } from "@/lib/auth"
import { getLastSeenMap, ONLINE_WINDOW_MS } from "@/lib/presence"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ ok: false }, { status: 401 })

  const rows = await db
    .select()
    .from(friendships)
    .where(or(eq(friendships.requesterId, me.id), eq(friendships.addresseeId, me.id)))

  const friends: { requestId: number; userId: number }[] = []
  const incoming: { requestId: number; userId: number }[] = []
  const outgoing: { requestId: number; userId: number }[] = []
  for (const r of rows) {
    const other = r.requesterId === me.id ? r.addresseeId : r.requesterId
    if (r.status === "accepted") friends.push({ requestId: r.id, userId: other })
    else if (r.addresseeId === me.id) incoming.push({ requestId: r.id, userId: other })
    else outgoing.push({ requestId: r.id, userId: other })
  }

  const ids = [...friends, ...incoming, ...outgoing].map((x) => x.userId)
  const people = ids.length
    ? await db.select().from(users).where(inArray(users.id, ids))
    : []

  const seen = await getLastSeenMap(ids.map((id) => `u${id}`))
  const now = Date.now()
  const map = new Map(
    people.map((u) => {
      const lastSeen = seen[`u${u.id}`] ?? null
      const online = lastSeen ? now - new Date(lastSeen).getTime() < ONLINE_WINDOW_MS : false
      return [
        u.id,
        {
          id: u.id,
          username: u.username,
          displayName: u.displayName,
          avatarUrl: u.avatarUrl,
          isAdmin: u.isAdmin,
          lastSeen,
          online,
        },
      ]
    }),
  )

  const hydrate = (list: { requestId: number; userId: number }[]) =>
    list.map((x) => ({ requestId: x.requestId, user: map.get(x.userId) })).filter((x) => x.user)

  return NextResponse.json({
    ok: true,
    friends: hydrate(friends),
    incoming: hydrate(incoming),
    outgoing: hydrate(outgoing),
  })
}
