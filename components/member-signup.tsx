"use client"

import { useEffect, useRef, useState } from "react"
import { UserPlus, Camera, CheckCircle2, Phone, MapPin, Loader2 } from "lucide-react"

const CID_KEY = "billy_client_id"

function getClientId() {
  if (typeof window === "undefined") return ""
  let id = localStorage.getItem(CID_KEY)
  if (!id) {
    id = "c_" + Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem(CID_KEY, id)
  }
  return id
}

// Downscales a chosen image to a small square thumbnail data URL (keeps the DB light).
function resizeImage(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext("2d")
        if (!ctx) return reject(new Error("no ctx"))
        const min = Math.min(img.width, img.height)
        const sx = (img.width - min) / 2
        const sy = (img.height - min) / 2
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size)
        resolve(canvas.toDataURL("image/jpeg", 0.8))
      }
      img.onerror = reject
      img.src = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function MemberSignup() {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [town, setTown] = useState("")
  const [photo, setPhoto] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const clientId = useRef("")

  useEffect(() => {
    clientId.current = getClientId()
  }, [])

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setPhoto(await resizeImage(file))
    } catch {
      setError("Ntibishoboye gufata ifoto")
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return
    setError(null)
    setSaving(true)
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ clientId: clientId.current, name, phone, town, photo }),
      })
      const data = await res.json()
      if (data.ok) {
        setDone(true)
      } else {
        setError(data.error ?? "Ntibishoboye")
      }
    } catch {
      setError("Habaye ikibazo, gerageza kandi")
    } finally {
      setSaving(false)
    }
  }

  if (done) {
    return (
      <section
        id="iyandikishe"
        className="rounded-3xl border border-emerald-500/30 bg-slate-900 p-6 text-center shadow-xl"
      >
        <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-400" />
        <h3 className="text-lg font-black text-white">Wanditswe neza!</h3>
        <p className="mt-2 text-sm text-slate-400">
          Murakoze {name}. Twebwe kuri BILLY FAST TRANSFER tuzoshobora kukubona no kuguhamagara igihe cose.
        </p>
        <button
          onClick={() => {
            setDone(false)
          }}
          className="mt-4 text-xs font-bold text-emerald-400 underline"
        >
          Hindura amakuru yawe
        </button>
      </section>
    )
  }

  return (
    <section id="iyandikishe" className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
      <div className="mb-1 flex items-center gap-2">
        <UserPlus className="h-5 w-5 text-emerald-400" />
        <h3 className="text-base font-black uppercase tracking-wide text-emerald-400 md:text-lg">
          Iyandikishe kuri BILLY FAST TRANSFER
        </h3>
      </div>
      <p className="mb-5 text-xs leading-5 text-slate-400">
        Shira izina, ifoto, nimero ya telefone n&apos;aho uba kugira dushobore kuguhamagara vuba igihe hari
        ico dukeneye kukubwira.
      </p>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <label className="group relative h-20 w-20 flex-shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-slate-600 bg-slate-950">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo || "/placeholder.svg"} alt="Ifoto yawe" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-slate-500 group-hover:text-emerald-400">
                <Camera className="h-5 w-5" />
                <span className="text-[9px] font-bold">Ifoto</span>
              </span>
            )}
            <input type="file" accept="image/*" onChange={onPhoto} className="sr-only" />
          </label>
          <div className="flex-1">
            <label htmlFor="m-name" className="mb-1 block text-xs font-semibold text-slate-400">
              Izina ryawe
            </label>
            <input
              id="m-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              required
              placeholder="Amazina yawe yose"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-medium text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="m-phone" className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <Phone className="h-3.5 w-3.5" /> Nimero ya telefone
            </label>
            <input
              id="m-phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={30}
              required
              placeholder="+257 ..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-medium text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="m-town" className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <MapPin className="h-3.5 w-3.5" /> Aho uba (Igisagara/Komine)
            </label>
            <input
              id="m-town"
              value={town}
              onChange={(e) => setTown(e.target.value)}
              maxLength={60}
              required
              placeholder="Urf. Bujumbura, Gitega..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-medium text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-black text-white transition hover:bg-emerald-500 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          {saving ? "Turimo kubika..." : "Iyandikishe"}
        </button>
      </form>
    </section>
  )
}
