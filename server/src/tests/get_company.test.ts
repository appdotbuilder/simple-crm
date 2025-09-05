import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable } from '../db/schema';
import { type IdParam } from '../schema';
import { getCompany } from '../handlers/get_company';
import { eq } from 'drizzle-orm';

// Test data
const testCompany = {
  name: 'Tech Solutions Inc',
  industry: 'Technology',
  website: 'https://techsolutions.com',
  phone: '+1-555-123-4567',
  address: '123 Tech Street, Silicon Valley, CA'
};

const minimalCompany = {
  name: 'Minimal Corp',
  industry: null,
  website: null,
  phone: null,
  address: null
};

describe('getCompany', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve a company with all fields populated', async () => {
    // Create test company
    const insertResult = await db.insert(companiesTable)
      .values(testCompany)
      .returning()
      .execute();
    
    const createdCompany = insertResult[0];
    
    // Test retrieval
    const input: IdParam = { id: createdCompany.id };
    const result = await getCompany(input);

    // Verify all fields
    expect(result.id).toEqual(createdCompany.id);
    expect(result.name).toEqual('Tech Solutions Inc');
    expect(result.industry).toEqual('Technology');
    expect(result.website).toEqual('https://techsolutions.com');
    expect(result.phone).toEqual('+1-555-123-4567');
    expect(result.address).toEqual('123 Tech Street, Silicon Valley, CA');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should retrieve a company with minimal data (nullable fields)', async () => {
    // Create minimal company
    const insertResult = await db.insert(companiesTable)
      .values(minimalCompany)
      .returning()
      .execute();
    
    const createdCompany = insertResult[0];
    
    // Test retrieval
    const input: IdParam = { id: createdCompany.id };
    const result = await getCompany(input);

    // Verify fields including nulls
    expect(result.id).toEqual(createdCompany.id);
    expect(result.name).toEqual('Minimal Corp');
    expect(result.industry).toBeNull();
    expect(result.website).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.address).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when company does not exist', async () => {
    const input: IdParam = { id: 999999 };
    
    await expect(getCompany(input)).rejects.toThrow(/Company with ID 999999 not found/i);
  });

  it('should verify company exists in database after retrieval', async () => {
    // Create test company
    const insertResult = await db.insert(companiesTable)
      .values(testCompany)
      .returning()
      .execute();
    
    const createdCompany = insertResult[0];
    
    // Retrieve through handler
    const input: IdParam = { id: createdCompany.id };
    const result = await getCompany(input);

    // Verify it matches database record
    const dbCompanies = await db.select()
      .from(companiesTable)
      .where(eq(companiesTable.id, createdCompany.id))
      .execute();

    expect(dbCompanies).toHaveLength(1);
    expect(result).toEqual(dbCompanies[0]);
  });

  it('should handle multiple companies and retrieve correct one', async () => {
    // Create multiple companies
    const company1 = await db.insert(companiesTable)
      .values({ ...testCompany, name: 'Company One' })
      .returning()
      .execute();
    
    const company2 = await db.insert(companiesTable)
      .values({ ...minimalCompany, name: 'Company Two' })
      .returning()
      .execute();
    
    // Retrieve specific company
    const input: IdParam = { id: company2[0].id };
    const result = await getCompany(input);

    // Verify we got the correct company
    expect(result.id).toEqual(company2[0].id);
    expect(result.name).toEqual('Company Two');
    expect(result.industry).toBeNull();
    
    // Verify it's not the first company
    expect(result.name).not.toEqual('Company One');
  });
});