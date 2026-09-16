import "server-only"
import { desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { members, type Member } from "@/lib/db/schema"

export type { Member }

// Full directory, newest first (admin only).
export async function listMembers(): Promise<Member[]> {
  return db.select().from(members).orderBy(desc(members.id))
}

// Adds a member, or updates the existing row for the same device (clientId).
export async function upsertMember(input: {
  clientId: string | null
  name: string
  phone: string
  town: string
  photo: string | null
}): Promise<Member> {
  if (input.clientId) {
    const existing = await db.select().from(members).where(eq(members.clientId, input.clientId)).limit(1)
    if (existing[0]) {
      const [row] = await db
        .update(members)
        .set({ name: input.name, phone: input.phone, town: input.town, photo: input.photo })
        .where(eq(members.id, existing[0].id))
        .returning()
      return row
    }
  }
  const [row] = await db.insert(members).values(input).returning()
  return row
}

export async function deleteMember(id: number): Promise<void> {
  await db.delete(members).where(eq(members.id, id))
}
