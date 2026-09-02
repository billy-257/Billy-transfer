import { NextResponse } from "next/server"
import { isAuthenticated } from "@/lib/admin-auth"
import { githubConfigured, listAiPullRequests, mergePullRequest, closePullRequest, GITHUB_REPO } from "@/lib/github"

export const runtime = "nodejs"

// GET: open pull requests created by the admin AI.
export async function GET() {
  if (!(await isAuthenticated())) return NextResponse.json({ ok: false }, { status: 401 })
  if (!githubConfigured()) return NextResponse.json({ ok: true, configured: false, prs: [] })
  try {
    const prs = await listAiPullRequests()
    return NextResponse.json({
      ok: true,
      configured: true,
      repo: GITHUB_REPO,
      prs: prs.map((p) => ({ number: p.number, title: p.title, url: p.html_url, createdAt: p.created_at })),
    })
  } catch (err) {
    return NextResponse.json({ ok: false, configured: true, error: (err as Error).message.slice(0, 300) }, { status: 500 })
  }
}

// POST { number, action: "merge" | "close" }
export async function POST(req: Request) {
  if (!(await isAuthenticated())) return NextResponse.json({ ok: false }, { status: 401 })
  try {
    const { number, action } = await req.json()
    const n = Number(number)
    if (!Number.isInteger(n) || n <= 0) return NextResponse.json({ ok: false, error: "PR itariyo" }, { status: 400 })
    if (action === "close") {
      await closePullRequest(n)
      return NextResponse.json({ ok: true, closed: true })
    }
    const res = await mergePullRequest(n)
    if (!res.merged) throw new Error(res.message || "Merge failed")
    return NextResponse.json({ ok: true, merged: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message.slice(0, 300) }, { status: 500 })
  }
}
