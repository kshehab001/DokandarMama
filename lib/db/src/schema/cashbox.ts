import {
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { shopsTable } from "./shops";
import { salesTable } from "./sales";

export const CASH_SESSION_STATUS = ["open", "closed"] as const;
export type CashSessionStatus = (typeof CASH_SESSION_STATUS)[number];

/** One cash drawer session per shop per business day. */
export const cashSessionsTable = pgTable("cash_sessions", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id")
    .notNull()
    .references(() => shopsTable.id, { onDelete: "cascade" }),
  openedByUserId: text("opened_by_user_id").notNull(),
  openingBalance: numeric("opening_balance", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  expectedClosing: numeric("expected_closing", { precision: 12, scale: 2 }),
  countedClosing: numeric("counted_closing", { precision: 12, scale: 2 }),
  difference: numeric("difference", { precision: 12, scale: 2 }),
  status: text("status", { enum: CASH_SESSION_STATUS })
    .notNull()
    .default("open"),
  note: text("note"),
  openedAt: timestamp("opened_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
});

export const CASH_MOVEMENT_TYPES = [
  "sale",
  "expense",
  "cash_in",
  "cash_out",
] as const;
export type CashMovementType = (typeof CASH_MOVEMENT_TYPES)[number];

/** Every cash in/out event attached to a session. */
export const cashMovementsTable = pgTable("cash_movements", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id")
    .notNull()
    .references(() => shopsTable.id, { onDelete: "cascade" }),
  sessionId: integer("session_id").references(() => cashSessionsTable.id, {
    onDelete: "cascade",
  }),
  type: text("type", { enum: CASH_MOVEMENT_TYPES }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  note: text("note"),
  saleId: integer("sale_id").references(() => salesTable.id, {
    onDelete: "set null",
  }),
  createdByUserId: text("created_by_user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertCashSessionSchema = createInsertSchema(
  cashSessionsTable,
).omit({ id: true, shopId: true, openedByUserId: true, openedAt: true });
export type CashSession = typeof cashSessionsTable.$inferSelect;
export type InsertCashSession = z.infer<typeof insertCashSessionSchema>;
export type CashMovement = typeof cashMovementsTable.$inferSelect;
