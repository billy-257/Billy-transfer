"use client"

import { useEffect } from "react"

export function VisitTracker() {
  useEffect(() => {
    const key = "billy_visit_sent"
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, "1")
    const params = new URLSearchParams(window.location.search)
    const source = params.get("ref") || params.get("src") || params.get("utm_source") || ""
    fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname, referrer: document.referrer, source }),
      keepalive: true,
    }).catch(() => {})
  }, [])

  return null
}
