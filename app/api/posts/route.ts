import { NextResponse } from "next/server"
import { desc, eq, inArray } from "drizzle-orm"
import { db } from "@/lib/db"
import { posts, postLikes, postComments, users } from "@/lib/db/schema"
import { getCurrentUser } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const me = await getCurrentUser()
  const rows = await db.select().from(posts).orderBy(desc(posts.id)).limit(50)
  if (rows.length === 0) return NextResponse.json({ ok: true, me: me?.id ?? null, posts: [] })

  const ids = rows.map((p) => p.id)
  const authorIds = [...new Set(rows.map((p) => p.userId))]
  const [likes, comments, authors] = await Promise.all([
    db.select().from(postLikes).where(inArray(postLikes.postId, ids)),
    db.select().from(postComments).where(inArray(postComments.postId, ids)),
    db.select().from(users).where(inArray(users.id, authorIds)),
  ])
  const amap = new Map(authors.map((u) => [u.id, { id: u.id, username: u.username, displayName: u.displayName, avatarUrl: u.avatarUrl, isAdmin: u.isAdmin }]))

  const result = rows.map((p) => ({
    id: p.id,
    caption: p.caption,
    imageUrl: p.imageUrl,
    createdAt: p.createdAt,
    author: amap.get(p.userId) ?? null,
    likeCount: likes.filter((l) => l.postId === p.id).length,
    commentCount: comments.filter((c) => c.postId === p.id).length,
    likedByMe: me ? likes.some((l) => l.postId === p.id && l.userId === me.id) : false,
  }))
  return NextResponse.json({ ok: true, me: me?.id ?? null, posts: result })
}

export async function POST(req: Request) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ ok: false }, { status: 401 })
  const { imageUrl, caption } = await req.json()
  const cap = String(caption ?? "").trim().slice(0, 1000)
  const img = typeof imageUrl === "string" ? imageUrl : null
  if (!img && !cap) return NextResponse.json({ ok: false, error: "Andika ijambo canke wongeremwo ishusho." }, { status: 400 })
  const [row] = await db.insert(posts).values({ userId: me.id, imageUrl: img, caption: cap }).returning()
  return NextResponse.json({ ok: true, post: row })
}

export async function DELETE(req: Request) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ ok: false }, { status: 401 })
  const id = Number(new URL(req.url).searchParams.get("id"))
  if (!Number.isFinite(id)) return NextResponse.json({ ok: false }, { status: 400 })

  const rows = await db.select().from(posts).where(eq(posts.id, id)).limit(1)
  const row = rows[0]
  if (!row) return NextResponse.json({ ok: false }, { status: 404 })
  if (row.userId !== me.id && !me.isAdmin) return NextResponse.json({ ok: false }, { status: 403 })

  await db.delete(postLikes).where(eq(postLikes.postId, id))
  await db.delete(postComments).where(eq(postComments.postId, id))
  await db.delete(posts).where(eq(posts.id, id))
  return NextResponse.json({ ok: true })
}
