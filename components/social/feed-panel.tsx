"use client"

import { useRef, useState } from "react"
import useSWR from "swr"
import { Heart, MessageCircle, ImagePlus, Send, Trash2, Loader2, ShieldCheck } from "lucide-react"
import { socialFetcher, compressImage, type SocialUser } from "@/components/social/types"

type FeedPost = {
  id: number
  caption: string
  imageUrl: string | null
  createdAt: string
  author: SocialUser | null
  likeCount: number
  commentCount: number
  likedByMe: boolean
}

function Avatar({ user, size = 40 }: { user: SocialUser | null; size?: number }) {
  if (!user) return <div className="rounded-full bg-slate-800" style={{ width: size, height: size }} />
  return user.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={user.avatarUrl || "/placeholder.svg"} alt={user.displayName} className="rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <div className="flex items-center justify-center rounded-full bg-emerald-500/20 font-black text-emerald-400" style={{ width: size, height: size }}>
      {user.displayName.charAt(0).toUpperCase()}
    </div>
  )
}

export function FeedPanel({ me }: { me: SocialUser }) {
  const { data, mutate } = useSWR("/api/posts", socialFetcher, { refreshInterval: 15000 })
  const posts: FeedPost[] = data?.posts ?? []
  const [caption, setCaption] = useState("")
  const [image, setImage] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setImage(await compressImage(file))
  }

  async function submit() {
    if (!caption.trim() && !image) return
    setPosting(true)
    await fetch("/api/posts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ caption, imageUrl: image }) })
    setCaption("")
    setImage(null)
    if (fileRef.current) fileRef.current.value = ""
    setPosting(false)
    mutate()
  }

  async function toggleLike(id: number) {
    await fetch("/api/posts/like", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ postId: id }) })
    mutate()
  }

  async function del(id: number) {
    await fetch(`/api/posts?id=${id}`, { method: "DELETE" })
    mutate()
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-4 px-4 py-4">
      {/* composer */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
        <div className="flex gap-3">
          <Avatar user={me} />
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Andika ikintu, sangiza ifoto..."
            rows={2}
            className="flex-1 resize-none bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
          />
        </div>
        {image ? (
          <div className="relative mt-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image || "/placeholder.svg"} alt="preview" className="max-h-64 w-full rounded-xl object-cover" />
            <button onClick={() => setImage(null)} className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white"><Trash2 className="h-4 w-4" /></button>
          </div>
        ) : null}
        <div className="mt-2 flex items-center justify-between">
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300">
            <ImagePlus className="h-4 w-4 text-emerald-400" /> Ifoto
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickImage} />
          <button onClick={submit} disabled={posting} className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-black text-slate-950 disabled:opacity-60">
            {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Tanga
          </button>
        </div>
      </div>

      {/* feed */}
      {posts.map((p) => (
        <div key={p.id} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3 p-3">
            <Avatar user={p.author} size={38} />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 truncate text-sm font-bold text-white">
                {p.author?.displayName ?? "?"}
                {p.author?.isAdmin ? <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> : null}
              </p>
              <p className="truncate text-[11px] text-slate-500">{new Date(p.createdAt).toLocaleString()}</p>
            </div>
            {(me.id === p.author?.id || me.isAdmin) && (
              <button onClick={() => del(p.id)} className="rounded-full p-1.5 text-slate-500 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
            )}
          </div>
          {p.caption ? <p className="whitespace-pre-wrap px-3 pb-3 text-sm text-slate-200">{p.caption}</p> : null}
          {p.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.imageUrl || "/placeholder.svg"} alt="post" className="max-h-[70vh] w-full object-cover" />
          ) : null}
          <div className="flex items-center gap-4 px-3 py-2.5">
            <button onClick={() => toggleLike(p.id)} className={`flex items-center gap-1.5 text-sm font-bold ${p.likedByMe ? "text-red-400" : "text-slate-400"}`}>
              <Heart className={`h-5 w-5 ${p.likedByMe ? "fill-red-400" : ""}`} /> {p.likeCount}
            </button>
            <CommentToggle post={p} me={me} onChanged={mutate} />
          </div>
        </div>
      ))}
      {posts.length === 0 ? <p className="pt-6 text-center text-sm text-slate-500">Nta foto iri ng&apos;aha. Ba uwa mbere kubishira!</p> : null}
    </div>
  )
}

type CommentRow = { id: number; body: string; createdAt: string; author: SocialUser | null }

function CommentToggle({ post, me, onChanged }: { post: FeedPost; me: SocialUser; onChanged: () => void }) {
  const [open, setOpen] = useState(false)
  const { data, mutate } = useSWR(open ? `/api/posts/comments?postId=${post.id}` : null, socialFetcher)
  const [text, setText] = useState("")
  const comments: CommentRow[] = data?.comments ?? []

  async function add() {
    const body = text.trim()
    if (!body) return
    setText("")
    await fetch("/api/posts/comments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ postId: post.id, body }) })
    mutate()
    onChanged()
  }

  async function del(id: number) {
    await fetch(`/api/posts/comments?id=${id}`, { method: "DELETE" })
    mutate()
    onChanged()
  }

  return (
    <>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5 text-sm font-bold text-slate-400">
        <MessageCircle className="h-5 w-5" /> {post.commentCount}
      </button>
      {open ? (
        <div className="w-full basis-full space-y-2 border-t border-slate-800 pt-3">
          {comments.map((c) => (
            <div key={c.id} className="group flex items-start gap-2">
              <Avatar user={c.author} size={28} />
              <div className="min-w-0 flex-1 rounded-2xl bg-slate-800 px-3 py-1.5">
                <p className="text-xs font-bold text-white">{c.author?.displayName ?? "?"}</p>
                <p className="break-words text-sm text-slate-200">{c.body}</p>
              </div>
              {(me.id === c.author?.id || me.isAdmin) && (
                <button onClick={() => del(c.id)} className="mt-1 rounded-full p-1 text-slate-600 opacity-0 transition group-hover:opacity-100 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
              )}
            </div>
          ))}
          <div className="flex items-center gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) add()
              }}
              placeholder="Andika iciyumviro..."
              className="flex-1 rounded-full border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            <button onClick={add} className="rounded-full bg-emerald-500 p-2 text-slate-950"><Send className="h-4 w-4" /></button>
          </div>
        </div>
      ) : null}
    </>
  )
}
