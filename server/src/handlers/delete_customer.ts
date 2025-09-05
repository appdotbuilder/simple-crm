import { db } from '../db';
import { customersTable, dealsTable } from '../db/schema';
import { type IdParam } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteCustomer = async (input: IdParam): Promise<{ success: boolean }> => {
  try {
    // First, check if the customer exists
    const existingCustomer = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, input.id))
      .execute();

    if (existingCustomer.length === 0) {
      throw new Error(`Customer with ID ${input.id} not found`);
    }

    // Check if there are any deals associated with this customer
    const relatedDeals = await db.select()
      .from(dealsTable)
      .where(eq(dealsTable.customer_id, input.id))
      .execute();

    if (relatedDeals.length > 0) {
      throw new Error(`Cannot delete customer with ID ${input.id} because it has ${relatedDeals.length} associated deal(s)`);
    }

    // Delete the customer
    await db.delete(customersTable)
      .where(eq(customersTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Customer deletion failed:', error);
    throw error;
  }
};