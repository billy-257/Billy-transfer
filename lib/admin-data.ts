import "server-only"
import { desc, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { visits, type Visit } from "@/lib/db/schema"

export type VisitStats = {
  today: number
  last7: number
  total: number
  recent: Visit[]
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
  const recent = await db.select().from(visits).orderBy(desc(visits.createdAt)).limit(50)

  return {
    today: todayRow?.n ?? 0,
    last7: weekRow?.n ?? 0,
    total: totalRow?.n ?? 0,
    recent,
  }
}
