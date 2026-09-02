// Minimal GitHub REST client used by the admin AI to read the repo and push changes.
// Requires GITHUB_TOKEN (fine-grained token with Contents + Pull requests: read/write).

const API = "https://api.github.com"
export const GITHUB_REPO = process.env.GITHUB_REPO || "billy-257/Billy-transfer"
export const GITHUB_BASE_BRANCH = process.env.GITHUB_BASE_BRANCH || "main"

export function githubConfigured() {
  return Boolean(process.env.GITHUB_TOKEN)
}

async function gh<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = process.env.GITHUB_TOKEN
  if (!token) throw new Error("GITHUB_TOKEN ntiyashizwe (missing).")
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`GitHub ${res.status} ${path}: ${body.slice(0, 200)}`)
  }
  return (await res.json()) as T
}

export type RepoFile = { path: string; size: number }

// All text source files in the repo (paths only).
export async function listSourceFiles(ref = GITHUB_BASE_BRANCH): Promise<RepoFile[]> {
  const data = await gh<{ tree: { path: string; type: string; size?: number }[] }>(
    `/repos/${GITHUB_REPO}/git/trees/${encodeURIComponent(ref)}?recursive=1`,
  )
  return data.tree
    .filter((t) => t.type === "blob")
    .filter((t) => /^(app|components|lib|hooks|styles)\/.*\.(tsx?|css|json)$/.test(t.path))
    .filter((t) => !t.path.includes("/ui/")) // shadcn primitives: not worth the tokens
    .map((t) => ({ path: t.path, size: t.size ?? 0 }))
}

export async function readFile(path: string, ref = GITHUB_BASE_BRANCH): Promise<string> {
  const data = await gh<{ content: string; encoding: string }>(
    `/repos/${GITHUB_REPO}/contents/${path.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(ref)}`,
  )
  return Buffer.from(data.content, "base64").toString("utf8")
}

async function getBranchHead(branch: string) {
  const ref = await gh<{ object: { sha: string } }>(
    `/repos/${GITHUB_REPO}/git/ref/heads/${encodeURIComponent(branch)}`,
  )
  const commit = await gh<{ tree: { sha: string } }>(`/repos/${GITHUB_REPO}/git/commits/${ref.object.sha}`)
  return { commitSha: ref.object.sha, treeSha: commit.tree.sha }
}

export async function createBranch(name: string, fromBranch = GITHUB_BASE_BRANCH) {
  const { commitSha } = await getBranchHead(fromBranch)
  await gh(`/repos/${GITHUB_REPO}/git/refs`, {
    method: "POST",
    body: JSON.stringify({ ref: `refs/heads/${name}`, sha: commitSha }),
  })
}

export type FileChange = { path: string; content: string }

// Commit several files in ONE commit on the given branch.
export async function commitFiles(branch: string, files: FileChange[], message: string) {
  const { commitSha, treeSha } = await getBranchHead(branch)

  const blobs = await Promise.all(
    files.map(async (f) => {
      const blob = await gh<{ sha: string }>(`/repos/${GITHUB_REPO}/git/blobs`, {
        method: "POST",
        body: JSON.stringify({ content: Buffer.from(f.content, "utf8").toString("base64"), encoding: "base64" }),
      })
      return { path: f.path, mode: "100644", type: "blob", sha: blob.sha }
    }),
  )

  const tree = await gh<{ sha: string }>(`/repos/${GITHUB_REPO}/git/trees`, {
    method: "POST",
    body: JSON.stringify({ base_tree: treeSha, tree: blobs }),
  })

  const commit = await gh<{ sha: string; html_url: string }>(`/repos/${GITHUB_REPO}/git/commits`, {
    method: "POST",
    body: JSON.stringify({ message, tree: tree.sha, parents: [commitSha] }),
  })

  await gh(`/repos/${GITHUB_REPO}/git/refs/heads/${encodeURIComponent(branch)}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha, force: false }),
  })

  return commit
}

export async function createPullRequest(head: string, title: string, body: string) {
  return gh<{ number: number; html_url: string }>(`/repos/${GITHUB_REPO}/pulls`, {
    method: "POST",
    body: JSON.stringify({ head, base: GITHUB_BASE_BRANCH, title, body }),
  })
}

export async function mergePullRequest(number: number) {
  return gh<{ merged: boolean; message: string }>(`/repos/${GITHUB_REPO}/pulls/${number}/merge`, {
    method: "PUT",
    body: JSON.stringify({ merge_method: "squash" }),
  })
}

export async function closePullRequest(number: number) {
  return gh(`/repos/${GITHUB_REPO}/pulls/${number}`, {
    method: "PATCH",
    body: JSON.stringify({ state: "closed" }),
  })
}

export type OpenPr = { number: number; title: string; html_url: string; head: { ref: string }; created_at: string }

export async function listAiPullRequests(): Promise<OpenPr[]> {
  const prs = await gh<OpenPr[]>(`/repos/${GITHUB_REPO}/pulls?state=open&per_page=20`)
  return prs.filter((p) => p.head.ref.startsWith("admin-ai/"))
}
