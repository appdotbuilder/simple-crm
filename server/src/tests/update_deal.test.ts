import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, customersTable, dealsTable } from '../db/schema';
import { type UpdateDealInput, type CreateCompanyInput, type CreateCustomerInput, type CreateDealInput } from '../schema';
import { updateDeal } from '../handlers/update_deal';
import { eq } from 'drizzle-orm';

// Test data setup
const testCompany: CreateCompanyInput = {
  name: 'Test Company',
  industry: 'Technology',
  website: 'https://testcompany.com',
  phone: '555-0123',
  address: '123 Test St'
};

const testCustomer: CreateCustomerInput = {
  name: 'John Doe',
  email: 'john.doe@test.com',
  phone: '555-0456',
  company_id: 1 // Will be set after company creation
};

const testDeal: CreateDealInput = {
  description: 'Initial deal description',
  amount: 10000,
  status: 'New',
  customer_id: 1, // Will be set after customer creation
  company_id: 1   // Will be set after company creation
};

describe('updateDeal', () => {
  let companyId: number;
  let customerId: number;
  let dealId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create prerequisite company
    const companyResult = await db.insert(companiesTable)
      .values(testCompany)
      .returning()
      .execute();
    companyId = companyResult[0].id;

    // Create prerequisite customer
    const customerResult = await db.insert(customersTable)
      .values({
        ...testCustomer,
        company_id: companyId
      })
      .returning()
      .execute();
    customerId = customerResult[0].id;

    // Create initial deal
    const dealResult = await db.insert(dealsTable)
      .values({
        ...testDeal,
        amount: testDeal.amount.toString(),
        customer_id: customerId,
        company_id: companyId
      })
      .returning()
      .execute();
    dealId = dealResult[0].id;
  });

  afterEach(resetDB);

  it('should update only the provided fields', async () => {
    const updateInput: UpdateDealInput = {
      id: dealId,
      description: 'Updated description',
      amount: 15000
    };

    const result = await updateDeal(updateInput);

    expect(result.id).toEqual(dealId);
    expect(result.description).toEqual('Updated description');
    expect(result.amount).toEqual(15000);
    expect(typeof result.amount).toEqual('number');
    expect(result.status).toEqual('New'); // Should remain unchanged
    expect(result.customer_id).toEqual(customerId); // Should remain unchanged
    expect(result.company_id).toEqual(companyId); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update all fields when provided', async () => {
    const updateInput: UpdateDealInput = {
      id: dealId,
      description: 'Completely updated deal',
      amount: 25000,
      status: 'Won',
      customer_id: customerId,
      company_id: companyId
    };

    const result = await updateDeal(updateInput);

    expect(result.id).toEqual(dealId);
    expect(result.description).toEqual('Completely updated deal');
    expect(result.amount).toEqual(25000);
    expect(result.status).toEqual('Won');
    expect(result.customer_id).toEqual(customerId);
    expect(result.company_id).toEqual(companyId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update the deal in the database', async () => {
    const updateInput: UpdateDealInput = {
      id: dealId,
      description: 'Database update test',
      amount: 30000,
      status: 'Qualified'
    };

    await updateDeal(updateInput);

    // Verify the update in database
    const deals = await db.select()
      .from(dealsTable)
      .where(eq(dealsTable.id, dealId))
      .execute();

    expect(deals).toHaveLength(1);
    expect(deals[0].description).toEqual('Database update test');
    expect(parseFloat(deals[0].amount)).toEqual(30000);
    expect(deals[0].status).toEqual('Qualified');
    expect(deals[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update the updated_at timestamp', async () => {
    // Get initial timestamp
    const initialDeal = await db.select()
      .from(dealsTable)
      .where(eq(dealsTable.id, dealId))
      .execute();
    const initialUpdatedAt = initialDeal[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateDealInput = {
      id: dealId,
      description: 'Timestamp update test'
    };

    const result = await updateDeal(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
  });

  it('should throw error for non-existent deal', async () => {
    const updateInput: UpdateDealInput = {
      id: 99999,
      description: 'This should fail'
    };

    await expect(updateDeal(updateInput)).rejects.toThrow(/Deal with ID 99999 not found/i);
  });

  it('should throw error for invalid customer_id', async () => {
    const updateInput: UpdateDealInput = {
      id: dealId,
      customer_id: 99999
    };

    await expect(updateDeal(updateInput)).rejects.toThrow(/Customer with ID 99999 not found/i);
  });

  it('should throw error for invalid company_id', async () => {
    const updateInput: UpdateDealInput = {
      id: dealId,
      company_id: 99999
    };

    await expect(updateDeal(updateInput)).rejects.toThrow(/Company with ID 99999 not found/i);
  });

  it('should handle status updates correctly', async () => {
    const statusUpdates = ['Qualified', 'Proposal', 'Won', 'Lost'] as const;

    for (const status of statusUpdates) {
      const updateInput: UpdateDealInput = {
        id: dealId,
        status: status
      };

      const result = await updateDeal(updateInput);
      expect(result.status).toEqual(status);
    }
  });

  it('should handle decimal amounts correctly', async () => {
    const updateInput: UpdateDealInput = {
      id: dealId,
      amount: 12345.67
    };

    const result = await updateDeal(updateInput);

    expect(result.amount).toEqual(12345.67);
    expect(typeof result.amount).toEqual('number');

    // Verify in database
    const deals = await db.select()
      .from(dealsTable)
      .where(eq(dealsTable.id, dealId))
      .execute();

    expect(parseFloat(deals[0].amount)).toEqual(12345.67);
  });

  it('should update with valid foreign keys from different entities', async () => {
    // Create another company and customer
    const company2Result = await db.insert(companiesTable)
      .values({
        name: 'Second Company',
        industry: 'Finance',
        website: null,
        phone: null,
        address: null
      })
      .returning()
      .execute();
    const company2Id = company2Result[0].id;

    const customer2Result = await db.insert(customersTable)
      .values({
        name: 'Jane Smith',
        email: 'jane.smith@test.com',
        phone: null,
        company_id: company2Id
      })
      .returning()
      .execute();
    const customer2Id = customer2Result[0].id;

    const updateInput: UpdateDealInput = {
      id: dealId,
      customer_id: customer2Id,
      company_id: company2Id
    };

    const result = await updateDeal(updateInput);

    expect(result.customer_id).toEqual(customer2Id);
    expect(result.company_id).toEqual(company2Id);
  });
});