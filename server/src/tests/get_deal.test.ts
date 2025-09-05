import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, customersTable, dealsTable } from '../db/schema';
import { type IdParam } from '../schema';
import { getDeal } from '../handlers/get_deal';

describe('getDeal', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get an existing deal', async () => {
    // Create prerequisite company
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        industry: 'Technology',
        website: 'https://testcompany.com',
        phone: '+1234567890',
        address: '123 Test St'
      })
      .returning()
      .execute();

    const company = companyResult[0];

    // Create prerequisite customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        company_id: company.id
      })
      .returning()
      .execute();

    const customer = customerResult[0];

    // Create test deal
    const dealResult = await db.insert(dealsTable)
      .values({
        description: 'Test Deal Description',
        amount: '25000.50', // Insert as string for numeric column
        status: 'Qualified',
        customer_id: customer.id,
        company_id: company.id
      })
      .returning()
      .execute();

    const createdDeal = dealResult[0];

    // Test the handler
    const input: IdParam = { id: createdDeal.id };
    const result = await getDeal(input);

    // Verify all fields
    expect(result.id).toEqual(createdDeal.id);
    expect(result.description).toEqual('Test Deal Description');
    expect(result.amount).toEqual(25000.50);
    expect(typeof result.amount).toEqual('number'); // Verify numeric conversion
    expect(result.status).toEqual('Qualified');
    expect(result.customer_id).toEqual(customer.id);
    expect(result.company_id).toEqual(company.id);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should handle deals with different status values', async () => {
    // Create prerequisite company
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Status Test Company',
        industry: 'Finance',
        website: null,
        phone: null,
        address: null
      })
      .returning()
      .execute();

    const company = companyResult[0];

    // Create prerequisite customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: null,
        company_id: company.id
      })
      .returning()
      .execute();

    const customer = customerResult[0];

    // Create deal with 'Won' status
    const dealResult = await db.insert(dealsTable)
      .values({
        description: 'Won Deal',
        amount: '15000.00',
        status: 'Won',
        customer_id: customer.id,
        company_id: company.id
      })
      .returning()
      .execute();

    const createdDeal = dealResult[0];

    // Test the handler
    const input: IdParam = { id: createdDeal.id };
    const result = await getDeal(input);

    expect(result.status).toEqual('Won');
    expect(result.amount).toEqual(15000.00);
  });

  it('should handle decimal amounts correctly', async () => {
    // Create prerequisite data
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Decimal Test Company',
        industry: 'Retail',
        website: null,
        phone: null,
        address: null
      })
      .returning()
      .execute();

    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Decimal Customer',
        email: 'decimal@example.com',
        phone: null,
        company_id: companyResult[0].id
      })
      .returning()
      .execute();

    // Create deal with precise decimal amount
    const dealResult = await db.insert(dealsTable)
      .values({
        description: 'Decimal Amount Deal',
        amount: '1234.56', // Precise decimal value
        status: 'Proposal',
        customer_id: customerResult[0].id,
        company_id: companyResult[0].id
      })
      .returning()
      .execute();

    const input: IdParam = { id: dealResult[0].id };
    const result = await getDeal(input);

    expect(result.amount).toEqual(1234.56);
    expect(typeof result.amount).toEqual('number');
  });

  it('should throw error for non-existent deal', async () => {
    const input: IdParam = { id: 99999 };
    
    expect(getDeal(input)).rejects.toThrow(/Deal with ID 99999 not found/i);
  });

  it('should handle deals with default status', async () => {
    // Create prerequisite data
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Default Status Company',
        industry: 'Manufacturing',
        website: null,
        phone: null,
        address: null
      })
      .returning()
      .execute();

    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Default Customer',
        email: 'default@example.com',
        phone: null,
        company_id: companyResult[0].id
      })
      .returning()
      .execute();

    // Create deal without explicitly setting status (should default to 'New')
    const dealResult = await db.insert(dealsTable)
      .values({
        description: 'Default Status Deal',
        amount: '5000.00',
        // status defaults to 'New'
        customer_id: customerResult[0].id,
        company_id: companyResult[0].id
      })
      .returning()
      .execute();

    const input: IdParam = { id: dealResult[0].id };
    const result = await getDeal(input);

    expect(result.status).toEqual('New');
    expect(result.description).toEqual('Default Status Deal');
  });
});