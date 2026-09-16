import "server-only"
import { asc, desc, gt, lt } from "drizzle-orm"
import { db } from "@/lib/db"
import { roomMessages, type RoomMessage } from "@/lib/db/schema"

export const ROOM_PAGE = 40

// Reserved display name for the business. Only the authenticated admin may post as this.
export const HOST_NAME = "BILLY FAST TRANSFER"

// Most recent page, returned in chronological (oldest-first) order for display.
export async function listRecent(): Promise<RoomMessage[]> {
  const rows = await db.select().from(roomMessages).orderBy(desc(roomMessages.id)).limit(ROOM_PAGE)
  return rows.reverse()
}

// Older history before a given id (for "load earlier"), chronological order.
export async function listBefore(before: number): Promise<RoomMessage[]> {
  const rows = await db
    .select()
    .from(roomMessages)
    .where(lt(roomMessages.id, before))
    .orderBy(desc(roomMessages.id))
    .limit(ROOM_PAGE)
  return rows.reverse()
}

// New messages after a given id (for live polling), chronological order.
export async function listAfter(after: number): Promise<RoomMessage[]> {
  return db.select().from(roomMessages).where(gt(roomMessages.id, after)).orderBy(asc(roomMessages.id)).limit(200)
}

export async function addRoomMessage(
  clientId: string | null,
  name: string,
  body: string,
  isHost = false,
): Promise<RoomMessage> {
  const [row] = await db.insert(roomMessages).values({ clientId, name, body, isHost }).returning()
  return row
}
