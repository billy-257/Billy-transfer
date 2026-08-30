import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { conversations } from "@/lib/db/schema"
import { isAuthenticated } from "@/lib/admin-auth"
import { listConversations, getThread, addMessage, markRead } from "@/lib/inbox"
import { sendPush } from "@/lib/push"

export const runtime = "nodejs"

export async function GET(req: Request) {
  if (!(await isAuthenticated())) return NextResponse.json({ ok: false }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const conversationId = searchParams.get("conversationId")

  if (conversationId) {
    const id = Number(conversationId)
    const messages = await getThread(id)
    await markRead(id, "admin")
    return NextResponse.json({ ok: true, messages })
  }

  const convos = await listConversations()
  return NextResponse.json({ ok: true, conversations: convos })
}

// Admin replies to a conversation.
export async function POST(req: Request) {
  if (!(await isAuthenticated())) return NextResponse.json({ ok: false }, { status: 401 })
  try {
    const { conversationId, body } = await req.json()
    const id = Number(conversationId)
    const text = typeof body === "string" ? body.trim() : ""
    if (!id || !text) return NextResponse.json({ ok: false }, { status: 400 })

    const msg = await addMessage(id, "admin", text.slice(0, 2000))

    const rows = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1)
    const convo = rows[0]
    if (convo) {
      sendPush(
        { role: "client", clientId: convo.clientId },
        {
          title: "Igisubizo kivuye kuri Billy Transfer",
          body: text.slice(0, 120),
          url: "/",
          tag: `convo-${id}`,
        },
      ).catch(() => {})
    }

    return NextResponse.json({ ok: true, message: msg })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
