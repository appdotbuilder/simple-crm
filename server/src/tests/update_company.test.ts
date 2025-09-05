import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable } from '../db/schema';
import { type UpdateCompanyInput, type CreateCompanyInput } from '../schema';
import { updateCompany } from '../handlers/update_company';
import { eq } from 'drizzle-orm';

// Helper function to create a test company
const createTestCompany = async (input: CreateCompanyInput) => {
  const result = await db.insert(companiesTable)
    .values({
      name: input.name,
      industry: input.industry,
      website: input.website,
      phone: input.phone,
      address: input.address
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateCompany', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a company with all fields', async () => {
    // Create test company first
    const testCompany = await createTestCompany({
      name: 'Original Company',
      industry: 'Technology',
      website: 'https://original.com',
      phone: '555-0001',
      address: '123 Original St'
    });

    const updateInput: UpdateCompanyInput = {
      id: testCompany.id,
      name: 'Updated Company',
      industry: 'Healthcare',
      website: 'https://updated.com',
      phone: '555-0002',
      address: '456 Updated Ave'
    };

    const result = await updateCompany(updateInput);

    expect(result.id).toEqual(testCompany.id);
    expect(result.name).toEqual('Updated Company');
    expect(result.industry).toEqual('Healthcare');
    expect(result.website).toEqual('https://updated.com');
    expect(result.phone).toEqual('555-0002');
    expect(result.address).toEqual('456 Updated Ave');
    expect(result.created_at).toEqual(testCompany.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(testCompany.updated_at.getTime());
  });

  it('should update only provided fields', async () => {
    // Create test company first
    const testCompany = await createTestCompany({
      name: 'Original Company',
      industry: 'Technology',
      website: 'https://original.com',
      phone: '555-0001',
      address: '123 Original St'
    });

    const updateInput: UpdateCompanyInput = {
      id: testCompany.id,
      name: 'Partially Updated Company',
      website: 'https://newsite.com'
    };

    const result = await updateCompany(updateInput);

    expect(result.id).toEqual(testCompany.id);
    expect(result.name).toEqual('Partially Updated Company');
    expect(result.industry).toEqual('Technology'); // Should remain unchanged
    expect(result.website).toEqual('https://newsite.com');
    expect(result.phone).toEqual('555-0001'); // Should remain unchanged
    expect(result.address).toEqual('123 Original St'); // Should remain unchanged
    expect(result.created_at).toEqual(testCompany.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(testCompany.updated_at.getTime());
  });

  it('should update nullable fields to null', async () => {
    // Create test company with all fields populated
    const testCompany = await createTestCompany({
      name: 'Test Company',
      industry: 'Technology',
      website: 'https://test.com',
      phone: '555-0001',
      address: '123 Test St'
    });

    const updateInput: UpdateCompanyInput = {
      id: testCompany.id,
      industry: null,
      website: null,
      phone: null,
      address: null
    };

    const result = await updateCompany(updateInput);

    expect(result.id).toEqual(testCompany.id);
    expect(result.name).toEqual('Test Company'); // Should remain unchanged
    expect(result.industry).toBeNull();
    expect(result.website).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.address).toBeNull();
  });

  it('should save updated company to database', async () => {
    // Create test company first
    const testCompany = await createTestCompany({
      name: 'Database Test Company',
      industry: 'Technology',
      website: null,
      phone: null,
      address: null
    });

    const updateInput: UpdateCompanyInput = {
      id: testCompany.id,
      name: 'Database Updated Company',
      website: 'https://dbtest.com'
    };

    const result = await updateCompany(updateInput);

    // Query database to verify changes were saved
    const companies = await db.select()
      .from(companiesTable)
      .where(eq(companiesTable.id, result.id))
      .execute();

    expect(companies).toHaveLength(1);
    const savedCompany = companies[0];
    expect(savedCompany.name).toEqual('Database Updated Company');
    expect(savedCompany.industry).toEqual('Technology'); // Unchanged
    expect(savedCompany.website).toEqual('https://dbtest.com');
    expect(savedCompany.phone).toBeNull(); // Unchanged
    expect(savedCompany.address).toBeNull(); // Unchanged
    expect(savedCompany.updated_at).toBeInstanceOf(Date);
    expect(savedCompany.updated_at.getTime()).toBeGreaterThan(testCompany.updated_at.getTime());
  });

  it('should throw error when company does not exist', async () => {
    const updateInput: UpdateCompanyInput = {
      id: 999999, // Non-existent ID
      name: 'Non-existent Company'
    };

    await expect(updateCompany(updateInput)).rejects.toThrow(/Company with ID 999999 not found/i);
  });

  it('should update only the updated_at timestamp when no other fields provided', async () => {
    // Create test company first
    const testCompany = await createTestCompany({
      name: 'Timestamp Test Company',
      industry: 'Technology',
      website: 'https://timestamp.com',
      phone: '555-0001',
      address: '123 Timestamp St'
    });

    const updateInput: UpdateCompanyInput = {
      id: testCompany.id
      // No other fields provided - only updated_at should change
    };

    const result = await updateCompany(updateInput);

    expect(result.id).toEqual(testCompany.id);
    expect(result.name).toEqual('Timestamp Test Company');
    expect(result.industry).toEqual('Technology');
    expect(result.website).toEqual('https://timestamp.com');
    expect(result.phone).toEqual('555-0001');
    expect(result.address).toEqual('123 Timestamp St');
    expect(result.created_at).toEqual(testCompany.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(testCompany.updated_at.getTime());
  });
});