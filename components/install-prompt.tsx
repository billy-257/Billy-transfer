"use client"

import { useEffect, useState } from "react"
import { Download, X, Share, Plus } from "lucide-react"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

function isStandalone() {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function isIos() {
  if (typeof navigator === "undefined") return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [showIosHelp, setShowIosHelp] = useState(false)

  useEffect(() => {
    if (isStandalone()) return

    // Android / Chrome / desktop: capture the native install event.
    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall)

    // iOS Safari never fires the event, so show the manual bar there.
    if (isIos()) setVisible(true)

    const onInstalled = () => {
      setVisible(false)
      setDeferred(null)
    }
    window.addEventListener("appinstalled", onInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  if (!visible) return null

  async function handleInstall() {
    if (deferred) {
      await deferred.prompt()
      const choice = await deferred.userChoice
      if (choice.outcome === "accepted") {
        setVisible(false)
      }
      setDeferred(null)
      return
    }
    // No native prompt (iOS, or browser without support): show instructions.
    setShowIosHelp(true)
  }

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-emerald-500/40 bg-slate-900/95 p-3 shadow-2xl backdrop-blur">
          <img
            src="/icon-192.png"
            alt="IWACU PAY"
            className="h-11 w-11 flex-shrink-0 rounded-xl"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">Installer app kuri telefone</p>
            <p className="truncate text-xs text-slate-400">Yifungura ningoga nk&apos;app nyayo.</p>
          </div>
          <button
            onClick={handleInstall}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-emerald-400"
          >
            <Download className="h-4 w-4" /> Installer
          </button>
          <button
            onClick={() => setVisible(false)}
            aria-label="Hisha"
            className="flex-shrink-0 rounded-full p-1 text-slate-500 transition hover:text-slate-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showIosHelp ? (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-3"
          onClick={() => setShowIosHelp(false)}
        >
          <div
            className="mx-auto w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Kuntu woshira app</h2>
              <button
                onClick={() => setShowIosHelp(false)}
                aria-label="Funga"
                className="rounded-full p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ol className="space-y-3 text-sm text-slate-300">
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-400">
                  1
                </span>
                <span className="flex items-center gap-1.5">
                  Kanda ku kamenyetso ka <Share className="inline h-4 w-4 text-emerald-400" /> (Share).
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-400">
                  2
                </span>
                <span className="flex items-center gap-1.5">
                  Hitamwo <Plus className="inline h-4 w-4 text-emerald-400" /> &quot;Add to Home Screen&quot;.
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-400">
                  3
                </span>
                <span>Kanda &quot;Add&quot; app ize kuri telefone yawe.</span>
              </li>
            </ol>
          </div>
        </div>
      ) : null}
    </>
  )
}
