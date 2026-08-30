import { NextResponse } from "next/server"
import { getOrCreateConversation, addMessage, getNewClientMessages, markRead } from "@/lib/inbox"
import { sendPush } from "@/lib/push"

export const runtime = "nodejs"

// Simple per-process rate limit for message sends.
const hits = new Map<string, { count: number; ts: number }>()
function limited(key: string) {
  const now = Date.now()
  const rec = hits.get(key)
  if (!rec || now - rec.ts > 60_000) {
    hits.set(key, { count: 1, ts: now })
    return false
  }
  rec.count++
  return rec.count > 12
}

// Client sends a message.
export async function POST(req: Request) {
  try {
    const { clientId, name, phone, body } = await req.json()
    if (typeof clientId !== "string" || !clientId.trim()) {
      return NextResponse.json({ ok: false, error: "Invalid client" }, { status: 400 })
    }
    const text = typeof body === "string" ? body.trim() : ""
    if (!text) return NextResponse.json({ ok: false, error: "Ubutumwa burakenewe" }, { status: 400 })
    if (text.length > 2000) return NextResponse.json({ ok: false, error: "Ubutumwa burebure cyane" }, { status: 400 })
    if (limited(clientId)) return NextResponse.json({ ok: false, error: "Tegereza gato" }, { status: 429 })

    const convo = await getOrCreateConversation(
      clientId.slice(0, 100),
      typeof name === "string" ? name.slice(0, 120) : undefined,
      typeof phone === "string" ? phone.slice(0, 40) : undefined,
    )
    const msg = await addMessage(convo.id, "client", text)

    // Notify the admin.
    sendPush(
      { role: "admin" },
      {
        title: `Ubutumwa bushya${convo.name ? ` - ${convo.name}` : ""}`,
        body: text.slice(0, 120),
        url: "/admin",
        tag: `convo-${convo.id}`,
      },
    ).catch(() => {})

    return NextResponse.json({ ok: true, message: msg })
  } catch {
    return NextResponse.json({ ok: false, error: "Habaye ikibazo" }, { status: 500 })
  }
}

// Client polls for new messages after a given id.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get("clientId")
  const after = Number(searchParams.get("after") ?? "0")
  if (!clientId) return NextResponse.json({ ok: false, messages: [] }, { status: 400 })

  const { conversationId, messages } = await getNewClientMessages(clientId, Number.isFinite(after) ? after : 0)
  // Mark admin replies as read by the client when they poll.
  if (conversationId && messages.some((m) => m.sender === "admin")) {
    await markRead(conversationId, "client")
  }
  return NextResponse.json({ ok: true, messages })
}
