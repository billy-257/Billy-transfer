import "server-only"
import { desc, isNotNull, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { visits, conversations, type Visit, type Conversation } from "@/lib/db/schema"

export type VisitStats = {
  today: number
  last7: number
  total: number
  whatsapp: number
  recent: Visit[]
  leads: Conversation[]
}

export async function getVisitStats(): Promise<VisitStats> {
  const [todayRow] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(visits)
    .where(sql`${visits.createdAt} >= date_trunc('day', now())`)
  const [weekRow] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(visits)
    .where(sql`${visits.createdAt} >= now() - interval '7 days'`)
  const [totalRow] = await db.select({ n: sql<number>`count(*)::int` }).from(visits)
  const [waRow] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(visits)
    .where(sql`${visits.source} = 'whatsapp'`)
  const recent = await db.select().from(visits).orderBy(desc(visits.createdAt)).limit(50)
  // Leads = visitors who left a phone number in the chat.
  const leads = await db
    .select()
    .from(conversations)
    .where(isNotNull(conversations.phone))
    .orderBy(desc(conversations.lastMessageAt))
    .limit(100)

  return {
    today: todayRow?.n ?? 0,
    last7: weekRow?.n ?? 0,
    total: totalRow?.n ?? 0,
    whatsapp: waRow?.n ?? 0,
    recent,
    leads,
  }
}
