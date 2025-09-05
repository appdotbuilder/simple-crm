import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, customersTable } from '../db/schema';
import { type IdParam } from '../schema';
import { getCustomer } from '../handlers/get_customer';

describe('getCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get a customer by ID', async () => {
    // Create prerequisite company
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        industry: 'Technology',
        website: 'https://testcompany.com',
        phone: '+1-555-0123',
        address: '123 Test Street'
      })
      .returning()
      .execute();

    const companyId = companyResult[0].id;

    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-0456',
        company_id: companyId
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Test the handler
    const input: IdParam = { id: customerId };
    const result = await getCustomer(input);

    // Verify the customer data
    expect(result.id).toBe(customerId);
    expect(result.name).toBe('John Doe');
    expect(result.email).toBe('john.doe@example.com');
    expect(result.phone).toBe('+1-555-0456');
    expect(result.company_id).toBe(companyId);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should get a customer with null phone', async () => {
    // Create prerequisite company
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        industry: 'Technology',
        website: null,
        phone: null,
        address: null
      })
      .returning()
      .execute();

    const companyId = companyResult[0].id;

    // Create test customer with null phone
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: null,
        company_id: companyId
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Test the handler
    const input: IdParam = { id: customerId };
    const result = await getCustomer(input);

    // Verify the customer data
    expect(result.id).toBe(customerId);
    expect(result.name).toBe('Jane Smith');
    expect(result.email).toBe('jane.smith@example.com');
    expect(result.phone).toBeNull();
    expect(result.company_id).toBe(companyId);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when customer does not exist', async () => {
    const input: IdParam = { id: 999 };

    await expect(getCustomer(input)).rejects.toThrow(/customer with id 999 not found/i);
  });

  it('should handle database query correctly', async () => {
    // Create multiple companies and customers
    const company1 = await db.insert(companiesTable)
      .values({
        name: 'Company One',
        industry: 'Finance',
        website: 'https://company1.com',
        phone: '+1-555-1000',
        address: '100 Finance Street'
      })
      .returning()
      .execute();

    const company2 = await db.insert(companiesTable)
      .values({
        name: 'Company Two',
        industry: 'Healthcare',
        website: 'https://company2.com',
        phone: '+1-555-2000',
        address: '200 Health Avenue'
      })
      .returning()
      .execute();

    // Create customers for both companies
    const customer1 = await db.insert(customersTable)
      .values({
        name: 'Alice Johnson',
        email: 'alice@company1.com',
        phone: '+1-555-1111',
        company_id: company1[0].id
      })
      .returning()
      .execute();

    const customer2 = await db.insert(customersTable)
      .values({
        name: 'Bob Wilson',
        email: 'bob@company2.com',
        phone: '+1-555-2222',
        company_id: company2[0].id
      })
      .returning()
      .execute();

    // Test getting the first customer
    const result1 = await getCustomer({ id: customer1[0].id });
    expect(result1.name).toBe('Alice Johnson');
    expect(result1.email).toBe('alice@company1.com');
    expect(result1.company_id).toBe(company1[0].id);

    // Test getting the second customer
    const result2 = await getCustomer({ id: customer2[0].id });
    expect(result2.name).toBe('Bob Wilson');
    expect(result2.email).toBe('bob@company2.com');
    expect(result2.company_id).toBe(company2[0].id);

    // Verify they are different customers
    expect(result1.id).not.toBe(result2.id);
    expect(result1.company_id).not.toBe(result2.company_id);
  });
});