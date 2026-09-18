"use client"

import { useEffect, useRef, useState } from "react"
import useSWR from "swr"
import { Image as ImageIcon, Megaphone, Save, Loader2, CheckCircle2, Eye, X, Trash2 } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// Resize an uploaded image to a compact JPEG data-URL for storage.
async function fileToDataUrl(file: File, maxW = 900): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxW / bitmap.width)
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(bitmap, 0, 0, w, h)
  return canvas.toDataURL("image/jpeg", 0.82)
}

export function PopupEditor() {
  const { data, mutate } = useSWR("/api/popup", fetcher)

  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [ctaLabel, setCtaLabel] = useState("")
  const [ctaUrl, setCtaUrl] = useState("")
  const [active, setActive] = useState(true)
  const [alsoPush, setAlsoPush] = useState(false)

  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [preview, setPreview] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const loaded = useRef(false)

  // Load existing popup once.
  useEffect(() => {
    if (loaded.current || !data) return
    loaded.current = true
    if (data.active !== undefined && data.body !== undefined) {
      setTitle(data.title ?? "")
      setBody(data.body ?? "")
      setImageUrl(data.imageUrl ?? null)
      setCtaLabel(data.ctaLabel ?? "")
      setCtaUrl(data.ctaUrl ?? "")
      setActive(!!data.active)
    }
  }, [data])

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const url = await fileToDataUrl(file)
      setImageUrl(url)
    } catch {
      setMsg("Ishusho ntiyashoboye kwinjizwa")
    }
  }

  async function save(nextActive: boolean) {
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch("/api/popup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          imageUrl,
          ctaLabel,
          ctaUrl,
          active: nextActive,
          push: alsoPush && nextActive,
        }),
      })
      const json = await res.json()
      if (json.ok) {
        setActive(nextActive)
        await mutate()
        setMsg(
          nextActive
            ? alsoPush
              ? `Byabitswe kandi byagiye kuri telefone ${json.sent}!`
              : "Byabitswe! Bizaboneka ku bantu bakinguye app."
            : "Popup yahagaritswe (ntibigaragara).",
        )
      } else {
        setMsg(json.error ?? "Ntibishoboye")
      }
    } catch {
      setMsg("Habaye ikibazo")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Megaphone className="h-5 w-5 text-emerald-400" />
        <h2 className="text-lg font-bold text-white">Popup / Itangazo rigaragara mu app</h2>
      </div>
      <p className="text-sm text-slate-400">
        Iyi popup iragaragara ku muntu wese akinguye app. Ushobora kongeramwo ishusho (ad) n&apos;akabuto. Ushaka,
        ushobora no kuyirungika nk&apos;integuza kuri telefone.
      </p>

      <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950 p-5">
        <div>
          <label htmlFor="p-title" className="mb-1.5 block text-sm font-bold text-white">
            Umutwe
          </label>
          <input
            id="p-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder="Urf. Igiciro gishasha uyu munsi!"
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-bold text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="p-body" className="mb-1.5 block text-sm font-bold text-white">
            Ubutumwa
          </label>
          <textarea
            id="p-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={1000}
            rows={4}
            placeholder="Andika ubutumwa canke itangazo..."
            className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-bold text-white">Ishusho (ad) — si ngombwa</span>
          {imageUrl ? (
            <div className="relative overflow-hidden rounded-xl border border-slate-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl || "/placeholder.svg"} alt="Popup" className="max-h-48 w-full object-cover" />
              <button
                onClick={() => {
                  setImageUrl(null)
                  if (fileRef.current) fileRef.current.value = ""
                }}
                className="absolute right-2 top-2 rounded-full bg-slate-950/80 p-1.5 text-white hover:bg-red-600"
                aria-label="Kura ishusho"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-600 bg-slate-900 py-6 text-sm font-medium text-slate-400 hover:border-emerald-500 hover:text-emerald-400"
            >
              <ImageIcon className="h-5 w-5" /> Hitamwo ishusho
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={onPickImage} className="hidden" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="p-cta" className="mb-1.5 block text-sm font-bold text-white">
              Akabuto (label)
            </label>
            <input
              id="p-cta"
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              maxLength={40}
              placeholder="Urf. Reba ibiciro"
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="p-ctaurl" className="mb-1.5 block text-sm font-bold text-white">
              Aho akabuto kajya (link)
            </label>
            <input
              id="p-ctaurl"
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              maxLength={300}
              placeholder="Urf. /room canke https://..."
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <label className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 cursor-pointer">
          <input
            type="checkbox"
            checked={alsoPush}
            onChange={(e) => setAlsoPush(e.target.checked)}
            className="h-5 w-5 rounded border-slate-600 bg-slate-900 accent-emerald-500"
          />
          <span className="text-sm font-bold text-white">Rungika kandi nk&apos;integuza kuri telefone (push)</span>
        </label>
      </div>

      {msg ? (
        <p className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-300">
          <CheckCircle2 className="h-4 w-4" /> {msg}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setPreview(true)}
          disabled={!body.trim()}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-bold text-slate-200 transition hover:border-slate-500 disabled:opacity-50"
        >
          <Eye className="h-4 w-4" /> Reba uko izosa
        </button>
        <button
          onClick={() => save(true)}
          disabled={saving || !body.trim()}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Bika & Erekana
        </button>
        {active ? (
          <button
            onClick={() => save(false)}
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300 transition hover:bg-red-500/20 disabled:opacity-60"
          >
            <X className="h-4 w-4" /> Hagarika
          </button>
        ) : null}
      </div>

      {preview ? <PopupPreview title={title} body={body} imageUrl={imageUrl} ctaLabel={ctaLabel} onClose={() => setPreview(false)} /> : null}
    </div>
  )
}

function PopupPreview({
  title,
  body,
  imageUrl,
  ctaLabel,
  onClose,
}: {
  title: string
  body: string
  imageUrl: string | null
  ctaLabel: string
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl || "/placeholder.svg"} alt="" className="max-h-56 w-full object-cover" />
        ) : null}
        <div className="p-5">
          {title ? <h3 className="mb-2 text-lg font-black text-white">{title}</h3> : null}
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{body}</p>
          <button className="mt-4 w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white">
            {ctaLabel || "Nabonye"}
          </button>
        </div>
      </div>
    </div>
  )
}
