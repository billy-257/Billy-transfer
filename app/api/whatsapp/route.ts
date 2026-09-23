import { NextResponse } from "next/server"
import { generateKirundiReply, fallbackKirundiReply } from "@/lib/ai-reply"
import { appendTurn, getThread, sendWhatsAppText, alreadyHandled } from "@/lib/whatsapp"

export const dynamic = "force-dynamic"
// Allow the AI a little time to answer before the platform times out.
export const maxDuration = 30

// --- Webhook verification (Meta calls this once when you set the webhook URL) ---
export async function GET(req: Request) {
  const url = new URL(req.url)
  const mode = url.searchParams.get("hub.mode")
  const token = url.searchParams.get("hub.verify_token")
  const challenge = url.searchParams.get("hub.challenge")

  if (mode === "subscribe" && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 })
  }
  return new NextResponse("Forbidden", { status: 403 })
}

// --- Incoming messages ---
export async function POST(req: Request) {
  let payload: any
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ ok: true })
  }

  try {
    const entries = payload?.entry ?? []
    for (const entry of entries) {
      for (const change of entry?.changes ?? []) {
        const value = change?.value
        const messages = value?.messages ?? []
        const contactName: string | undefined = value?.contacts?.[0]?.profile?.name

        for (const message of messages) {
          // Only handle text messages; ignore statuses/reactions/etc.
          if (message?.type !== "text" || !message?.text?.body) continue
          if (alreadyHandled(message.id)) continue

          const from: string = message.from // sender's phone number (wa_id)
          const text: string = message.text.body

          appendTurn(from, "client", text)
          const thread = getThread(from)

          let reply = await generateKirundiReply(thread, contactName ?? null)
          if (!reply) reply = await fallbackKirundiReply(contactName ?? null, text, thread)

          appendTurn(from, "admin", reply)
          await sendWhatsAppText(from, reply)
        }
      }
    }
  } catch (err) {
    console.log("[v0] WhatsApp webhook error:", (err as Error).message)
  }

  // Always ack so Meta doesn't keep retrying.
  return NextResponse.json({ ok: true })
}
