import { db } from '../db';
import { companiesTable } from '../db/schema';
import { type UpdateCompanyInput, type Company } from '../schema';
import { eq } from 'drizzle-orm';

export const updateCompany = async (input: UpdateCompanyInput): Promise<Company> => {
  try {
    // Check if company exists first
    const existingCompany = await db.select()
      .from(companiesTable)
      .where(eq(companiesTable.id, input.id))
      .execute();

    if (existingCompany.length === 0) {
      throw new Error(`Company with ID ${input.id} not found`);
    }

    // Build update values object with only provided fields
    const updateValues: Partial<typeof companiesTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateValues.name = input.name;
    }
    if (input.industry !== undefined) {
      updateValues.industry = input.industry;
    }
    if (input.website !== undefined) {
      updateValues.website = input.website;
    }
    if (input.phone !== undefined) {
      updateValues.phone = input.phone;
    }
    if (input.address !== undefined) {
      updateValues.address = input.address;
    }

    // Update company record
    const result = await db.update(companiesTable)
      .set(updateValues)
      .where(eq(companiesTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Company update failed:', error);
    throw error;
  }
};