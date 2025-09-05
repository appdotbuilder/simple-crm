import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dealsTable, customersTable, companiesTable } from '../db/schema';
import { type CreateDealInput } from '../schema';
import { createDeal } from '../handlers/create_deal';
import { eq } from 'drizzle-orm';

// Test company data
const testCompany = {
  name: 'Test Company',
  industry: 'Technology',
  website: 'https://testcompany.com',
  phone: '555-0100',
  address: '123 Tech Street'
};

// Test customer data  
const testCustomer = {
  name: 'John Doe',
  email: 'john@testcompany.com',
  phone: '555-0101',
  company_id: 1 // Will be updated after company creation
};

// Test deal input
const testDealInput: CreateDealInput = {
  description: 'Enterprise software license deal',
  amount: 50000.00,
  status: 'New',
  customer_id: 1, // Will be updated after customer creation
  company_id: 1   // Will be updated after company creation
};

describe('createDeal', () => {
  let companyId: number;
  let customerId: number;

  beforeEach(async () => {
    await createDB();

    // Create test company
    const companyResult = await db.insert(companiesTable)
      .values(testCompany)
      .returning()
      .execute();
    companyId = companyResult[0].id;

    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({ ...testCustomer, company_id: companyId })
      .returning()
      .execute();
    customerId = customerResult[0].id;
  });

  afterEach(resetDB);

  it('should create a deal with all fields', async () => {
    const input: CreateDealInput = {
      ...testDealInput,
      customer_id: customerId,
      company_id: companyId
    };

    const result = await createDeal(input);

    // Basic field validation
    expect(result.description).toEqual('Enterprise software license deal');
    expect(result.amount).toEqual(50000.00);
    expect(typeof result.amount).toBe('number');
    expect(result.status).toEqual('New');
    expect(result.customer_id).toEqual(customerId);
    expect(result.company_id).toEqual(companyId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save deal to database', async () => {
    const input: CreateDealInput = {
      ...testDealInput,
      customer_id: customerId,
      company_id: companyId
    };

    const result = await createDeal(input);

    // Query using proper drizzle syntax
    const deals = await db.select()
      .from(dealsTable)
      .where(eq(dealsTable.id, result.id))
      .execute();

    expect(deals).toHaveLength(1);
    expect(deals[0].description).toEqual('Enterprise software license deal');
    expect(parseFloat(deals[0].amount)).toEqual(50000.00);
    expect(deals[0].status).toEqual('New');
    expect(deals[0].customer_id).toEqual(customerId);
    expect(deals[0].company_id).toEqual(companyId);
    expect(deals[0].created_at).toBeInstanceOf(Date);
    expect(deals[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create deal with default status when not provided', async () => {
    const input: CreateDealInput = {
      description: 'Deal with default status',
      amount: 25000.00,
      status: 'New', // Zod default will be applied
      customer_id: customerId,
      company_id: companyId
    };

    const result = await createDeal(input);

    expect(result.status).toEqual('New');
    expect(result.description).toEqual('Deal with default status');
    expect(result.amount).toEqual(25000.00);
  });

  it('should create deal with different status values', async () => {
    const statuses = ['New', 'Qualified', 'Proposal', 'Won', 'Lost'] as const;
    
    for (const status of statuses) {
      const input: CreateDealInput = {
        description: `Deal with ${status} status`,
        amount: 10000.00,
        status: status,
        customer_id: customerId,
        company_id: companyId
      };

      const result = await createDeal(input);
      expect(result.status).toEqual(status);
    }
  });

  it('should handle decimal amounts correctly', async () => {
    const input: CreateDealInput = {
      description: 'Deal with decimal amount',
      amount: 12345.67,
      status: 'New',
      customer_id: customerId,
      company_id: companyId
    };

    const result = await createDeal(input);

    expect(result.amount).toEqual(12345.67);
    expect(typeof result.amount).toBe('number');

    // Verify in database
    const deals = await db.select()
      .from(dealsTable)
      .where(eq(dealsTable.id, result.id))
      .execute();

    expect(parseFloat(deals[0].amount)).toEqual(12345.67);
  });

  it('should throw error when customer does not exist', async () => {
    const input: CreateDealInput = {
      description: 'Deal with non-existent customer',
      amount: 10000.00,
      status: 'New',
      customer_id: 99999, // Non-existent customer
      company_id: companyId
    };

    await expect(createDeal(input)).rejects.toThrow(/Customer with ID 99999 not found/i);
  });

  it('should throw error when company does not exist', async () => {
    const input: CreateDealInput = {
      description: 'Deal with non-existent company',
      amount: 10000.00,
      status: 'New',
      customer_id: customerId,
      company_id: 99999 // Non-existent company
    };

    await expect(createDeal(input)).rejects.toThrow(/Company with ID 99999 not found/i);
  });

  it('should throw error when both customer and company do not exist', async () => {
    const input: CreateDealInput = {
      description: 'Deal with non-existent entities',
      amount: 10000.00,
      status: 'New',
      customer_id: 99998,
      company_id: 99999
    };

    // Should fail on customer check first
    await expect(createDeal(input)).rejects.toThrow(/Customer with ID 99998 not found/i);
  });
});