"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import useSWR from "swr"
import { ChevronLeft, ChevronRight } from "lucide-react"

type Slide = {
  id: number
  imageUrl: string
  title: string
  caption: string
}

// Fallback slides used only if the admin hasn't added any yet.
const FALLBACK: Slide[] = [
  {
    id: -1,
    imageUrl: "/showcase/sending-money.png",
    title: "Rungika mu maseconde",
    caption: "Ava Dubai (AED/USD) aja mu Burundi ningoga cane, ukoresheje telefone yawe gusa.",
  },
  {
    id: -2,
    imageUrl: "/showcase/receiving-money.png",
    title: "Amahera yawe arinzwe",
    caption: "Buri kurungika kwizewe kandi kurindiwe. Uraronka integuza igihe amahera ashitse.",
  },
  {
    id: -3,
    imageUrl: "/showcase/family-support.png",
    title: "Ushigikira abo ukunda",
    caption: "Fasha umuryango wawe n'abagenzi bawe aho bari hose, mu Burundi no mu bindi bihugu vya Afrika.",
  },
]

const fetcher = (url: string) => fetch(url).then((r) => r.json())
const AUTO_MS = 2600 // each slide shows ~2.6s

export function FeatureShowcase() {
  const { data } = useSWR<{ slides: Slide[] }>("/api/showcase", fetcher, {
    revalidateOnFocus: false,
  })

  const slides = data?.slides && data.slides.length > 0 ? data.slides : FALLBACK
  const count = slides.length

  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchX = useRef<number | null>(null)

  const go = useCallback(
    (next: number) => {
      setIndex((_) => ((next % count) + count) % count)
    },
    [count],
  )

  // Auto-advance every AUTO_MS unless paused or only one slide.
  useEffect(() => {
    if (paused || count <= 1) return
    const t = setInterval(() => setIndex((i) => (i + 1) % count), AUTO_MS)
    return () => clearInterval(t)
  }, [paused, count])

  // Keep index valid if the slide count changes.
  useEffect(() => {
    if (index > count - 1) setIndex(0)
  }, [count, index])

  function onTouchStart(e: React.TouchEvent) {
    touchX.current = e.touches[0].clientX
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchX.current == null) return
    const dx = e.changedTouches[0].clientX - touchX.current
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1))
    touchX.current = null
  }

  return (
    <section aria-label="Ico app ikora" className="py-2">
      <div className="mb-5 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">Billy Fast Transfer</p>
        <h2 className="mt-2 text-balance text-2xl font-black text-white sm:text-3xl">Amahera yawe, inshingano zacu</h2>
        <p className="mx-auto mt-2 max-w-md text-pretty text-sm leading-relaxed text-slate-400">
          Twegereza amahera yawe abo ukunda mu buryo bwihuse, bworoshe kandi bwizewe.
        </p>
      </div>

      <div
        className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-xl"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Sliding track: moves sideways by index */}
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((s) => (
            <article key={s.id} className="relative w-full flex-shrink-0">
              <div className="relative aspect-[4/5] w-full overflow-hidden sm:aspect-[16/10]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.imageUrl || "/placeholder.svg"} alt={s.title} className="h-full w-full object-cover" />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                <h3 className="text-balance text-xl font-black text-white sm:text-2xl">{s.title}</h3>
                {s.caption ? (
                  <p className="mt-1.5 max-w-lg text-pretty text-sm leading-relaxed text-slate-200">{s.caption}</p>
                ) : null}
              </div>
            </article>
          ))}
        </div>

        {count > 1 ? (
          <>
            <button
              onClick={() => go(index - 1)}
              aria-label="Isubira inyuma"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-slate-950/60 p-2 text-white backdrop-blur transition hover:bg-slate-950/90"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => go(index + 1)}
              aria-label="Ija imbere"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-slate-950/60 p-2 text-white backdrop-blur transition hover:bg-slate-950/90"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-1.5">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => go(i)}
                  aria-label={`Ishusho ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-6 bg-emerald-400" : "w-1.5 bg-white/50 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  )
}
