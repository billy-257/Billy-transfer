import { NextResponse } from "next/server"
import { deleteMember, listMembers, upsertMember } from "@/lib/members"
import { isAuthenticated } from "@/lib/admin-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Per-process rate limit: max 5 submissions per minute per IP.
const hits = new Map<string, { count: number; ts: number }>()
function limited(key: string) {
  const now = Date.now()
  const rec = hits.get(key)
  if (!rec || now - rec.ts > 60_000) {
    hits.set(key, { count: 1, ts: now })
    return false
  }
  rec.count++
  return rec.count > 5
}

// Admin only: list every member in the directory.
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  return NextResponse.json({ ok: true, members: await listMembers() })
}

// Public: register (or update) your own contact card.
export async function POST(req: Request) {
  try {
    const { clientId, name, phone, town, photo } = await req.json()
    const n = typeof name === "string" ? name.trim().slice(0, 60) : ""
    const p = typeof phone === "string" ? phone.trim().slice(0, 30) : ""
    const t = typeof town === "string" ? town.trim().slice(0, 60) : ""
    const cid = typeof clientId === "string" ? clientId.slice(0, 64) : null
    // Photo is a small data-URL thumbnail; cap size to keep the row light.
    const img =
      typeof photo === "string" && photo.startsWith("data:image/") && photo.length < 400_000 ? photo : null

    if (n.length < 2) return NextResponse.json({ ok: false, error: "Andika izina ryawe" }, { status: 400 })
    if (p.replace(/[^0-9]/g, "").length < 6) {
      return NextResponse.json({ ok: false, error: "Andika nimero ya telefone" }, { status: 400 })
    }
    if (t.length < 2) return NextResponse.json({ ok: false, error: "Andika igisagara/komine" }, { status: 400 })

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon"
    if (limited(ip)) return NextResponse.json({ ok: false, error: "Tegereza gato" }, { status: 429 })

    const row = await upsertMember({ clientId: cid, name: n, phone: p, town: t, photo: img })
    return NextResponse.json({ ok: true, member: row })
  } catch {
    return NextResponse.json({ ok: false, error: "Habaye ikibazo" }, { status: 500 })
  }
}

// Admin only: remove a member from the directory.
export async function DELETE(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const id = Number(searchParams.get("id"))
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  await deleteMember(id)
  return NextResponse.json({ ok: true })
}
