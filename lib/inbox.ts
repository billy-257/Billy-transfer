import "server-only"
import { and, asc, desc, eq, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { conversations, chatMessages, type ChatMessage, type Conversation } from "@/lib/db/schema"

export async function getOrCreateConversation(clientId: string, name?: string, phone?: string) {
  const existing = await db.select().from(conversations).where(eq(conversations.clientId, clientId)).limit(1)
  if (existing[0]) {
    // Backfill name/phone if newly provided.
    if ((name && !existing[0].name) || (phone && !existing[0].phone)) {
      await db
        .update(conversations)
        .set({ name: name ?? existing[0].name, phone: phone ?? existing[0].phone })
        .where(eq(conversations.id, existing[0].id))
    }
    return existing[0]
  }
  const inserted = await db
    .insert(conversations)
    .values({ clientId, name: name ?? null, phone: phone ?? null })
    .returning()
  return inserted[0]
}

export async function addMessage(
  conversationId: number,
  sender: "client" | "admin",
  body: string,
): Promise<ChatMessage> {
  const inserted = await db.insert(chatMessages).values({ conversationId, sender, body }).returning()
  // Update conversation counters.
  if (sender === "client") {
    await db
      .update(conversations)
      .set({ lastMessageAt: new Date(), unreadForAdmin: sql`${conversations.unreadForAdmin} + 1` })
      .where(eq(conversations.id, conversationId))
  } else {
    await db
      .update(conversations)
      .set({ lastMessageAt: new Date(), unreadForClient: sql`${conversations.unreadForClient} + 1` })
      .where(eq(conversations.id, conversationId))
  }
  return inserted[0]
}

export async function getThread(conversationId: number): Promise<ChatMessage[]> {
  return db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId))
    .orderBy(asc(chatMessages.createdAt))
}

export async function markRead(conversationId: number, reader: "client" | "admin") {
  await db
    .update(conversations)
    .set(reader === "admin" ? { unreadForAdmin: 0 } : { unreadForClient: 0 })
    .where(eq(conversations.id, conversationId))
}

export type ConversationWithLast = Conversation & { lastBody: string | null; total: number }

export async function listConversations(): Promise<ConversationWithLast[]> {
  const convos = await db.select().from(conversations).orderBy(desc(conversations.lastMessageAt))
  const result: ConversationWithLast[] = []
  for (const c of convos) {
    const last = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, c.id))
      .orderBy(desc(chatMessages.createdAt))
      .limit(1)
    const countRows = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, c.id))
    result.push({ ...c, lastBody: last[0]?.body ?? null, total: countRows[0]?.n ?? 0 })
  }
  return result
}

// Delete a single message from a conversation.
export async function deleteMessage(conversationId: number, messageId: number) {
  await db
    .delete(chatMessages)
    .where(and(eq(chatMessages.id, messageId), eq(chatMessages.conversationId, conversationId)))
}

// Delete an entire conversation and all its messages.
export async function deleteConversation(conversationId: number) {
  await db.delete(chatMessages).where(eq(chatMessages.conversationId, conversationId))
  await db.delete(conversations).where(eq(conversations.id, conversationId))
}

export async function getConversationByClientId(clientId: string) {
  const rows = await db.select().from(conversations).where(eq(conversations.clientId, clientId)).limit(1)
  return rows[0] ?? null
}

export async function getNewClientMessages(clientId: string, afterId: number) {
  const convo = await getConversationByClientId(clientId)
  if (!convo) return { conversationId: null as number | null, messages: [] as ChatMessage[] }
  const messages = await db
    .select()
    .from(chatMessages)
    .where(and(eq(chatMessages.conversationId, convo.id), sql`${chatMessages.id} > ${afterId}`))
    .orderBy(asc(chatMessages.createdAt))
  return { conversationId: convo.id, messages }
}
