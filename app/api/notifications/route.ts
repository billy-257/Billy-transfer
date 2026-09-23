import { NextResponse } from "next/server"
import { and, desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { appNotifications } from "@/lib/db/schema"
import { getCurrentUser } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ ok: false, notifications: [], unread: 0 }, { status: 200 })
  const rows = await db
    .select()
    .from(appNotifications)
    .where(eq(appNotifications.userId, me.id))
    .orderBy(desc(appNotifications.id))
    .limit(50)
  const unread = rows.filter((n) => !n.read).length
  return NextResponse.json({ ok: true, notifications: rows, unread })
}

// POST { id } to mark one read, or { all: true } to mark all read.
export async function POST(req: Request) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ ok: false }, { status: 401 })
  const { id, all } = await req.json()
  if (all) {
    await db.update(appNotifications).set({ read: true }).where(eq(appNotifications.userId, me.id))
  } else if (Number.isFinite(Number(id))) {
    await db
      .update(appNotifications)
      .set({ read: true })
      .where(and(eq(appNotifications.id, Number(id)), eq(appNotifications.userId, me.id)))
  }
  return NextResponse.json({ ok: true })
}
