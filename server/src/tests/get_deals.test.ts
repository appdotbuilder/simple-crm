import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, customersTable, dealsTable } from '../db/schema';
import { getDeals } from '../handlers/get_deals';
import { eq } from 'drizzle-orm';

describe('getDeals', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no deals exist', async () => {
    const result = await getDeals();
    expect(result).toEqual([]);
  });

  it('should fetch all deals from database', async () => {
    // Create prerequisite company
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        industry: 'Technology',
        website: 'https://test.com',
        phone: '123-456-7890',
        address: '123 Test St'
      })
      .returning()
      .execute();
    const company = companyResult[0];

    // Create prerequisite customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'John Doe',
        email: 'john@test.com',
        phone: '555-0123',
        company_id: company.id
      })
      .returning()
      .execute();
    const customer = customerResult[0];

    // Create multiple test deals
    const deal1 = await db.insert(dealsTable)
      .values({
        description: 'First deal',
        amount: '1500.50',
        status: 'New',
        customer_id: customer.id,
        company_id: company.id
      })
      .returning()
      .execute();

    const deal2 = await db.insert(dealsTable)
      .values({
        description: 'Second deal',
        amount: '2750.25',
        status: 'Qualified',
        customer_id: customer.id,
        company_id: company.id
      })
      .returning()
      .execute();

    const result = await getDeals();

    // Should return all deals
    expect(result).toHaveLength(2);

    // Verify first deal
    const firstDeal = result.find(d => d.id === deal1[0].id);
    expect(firstDeal).toBeDefined();
    expect(firstDeal!.description).toEqual('First deal');
    expect(firstDeal!.amount).toEqual(1500.50);
    expect(typeof firstDeal!.amount).toEqual('number');
    expect(firstDeal!.status).toEqual('New');
    expect(firstDeal!.customer_id).toEqual(customer.id);
    expect(firstDeal!.company_id).toEqual(company.id);
    expect(firstDeal!.id).toBeDefined();
    expect(firstDeal!.created_at).toBeInstanceOf(Date);
    expect(firstDeal!.updated_at).toBeInstanceOf(Date);

    // Verify second deal
    const secondDeal = result.find(d => d.id === deal2[0].id);
    expect(secondDeal).toBeDefined();
    expect(secondDeal!.description).toEqual('Second deal');
    expect(secondDeal!.amount).toEqual(2750.25);
    expect(typeof secondDeal!.amount).toEqual('number');
    expect(secondDeal!.status).toEqual('Qualified');
    expect(secondDeal!.customer_id).toEqual(customer.id);
    expect(secondDeal!.company_id).toEqual(company.id);
  });

  it('should handle different deal statuses correctly', async () => {
    // Create prerequisite data
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Status Test Company',
        industry: null,
        website: null,
        phone: null,
        address: null
      })
      .returning()
      .execute();
    const company = companyResult[0];

    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Status Customer',
        email: 'status@test.com',
        phone: null,
        company_id: company.id
      })
      .returning()
      .execute();
    const customer = customerResult[0];

    // Create deals with different statuses
    const dealStatuses = ['New', 'Qualified', 'Proposal', 'Won', 'Lost'] as const;
    
    for (const status of dealStatuses) {
      await db.insert(dealsTable)
        .values({
          description: `Deal with ${status} status`,
          amount: '1000.00',
          status: status,
          customer_id: customer.id,
          company_id: company.id
        })
        .execute();
    }

    const result = await getDeals();

    expect(result).toHaveLength(5);
    
    // Verify each status is present
    for (const status of dealStatuses) {
      const dealWithStatus = result.find(d => d.status === status);
      expect(dealWithStatus).toBeDefined();
      expect(dealWithStatus!.description).toEqual(`Deal with ${status} status`);
    }
  });

  it('should verify deals are saved correctly in database', async () => {
    // Create prerequisite data
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'DB Test Company',
        industry: 'Finance',
        website: 'https://dbtest.com',
        phone: '999-888-7777',
        address: '456 DB Street'
      })
      .returning()
      .execute();
    const company = companyResult[0];

    const customerResult = await db.insert(customersTable)
      .values({
        name: 'DB Test Customer',
        email: 'dbtest@customer.com',
        phone: '555-9999',
        company_id: company.id
      })
      .returning()
      .execute();
    const customer = customerResult[0];

    // Create a test deal
    const dealResult = await db.insert(dealsTable)
      .values({
        description: 'Database verification deal',
        amount: '3333.33',
        status: 'Proposal',
        customer_id: customer.id,
        company_id: company.id
      })
      .returning()
      .execute();
    const createdDeal = dealResult[0];

    // Fetch via handler
    const handlerResult = await getDeals();
    expect(handlerResult).toHaveLength(1);

    // Verify against direct database query
    const dbDeals = await db.select()
      .from(dealsTable)
      .where(eq(dealsTable.id, createdDeal.id))
      .execute();

    expect(dbDeals).toHaveLength(1);
    const dbDeal = dbDeals[0];
    const handlerDeal = handlerResult[0];

    // Compare handler result with database record
    expect(handlerDeal.id).toEqual(dbDeal.id);
    expect(handlerDeal.description).toEqual(dbDeal.description);
    expect(handlerDeal.amount).toEqual(parseFloat(dbDeal.amount)); // Handler converts to number
    expect(handlerDeal.status).toEqual(dbDeal.status);
    expect(handlerDeal.customer_id).toEqual(dbDeal.customer_id);
    expect(handlerDeal.company_id).toEqual(dbDeal.company_id);
    expect(handlerDeal.created_at).toEqual(dbDeal.created_at);
    expect(handlerDeal.updated_at).toEqual(dbDeal.updated_at);
  });

  it('should handle numeric amount conversion correctly', async () => {
    // Create prerequisite data
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Numeric Test Company',
        industry: 'Testing',
        website: null,
        phone: null,
        address: null
      })
      .returning()
      .execute();
    const company = companyResult[0];

    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Numeric Customer',
        email: 'numeric@test.com',
        phone: null,
        company_id: company.id
      })
      .returning()
      .execute();
    const customer = customerResult[0];

    // Test various numeric amounts
    const testAmounts = ['0.01', '999.99', '10000.00', '12345.67'];
    
    for (const amount of testAmounts) {
      await db.insert(dealsTable)
        .values({
          description: `Deal with amount ${amount}`,
          amount: amount,
          status: 'New',
          customer_id: customer.id,
          company_id: company.id
        })
        .execute();
    }

    const result = await getDeals();
    expect(result).toHaveLength(4);

    // Verify numeric conversion
    result.forEach(deal => {
      expect(typeof deal.amount).toEqual('number');
      expect(deal.amount).toBeGreaterThan(0);
    });

    // Verify specific amounts
    const expectedAmounts = [0.01, 999.99, 10000.00, 12345.67];
    const actualAmounts = result.map(d => d.amount).sort();
    expectedAmounts.sort();
    
    for (let i = 0; i < expectedAmounts.length; i++) {
      expect(actualAmounts[i]).toEqual(expectedAmounts[i]);
    }
  });
});