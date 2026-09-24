import { NextResponse } from "next/server"
import { and, eq, isNull, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { directMessages } from "@/lib/db/schema"
import { getCurrentUser } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Total number of direct messages sent to me that I have not opened yet.
export async function GET() {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ ok: false, unread: 0 }, { status: 200 })

  const rows = await db
    .select({ c: sql<number>`count(*)` })
    .from(directMessages)
    .where(and(eq(directMessages.recipientId, me.id), isNull(directMessages.readAt)))

  return NextResponse.json({ ok: true, unread: Number(rows[0]?.c ?? 0) })
}
