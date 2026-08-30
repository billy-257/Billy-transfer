import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { pushSubscriptions } from "@/lib/db/schema"
import { getPublicKey } from "@/lib/push"
import { isAuthenticated } from "@/lib/admin-auth"

export const runtime = "nodejs"

// Returns the VAPID public key for the browser to subscribe.
export async function GET() {
  const publicKey = await getPublicKey()
  return NextResponse.json({ publicKey })
}

// Stores a push subscription for either the admin or a client.
export async function POST(req: Request) {
  try {
    const { role, clientId, subscription } = await req.json()
    if (role !== "admin" && role !== "client") {
      return NextResponse.json({ ok: false }, { status: 400 })
    }
    if (role === "admin" && !(await isAuthenticated())) {
      return NextResponse.json({ ok: false }, { status: 401 })
    }
    const endpoint = subscription?.endpoint
    const p256dh = subscription?.keys?.p256dh
    const auth = subscription?.keys?.auth
    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const existing = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint))
      .limit(1)

    if (existing[0]) {
      await db
        .update(pushSubscriptions)
        .set({ role, clientId: role === "client" ? String(clientId ?? "").slice(0, 100) : null, p256dh, auth })
        .where(eq(pushSubscriptions.id, existing[0].id))
    } else {
      await db.insert(pushSubscriptions).values({
        role,
        clientId: role === "client" ? String(clientId ?? "").slice(0, 100) : null,
        endpoint,
        p256dh,
        auth,
      })
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
