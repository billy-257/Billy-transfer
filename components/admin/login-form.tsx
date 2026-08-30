"use client"

import { useActionState } from "react"
import { Lock } from "lucide-react"
import { login, type SaveState } from "@/app/admin/actions"

export function LoginForm() {
  const [state, formAction, pending] = useActionState<SaveState, FormData>(login, {})

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl"
      >
        <div className="mb-5 flex items-center gap-2">
          <Lock className="h-5 w-5 text-emerald-400" />
          <h1 className="text-lg font-bold text-white">Admin &middot; Billy Transfer</h1>
        </div>
        <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-slate-400">
          Ijambo ry&apos;ibanga
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-bold text-white focus:border-emerald-500 focus:outline-none"
          placeholder="••••••••"
        />
        {state.error ? <p className="mt-2 text-sm text-red-400">{state.error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="mt-4 w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-60"
        >
          {pending ? "Turimo kwinjira..." : "Injira (Login)"}
        </button>
      </form>
    </div>
  )
}
