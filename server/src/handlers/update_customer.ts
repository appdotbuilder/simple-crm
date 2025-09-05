import { db } from '../db';
import { customersTable, companiesTable } from '../db/schema';
import { type UpdateCustomerInput, type Customer } from '../schema';
import { eq, and } from 'drizzle-orm';

export const updateCustomer = async (input: UpdateCustomerInput): Promise<Customer> => {
  try {
    // First verify the customer exists
    const existingCustomer = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, input.id))
      .limit(1)
      .execute();

    if (existingCustomer.length === 0) {
      throw new Error(`Customer with id ${input.id} not found`);
    }

    // If company_id is being updated, verify the company exists
    if (input.company_id !== undefined) {
      const company = await db.select()
        .from(companiesTable)
        .where(eq(companiesTable.id, input.company_id))
        .limit(1)
        .execute();

      if (company.length === 0) {
        throw new Error(`Company with id ${input.company_id} not found`);
      }
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.email !== undefined) {
      updateData.email = input.email;
    }
    if (input.phone !== undefined) {
      updateData.phone = input.phone;
    }
    if (input.company_id !== undefined) {
      updateData.company_id = input.company_id;
    }

    // Update the customer record
    const result = await db.update(customersTable)
      .set(updateData)
      .where(eq(customersTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Customer update failed:', error);
    throw error;
  }
};