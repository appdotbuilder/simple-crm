import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, companiesTable } from '../db/schema';
import { type CreateCustomerInput } from '../schema';
import { createCustomer } from '../handlers/create_customer';
import { eq } from 'drizzle-orm';

describe('createCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a customer with valid company_id', async () => {
    // First create a company to reference
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

    const company = companyResult[0];

    const testInput: CreateCustomerInput = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      company_id: company.id
    };

    const result = await createCustomer(testInput);

    // Basic field validation
    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.phone).toEqual('+1234567890');
    expect(result.company_id).toEqual(company.id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a customer with null phone', async () => {
    // Create a company first
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Another Company',
        industry: 'Finance',
        website: null,
        phone: null,
        address: null
      })
      .returning()
      .execute();

    const company = companyResult[0];

    const testInput: CreateCustomerInput = {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: null,
      company_id: company.id
    };

    const result = await createCustomer(testInput);

    expect(result.name).toEqual('Jane Smith');
    expect(result.email).toEqual('jane.smith@example.com');
    expect(result.phone).toBeNull();
    expect(result.company_id).toEqual(company.id);
    expect(result.id).toBeDefined();
  });

  it('should save customer to database', async () => {
    // Create a company first
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Database Test Company',
        industry: 'Software',
        website: null,
        phone: null,
        address: null
      })
      .returning()
      .execute();

    const company = companyResult[0];

    const testInput: CreateCustomerInput = {
      name: 'Test Customer',
      email: 'test@example.com',
      phone: '+1987654321',
      company_id: company.id
    };

    const result = await createCustomer(testInput);

    // Query the database to verify the customer was saved
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, result.id))
      .execute();

    expect(customers).toHaveLength(1);
    expect(customers[0].name).toEqual('Test Customer');
    expect(customers[0].email).toEqual('test@example.com');
    expect(customers[0].phone).toEqual('+1987654321');
    expect(customers[0].company_id).toEqual(company.id);
    expect(customers[0].created_at).toBeInstanceOf(Date);
    expect(customers[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when company_id does not exist', async () => {
    const testInput: CreateCustomerInput = {
      name: 'Invalid Customer',
      email: 'invalid@example.com',
      phone: null,
      company_id: 99999 // Non-existent company ID
    };

    await expect(createCustomer(testInput)).rejects.toThrow(/Company with ID 99999 does not exist/i);
  });

  it('should handle database constraint violations gracefully', async () => {
    // Create a company first
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Constraint Test Company',
        industry: 'Testing',
        website: null,
        phone: null,
        address: null
      })
      .returning()
      .execute();

    const company = companyResult[0];

    const testInput: CreateCustomerInput = {
      name: 'Constraint Test Customer',
      email: 'constraint@example.com',
      phone: null,
      company_id: company.id
    };

    // First customer should succeed
    const result = await createCustomer(testInput);
    expect(result.id).toBeDefined();

    // Second customer with same email should still succeed (no unique constraint on email in schema)
    const duplicateInput: CreateCustomerInput = {
      name: 'Another Customer',
      email: 'constraint@example.com', // Same email
      phone: null,
      company_id: company.id
    };

    const duplicateResult = await createCustomer(duplicateInput);
    expect(duplicateResult.id).toBeDefined();
    expect(duplicateResult.id).not.toEqual(result.id);
  });
});