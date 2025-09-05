import { db } from '../db';
import { customersTable } from '../db/schema';
import { type Customer, type IdParam } from '../schema';
import { eq } from 'drizzle-orm';

export const getCustomer = async (input: IdParam): Promise<Customer> => {
  try {
    // Query for the customer by ID
    const result = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, input.id))
      .execute();

    // Check if customer exists
    if (result.length === 0) {
      throw new Error(`Customer with ID ${input.id} not found`);
    }

    // Return the customer record
    const customer = result[0];
    return customer;
  } catch (error) {
    console.error('Failed to fetch customer:', error);
    throw error;
  }
};