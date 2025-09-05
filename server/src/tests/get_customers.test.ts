import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, customersTable } from '../db/schema';
import { getCustomers } from '../handlers/get_customers';

describe('getCustomers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no customers exist', async () => {
    const result = await getCustomers();
    expect(result).toEqual([]);
  });

  it('should return all customers', async () => {
    // Create a company first (required for foreign key)
    const [company] = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        industry: 'Technology',
        website: 'https://test.com',
        phone: '123-456-7890',
        address: '123 Test St'
      })
      .returning()
      .execute();

    // Create test customers
    await db.insert(customersTable)
      .values([
        {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          company_id: company.id
        },
        {
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: null,
          company_id: company.id
        },
        {
          name: 'Bob Johnson',
          email: 'bob@example.com',
          phone: '555-5678',
          company_id: company.id
        }
      ])
      .execute();

    const result = await getCustomers();

    expect(result).toHaveLength(3);

    // Verify customer details
    const johnDoe = result.find(c => c.email === 'john@example.com');
    expect(johnDoe).toBeDefined();
    expect(johnDoe!.name).toEqual('John Doe');
    expect(johnDoe!.phone).toEqual('555-1234');
    expect(johnDoe!.company_id).toEqual(company.id);
    expect(johnDoe!.id).toBeDefined();
    expect(johnDoe!.created_at).toBeInstanceOf(Date);
    expect(johnDoe!.updated_at).toBeInstanceOf(Date);

    const janeSmith = result.find(c => c.email === 'jane@example.com');
    expect(janeSmith).toBeDefined();
    expect(janeSmith!.name).toEqual('Jane Smith');
    expect(janeSmith!.phone).toBeNull();
    expect(janeSmith!.company_id).toEqual(company.id);

    const bobJohnson = result.find(c => c.email === 'bob@example.com');
    expect(bobJohnson).toBeDefined();
    expect(bobJohnson!.name).toEqual('Bob Johnson');
    expect(bobJohnson!.phone).toEqual('555-5678');
    expect(bobJohnson!.company_id).toEqual(company.id);
  });

  it('should return customers from multiple companies', async () => {
    // Create two companies
    const [company1] = await db.insert(companiesTable)
      .values({
        name: 'Tech Corp',
        industry: 'Technology'
      })
      .returning()
      .execute();

    const [company2] = await db.insert(companiesTable)
      .values({
        name: 'Business Inc',
        industry: 'Business Services'
      })
      .returning()
      .execute();

    // Create customers for each company
    await db.insert(customersTable)
      .values([
        {
          name: 'Alice Tech',
          email: 'alice@techcorp.com',
          phone: '555-0001',
          company_id: company1.id
        },
        {
          name: 'Bob Business',
          email: 'bob@businessinc.com',
          phone: '555-0002',
          company_id: company2.id
        }
      ])
      .execute();

    const result = await getCustomers();

    expect(result).toHaveLength(2);
    
    const alice = result.find(c => c.email === 'alice@techcorp.com');
    expect(alice!.company_id).toEqual(company1.id);
    
    const bob = result.find(c => c.email === 'bob@businessinc.com');
    expect(bob!.company_id).toEqual(company2.id);
  });

  it('should handle database with only customers with null phone numbers', async () => {
    // Create a company
    const [company] = await db.insert(companiesTable)
      .values({
        name: 'Null Phone Company',
        industry: 'Testing'
      })
      .returning()
      .execute();

    // Create customers with null phone numbers
    await db.insert(customersTable)
      .values([
        {
          name: 'No Phone Customer 1',
          email: 'nophone1@example.com',
          phone: null,
          company_id: company.id
        },
        {
          name: 'No Phone Customer 2', 
          email: 'nophone2@example.com',
          phone: null,
          company_id: company.id
        }
      ])
      .execute();

    const result = await getCustomers();

    expect(result).toHaveLength(2);
    result.forEach(customer => {
      expect(customer.phone).toBeNull();
      expect(customer.name).toMatch(/No Phone Customer \d/);
    });
  });
});