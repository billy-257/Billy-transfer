import { NextResponse } from "next/server"
import { generateText, Output } from "ai"
import { z } from "zod"
import { isAuthenticated } from "@/lib/admin-auth"
import {
  githubConfigured,
  listSourceFiles,
  readFile,
  createBranch,
  commitFiles,
  createPullRequest,
  GITHUB_BASE_BRANCH,
  type FileChange,
} from "@/lib/github"

export const runtime = "nodejs"
export const maxDuration = 300

const PICK_MODEL = "google/gemini-2.5-flash"
const CODE_MODEL = process.env.AI_CODE_MODEL || "google/gemini-2.5-pro"

const APP_CONTEXT = `The repo is "RUNGIKA NA BILLY": a Next.js 16 App Router + Tailwind v4 + TypeScript app for sending money Dubai (AED) <-> Burundi (BIF) and East Africa. Data: Neon Postgres via Drizzle (lib/db/schema.ts). AI: Vercel AI SDK via AI Gateway (plain "provider/model" strings, no provider packages). UI language is Kirundi. Key files: components/client.tsx (the whole public homepage), components/client-chat.tsx (customer chat), components/feedback-section.tsx, components/admin/* (admin panel tabs), app/api/* (route handlers), lib/* (data access).`

const CODE_RULES = `Rules you MUST follow:
- Return the COMPLETE new content of every file you change or create (not a diff, no placeholders like "... rest unchanged ...").
- Only touch files under app/, components/, lib/, hooks/, styles/. NEVER edit package.json, lockfiles, next.config, tsconfig, or .env files. Use only dependencies that already exist in the code you were shown (react, next, tailwind, lucide-react, swr, ai, zod, drizzle-orm).
- Keep the existing dark slate/red visual style and Kirundi copy. Keep code TypeScript-strict and compilable. Escape apostrophes in JSX text with &apos;.
- Make the smallest change that fully implements the request. Do not refactor unrelated code.
- If a new database table/column is required, add it to lib/db/schema.ts AND include the SQL in "sql" so the owner can run it.
- If the request is unclear or impossible from these files, return files: [] and explain in summaryKirundi.`

const pickSchema = z.object({
  files: z.array(z.string()).max(8).describe("Existing file paths needed to implement the request"),
  reasoning: z.string(),
})

const editSchema = z.object({
  summaryKirundi: z.string().describe("2-4 simple Kirundi sentences telling the owner what was changed"),
  commitMessage: z.string().describe("Short English commit message"),
  files: z.array(z.object({ path: z.string(), content: z.string() })),
  sql: z.string().optional().describe("SQL to run manually if the schema changed, else empty"),
})

const ALLOWED = /^(app|components|lib|hooks|styles)\/[A-Za-z0-9_\-./[\]()@]+\.(tsx?|css)$/

export async function POST(req: Request) {
  if (!(await isAuthenticated())) return NextResponse.json({ ok: false }, { status: 401 })
  if (!githubConfigured()) {
    return NextResponse.json(
      { ok: false, error: "GITHUB_TOKEN ntiyashizwe muri Vercel. Yongere muri Settings > Environment Variables." },
      { status: 400 },
    )
  }

  try {
    const body = await req.json()
    const instruction = typeof body.instruction === "string" ? body.instruction.trim().slice(0, 4000) : ""
    const mode: "pr" | "direct" = body.mode === "direct" ? "direct" : "pr"
    if (instruction.length < 3) {
      return NextResponse.json({ ok: false, error: "Andika ico ushaka guhindura" }, { status: 400 })
    }

    // 1. Which files matter?
    const tree = await listSourceFiles()
    const treeList = tree.map((f) => `${f.path} (${f.size}b)`).join("\n")
    const pick = await generateText({
      model: PICK_MODEL,
      output: Output.object({ schema: pickSchema }),
      system: `${APP_CONTEXT}\nYou select which existing files a developer must read to implement a change request. Prefer the fewest files; always include the file(s) that will be edited. If a brand new page/component is needed, still include the files it must be wired into (e.g. components/client.tsx or components/admin/admin-dashboard.tsx).`,
      prompt: `Request from the owner:\n"""${instruction}"""\n\nRepository files:\n${treeList}`,
      timeout: 60_000,
    })
    const picked = (pick.output?.files ?? []).filter((p) => tree.some((t) => t.path === p)).slice(0, 8)

    const sources = await Promise.all(
      picked.map(async (p) => ({ path: p, content: await readFile(p) })),
    )
    const sourceBlock = sources
      .map((s) => `===== FILE: ${s.path} =====\n${s.content}\n===== END ${s.path} =====`)
      .join("\n\n")

    // 2. Produce the new file contents.
    const edit = await generateText({
      model: CODE_MODEL,
      output: Output.object({ schema: editSchema }),
      system: `${APP_CONTEXT}\n\nYou are a senior engineer implementing the owner's request directly in the codebase.\n${CODE_RULES}`,
      prompt: `Owner's request (may be Kirundi/French/English):\n"""${instruction}"""\n\nOther files in the repo (for reference, not shown): ${tree.map((t) => t.path).join(", ")}\n\nCurrent contents of the relevant files:\n\n${sourceBlock}`,
      timeout: 240_000,
    })

    const result = edit.output
    if (!result) throw new Error("AI ntiyashoboye gutanga inyishu")

    const changes: FileChange[] = result.files
      .filter((f) => ALLOWED.test(f.path) && f.content.trim().length > 0)
      .map((f) => ({ path: f.path, content: f.content.endsWith("\n") ? f.content : `${f.content}\n` }))

    if (changes.length === 0) {
      return NextResponse.json({
        ok: true,
        applied: false,
        summaryKirundi: result.summaryKirundi || "AI ntiyabonye ico ihindura kuri iki gisabwa.",
      })
    }

    // 3. Push to GitHub.
    const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14)
    const branch = mode === "direct" ? GITHUB_BASE_BRANCH : `admin-ai/${stamp}`
    if (mode !== "direct") await createBranch(branch)

    const commit = await commitFiles(
      branch,
      changes,
      `${result.commitMessage || "Admin AI change"}\n\nRequested from the admin panel:\n${instruction}\n\nCo-authored-by: v0 <it+v0agent@vercel.com>`,
    )

    let pr: { number: number; html_url: string } | null = null
    if (mode !== "direct") {
      pr = await createPullRequest(
        branch,
        result.commitMessage || "Admin AI change",
        `${result.summaryKirundi}\n\n**Request:** ${instruction}\n\n${result.sql ? `**SQL to run:**\n\`\`\`sql\n${result.sql}\n\`\`\`` : ""}`,
      )
    }

    return NextResponse.json({
      ok: true,
      applied: true,
      mode,
      branch,
      commitUrl: commit.html_url,
      pr,
      files: changes.map((c) => c.path),
      summaryKirundi: result.summaryKirundi,
      sql: result.sql || "",
    })
  } catch (err) {
    console.log("[v0] ai-apply error:", (err as Error).message)
    return NextResponse.json(
      { ok: false, error: ((err as Error).message ?? "Habaye ikibazo").slice(0, 400) },
      { status: 500 },
    )
  }
}
