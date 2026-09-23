import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { friendships } from "@/lib/db/schema"
import { getCurrentUser } from "@/lib/auth"
import { friendshipBetween, notifyUser } from "@/lib/social"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ ok: false }, { status: 401 })

  const { toUserId } = await req.json()
  const to = Number(toUserId)
  if (!Number.isFinite(to) || to === me.id) {
    return NextResponse.json({ ok: false, error: "Ntibishoboka." }, { status: 400 })
  }

  const existing = await friendshipBetween(me.id, to)
  if (existing) {
    return NextResponse.json({ ok: true, already: true })
  }

  await db.insert(friendships).values({ requesterId: me.id, addresseeId: to, status: "pending" })
  await notifyUser(to, "friend_request", `${me.displayName} akwipfuza kuba umugenzi wawe.`)
  return NextResponse.json({ ok: true })
}
