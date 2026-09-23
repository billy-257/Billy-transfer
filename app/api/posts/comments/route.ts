import { NextResponse } from "next/server"
import { asc, eq, inArray } from "drizzle-orm"
import { db } from "@/lib/db"
import { posts, postComments, users } from "@/lib/db/schema"
import { getCurrentUser } from "@/lib/auth"
import { notifyUser } from "@/lib/social"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const pid = Number(new URL(req.url).searchParams.get("postId"))
  if (!Number.isFinite(pid)) return NextResponse.json({ ok: false }, { status: 400 })
  const rows = await db.select().from(postComments).where(eq(postComments.postId, pid)).orderBy(asc(postComments.id)).limit(200)
  const authorIds = [...new Set(rows.map((c) => c.userId))]
  const authors = authorIds.length ? await db.select().from(users).where(inArray(users.id, authorIds)) : []
  const amap = new Map(authors.map((u) => [u.id, { id: u.id, displayName: u.displayName, avatarUrl: u.avatarUrl, isAdmin: u.isAdmin }]))
  const me = await getCurrentUser()
  return NextResponse.json({
    ok: true,
    me: me?.id ?? null,
    isAdmin: me?.isAdmin ?? false,
    comments: rows.map((c) => ({ id: c.id, body: c.body, createdAt: c.createdAt, author: amap.get(c.userId) ?? null })),
  })
}

export async function POST(req: Request) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ ok: false }, { status: 401 })
  const { postId, body } = await req.json()
  const pid = Number(postId)
  const text = String(body ?? "").trim().slice(0, 1000)
  if (!Number.isFinite(pid) || !text) return NextResponse.json({ ok: false }, { status: 400 })

  const [row] = await db.insert(postComments).values({ postId: pid, userId: me.id, body: text }).returning()
  const post = (await db.select().from(posts).where(eq(posts.id, pid)).limit(1))[0]
  if (post && post.userId !== me.id) {
    await notifyUser(post.userId, "comment", `${me.displayName} yavuzeko ifoto yawe: ${text.slice(0, 60)}`)
  }
  return NextResponse.json({ ok: true, comment: row })
}

export async function DELETE(req: Request) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ ok: false }, { status: 401 })
  const id = Number(new URL(req.url).searchParams.get("id"))
  if (!Number.isFinite(id)) return NextResponse.json({ ok: false }, { status: 400 })
  const rows = await db.select().from(postComments).where(eq(postComments.id, id)).limit(1)
  const row = rows[0]
  if (!row) return NextResponse.json({ ok: false }, { status: 404 })
  if (row.userId !== me.id && !me.isAdmin) return NextResponse.json({ ok: false }, { status: 403 })
  await db.delete(postComments).where(eq(postComments.id, id))
  return NextResponse.json({ ok: true })
}
