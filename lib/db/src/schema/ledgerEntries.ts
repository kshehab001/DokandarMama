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
import { customersTable } from "./customers";

export const ledgerEntriesTable = pgTable("ledger_entries", {
  id: serial("id").primaryKey(),
  // Clerk user ID of the shopkeeper who owns this ledger entry (denormalized
  // from the customer for simple, join-free filtering in the ledger route).
  userId: text("user_id").notNull(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customersTable.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["sale", "payment"] }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  balanceAfter: numeric("balance_after", { precision: 12, scale: 2 }).notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertLedgerEntrySchema = createInsertSchema(
  ledgerEntriesTable,
).omit({
  id: true,
  userId: true,
  createdAt: true,
});
export type InsertLedgerEntry = z.infer<typeof insertLedgerEntrySchema>;
export type LedgerEntry = typeof ledgerEntriesTable.$inferSelect;
