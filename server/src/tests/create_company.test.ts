import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable } from '../db/schema';
import { type CreateCompanyInput } from '../schema';
import { createCompany } from '../handlers/create_company';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateCompanyInput = {
  name: 'Test Company',
  industry: 'Technology',
  website: 'https://testcompany.com',
  phone: '+1-555-0123',
  address: '123 Main St, Test City, TC 12345'
};

// Test input with minimal required fields
const minimalTestInput: CreateCompanyInput = {
  name: 'Minimal Company',
  industry: null,
  website: null,
  phone: null,
  address: null
};

describe('createCompany', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a company with all fields', async () => {
    const result = await createCompany(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Company');
    expect(result.industry).toEqual('Technology');
    expect(result.website).toEqual('https://testcompany.com');
    expect(result.phone).toEqual('+1-555-0123');
    expect(result.address).toEqual('123 Main St, Test City, TC 12345');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a company with minimal required fields', async () => {
    const result = await createCompany(minimalTestInput);

    // Basic field validation
    expect(result.name).toEqual('Minimal Company');
    expect(result.industry).toBeNull();
    expect(result.website).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.address).toBeNull();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save company to database', async () => {
    const result = await createCompany(testInput);

    // Query using proper drizzle syntax
    const companies = await db.select()
      .from(companiesTable)
      .where(eq(companiesTable.id, result.id))
      .execute();

    expect(companies).toHaveLength(1);
    expect(companies[0].name).toEqual('Test Company');
    expect(companies[0].industry).toEqual('Technology');
    expect(companies[0].website).toEqual('https://testcompany.com');
    expect(companies[0].phone).toEqual('+1-555-0123');
    expect(companies[0].address).toEqual('123 Main St, Test City, TC 12345');
    expect(companies[0].created_at).toBeInstanceOf(Date);
    expect(companies[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create multiple companies with unique IDs', async () => {
    const company1 = await createCompany({
      name: 'Company One',
      industry: 'Finance',
      website: null,
      phone: null,
      address: null
    });

    const company2 = await createCompany({
      name: 'Company Two',
      industry: 'Healthcare',
      website: null,
      phone: null,
      address: null
    });

    expect(company1.id).not.toEqual(company2.id);
    expect(company1.name).toEqual('Company One');
    expect(company2.name).toEqual('Company Two');
    expect(company1.industry).toEqual('Finance');
    expect(company2.industry).toEqual('Healthcare');
  });

  it('should handle companies with same name but different other fields', async () => {
    const company1 = await createCompany({
      name: 'Same Name Company',
      industry: 'Tech',
      website: 'https://tech.com',
      phone: null,
      address: null
    });

    const company2 = await createCompany({
      name: 'Same Name Company',
      industry: 'Finance',
      website: 'https://finance.com',
      phone: null,
      address: null
    });

    expect(company1.id).not.toEqual(company2.id);
    expect(company1.name).toEqual(company2.name);
    expect(company1.industry).toEqual('Tech');
    expect(company2.industry).toEqual('Finance');
  });

  it('should set timestamps correctly', async () => {
    const beforeCreate = new Date();
    const result = await createCompany(testInput);
    const afterCreate = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
  });
});