import { NextResponse } from "next/server"
import { addFeedback, deleteFeedback, listFeedback } from "@/lib/feedback"
import { isAuthenticated } from "@/lib/admin-auth"

export const runtime = "nodejs"

// Simple per-process rate limit: 3 comments per 10 minutes per IP.
const hits = new Map<string, { count: number; ts: number }>()
function limited(key: string) {
  const now = Date.now()
  const rec = hits.get(key)
  if (!rec || now - rec.ts > 600_000) {
    hits.set(key, { count: 1, ts: now })
    return false
  }
  rec.count++
  return rec.count > 3
}

// Public: list feedback (newest first), paginated with ?before=<id>.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const before = Number(searchParams.get("before"))
  const data = await listFeedback(Number.isFinite(before) && before > 0 ? before : undefined)
  return NextResponse.json({ ok: true, ...data })
}

// Public: post a comment (name + comment only; no phone is collected).
export async function POST(req: Request) {
  try {
    const { name, comment } = await req.json()
    const n = typeof name === "string" ? name.trim().slice(0, 60) : ""
    const c = typeof comment === "string" ? comment.trim().slice(0, 600) : ""
    if (n.length < 2) return NextResponse.json({ ok: false, error: "Andika izina ryawe" }, { status: 400 })
    if (c.length < 3) return NextResponse.json({ ok: false, error: "Andika ico wiyumvira" }, { status: 400 })
    if (/https?:\/\/|www\./i.test(c)) {
      return NextResponse.json({ ok: false, error: "Nta link zemewe" }, { status: 400 })
    }
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon"
    if (limited(ip)) return NextResponse.json({ ok: false, error: "Tegereza gato" }, { status: 429 })

    const row = await addFeedback(n, c)
    return NextResponse.json({ ok: true, item: row })
  } catch {
    return NextResponse.json({ ok: false, error: "Habaye ikibazo" }, { status: 500 })
  }
}

// Admin only: remove a comment.
export async function DELETE(req: Request) {
  if (!(await isAuthenticated())) return NextResponse.json({ ok: false }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const id = Number(searchParams.get("id"))
  if (!id) return NextResponse.json({ ok: false }, { status: 400 })
  await deleteFeedback(id)
  return NextResponse.json({ ok: true })
}
