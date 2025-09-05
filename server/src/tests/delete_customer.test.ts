import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, customersTable, dealsTable } from '../db/schema';
import { type IdParam } from '../schema';
import { deleteCustomer } from '../handlers/delete_customer';
import { eq } from 'drizzle-orm';

describe('deleteCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a customer successfully when no deals exist', async () => {
    // Create test company first
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

    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        company_id: companyId
      })
      .returning()
      .execute();
    
    const customerId = customerResult[0].id;

    const input: IdParam = { id: customerId };

    // Delete the customer
    const result = await deleteCustomer(input);

    // Verify success response
    expect(result.success).toBe(true);

    // Verify customer was deleted from database
    const deletedCustomer = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, customerId))
      .execute();

    expect(deletedCustomer).toHaveLength(0);
  });

  it('should throw error when customer does not exist', async () => {
    const input: IdParam = { id: 999 };

    await expect(deleteCustomer(input)).rejects.toThrow(/Customer with ID 999 not found/);
  });

  it('should throw error when customer has associated deals', async () => {
    // Create test company first
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

    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        company_id: companyId
      })
      .returning()
      .execute();
    
    const customerId = customerResult[0].id;

    // Create test deal associated with the customer
    await db.insert(dealsTable)
      .values({
        description: 'Test Deal',
        amount: '5000.00',
        status: 'New',
        customer_id: customerId,
        company_id: companyId
      })
      .execute();

    const input: IdParam = { id: customerId };

    // Try to delete customer with associated deals
    await expect(deleteCustomer(input)).rejects.toThrow(/Cannot delete customer with ID \d+ because it has 1 associated deal/);

    // Verify customer was not deleted
    const existingCustomer = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, customerId))
      .execute();

    expect(existingCustomer).toHaveLength(1);
  });

  it('should throw error when customer has multiple associated deals', async () => {
    // Create test company first
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

    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '987-654-3210',
        company_id: companyId
      })
      .returning()
      .execute();
    
    const customerId = customerResult[0].id;

    // Create multiple test deals associated with the customer
    await db.insert(dealsTable)
      .values([
        {
          description: 'Test Deal 1',
          amount: '3000.00',
          status: 'New',
          customer_id: customerId,
          company_id: companyId
        },
        {
          description: 'Test Deal 2',
          amount: '7000.00',
          status: 'Qualified',
          customer_id: customerId,
          company_id: companyId
        }
      ])
      .execute();

    const input: IdParam = { id: customerId };

    // Try to delete customer with multiple associated deals
    await expect(deleteCustomer(input)).rejects.toThrow(/Cannot delete customer with ID \d+ because it has 2 associated deal/);

    // Verify customer was not deleted
    const existingCustomer = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, customerId))
      .execute();

    expect(existingCustomer).toHaveLength(1);
  });

  it('should verify database constraints work correctly', async () => {
    // Create test company first
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

    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'test@example.com',
        phone: null,
        company_id: companyId
      })
      .returning()
      .execute();
    
    const customerId = customerResult[0].id;

    // Verify customer exists before deletion
    const beforeDeletion = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, customerId))
      .execute();

    expect(beforeDeletion).toHaveLength(1);
    expect(beforeDeletion[0].name).toBe('Test Customer');
    expect(beforeDeletion[0].email).toBe('test@example.com');
    expect(beforeDeletion[0].company_id).toBe(companyId);

    // Delete the customer
    const input: IdParam = { id: customerId };
    const result = await deleteCustomer(input);

    expect(result.success).toBe(true);

    // Verify customer no longer exists
    const afterDeletion = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, customerId))
      .execute();

    expect(afterDeletion).toHaveLength(0);
  });
});