import { NextResponse } from "next/server"
import { addRoomMessage, listAfter, listBefore, listRecent, HOST_NAME } from "@/lib/room"
import { isAuthenticated } from "@/lib/admin-auth"
import { sendPushToAllClients } from "@/lib/push"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Per-process rate limit: max 20 messages per minute per IP.
const hits = new Map<string, { count: number; ts: number }>()
function limited(key: string) {
  const now = Date.now()
  const rec = hits.get(key)
  if (!rec || now - rec.ts > 60_000) {
    hits.set(key, { count: 1, ts: now })
    return false
  }
  rec.count++
  return rec.count > 20
}

// Public: read the room. ?after=<id> for new messages, ?before=<id> for older history.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const after = Number(searchParams.get("after"))
  const before = Number(searchParams.get("before"))
  if (Number.isFinite(after) && after > 0) {
    return NextResponse.json({ ok: true, messages: await listAfter(after) })
  }
  if (Number.isFinite(before) && before > 0) {
    return NextResponse.json({ ok: true, messages: await listBefore(before) })
  }
  return NextResponse.json({ ok: true, messages: await listRecent() })
}

// Public: post a message to the shared room.
export async function POST(req: Request) {
  try {
    const { clientId, name, body } = await req.json()
    const n = typeof name === "string" ? name.trim().slice(0, 40) : ""
    const b = typeof body === "string" ? body.trim().slice(0, 1000) : ""
    const cid = typeof clientId === "string" ? clientId.slice(0, 64) : null
    if (n.length < 2) return NextResponse.json({ ok: false, error: "Andika izina ryawe" }, { status: 400 })
    if (b.length < 1) return NextResponse.json({ ok: false, error: "Andika ubutumwa" }, { status: 400 })
    if (/https?:\/\/|www\./i.test(b)) {
      return NextResponse.json({ ok: false, error: "Nta link zemewe" }, { status: 400 })
    }
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon"
    if (limited(ip)) return NextResponse.json({ ok: false, error: "Tegereza gato" }, { status: 429 })

    // Only the authenticated admin may post as the business host. Everyone else
    // is blocked from impersonating the reserved name.
    const isHost = await isAuthenticated()
    if (!isHost && n.toUpperCase() === HOST_NAME) {
      return NextResponse.json({ ok: false, error: "Iryo zina ryabitswe kuri BILLY gusa" }, { status: 403 })
    }
    const finalName = isHost ? HOST_NAME : n

    const row = await addRoomMessage(cid, finalName, b, isHost)

    // Immediately notify everyone else in the room of the new message.
    try {
      await sendPushToAllClients(
        {
          title: `${finalName} · Aho kuganirira`,
          body: b.slice(0, 140),
          url: "/room",
          tag: "room-chat",
        },
        { excludeClientId: cid ?? undefined },
      )
    } catch (err) {
      console.log("[v0] room push failed:", (err as Error).message)
    }

    return NextResponse.json({ ok: true, message: row })
  } catch {
    return NextResponse.json({ ok: false, error: "Habaye ikibazo" }, { status: 500 })
  }
}
