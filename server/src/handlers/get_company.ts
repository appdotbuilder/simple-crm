import { db } from '../db';
import { companiesTable } from '../db/schema';
import { type Company, type IdParam } from '../schema';
import { eq } from 'drizzle-orm';

export const getCompany = async (input: IdParam): Promise<Company> => {
  try {
    // Query company by ID
    const results = await db.select()
      .from(companiesTable)
      .where(eq(companiesTable.id, input.id))
      .execute();

    // Check if company exists
    if (results.length === 0) {
      throw new Error(`Company with ID ${input.id} not found`);
    }

    // Return the found company
    return results[0];
  } catch (error) {
    console.error('Get company failed:', error);
    throw error;
  }
};