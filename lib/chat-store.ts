"use client"

import { useSyncExternalStore } from "react"

// Tiny shared store so the header badge and the chat widget stay in sync.
type ChatState = { open: boolean; unread: number }

let state: ChatState = { open: false, unread: 0 }
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

export const chatStore = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  },
  setOpen(open: boolean) {
    state = { ...state, open, unread: open ? 0 : state.unread }
    emit()
  },
  setUnread(unread: number) {
    if (unread === state.unread) return
    state = { ...state, unread }
    emit()
  },
}

const serverSnapshot: ChatState = { open: false, unread: 0 }

export function useChatStore() {
  return useSyncExternalStore(chatStore.subscribe, chatStore.get, () => serverSnapshot)
}
