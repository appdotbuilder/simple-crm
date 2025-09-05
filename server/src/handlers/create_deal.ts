import { db } from '../db';
import { dealsTable, customersTable, companiesTable } from '../db/schema';
import { type CreateDealInput, type Deal } from '../schema';
import { eq } from 'drizzle-orm';

export const createDeal = async (input: CreateDealInput): Promise<Deal> => {
  try {
    // Verify that customer exists
    const customer = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, input.customer_id))
      .limit(1)
      .execute();

    if (customer.length === 0) {
      throw new Error(`Customer with ID ${input.customer_id} not found`);
    }

    // Verify that company exists
    const company = await db.select()
      .from(companiesTable)
      .where(eq(companiesTable.id, input.company_id))
      .limit(1)
      .execute();

    if (company.length === 0) {
      throw new Error(`Company with ID ${input.company_id} not found`);
    }

    // Insert deal record
    const result = await db.insert(dealsTable)
      .values({
        description: input.description,
        amount: input.amount.toString(), // Convert number to string for numeric column
        status: input.status,
        customer_id: input.customer_id,
        company_id: input.company_id
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const deal = result[0];
    return {
      ...deal,
      amount: parseFloat(deal.amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Deal creation failed:', error);
    throw error;
  }
};