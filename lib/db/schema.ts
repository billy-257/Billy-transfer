import { boolean, integer, jsonb, numeric, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core"
import type { SiteContent } from "@/lib/content-types"

// Single-row (id=1) numeric rate settings.
export const rateSettings = pgTable("rate_settings", {
  id: integer("id").primaryKey().default(1),
  aedRates: jsonb("aed_rates").$type<Record<string, number>>().notNull(),
  usdMobileRate: numeric("usd_mobile_rate").notNull(),
  usdBankRate: numeric("usd_bank_rate").notNull(),
  margin: numeric("margin").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})
export type RateSettings = typeof rateSettings.$inferSelect

// Single-row (id=1) editable site content.
export const siteContent = pgTable("site_content", {
  id: integer("id").primaryKey().default(1),
  data: jsonb("data").$type<SiteContent>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})
export type SiteContentRow = typeof siteContent.$inferSelect

// Visit tracking.
export const visits = pgTable("visits", {
  id: serial("id").primaryKey(),
  path: text("path"),
  referrer: text("referrer"),
  source: text("source"),
  country: text("country"),
  city: text("city"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
export type Visit = typeof visits.$inferSelect

// Legacy one-way messages (kept for history).
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  name: text("name"),
  phone: text("phone"),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
export type Message = typeof messages.$inferSelect

// In-app inbox: one conversation per visitor (keyed by a client id in their browser).
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  clientId: text("client_id").notNull().unique(),
  name: text("name"),
  phone: text("phone"),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }).notNull().defaultNow(),
  unreadForAdmin: integer("unread_for_admin").notNull().default(0),
  unreadForClient: integer("unread_for_client").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
export type Conversation = typeof conversations.$inferSelect

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  sender: text("sender").notNull(), // 'client' | 'admin'
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
export type ChatMessage = typeof chatMessages.$inferSelect

// Web Push subscriptions.
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  role: text("role").notNull(), // 'admin' | 'client'
  clientId: text("client_id"),
  userId: integer("user_id"), // links a subscription to a registered social user
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
export type PushSubscription = typeof pushSubscriptions.$inferSelect

// Public feedback / testimonials left by customers (name + comment only, no phone).
export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
export type Feedback = typeof feedback.$inferSelect

// Public community chat room. All members share one room; every message is stored
// server-side forever, so it stays visible to everyone even after a reinstall.
export const roomMessages = pgTable("room_messages", {
  id: serial("id").primaryKey(),
  clientId: text("client_id"), // stable per-device id, only used to align a user's own bubbles
  name: text("name").notNull(),
  body: text("body").notNull(),
  isHost: boolean("is_host").notNull().default(false), // true = posted by admin (BILLY FAST TRANSFER)
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
export type RoomMessage = typeof roomMessages.$inferSelect

// Member directory: people register their contact so the admin can reach them.
export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  clientId: text("client_id"), // stable per-device id to dedupe self-updates
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  town: text("town").notNull(),
  photo: text("photo"), // small data-URL thumbnail, optional
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
export type Member = typeof members.$inferSelect

// Presence: last-seen heartbeat per actor. id = "admin" or a client id.
export const presence = pgTable("presence", {
  id: text("id").primaryKey(),
  role: text("role").notNull(), // 'admin' | 'client'
  lastSeen: timestamp("last_seen", { withTimezone: true }).notNull().defaultNow(),
})
export type Presence = typeof presence.$inferSelect

// Single-row (id=1) in-app popup / advert shown when a user opens the app.
export const appPopup = pgTable("app_popup", {
  id: integer("id").primaryKey().default(1),
  title: text("title"),
  body: text("body").notNull().default(""),
  imageUrl: text("image_url"), // optional ad image (data-URL or link)
  ctaLabel: text("cta_label"), // optional button label
  ctaUrl: text("cta_url"), // optional button link
  active: boolean("active").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})
export type AppPopup = typeof appPopup.$inferSelect

// Showcase slides: the sliding image + words carousel on the home page, fully
// managed from the admin (add / edit / delete, with optional AI image editing).
export const showcaseSlides = pgTable("showcase_slides", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url").notNull(), // data-URL or link
  title: text("title").notNull().default(""),
  caption: text("caption").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
export type ShowcaseSlide = typeof showcaseSlides.$inferSelect

// ===================== SOCIAL NETWORK =====================

// Registered social users (username + phone + password, no verification codes).
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  phone: text("phone").notNull().unique(),
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  avatarUrl: text("avatar_url"),
  location: text("location"), // where the user lives (town / country)
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
export type User = typeof users.$inferSelect

// Friend relationships. One row per pair; status pending until accepted.
export const friendships = pgTable("friendships", {
  id: serial("id").primaryKey(),
  requesterId: integer("requester_id").notNull(),
  addresseeId: integer("addressee_id").notNull(),
  status: text("status").notNull().default("pending"), // 'pending' | 'accepted'
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
export type Friendship = typeof friendships.$inferSelect

// 1:1 direct messages between users.
export const directMessages = pgTable("direct_messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  recipientId: integer("recipient_id").notNull(),
  body: text("body").notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
export type DirectMessage = typeof directMessages.$inferSelect

// Photo feed posts.
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  imageUrl: text("image_url"),
  caption: text("caption").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
export type Post = typeof posts.$inferSelect

export const postLikes = pgTable("post_likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
export type PostLike = typeof postLikes.$inferSelect

export const postComments = pgTable("post_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
export type PostComment = typeof postComments.$inferSelect

// In-app notification center entries.
export const appNotifications = pgTable("app_notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // recipient
  type: text("type").notNull(), // 'friend_request' | 'friend_accept' | 'message' | 'like' | 'comment'
  body: text("body").notNull(),
  link: text("link"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
export type AppNotification = typeof appNotifications.$inferSelect

// Single-row (id=1) VAPID keypair for Web Push.
export const pushConfig = pgTable("push_config", {
  id: integer("id").primaryKey().default(1),
  publicKey: text("public_key").notNull(),
  privateKey: text("private_key").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
export type PushConfig = typeof pushConfig.$inferSelect
