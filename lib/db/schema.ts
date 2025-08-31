import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  json,
  real,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Existing enums
export const planEnum = pgEnum("plan", ["FREE", "CREATOR", "PRO"]);
export const generationStatusEnum = pgEnum("generation_status", [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
]);
export const creditTransactionTypeEnum = pgEnum("credit_transaction_type", [
  "PURCHASE",
  "USAGE",
  "REFUND",
  "BONUS",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "COMPLETED",
  "FAILED",
  "REFUNDED",
]);

// Users Table (existing)
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  clerkId: text("clerk_id").unique().notNull(),
  email: text("email").unique().notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  imageUrl: text("image_url"),
  plan: planEnum("plan").default("FREE").notNull(),
  credits: integer("credits").default(5).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// NEW: Personas Table
export const personas = pgTable("personas", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"), // Optional description for user reference
  imageUrl: text("image_url").notNull(), // ✅ Required - this is the actual persona image
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// NEW: Styles Table (no single image, uses styleImages table)
export const styles = pgTable("styles", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  extractedMeta: json("extracted_metadata"), // Combined metadata from all images
  isPublic: boolean("is_public").default(false).notNull(),
  usageCount: integer("usage_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// NEW: Style Images Table (multiple images per style)
export const styleImages = pgTable("style_images", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  styleId: text("style_id")
    .notNull()
    .references(() => styles.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  order: integer("order").default(0).notNull(),
  extractedMeta: json("extracted_metadata"), // Individual image metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// UPDATED: Generations Table (with persona, style, edit support)
export const generations = pgTable("generations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),
  enhancedPrompt: text("enhanced_prompt"),
  imageUrl: text("image_url"),
  status: generationStatusEnum("status").default("PENDING").notNull(),
  creditsUsed: integer("credits_used").default(1).notNull(),
  width: integer("width").default(1280),
  height: integer("height").default(720),
  // NEW: Persona and Style support
  personaId: text("persona_id").references(() => personas.id),
  styleId: text("style_id").references(() => styles.id),
  // NEW: Edit functionality
  parentGenerationId: text("parent_generation_id"), // For edits
  editPrompt: text("edit_prompt"), // What user wanted to change
  // NEW: Dimension tracking
  dimensions: json("dimensions"), // Store actual output dimensions
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// Credit Transactions Table
export const creditTransactions = pgTable("credit_transactions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // Positive for purchases, negative for usage
  type: creditTransactionTypeEnum("type").notNull(),
  description: text("description"),
  generationId: text("generation_id"),
  paymentId: text("payment_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Payment Records Table
export const paymentRecords = pgTable("payment_records", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: real("amount").notNull(), // Amount in INR
  currency: text("currency").default("INR").notNull(),
  creditsGranted: integer("credits_granted").notNull(),
  status: paymentStatusEnum("status").default("PENDING").notNull(),
  // Gateway-specific fields (optional for future)
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  razorpaySignature: text("razorpay_signature"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// Relations
export const personasRelations = relations(personas, ({ one, many }) => ({
  user: one(users, { fields: [personas.userId], references: [users.id] }),
  generations: many(generations),
}));

export const stylesRelations = relations(styles, ({ one, many }) => ({
  user: one(users, { fields: [styles.userId], references: [users.id] }),
  images: many(styleImages),
  generations: many(generations),
}));

export const styleImagesRelations = relations(styleImages, ({ one }) => ({
  style: one(styles, {
    fields: [styleImages.styleId],
    references: [styles.id],
  }),
}));

export const generationsRelations = relations(generations, ({ one }) => ({
  user: one(users, { fields: [generations.userId], references: [users.id] }),
  persona: one(personas, {
    fields: [generations.personaId],
    references: [personas.id],
  }),
  style: one(styles, {
    fields: [generations.styleId],
    references: [styles.id],
  }),
}));

// Type exports for use in application
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Generation = typeof generations.$inferSelect;
export type NewGeneration = typeof generations.$inferInsert;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type NewCreditTransaction = typeof creditTransactions.$inferInsert;
export type PaymentRecord = typeof paymentRecords.$inferSelect;
export type NewPaymentRecord = typeof paymentRecords.$inferInsert;
export type Style = typeof styles.$inferSelect;
export type NewStyle = typeof styles.$inferInsert;
export type Persona = typeof personas.$inferSelect;
export type NewPersona = typeof personas.$inferInsert;
