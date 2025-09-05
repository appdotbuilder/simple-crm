import { serial, text, pgTable, timestamp, numeric, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Deal status enum
export const dealStatusEnum = pgEnum('deal_status', ['New', 'Qualified', 'Proposal', 'Won', 'Lost']);

// Companies table
export const companiesTable = pgTable('companies', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  industry: text('industry'), // Nullable by default
  website: text('website'),
  phone: text('phone'),
  address: text('address'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Customers table
export const customersTable = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'), // Nullable by default
  company_id: integer('company_id').notNull().references(() => companiesTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Deals table
export const dealsTable = pgTable('deals', {
  id: serial('id').primaryKey(),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(), // Use numeric for monetary values with precision
  status: dealStatusEnum('status').notNull().default('New'),
  customer_id: integer('customer_id').notNull().references(() => customersTable.id),
  company_id: integer('company_id').notNull().references(() => companiesTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const companiesRelations = relations(companiesTable, ({ many }) => ({
  customers: many(customersTable),
  deals: many(dealsTable),
}));

export const customersRelations = relations(customersTable, ({ one, many }) => ({
  company: one(companiesTable, {
    fields: [customersTable.company_id],
    references: [companiesTable.id],
  }),
  deals: many(dealsTable),
}));

export const dealsRelations = relations(dealsTable, ({ one }) => ({
  customer: one(customersTable, {
    fields: [dealsTable.customer_id],
    references: [customersTable.id],
  }),
  company: one(companiesTable, {
    fields: [dealsTable.company_id],
    references: [companiesTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Company = typeof companiesTable.$inferSelect;
export type NewCompany = typeof companiesTable.$inferInsert;
export type Customer = typeof customersTable.$inferSelect;
export type NewCustomer = typeof customersTable.$inferInsert;
export type Deal = typeof dealsTable.$inferSelect;
export type NewDeal = typeof dealsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  companies: companiesTable,
  customers: customersTable,
  deals: dealsTable,
};

export const tableRelations = {
  companies: companiesRelations,
  customers: customersRelations,
  deals: dealsRelations,
};