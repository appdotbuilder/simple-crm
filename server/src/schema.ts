import { z } from 'zod';

// Deal status enum
export const dealStatusSchema = z.enum(['New', 'Qualified', 'Proposal', 'Won', 'Lost']);
export type DealStatus = z.infer<typeof dealStatusSchema>;

// Company schemas
export const companySchema = z.object({
  id: z.number(),
  name: z.string(),
  industry: z.string().nullable(),
  website: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Company = z.infer<typeof companySchema>;

export const createCompanyInputSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  industry: z.string().nullable(),
  website: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable()
});

export type CreateCompanyInput = z.infer<typeof createCompanyInputSchema>;

export const updateCompanyInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Company name is required').optional(),
  industry: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional()
});

export type UpdateCompanyInput = z.infer<typeof updateCompanyInputSchema>;

// Customer schemas
export const customerSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  company_id: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Customer = z.infer<typeof customerSchema>;

export const createCustomerInputSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().nullable(),
  company_id: z.number().int().positive('Valid company ID is required')
});

export type CreateCustomerInput = z.infer<typeof createCustomerInputSchema>;

export const updateCustomerInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Customer name is required').optional(),
  email: z.string().email('Valid email is required').optional(),
  phone: z.string().nullable().optional(),
  company_id: z.number().int().positive('Valid company ID is required').optional()
});

export type UpdateCustomerInput = z.infer<typeof updateCustomerInputSchema>;

// Deal schemas
export const dealSchema = z.object({
  id: z.number(),
  description: z.string(),
  amount: z.number(),
  status: dealStatusSchema,
  customer_id: z.number(),
  company_id: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Deal = z.infer<typeof dealSchema>;

export const createDealInputSchema = z.object({
  description: z.string().min(1, 'Deal description is required'),
  amount: z.number().positive('Deal amount must be positive'),
  status: dealStatusSchema.default('New'),
  customer_id: z.number().int().positive('Valid customer ID is required'),
  company_id: z.number().int().positive('Valid company ID is required')
});

export type CreateDealInput = z.infer<typeof createDealInputSchema>;

export const updateDealInputSchema = z.object({
  id: z.number(),
  description: z.string().min(1, 'Deal description is required').optional(),
  amount: z.number().positive('Deal amount must be positive').optional(),
  status: dealStatusSchema.optional(),
  customer_id: z.number().int().positive('Valid customer ID is required').optional(),
  company_id: z.number().int().positive('Valid company ID is required').optional()
});

export type UpdateDealInput = z.infer<typeof updateDealInputSchema>;

// ID parameter schemas for operations
export const idParamSchema = z.object({
  id: z.number().int().positive()
});

export type IdParam = z.infer<typeof idParamSchema>;