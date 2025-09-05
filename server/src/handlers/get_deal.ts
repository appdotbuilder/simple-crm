import { db } from '../db';
import { dealsTable } from '../db/schema';
import { type Deal, type IdParam } from '../schema';
import { eq } from 'drizzle-orm';

export const getDeal = async (input: IdParam): Promise<Deal> => {
  try {
    // Query the deal by ID
    const result = await db.select()
      .from(dealsTable)
      .where(eq(dealsTable.id, input.id))
      .execute();

    if (result.length === 0) {
      throw new Error(`Deal with ID ${input.id} not found`);
    }

    const deal = result[0];
    
    // Convert numeric amount back to number
    return {
      ...deal,
      amount: parseFloat(deal.amount)
    };
  } catch (error) {
    console.error('Get deal failed:', error);
    throw error;
  }
};