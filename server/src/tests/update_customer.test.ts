import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, companiesTable } from '../db/schema';
import { type UpdateCustomerInput, type CreateCompanyInput, type CreateCustomerInput } from '../schema';
import { updateCustomer } from '../handlers/update_customer';
import { eq } from 'drizzle-orm';

// Test company data
const testCompany: CreateCompanyInput = {
  name: 'Test Company',
  industry: 'Technology',
  website: 'https://testcompany.com',
  phone: '555-0100',
  address: '123 Tech Street'
};

const alternativeCompany: CreateCompanyInput = {
  name: 'Alternative Company',
  industry: 'Finance',
  website: 'https://altcompany.com',
  phone: '555-0200',
  address: '456 Finance Ave'
};

// Test customer data
const testCustomer: CreateCustomerInput = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-1234',
  company_id: 1 // Will be set dynamically
};

describe('updateCustomer', () => {
  let companyId: number;
  let altCompanyId: number;
  let customerId: number;

  beforeEach(async () => {
    await createDB();

    // Create test companies
    const companyResult = await db.insert(companiesTable)
      .values(testCompany)
      .returning()
      .execute();
    companyId = companyResult[0].id;

    const altCompanyResult = await db.insert(companiesTable)
      .values(alternativeCompany)
      .returning()
      .execute();
    altCompanyId = altCompanyResult[0].id;

    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        ...testCustomer,
        company_id: companyId
      })
      .returning()
      .execute();
    customerId = customerResult[0].id;
  });

  afterEach(resetDB);

  it('should update customer name only', async () => {
    const updateInput: UpdateCustomerInput = {
      id: customerId,
      name: 'Jane Doe'
    };

    const result = await updateCustomer(updateInput);

    expect(result.id).toEqual(customerId);
    expect(result.name).toEqual('Jane Doe');
    expect(result.email).toEqual('john@example.com'); // Unchanged
    expect(result.phone).toEqual('555-1234'); // Unchanged
    expect(result.company_id).toEqual(companyId); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update customer email only', async () => {
    const updateInput: UpdateCustomerInput = {
      id: customerId,
      email: 'jane@example.com'
    };

    const result = await updateCustomer(updateInput);

    expect(result.id).toEqual(customerId);
    expect(result.name).toEqual('John Doe'); // Unchanged
    expect(result.email).toEqual('jane@example.com');
    expect(result.phone).toEqual('555-1234'); // Unchanged
    expect(result.company_id).toEqual(companyId); // Unchanged
  });

  it('should update customer phone to null', async () => {
    const updateInput: UpdateCustomerInput = {
      id: customerId,
      phone: null
    };

    const result = await updateCustomer(updateInput);

    expect(result.phone).toBeNull();
    expect(result.name).toEqual('John Doe'); // Other fields unchanged
    expect(result.email).toEqual('john@example.com');
  });

  it('should update customer company_id', async () => {
    const updateInput: UpdateCustomerInput = {
      id: customerId,
      company_id: altCompanyId
    };

    const result = await updateCustomer(updateInput);

    expect(result.company_id).toEqual(altCompanyId);
    expect(result.name).toEqual('John Doe'); // Other fields unchanged
    expect(result.email).toEqual('john@example.com');
  });

  it('should update multiple fields at once', async () => {
    const updateInput: UpdateCustomerInput = {
      id: customerId,
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '555-9999',
      company_id: altCompanyId
    };

    const result = await updateCustomer(updateInput);

    expect(result.id).toEqual(customerId);
    expect(result.name).toEqual('Jane Smith');
    expect(result.email).toEqual('jane.smith@example.com');
    expect(result.phone).toEqual('555-9999');
    expect(result.company_id).toEqual(altCompanyId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated customer to database', async () => {
    const updateInput: UpdateCustomerInput = {
      id: customerId,
      name: 'Updated Name'
    };

    await updateCustomer(updateInput);

    // Verify in database
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, customerId))
      .execute();

    expect(customers).toHaveLength(1);
    expect(customers[0].name).toEqual('Updated Name');
    expect(customers[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update the updated_at timestamp', async () => {
    // Get original timestamp
    const originalCustomer = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, customerId))
      .execute();
    const originalTimestamp = originalCustomer[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateCustomerInput = {
      id: customerId,
      name: 'Updated Name'
    };

    const result = await updateCustomer(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalTimestamp.getTime());
  });

  it('should throw error when customer not found', async () => {
    const updateInput: UpdateCustomerInput = {
      id: 99999,
      name: 'Non-existent Customer'
    };

    await expect(updateCustomer(updateInput)).rejects.toThrow(/customer with id 99999 not found/i);
  });

  it('should throw error when company_id does not exist', async () => {
    const updateInput: UpdateCustomerInput = {
      id: customerId,
      company_id: 99999
    };

    await expect(updateCustomer(updateInput)).rejects.toThrow(/company with id 99999 not found/i);
  });

  it('should handle updating with same values', async () => {
    const updateInput: UpdateCustomerInput = {
      id: customerId,
      name: 'John Doe', // Same as original
      email: 'john@example.com' // Same as original
    };

    const result = await updateCustomer(updateInput);

    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john@example.com');
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});