"use client"

import { useRef, useState } from "react"
import useSWR from "swr"
import {
  Images,
  ImagePlus,
  Sparkles,
  Loader2,
  Save,
  Trash2,
  Eye,
  EyeOff,
  Wand2,
  CheckCircle2,
  X,
} from "lucide-react"

type Slide = {
  id: number
  imageUrl: string
  title: string
  caption: string
  sortOrder: number
  active: boolean
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// Resize an image (File or data-URL) to a compact JPEG data-URL for storage.
async function toCompactDataUrl(src: Blob | string, maxW = 1000): Promise<string> {
  const bitmap =
    typeof src === "string"
      ? await createImageBitmap(await (await fetch(src)).blob())
      : await createImageBitmap(src)
  const scale = Math.min(1, maxW / bitmap.width)
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h)
  return canvas.toDataURL("image/jpeg", 0.85)
}

// Ask the free AI to edit an image with a text prompt. Returns a new data-URL.
async function aiEdit(image: string, prompt: string): Promise<string> {
  const res = await fetch("/api/showcase/ai-edit", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ image, prompt }),
  })
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || "AI ntiyakoze")
  return json.image as string
}

export function ShowcaseManager() {
  const { data, mutate } = useSWR<{ slides: Slide[] }>("/api/showcase?admin=1", fetcher)
  const slides = data?.slides ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Images className="h-5 w-5 text-emerald-400" />
        <h2 className="text-lg font-bold text-white">Amashusho ariko aranyerera (carousel)</h2>
      </div>
      <p className="text-sm text-slate-400">
        Ongeramwo, uhindure canke ukure amashusho n&apos;amajambo agaragara ku rupapuro rw&apos;itangiriro. Ushobora
        no gukoresha <span className="font-bold text-emerald-400">AI y&apos;ubuntu</span> guhindura ishusho ukoresheje
        prompt (amajambo) imbere yo kuyishira ahabona.
      </p>

      <NewSlideForm onDone={() => mutate()} />

      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">
          Amashusho ariho ({slides.length})
        </h3>
        {slides.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-700 bg-slate-950 px-4 py-6 text-center text-sm text-slate-500">
            Nta shusho iriho. Ongeramwo iya mbere hejuru.
          </p>
        ) : (
          slides.map((s) => <SlideRow key={s.id} slide={s} onChange={() => mutate()} />)
        )}
      </div>
    </div>
  )
}

function NewSlideForm({ onDone }: { onDone: () => void }) {
  const [image, setImage] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [caption, setCaption] = useState("")
  const [prompt, setPrompt] = useState("")
  const [busy, setBusy] = useState<"" | "upload" | "ai" | "save">("")
  const [msg, setMsg] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy("upload")
    setMsg(null)
    try {
      setImage(await toCompactDataUrl(file))
    } catch {
      setMsg("Ishusho ntiyinjiye")
    } finally {
      setBusy("")
    }
  }

  async function runAi() {
    if (!image || !prompt.trim()) return
    setBusy("ai")
    setMsg(null)
    try {
      const edited = await aiEdit(image, prompt.trim())
      setImage(await toCompactDataUrl(edited))
      setMsg("AI yahinduye ishusho! Reba niba bikuneza hanyuma ubike.")
    } catch (err) {
      setMsg((err as Error).message)
    } finally {
      setBusy("")
    }
  }

  async function save() {
    if (!image) return
    setBusy("save")
    setMsg(null)
    try {
      const res = await fetch("/api/showcase", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ imageUrl: image, title, caption }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error)
      setImage(null)
      setTitle("")
      setCaption("")
      setPrompt("")
      if (fileRef.current) fileRef.current.value = ""
      setMsg("Yashizwe ahabona!")
      onDone()
    } catch (err) {
      setMsg((err as Error).message || "Ntibishoboye")
    } finally {
      setBusy("")
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-emerald-500/30 bg-slate-950 p-5">
      <div className="flex items-center gap-2">
        <ImagePlus className="h-4 w-4 text-emerald-400" />
        <span className="text-sm font-bold text-white">Ongeramwo ishusho nshasha</span>
      </div>

      {image ? (
        <div className="relative overflow-hidden rounded-xl border border-slate-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image || "/placeholder.svg"} alt="Preview" className="max-h-64 w-full object-cover" />
          <button
            onClick={() => {
              setImage(null)
              if (fileRef.current) fileRef.current.value = ""
            }}
            className="absolute right-2 top-2 rounded-full bg-slate-950/80 p-1.5 text-white hover:bg-red-600"
            aria-label="Kura ishusho"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy === "upload"}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-600 bg-slate-900 py-8 text-sm font-medium text-slate-400 hover:border-emerald-500 hover:text-emerald-400 disabled:opacity-50"
        >
          {busy === "upload" ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
          Hitamwo ishusho
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="hidden" />

      {image ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-emerald-400">
            <Wand2 className="h-3.5 w-3.5" /> Hindura ishusho na AI (prompt)
          </label>
          <div className="flex gap-2">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Urf. Ongerako 'BILLY FAST TRANSFER' + ibara ry'icatsi"
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            <button
              onClick={runAi}
              disabled={busy === "ai" || !prompt.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600/90 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50"
            >
              {busy === "ai" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Hindura
            </button>
          </div>
        </div>
      ) : null}

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={120}
        placeholder="Umutwe (urf. Rungika mu maseconde)"
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-bold text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
      />
      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        maxLength={300}
        rows={2}
        placeholder="Amajambo agaragara kuri iyi shusho..."
        className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
      />

      {msg ? (
        <p className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-300">
          <CheckCircle2 className="h-4 w-4" /> {msg}
        </p>
      ) : null}

      <button
        onClick={save}
        disabled={!image || busy === "save"}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-60"
      >
        {busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Shira ahabona
      </button>
    </div>
  )
}

function SlideRow({ slide, onChange }: { slide: Slide; onChange: () => void }) {
  const [title, setTitle] = useState(slide.title)
  const [caption, setCaption] = useState(slide.caption)
  const [image, setImage] = useState(slide.imageUrl)
  const [prompt, setPrompt] = useState("")
  const [busy, setBusy] = useState<"" | "ai" | "save" | "del" | "toggle">("")
  const [msg, setMsg] = useState<string | null>(null)

  const dirty = title !== slide.title || caption !== slide.caption || image !== slide.imageUrl

  async function runAi() {
    if (!prompt.trim()) return
    setBusy("ai")
    setMsg(null)
    try {
      const edited = await aiEdit(image, prompt.trim())
      setImage(await toCompactDataUrl(edited))
      setMsg("AI yahinduye — bika kugira bigume.")
    } catch (err) {
      setMsg((err as Error).message)
    } finally {
      setBusy("")
    }
  }

  async function save() {
    setBusy("save")
    setMsg(null)
    try {
      await fetch("/api/showcase", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: slide.id, title, caption, imageUrl: image }),
      })
      onChange()
      setMsg("Byabitswe!")
    } finally {
      setBusy("")
    }
  }

  async function toggle() {
    setBusy("toggle")
    await fetch("/api/showcase", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: slide.id, active: !slide.active }),
    })
    onChange()
    setBusy("")
  }

  async function remove() {
    if (!confirm("Ukure iyi shusho?")) return
    setBusy("del")
    await fetch(`/api/showcase?id=${slide.id}`, { method: "DELETE" })
    onChange()
  }

  return (
    <div className={`rounded-2xl border bg-slate-950 p-4 ${slide.active ? "border-slate-800" : "border-slate-800 opacity-60"}`}>
      <div className="flex gap-4">
        <div className="relative h-24 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-slate-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image || "/placeholder.svg"} alt={title} className="h-full w-full object-cover" />
        </div>
        <div className="flex-1 space-y-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder="Umutwe"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-bold text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={300}
            rows={2}
            placeholder="Amajambo"
            className="w-full resize-none rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Hindura iyi shusho na AI (prompt)..."
          className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
        />
        <button
          onClick={runAi}
          disabled={busy === "ai" || !prompt.trim()}
          className="flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
        >
          {busy === "ai" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
          AI
        </button>
      </div>

      {msg ? <p className="mt-2 text-xs font-medium text-emerald-300">{msg}</p> : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={save}
          disabled={busy === "save" || !dirty}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {busy === "save" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Bika
        </button>
        <button
          onClick={toggle}
          disabled={busy === "toggle"}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200 transition hover:border-slate-500"
        >
          {slide.active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {slide.active ? "Hisha" : "Erekana"}
        </button>
        <button
          onClick={remove}
          disabled={busy === "del"}
          className="flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
        >
          {busy === "del" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          Kura
        </button>
      </div>
    </div>
  )
}
