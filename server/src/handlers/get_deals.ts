import { db } from '../db';
import { dealsTable } from '../db/schema';
import { type Deal } from '../schema';

export const getDeals = async (): Promise<Deal[]> => {
  try {
    // Fetch all deals from the database
    const results = await db.select()
      .from(dealsTable)
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(deal => ({
      ...deal,
      amount: parseFloat(deal.amount) // Convert string back to number
    }));
  } catch (error) {
    console.error('Failed to fetch deals:', error);
    throw error;
  }
};