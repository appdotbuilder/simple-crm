import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, customersTable, dealsTable } from '../db/schema';
import { type IdParam, type CreateCompanyInput, type CreateCustomerInput, type CreateDealInput } from '../schema';
import { deleteCompany } from '../handlers/delete_company';
import { eq } from 'drizzle-orm';

// Test input
const testIdParam: IdParam = {
  id: 1
};

const testCompanyInput: CreateCompanyInput = {
  name: 'Test Company',
  industry: 'Technology',
  website: 'https://test.com',
  phone: '555-0123',
  address: '123 Test St'
};

const testCustomerInput: CreateCustomerInput = {
  name: 'Test Customer',
  email: 'test@customer.com',
  phone: '555-0456',
  company_id: 1
};

const testDealInput: CreateDealInput = {
  description: 'Test Deal',
  amount: 1000.00,
  status: 'New',
  customer_id: 1,
  company_id: 1
};

describe('deleteCompany', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a company successfully', async () => {
    // Create test company
    const companyResult = await db.insert(companiesTable)
      .values({
        name: testCompanyInput.name,
        industry: testCompanyInput.industry,
        website: testCompanyInput.website,
        phone: testCompanyInput.phone,
        address: testCompanyInput.address
      })
      .returning()
      .execute();

    const companyId = companyResult[0].id;

    // Delete the company
    const result = await deleteCompany({ id: companyId });

    // Verify successful deletion
    expect(result.success).toBe(true);

    // Verify company is removed from database
    const companies = await db.select()
      .from(companiesTable)
      .where(eq(companiesTable.id, companyId))
      .execute();

    expect(companies).toHaveLength(0);
  });

  it('should throw error when company does not exist', async () => {
    // Try to delete non-existent company
    await expect(deleteCompany({ id: 999 }))
      .rejects
      .toThrow(/company not found/i);
  });

  it('should prevent deletion when company has customers', async () => {
    // Create test company
    const companyResult = await db.insert(companiesTable)
      .values({
        name: testCompanyInput.name,
        industry: testCompanyInput.industry,
        website: testCompanyInput.website,
        phone: testCompanyInput.phone,
        address: testCompanyInput.address
      })
      .returning()
      .execute();

    const companyId = companyResult[0].id;

    // Create a customer for the company
    await db.insert(customersTable)
      .values({
        name: testCustomerInput.name,
        email: testCustomerInput.email,
        phone: testCustomerInput.phone,
        company_id: companyId
      })
      .execute();

    // Try to delete company with customers
    await expect(deleteCompany({ id: companyId }))
      .rejects
      .toThrow(/cannot delete company with existing customers/i);

    // Verify company still exists
    const companies = await db.select()
      .from(companiesTable)
      .where(eq(companiesTable.id, companyId))
      .execute();

    expect(companies).toHaveLength(1);
  });

  it('should prevent deletion when company has deals', async () => {
    // Create test company
    const companyResult = await db.insert(companiesTable)
      .values({
        name: testCompanyInput.name,
        industry: testCompanyInput.industry,
        website: testCompanyInput.website,
        phone: testCompanyInput.phone,
        address: testCompanyInput.address
      })
      .returning()
      .execute();

    const companyId = companyResult[0].id;

    // Create a customer for the company (required for deal)
    const customerResult = await db.insert(customersTable)
      .values({
        name: testCustomerInput.name,
        email: testCustomerInput.email,
        phone: testCustomerInput.phone,
        company_id: companyId
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Create a deal for the company
    await db.insert(dealsTable)
      .values({
        description: testDealInput.description,
        amount: testDealInput.amount.toString(), // Convert to string for numeric column
        status: testDealInput.status,
        customer_id: customerId,
        company_id: companyId
      })
      .execute();

    // Try to delete company with deals
    await expect(deleteCompany({ id: companyId }))
      .rejects
      .toThrow(/cannot delete company with existing deals/i);

    // Verify company still exists
    const companies = await db.select()
      .from(companiesTable)
      .where(eq(companiesTable.id, companyId))
      .execute();

    expect(companies).toHaveLength(1);
  });

  it('should handle database transaction rollback properly', async () => {
    // Create test company
    const companyResult = await db.insert(companiesTable)
      .values({
        name: testCompanyInput.name,
        industry: testCompanyInput.industry,
        website: testCompanyInput.website,
        phone: testCompanyInput.phone,
        address: testCompanyInput.address
      })
      .returning()
      .execute();

    const companyId = companyResult[0].id;

    // Create a customer to prevent deletion
    await db.insert(customersTable)
      .values({
        name: testCustomerInput.name,
        email: testCustomerInput.email,
        phone: testCustomerInput.phone,
        company_id: companyId
      })
      .execute();

    // Attempt deletion - should fail and maintain data integrity
    try {
      await deleteCompany({ id: companyId });
    } catch (error) {
      // Expected to fail
    }

    // Verify company and customer still exist after failed deletion
    const companies = await db.select()
      .from(companiesTable)
      .where(eq(companiesTable.id, companyId))
      .execute();

    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.company_id, companyId))
      .execute();

    expect(companies).toHaveLength(1);
    expect(customers).toHaveLength(1);
  });
});