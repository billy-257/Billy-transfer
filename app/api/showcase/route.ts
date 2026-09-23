import { NextResponse } from "next/server"
import { isAuthenticated } from "@/lib/admin-auth"
import { createSlide, deleteSlide, listActiveSlides, listAllSlides, updateSlide } from "@/lib/showcase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET: public returns active slides. ?admin=1 (authenticated) returns all slides.
export async function GET(req: Request) {
  const url = new URL(req.url)
  if (url.searchParams.get("admin") === "1") {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ ok: false, error: "Ntiwemerewe" }, { status: 401 })
    }
    return NextResponse.json({ ok: true, slides: await listAllSlides() })
  }
  return NextResponse.json({ slides: await listActiveSlides() })
}

// POST (admin): create a slide.
export async function POST(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Ntiwemerewe" }, { status: 401 })
  }
  try {
    const data = await req.json()
    const imageUrl = typeof data.imageUrl === "string" ? data.imageUrl : ""
    if (!imageUrl) return NextResponse.json({ ok: false, error: "Nta shusho" }, { status: 400 })
    const slide = await createSlide({
      imageUrl,
      title: typeof data.title === "string" ? data.title.trim() : "",
      caption: typeof data.caption === "string" ? data.caption.trim() : "",
    })
    return NextResponse.json({ ok: true, slide })
  } catch {
    return NextResponse.json({ ok: false, error: "Habaye ikibazo" }, { status: 500 })
  }
}

// PUT (admin): update a slide.
export async function PUT(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Ntiwemerewe" }, { status: 401 })
  }
  try {
    const data = await req.json()
    const id = Number(data.id)
    if (!Number.isInteger(id)) return NextResponse.json({ ok: false, error: "Nta id" }, { status: 400 })
    const slide = await updateSlide(id, {
      imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : undefined,
      title: typeof data.title === "string" ? data.title.trim() : undefined,
      caption: typeof data.caption === "string" ? data.caption.trim() : undefined,
      active: typeof data.active === "boolean" ? data.active : undefined,
      sortOrder: typeof data.sortOrder === "number" ? data.sortOrder : undefined,
    })
    return NextResponse.json({ ok: true, slide })
  } catch {
    return NextResponse.json({ ok: false, error: "Habaye ikibazo" }, { status: 500 })
  }
}

// DELETE (admin): remove a slide by ?id=.
export async function DELETE(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Ntiwemerewe" }, { status: 401 })
  }
  try {
    const id = Number(new URL(req.url).searchParams.get("id"))
    if (!Number.isInteger(id)) return NextResponse.json({ ok: false, error: "Nta id" }, { status: 400 })
    await deleteSlide(id)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: "Habaye ikibazo" }, { status: 500 })
  }
}
