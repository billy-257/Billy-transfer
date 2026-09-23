import "server-only"
import type { ChatMessage } from "@/lib/db/schema"

// WhatsApp Cloud API config (set these in the project env vars).
const GRAPH_VERSION = "v21.0"
const TOKEN = process.env.WHATSAPP_TOKEN
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID

export function whatsappConfigured() {
  return Boolean(TOKEN && PHONE_NUMBER_ID)
}

/**
 * Short-lived per-sender conversation memory so the AI has context.
 * Serverless instances may reset this — that's acceptable for a simple bot;
 * it just means the model occasionally starts a thread fresh.
 */
const MAX_TURNS = 16
const store = new Map<string, { sender: "client" | "admin"; body: string }[]>()

export function getThread(phone: string): ChatMessage[] {
  const turns = store.get(phone) ?? []
  // Map lightweight turns onto the ChatMessage shape the AI helper expects.
  return turns.map((t, i) => ({
    id: i,
    conversationId: 0,
    sender: t.sender,
    body: t.body,
    createdAt: new Date(),
  })) as ChatMessage[]
}

export function appendTurn(phone: string, sender: "client" | "admin", body: string) {
  const turns = store.get(phone) ?? []
  turns.push({ sender, body })
  store.set(phone, turns.slice(-MAX_TURNS))
}

// De-duplicate WhatsApp webhook retries (Meta re-delivers if we're slow).
const seen = new Map<string, number>()
export function alreadyHandled(messageId: string): boolean {
  const now = Date.now()
  // Drop entries older than 10 minutes to keep the map small.
  for (const [id, at] of seen) if (now - at > 600_000) seen.delete(id)
  if (seen.has(messageId)) return true
  seen.set(messageId, now)
  return false
}

// Sends a plain-text WhatsApp message back to the user.
export async function sendWhatsAppText(to: string, body: string): Promise<boolean> {
  if (!whatsappConfigured()) {
    console.log("[v0] WhatsApp not configured; skipping send")
    return false
  }
  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { preview_url: false, body: body.slice(0, 4096) },
      }),
    })
    if (!res.ok) {
      console.log("[v0] WhatsApp send failed:", res.status, (await res.text()).slice(0, 300))
      return false
    }
    return true
  } catch (err) {
    console.log("[v0] WhatsApp send error:", (err as Error).message)
    return false
  }
}
