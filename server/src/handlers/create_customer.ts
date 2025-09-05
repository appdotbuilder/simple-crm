import { db } from '../db';
import { customersTable, companiesTable } from '../db/schema';
import { type CreateCustomerInput, type Customer } from '../schema';
import { eq } from 'drizzle-orm';

export const createCustomer = async (input: CreateCustomerInput): Promise<Customer> => {
  try {
    // Verify that the company exists first to prevent foreign key constraint violation
    const existingCompany = await db.select()
      .from(companiesTable)
      .where(eq(companiesTable.id, input.company_id))
      .execute();

    if (existingCompany.length === 0) {
      throw new Error(`Company with ID ${input.company_id} does not exist`);
    }

    // Insert customer record
    const result = await db.insert(customersTable)
      .values({
        name: input.name,
        email: input.email,
        phone: input.phone,
        company_id: input.company_id
      })
      .returning()
      .execute();

    const customer = result[0];
    return customer;
  } catch (error) {
    console.error('Customer creation failed:', error);
    throw error;
  }
};