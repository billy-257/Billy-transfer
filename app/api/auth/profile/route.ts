import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { posts, users } from "@/lib/db/schema"
import { getCurrentUser, hashPassword, verifyPasswordHash } from "@/lib/auth"
import { getFriendIds, notifyUser } from "@/lib/social"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// PATCH { displayName?, location?, avatarUrl?, currentPassword?, newPassword? }
export async function PATCH(req: Request) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ ok: false }, { status: 401 })

  const b = await req.json().catch(() => ({}) as Record<string, unknown>)

  const displayName = typeof b.displayName === "string" ? b.displayName.trim().slice(0, 60) : undefined
  const location = typeof b.location === "string" ? b.location.trim().slice(0, 80) : undefined
  const avatarUrl = typeof b.avatarUrl === "string" ? b.avatarUrl : undefined

  const nameChanged = !!displayName && displayName !== me.displayName
  const townChanged = location !== undefined && location !== (me.location ?? "")
  const avatarChanged = avatarUrl !== undefined && avatarUrl !== (me.avatarUrl ?? "")

  const updates: Record<string, unknown> = {}
  if (displayName) updates.displayName = displayName
  if (location !== undefined) updates.location = location
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl || null

  // Optional password change (requires the current password).
  if (typeof b.newPassword === "string" && b.newPassword.length > 0) {
    if (b.newPassword.length < 4) {
      return NextResponse.json({ ok: false, error: "Ijambo ry'ibanga rigufi cane (nibura inyuguti 4)." }, { status: 400 })
    }
    const rows = await db.select().from(users).where(eq(users.id, me.id)).limit(1)
    const stored = rows[0]?.passwordHash
    if (!stored || !verifyPasswordHash(String(b.currentPassword ?? ""), stored)) {
      return NextResponse.json({ ok: false, error: "Ijambo ry'ibanga rya kera ntirikwiye." }, { status: 400 })
    }
    updates.passwordHash = hashPassword(b.newPassword)
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: false, error: "Nta co wahinduye." }, { status: 400 })
  }

  await db.update(users).set(updates).where(eq(users.id, me.id))

  const finalName = displayName || me.displayName

  // Any profile change is announced on the Amafoto feed.
  if (avatarChanged) {
    await db
      .insert(posts)
      .values({ userId: me.id, imageUrl: avatarUrl || null, caption: `${finalName} yahinduye ifoto y'umwidondoro.` })
      .catch(() => {})
    const friends = await getFriendIds(me.id)
    await Promise.all(friends.map((fid) => notifyUser(fid, "profile", `${finalName} yahinduye ifoto y'umwidondoro.`)))
  } else if (nameChanged || townChanged) {
    const parts: string[] = []
    if (nameChanged) parts.push(`izina rishasha: ${finalName}`)
    if (townChanged) parts.push(`aba i ${location}`)
    await db
      .insert(posts)
      .values({ userId: me.id, imageUrl: null, caption: `${finalName} yahinduye umwidondoro (${parts.join(", ")}).` })
      .catch(() => {})
  }

  const fresh = await db.select().from(users).where(eq(users.id, me.id)).limit(1)
  const u = fresh[0]
  const { passwordHash: _drop, ...safe } = u
  return NextResponse.json({ ok: true, user: safe })
}
