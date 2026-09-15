import {
  index,
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
import { shopsTable } from "./shops";

export const ledgerEntriesTable = pgTable(
  "ledger_entries",
  {
    id: serial("id").primaryKey(),
    // Tenant boundary: the shop this row belongs to. Nullable only so existing
    // pre-multi-tenant rows can be backfilled on first shop creation; the API
    // layer always writes it and always filters on it.
    shopId: integer("shop_id").references(() => shopsTable.id, {
      onDelete: "cascade",
    }),
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
  },
  (table) => [
    index("idx_ledger_shop_customer").on(table.shopId, table.customerId),
  ],
);

export const insertLedgerEntrySchema = createInsertSchema(
  ledgerEntriesTable,
).omit({
  id: true,
  userId: true,
  shopId: true,
  createdAt: true,
});
export type InsertLedgerEntry = z.infer<typeof insertLedgerEntrySchema>;
export type LedgerEntry = typeof ledgerEntriesTable.$inferSelect;
