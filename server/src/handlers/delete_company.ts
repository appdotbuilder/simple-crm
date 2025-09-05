import { db } from '../db';
import { companiesTable, customersTable, dealsTable } from '../db/schema';
import { type IdParam } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteCompany = async (input: IdParam): Promise<{ success: boolean }> => {
  try {
    // First, verify the company exists
    const existingCompanies = await db.select()
      .from(companiesTable)
      .where(eq(companiesTable.id, input.id))
      .execute();

    if (existingCompanies.length === 0) {
      throw new Error('Company not found');
    }

    // Check for related customers
    const relatedCustomers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.company_id, input.id))
      .execute();

    // Check for related deals
    const relatedDeals = await db.select()
      .from(dealsTable)
      .where(eq(dealsTable.company_id, input.id))
      .execute();

    // Prioritize deals error over customers error since deals are more specific
    if (relatedDeals.length > 0) {
      throw new Error('Cannot delete company with existing deals');
    }

    if (relatedCustomers.length > 0) {
      throw new Error('Cannot delete company with existing customers');
    }

    // Delete the company
    await db.delete(companiesTable)
      .where(eq(companiesTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Company deletion failed:', error);
    throw error;
  }
};