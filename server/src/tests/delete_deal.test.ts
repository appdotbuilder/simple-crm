import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, customersTable, dealsTable } from '../db/schema';
import { type IdParam, type CreateCompanyInput, type CreateCustomerInput, type CreateDealInput } from '../schema';
import { deleteDeal } from '../handlers/delete_deal';
import { eq } from 'drizzle-orm';

// Test data setup
const testCompanyInput: CreateCompanyInput = {
  name: 'Test Company',
  industry: 'Technology',
  website: 'https://test.com',
  phone: '123-456-7890',
  address: '123 Test St'
};

const testCustomerInput: CreateCustomerInput = {
  name: 'Test Customer',
  email: 'test@example.com',
  phone: '987-654-3210',
  company_id: 1 // Will be set after company creation
};

const testDealInput: CreateDealInput = {
  description: 'Test Deal',
  amount: 10000.50,
  status: 'New',
  customer_id: 1, // Will be set after customer creation
  company_id: 1   // Will be set after company creation
};

describe('deleteDeal', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing deal', async () => {
    // Create prerequisite company
    const companyResult = await db.insert(companiesTable)
      .values(testCompanyInput)
      .returning()
      .execute();
    const company = companyResult[0];

    // Create prerequisite customer
    const customerResult = await db.insert(customersTable)
      .values({
        ...testCustomerInput,
        company_id: company.id
      })
      .returning()
      .execute();
    const customer = customerResult[0];

    // Create deal to delete
    const dealResult = await db.insert(dealsTable)
      .values({
        ...testDealInput,
        amount: testDealInput.amount.toString(),
        customer_id: customer.id,
        company_id: company.id
      })
      .returning()
      .execute();
    const deal = dealResult[0];

    const input: IdParam = { id: deal.id };

    // Delete the deal
    const result = await deleteDeal(input);

    // Verify successful deletion response
    expect(result.success).toBe(true);

    // Verify deal is actually deleted from database
    const deletedDeal = await db.select()
      .from(dealsTable)
      .where(eq(dealsTable.id, deal.id))
      .execute();

    expect(deletedDeal).toHaveLength(0);
  });

  it('should throw error when deal does not exist', async () => {
    const nonExistentId = 999;
    const input: IdParam = { id: nonExistentId };

    // Attempt to delete non-existent deal should throw error
    await expect(deleteDeal(input)).rejects.toThrow(/Deal with ID 999 not found/i);
  });

  it('should handle multiple deals deletion correctly', async () => {
    // Create prerequisite company
    const companyResult = await db.insert(companiesTable)
      .values(testCompanyInput)
      .returning()
      .execute();
    const company = companyResult[0];

    // Create prerequisite customer
    const customerResult = await db.insert(customersTable)
      .values({
        ...testCustomerInput,
        company_id: company.id
      })
      .returning()
      .execute();
    const customer = customerResult[0];

    // Create multiple deals
    const deal1Result = await db.insert(dealsTable)
      .values({
        description: 'Deal 1',
        amount: '5000.00',
        status: 'New',
        customer_id: customer.id,
        company_id: company.id
      })
      .returning()
      .execute();

    const deal2Result = await db.insert(dealsTable)
      .values({
        description: 'Deal 2',
        amount: '7500.50',
        status: 'Qualified',
        customer_id: customer.id,
        company_id: company.id
      })
      .returning()
      .execute();

    const deal1 = deal1Result[0];
    const deal2 = deal2Result[0];

    // Delete first deal
    const result1 = await deleteDeal({ id: deal1.id });
    expect(result1.success).toBe(true);

    // Verify first deal is deleted but second still exists
    const remainingDeals = await db.select()
      .from(dealsTable)
      .execute();

    expect(remainingDeals).toHaveLength(1);
    expect(remainingDeals[0].id).toEqual(deal2.id);
    expect(remainingDeals[0].description).toEqual('Deal 2');

    // Delete second deal
    const result2 = await deleteDeal({ id: deal2.id });
    expect(result2.success).toBe(true);

    // Verify all deals are deleted
    const allDeals = await db.select()
      .from(dealsTable)
      .execute();

    expect(allDeals).toHaveLength(0);
  });

  it('should validate deal existence before deletion', async () => {
    // Create prerequisite company
    const companyResult = await db.insert(companiesTable)
      .values(testCompanyInput)
      .returning()
      .execute();
    const company = companyResult[0];

    // Create prerequisite customer
    const customerResult = await db.insert(customersTable)
      .values({
        ...testCustomerInput,
        company_id: company.id
      })
      .returning()
      .execute();
    const customer = customerResult[0];

    // Create deal
    const dealResult = await db.insert(dealsTable)
      .values({
        ...testDealInput,
        amount: testDealInput.amount.toString(),
        customer_id: customer.id,
        company_id: company.id
      })
      .returning()
      .execute();
    const deal = dealResult[0];

    // Delete the deal once
    const result1 = await deleteDeal({ id: deal.id });
    expect(result1.success).toBe(true);

    // Attempt to delete the same deal again should throw error
    await expect(deleteDeal({ id: deal.id })).rejects.toThrow(/Deal with ID \d+ not found/i);
  });
});