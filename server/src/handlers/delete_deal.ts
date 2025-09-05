import { db } from '../db';
import { dealsTable } from '../db/schema';
import { type IdParam } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteDeal = async (input: IdParam): Promise<{ success: boolean }> => {
  try {
    // First check if the deal exists
    const existingDeal = await db.select()
      .from(dealsTable)
      .where(eq(dealsTable.id, input.id))
      .execute();

    if (existingDeal.length === 0) {
      throw new Error(`Deal with ID ${input.id} not found`);
    }

    // Delete the deal record
    await db.delete(dealsTable)
      .where(eq(dealsTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Deal deletion failed:', error);
    throw error;
  }
};