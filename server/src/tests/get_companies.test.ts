import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable } from '../db/schema';
import { type CreateCompanyInput } from '../schema';
import { getCompanies } from '../handlers/get_companies';

// Test data
const testCompanies: CreateCompanyInput[] = [
  {
    name: 'Tech Corp',
    industry: 'Technology',
    website: 'https://techcorp.com',
    phone: '+1-555-0101',
    address: '123 Tech Street'
  },
  {
    name: 'Global Industries',
    industry: 'Manufacturing',
    website: 'https://global.com',
    phone: '+1-555-0202',
    address: '456 Industrial Ave'
  },
  {
    name: 'Local Business',
    industry: null,
    website: null,
    phone: null,
    address: null
  }
];

describe('getCompanies', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no companies exist', async () => {
    const result = await getCompanies();
    
    expect(result).toBeInstanceOf(Array);
    expect(result).toHaveLength(0);
  });

  it('should return all companies', async () => {
    // Create test companies
    for (const company of testCompanies) {
      await db.insert(companiesTable)
        .values(company)
        .execute();
    }

    const result = await getCompanies();

    expect(result).toHaveLength(3);
    
    // Check all required fields exist
    result.forEach(company => {
      expect(company.id).toBeDefined();
      expect(typeof company.id).toBe('number');
      expect(company.name).toBeDefined();
      expect(typeof company.name).toBe('string');
      expect(company.created_at).toBeInstanceOf(Date);
      expect(company.updated_at).toBeInstanceOf(Date);
    });

    // Check specific company data
    const techCorp = result.find(c => c.name === 'Tech Corp');
    expect(techCorp).toBeDefined();
    expect(techCorp?.industry).toBe('Technology');
    expect(techCorp?.website).toBe('https://techcorp.com');
    expect(techCorp?.phone).toBe('+1-555-0101');
    expect(techCorp?.address).toBe('123 Tech Street');

    const localBusiness = result.find(c => c.name === 'Local Business');
    expect(localBusiness).toBeDefined();
    expect(localBusiness?.industry).toBeNull();
    expect(localBusiness?.website).toBeNull();
    expect(localBusiness?.phone).toBeNull();
    expect(localBusiness?.address).toBeNull();
  });

  it('should return companies ordered by creation date (ascending)', async () => {
    // Create companies with slight delay to ensure different timestamps
    await db.insert(companiesTable)
      .values(testCompanies[0])
      .execute();

    // Small delay to ensure different creation timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(companiesTable)
      .values(testCompanies[1])
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(companiesTable)
      .values(testCompanies[2])
      .execute();

    const result = await getCompanies();

    expect(result).toHaveLength(3);
    
    // Verify ascending order by creation date
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].created_at.getTime()).toBeLessThanOrEqual(
        result[i + 1].created_at.getTime()
      );
    }

    // First company should be Tech Corp (created first)
    expect(result[0].name).toBe('Tech Corp');
    expect(result[1].name).toBe('Global Industries');
    expect(result[2].name).toBe('Local Business');
  });

  it('should handle large number of companies', async () => {
    // Create multiple companies
    const manyCompanies = Array.from({ length: 50 }, (_, i) => ({
      name: `Company ${i + 1}`,
      industry: i % 2 === 0 ? 'Tech' : 'Finance',
      website: `https://company${i + 1}.com`,
      phone: `+1-555-${String(i + 1).padStart(4, '0')}`,
      address: `${i + 1} Business St`
    }));

    for (const company of manyCompanies) {
      await db.insert(companiesTable)
        .values(company)
        .execute();
    }

    const result = await getCompanies();

    expect(result).toHaveLength(50);
    expect(result[0].name).toBe('Company 1');
    expect(result[49].name).toBe('Company 50');
    
    // Verify all have valid timestamps and are ordered
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].created_at).toBeInstanceOf(Date);
      expect(result[i].created_at.getTime()).toBeLessThanOrEqual(
        result[i + 1].created_at.getTime()
      );
    }
  });
});