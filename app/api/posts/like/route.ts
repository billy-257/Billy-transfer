import { NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { posts, postLikes } from "@/lib/db/schema"
import { getCurrentUser } from "@/lib/auth"
import { notifyUser } from "@/lib/social"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ ok: false }, { status: 401 })
  const { postId } = await req.json()
  const pid = Number(postId)
  if (!Number.isFinite(pid)) return NextResponse.json({ ok: false }, { status: 400 })

  const existing = await db
    .select()
    .from(postLikes)
    .where(and(eq(postLikes.postId, pid), eq(postLikes.userId, me.id)))
    .limit(1)

  if (existing[0]) {
    await db.delete(postLikes).where(eq(postLikes.id, existing[0].id))
    return NextResponse.json({ ok: true, liked: false })
  }

  await db.insert(postLikes).values({ postId: pid, userId: me.id })
  const post = (await db.select().from(posts).where(eq(posts.id, pid)).limit(1))[0]
  if (post && post.userId !== me.id) {
    await notifyUser(post.userId, "like", `${me.displayName} yakunze ifoto yawe.`)
  }
  return NextResponse.json({ ok: true, liked: true })
}
