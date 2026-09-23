import { NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { friendships } from "@/lib/db/schema"
import { getCurrentUser } from "@/lib/auth"
import { notifyUser } from "@/lib/social"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ ok: false }, { status: 401 })

  const { requestId, action } = await req.json()
  const id = Number(requestId)
  if (!Number.isFinite(id) || (action !== "accept" && action !== "refuse")) {
    return NextResponse.json({ ok: false, error: "Ntibishoboka." }, { status: 400 })
  }

  // Only the addressee of a pending request may respond.
  const rows = await db
    .select()
    .from(friendships)
    .where(and(eq(friendships.id, id), eq(friendships.addresseeId, me.id)))
    .limit(1)
  const row = rows[0]
  if (!row) return NextResponse.json({ ok: false }, { status: 404 })

  if (action === "accept") {
    await db.update(friendships).set({ status: "accepted" }).where(eq(friendships.id, id))
    await notifyUser(row.requesterId, "friend_accept", `${me.displayName} yemeye ubugenzi bwawe.`)
  } else {
    await db.delete(friendships).where(eq(friendships.id, id))
  }
  return NextResponse.json({ ok: true })
}
