import "server-only"
import { and, eq, or } from "drizzle-orm"
import { db } from "@/lib/db"
import { appNotifications, friendships } from "@/lib/db/schema"
import { sendPushToUser } from "@/lib/push"

// Creates an in-app notification and pushes it to the user's devices.
export async function notifyUser(
  userId: number,
  type: string,
  body: string,
  link = "/?hub=1",
) {
  try {
    await db.insert(appNotifications).values({ userId, type, body, link })
    await sendPushToUser(userId, { title: "BILLY FASTER TRANSFER", body, url: link, tag: type })
  } catch (err) {
    console.log("[v0] notifyUser failed:", (err as Error).message)
  }
}

// Returns the set of user ids that are accepted friends of `userId`.
export async function getFriendIds(userId: number): Promise<number[]> {
  const rows = await db
    .select()
    .from(friendships)
    .where(
      and(
        eq(friendships.status, "accepted"),
        or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId)),
      ),
    )
  return rows.map((r) => (r.requesterId === userId ? r.addresseeId : r.requesterId))
}

// Returns the friendship row between two users, in either direction.
export async function friendshipBetween(a: number, b: number) {
  const rows = await db
    .select()
    .from(friendships)
    .where(
      or(
        and(eq(friendships.requesterId, a), eq(friendships.addresseeId, b)),
        and(eq(friendships.requesterId, b), eq(friendships.addresseeId, a)),
      ),
    )
    .limit(1)
  return rows[0] ?? null
}
