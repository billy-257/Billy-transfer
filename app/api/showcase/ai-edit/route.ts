import { NextResponse } from "next/server"
import { generateText } from "ai"
import { isAuthenticated } from "@/lib/admin-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

// POST (admin): edit an uploaded image with a text prompt using a free AI Gateway
// image model (Google Gemini "nano-banana"). Returns the edited image as a data-URL.
export async function POST(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Ntiwemerewe" }, { status: 401 })
  }
  try {
    const { image, prompt } = await req.json()
    if (typeof image !== "string" || !image.startsWith("data:")) {
      return NextResponse.json({ ok: false, error: "Nta shusho watanze" }, { status: 400 })
    }
    const p = typeof prompt === "string" ? prompt.trim() : ""
    if (!p) {
      return NextResponse.json({ ok: false, error: "Andika ico ushaka guhindura ku ishusho" }, { status: 400 })
    }

    const mediaType = image.slice(5, image.indexOf(";")) || "image/jpeg"

    const result = await generateText({
      model: "google/gemini-2.5-flash-image",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: p },
            { type: "file", mediaType, data: image },
          ],
        },
      ],
    })

    const file = result.files.find((f) => f.mediaType.startsWith("image/"))
    if (!file) {
      return NextResponse.json(
        { ok: false, error: "AI ntiyashoboye guhindura iyi shusho. Gerageza indi prompt." },
        { status: 502 },
      )
    }

    const b64 = file.base64
    const dataUrl = b64.startsWith("data:") ? b64 : `data:${file.mediaType};base64,${b64}`
    return NextResponse.json({ ok: true, image: dataUrl })
  } catch (err) {
    console.log("[v0] ai-edit failed:", (err as Error).message)
    return NextResponse.json({ ok: false, error: "AI ntiyakoze neza. Gerageza kandi." }, { status: 500 })
  }
}
