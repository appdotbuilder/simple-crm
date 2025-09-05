import { db } from '../db';
import { dealsTable, customersTable, companiesTable } from '../db/schema';
import { type UpdateDealInput, type Deal } from '../schema';
import { eq, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export const updateDeal = async (input: UpdateDealInput): Promise<Deal> => {
  try {
    // First, verify the deal exists
    const existingDeal = await db.select()
      .from(dealsTable)
      .where(eq(dealsTable.id, input.id))
      .execute();

    if (existingDeal.length === 0) {
      throw new Error(`Deal with ID ${input.id} not found`);
    }

    // Validate foreign key constraints if they're being updated
    if (input.customer_id !== undefined) {
      const customer = await db.select()
        .from(customersTable)
        .where(eq(customersTable.id, input.customer_id))
        .execute();

      if (customer.length === 0) {
        throw new Error(`Customer with ID ${input.customer_id} not found`);
      }
    }

    if (input.company_id !== undefined) {
      const company = await db.select()
        .from(companiesTable)
        .where(eq(companiesTable.id, input.company_id))
        .execute();

      if (company.length === 0) {
        throw new Error(`Company with ID ${input.company_id} not found`);
      }
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: sql`now()` // Set updated timestamp
    };

    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    if (input.amount !== undefined) {
      updateData.amount = input.amount.toString(); // Convert number to string for numeric column
    }

    if (input.status !== undefined) {
      updateData.status = input.status;
    }

    if (input.customer_id !== undefined) {
      updateData.customer_id = input.customer_id;
    }

    if (input.company_id !== undefined) {
      updateData.company_id = input.company_id;
    }

    // Update the deal record
    const result = await db.update(dealsTable)
      .set(updateData)
      .where(eq(dealsTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const updatedDeal = result[0];
    return {
      ...updatedDeal,
      amount: parseFloat(updatedDeal.amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Deal update failed:', error);
    throw error;
  }
};