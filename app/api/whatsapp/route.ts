import { NextResponse } from "next/server"
import { getOrCreateConversation, addMessage, getThread } from "@/lib/inbox"
import { generateKirundiReply, fallbackKirundiReply } from "@/lib/ai-reply"
import { sendWhatsappText } from "@/lib/whatsapp"

export const runtime = "nodejs"
// A model reply can take several seconds; keep the function alive long enough.
export const maxDuration = 60

// --- Webhook verification (Meta calls this once when you save the webhook URL) ---
export async function GET(req: Request) {
  const url = new URL(req.url)
  const mode = url.searchParams.get("hub.mode")
  const token = url.searchParams.get("hub.verify_token")
  const challenge = url.searchParams.get("hub.challenge")

  if (mode === "subscribe" && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    // Meta expects the raw challenge string echoed back.
    return new Response(challenge ?? "", { status: 200 })
  }
  return new Response("Forbidden", { status: 403 })
}

// Meta may retry, so ignore messages we've already handled in this instance.
const handled = new Set<string>()

// --- Incoming messages ---
export async function POST(req: Request) {
  let payload: any
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ ok: true })
  }

  // Always ack fast; do the work but never throw back to Meta (avoids retries storms).
  try {
    const entry = payload?.entry?.[0]
    const change = entry?.changes?.[0]
    const value = change?.value
    const message = value?.messages?.[0]

    // Delivery/read status callbacks have no `messages` — just acknowledge them.
    if (!message) return NextResponse.json({ ok: true })

    // Only handle text messages; politely handle other types.
    const from: string = message.from // customer's number, E.164 without '+'
    const messageId: string = message.id
    if (handled.has(messageId)) return NextResponse.json({ ok: true })
    handled.add(messageId)
    if (handled.size > 500) handled.clear()

    const profileName: string | undefined = value?.contacts?.[0]?.profile?.name
    let text = ""
    if (message.type === "text") {
      text = message.text?.body ?? ""
    } else {
      text = `[${message.type}]`
    }

    // Log into the SAME admin inbox so Billy sees WhatsApp chats and can take over.
    const clientId = `wa:${from}`
    const convo = await getOrCreateConversation(clientId, profileName, `+${from}`)
    await addMessage(convo.id, "client", text || `[${message.type}]`)

    // Non-text messages: ask for text, don't run the model.
    if (message.type !== "text" || !text.trim()) {
      const note =
        "Muraho! Kubw'ikibazo canke kurungika amafaranga, andika ubutumwa mu majambo (text) turabishure. Murakoze!"
      await addMessage(convo.id, "admin", note)
      await sendWhatsappText(from, note)
      return NextResponse.json({ ok: true })
    }

    // Generate the customer-care reply in Kirundi with live rates.
    const thread = await getThread(convo.id)
    let reply = await generateKirundiReply(thread, convo.name ?? profileName)
    if (!reply) reply = await fallbackKirundiReply(convo.name ?? profileName, text, thread)

    if (reply) {
      await addMessage(convo.id, "admin", reply)
      await sendWhatsappText(from, reply)
    }
  } catch (err) {
    console.log("[v0] WhatsApp webhook error:", (err as Error).message)
  }

  return NextResponse.json({ ok: true })
}
