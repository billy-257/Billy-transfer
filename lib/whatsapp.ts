import "server-only"

// WhatsApp Business Cloud API (Meta) helper for "Billy Transfer".
// Free tier: Meta gives 1,000 service conversations/month at no cost.
// Required environment variables (set after creating a Meta WhatsApp Business app):
//   WHATSAPP_ACCESS_TOKEN     - permanent access token for the WhatsApp system user
//   WHATSAPP_PHONE_NUMBER_ID  - the Phone Number ID of your WhatsApp sender
//   WHATSAPP_VERIFY_TOKEN     - any secret string you choose; used to verify the webhook

const GRAPH_VERSION = "v21.0"

export function whatsappConfigured() {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID)
}

// Sends a plain-text WhatsApp message to a customer's number (E.164 without '+').
export async function sendWhatsappText(to: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!token || !phoneNumberId) {
    return { ok: false, error: "WhatsApp not configured" }
  }

  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
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
      const detail = await res.text()
      console.log("[v0] WhatsApp send failed:", res.status, detail.slice(0, 300))
      return { ok: false, error: `${res.status}: ${detail.slice(0, 200)}` }
    }
    return { ok: true }
  } catch (err) {
    const message = (err as Error).message ?? String(err)
    console.log("[v0] WhatsApp send error:", message)
    return { ok: false, error: message }
  }
}
