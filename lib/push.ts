import "server-only"
import webpush from "web-push"
import { eq, and } from "drizzle-orm"
import { db } from "@/lib/db"
import { pushConfig, pushSubscriptions } from "@/lib/db/schema"

let configured: { publicKey: string; privateKey: string } | null = null

// Loads the VAPID keys from the DB, generating and persisting them once.
export async function getPushKeys() {
  if (configured) return configured

  const rows = await db.select().from(pushConfig).where(eq(pushConfig.id, 1)).limit(1)
  let row = rows[0]

  if (!row) {
    const keys = webpush.generateVAPIDKeys()
    await db
      .insert(pushConfig)
      .values({ id: 1, publicKey: keys.publicKey, privateKey: keys.privateKey })
      .onConflictDoNothing()
    const reread = await db.select().from(pushConfig).where(eq(pushConfig.id, 1)).limit(1)
    row = reread[0] ?? { id: 1, publicKey: keys.publicKey, privateKey: keys.privateKey, createdAt: new Date() }
  }

  configured = { publicKey: row.publicKey, privateKey: row.privateKey }
  webpush.setVapidDetails("mailto:admin@billytransfer.com", row.publicKey, row.privateKey)
  return configured
}

export async function getPublicKey() {
  const { publicKey } = await getPushKeys()
  return publicKey
}

type PushPayload = { title: string; body: string; url?: string; tag?: string }

// Sends a notification to every subscription matching the target.
export async function sendPush(
  target: { role: "admin" } | { role: "client"; clientId: string },
  payload: PushPayload,
) {
  await getPushKeys()

  const subs =
    target.role === "admin"
      ? await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.role, "admin"))
      : await db
          .select()
          .from(pushSubscriptions)
          .where(and(eq(pushSubscriptions.role, "client"), eq(pushSubscriptions.clientId, target.clientId)))

  const body = JSON.stringify(payload)
  const stale: number[] = []

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        )
      } catch (err: unknown) {
        const status = (err as { statusCode?: number })?.statusCode
        if (status === 404 || status === 410) stale.push(s.id)
      }
    }),
  )

  if (stale.length) {
    for (const id of stale) {
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, id))
    }
  }
}
