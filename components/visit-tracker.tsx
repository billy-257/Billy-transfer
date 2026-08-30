"use client"

import { useEffect } from "react"

export function VisitTracker() {
  useEffect(() => {
    const key = "billy_visit_sent"
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, "1")
    fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname, referrer: document.referrer }),
      keepalive: true,
    }).catch(() => {})
  }, [])

  return null
}
