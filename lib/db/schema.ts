import { integer, jsonb, numeric, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core"
import type { SiteContent } from "@/lib/content-types"

// Single-row (id=1) numeric rate settings.
export const rateSettings = pgTable("rate_settings", {
  id: integer("id").primaryKey().default(1),
  aedRates: jsonb("aed_rates").$type<Record<string, number>>().notNull(),
  usdMobileRate: numeric("usd_mobile_rate", { mode: "number" }).notNull(),
  usdBankRate: numeric("usd_bank_rate", { mode: "number" }).notNull(),
  margin: numeric("margin", { mode: "number" }).notNull(),
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
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
export type PushSubscription = typeof pushSubscriptions.$inferSelect

// Single-row (id=1) VAPID keypair for Web Push.
export const pushConfig = pgTable("push_config", {
  id: integer("id").primaryKey().default(1),
  publicKey: text("public_key").notNull(),
  privateKey: text("private_key").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
export type PushConfig = typeof pushConfig.$inferSelect
