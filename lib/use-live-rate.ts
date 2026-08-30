"use client"

import { useEffect, useRef, useState } from "react"

export type Direction = "up" | "down" | "flat"

/**
 * Simulates a crypto/P2P-style rate that drifts gently up and down around a
 * fixed anchor (the admin-set price). It never overwrites the anchor: if the
 * anchor changes, the drift re-centers on the new value.
 */
export function useLiveRate(anchor: number) {
  const [rate, setRate] = useState(anchor)
  const [direction, setDirection] = useState<Direction>("flat")
  const rateRef = useRef(anchor)

  useEffect(() => {
    rateRef.current = anchor
    setRate(anchor)
  }, [anchor])

  useEffect(() => {
    if (!anchor || anchor <= 0) return
    let timeout: ReturnType<typeof setTimeout>

    const tick = () => {
      const current = rateRef.current
      // Max drift band: +/- 0.6% of the anchor.
      const band = anchor * 0.006
      // Gentle step: move only a few BIF at a time so it creeps digit-by-digit.
      const rawStep = 1 + Math.random() * 3
      const step = rawStep * (Math.random() < 0.5 ? -1 : 1)
      // Small mean-reversion pull back toward the anchor.
      const pull = (anchor - current) * 0.05
      let next = current + step + pull
      next = Math.max(anchor - band, Math.min(anchor + band, next))

      const rounded = Math.round(next)
      setDirection(rounded > Math.round(current) ? "up" : rounded < Math.round(current) ? "down" : "flat")
      rateRef.current = next
      setRate(next)

      // Slow, calm cadence between 5s and 9s.
      timeout = setTimeout(tick, 5000 + Math.random() * 4000)
    }

    timeout = setTimeout(tick, 5000)
    return () => clearTimeout(timeout)
  }, [anchor])

  return { rate, direction }
}
