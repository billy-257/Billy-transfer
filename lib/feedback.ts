import "server-only"
import { desc, eq, lt, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { feedback, type Feedback } from "@/lib/db/schema"

export const FEEDBACK_PAGE = 12

// Newest first; pass `before` (an id) to load older pages.
export async function listFeedback(before?: number): Promise<{ items: Feedback[]; total: number }> {
  const [items, [{ n }]] = await Promise.all([
    before
      ? db.select().from(feedback).where(lt(feedback.id, before)).orderBy(desc(feedback.id)).limit(FEEDBACK_PAGE)
      : db.select().from(feedback).orderBy(desc(feedback.id)).limit(FEEDBACK_PAGE),
    db.select({ n: sql<number>`count(*)::int` }).from(feedback),
  ])
  return { items, total: n ?? 0 }
}

export async function addFeedback(name: string, comment: string): Promise<Feedback> {
  const [row] = await db.insert(feedback).values({ name, comment }).returning()
  return row
}

export async function deleteFeedback(id: number) {
  await db.delete(feedback).where(eq(feedback.id, id))
}
