import { NextResponse } from "next/server"
import { and, asc, eq, isNull, or } from "drizzle-orm"
import { db } from "@/lib/db"
import { directMessages } from "@/lib/db/schema"
import { getCurrentUser } from "@/lib/auth"
import { notifyUser } from "@/lib/social"
import { getLastSeenMap, ONLINE_WINDOW_MS } from "@/lib/presence"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET ?with=<userId> — the conversation between me and that user.
export async function GET(req: Request) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ ok: false }, { status: 401 })

  const withId = Number(new URL(req.url).searchParams.get("with"))
  if (!Number.isFinite(withId)) return NextResponse.json({ ok: false }, { status: 400 })

  const rows = await db
    .select()
    .from(directMessages)
    .where(
      or(
        and(eq(directMessages.senderId, me.id), eq(directMessages.recipientId, withId)),
        and(eq(directMessages.senderId, withId), eq(directMessages.recipientId, me.id)),
      ),
    )
    .orderBy(asc(directMessages.id))
    .limit(300)

  // Mark messages sent to me as read.
  await db
    .update(directMessages)
    .set({ readAt: new Date() })
    .where(and(eq(directMessages.senderId, withId), eq(directMessages.recipientId, me.id), isNull(directMessages.readAt)))
    .catch(() => {})

  const seen = await getLastSeenMap([`u${withId}`])
  const peerLastSeen = seen[`u${withId}`] ?? null
  const peerOnline = peerLastSeen ? Date.now() - new Date(peerLastSeen).getTime() < ONLINE_WINDOW_MS : false

  return NextResponse.json({ ok: true, me: me.id, messages: rows, peerLastSeen, peerOnline })
}

// POST { toUserId, body }
export async function POST(req: Request) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ ok: false }, { status: 401 })

  const { toUserId, body } = await req.json()
  const to = Number(toUserId)
  const text = String(body ?? "").trim().slice(0, 2000)
  if (!Number.isFinite(to) || !text) return NextResponse.json({ ok: false }, { status: 400 })

  const [row] = await db.insert(directMessages).values({ senderId: me.id, recipientId: to, body: text }).returning()
  await notifyUser(to, "message", `${me.displayName}: ${text.slice(0, 80)}`)
  return NextResponse.json({ ok: true, message: row })
}

// DELETE ?id= — sender or admin may delete a message.
export async function DELETE(req: Request) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ ok: false }, { status: 401 })
  const id = Number(new URL(req.url).searchParams.get("id"))
  if (!Number.isFinite(id)) return NextResponse.json({ ok: false }, { status: 400 })

  const rows = await db.select().from(directMessages).where(eq(directMessages.id, id)).limit(1)
  const row = rows[0]
  if (!row) return NextResponse.json({ ok: false }, { status: 404 })
  if (row.senderId !== me.id && !me.isAdmin) return NextResponse.json({ ok: false }, { status: 403 })

  await db.delete(directMessages).where(eq(directMessages.id, id))
  return NextResponse.json({ ok: true })
}
