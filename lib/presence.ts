import "server-only"
import { eq, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { presence } from "@/lib/db/schema"

// How long since last heartbeat we still consider someone "online".
export const ONLINE_WINDOW_MS = 45_000

// Record a heartbeat for an actor (admin or a client id).
export async function heartbeat(id: string, role: "admin" | "client") {
  await db
    .insert(presence)
    .values({ id, role, lastSeen: new Date() })
    .onConflictDoUpdate({ target: presence.id, set: { role, lastSeen: new Date() } })
}

// Is the admin currently online?
export async function isAdminOnline(): Promise<boolean> {
  const rows = await db.select().from(presence).where(eq(presence.id, "admin")).limit(1)
  const last = rows[0]?.lastSeen
  if (!last) return false
  return Date.now() - new Date(last).getTime() < ONLINE_WINDOW_MS
}

// Return the set of client ids seen within the online window.
export async function getOnlineClientIds(): Promise<string[]> {
  const cutoff = new Date(Date.now() - ONLINE_WINDOW_MS)
  const rows = await db
    .select({ id: presence.id })
    .from(presence)
    .where(sql`${presence.role} = 'client' and ${presence.lastSeen} >= ${cutoff}`)
  return rows.map((r) => r.id)
}
