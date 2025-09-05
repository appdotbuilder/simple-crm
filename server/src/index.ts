import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createCompanyInputSchema,
  updateCompanyInputSchema,
  createCustomerInputSchema,
  updateCustomerInputSchema,
  createDealInputSchema,
  updateDealInputSchema,
  idParamSchema
} from './schema';

// Import handlers
import { createCompany } from './handlers/create_company';
import { getCompanies } from './handlers/get_companies';
import { getCompany } from './handlers/get_company';
import { updateCompany } from './handlers/update_company';
import { deleteCompany } from './handlers/delete_company';

import { createCustomer } from './handlers/create_customer';
import { getCustomers } from './handlers/get_customers';
import { getCustomer } from './handlers/get_customer';
import { updateCustomer } from './handlers/update_customer';
import { deleteCustomer } from './handlers/delete_customer';

import { createDeal } from './handlers/create_deal';
import { getDeals } from './handlers/get_deals';
import { getDeal } from './handlers/get_deal';
import { updateDeal } from './handlers/update_deal';
import { deleteDeal } from './handlers/delete_deal';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Company routes
  createCompany: publicProcedure
    .input(createCompanyInputSchema)
    .mutation(({ input }) => createCompany(input)),
  
  getCompanies: publicProcedure
    .query(() => getCompanies()),
  
  getCompany: publicProcedure
    .input(idParamSchema)
    .query(({ input }) => getCompany(input)),
  
  updateCompany: publicProcedure
    .input(updateCompanyInputSchema)
    .mutation(({ input }) => updateCompany(input)),
  
  deleteCompany: publicProcedure
    .input(idParamSchema)
    .mutation(({ input }) => deleteCompany(input)),

  // Customer routes
  createCustomer: publicProcedure
    .input(createCustomerInputSchema)
    .mutation(({ input }) => createCustomer(input)),
  
  getCustomers: publicProcedure
    .query(() => getCustomers()),
  
  getCustomer: publicProcedure
    .input(idParamSchema)
    .query(({ input }) => getCustomer(input)),
  
  updateCustomer: publicProcedure
    .input(updateCustomerInputSchema)
    .mutation(({ input }) => updateCustomer(input)),
  
  deleteCustomer: publicProcedure
    .input(idParamSchema)
    .mutation(({ input }) => deleteCustomer(input)),

  // Deal routes
  createDeal: publicProcedure
    .input(createDealInputSchema)
    .mutation(({ input }) => createDeal(input)),
  
  getDeals: publicProcedure
    .query(() => getDeals()),
  
  getDeal: publicProcedure
    .input(idParamSchema)
    .query(({ input }) => getDeal(input)),
  
  updateDeal: publicProcedure
    .input(updateDealInputSchema)
    .mutation(({ input }) => updateDeal(input)),
  
  deleteDeal: publicProcedure
    .input(idParamSchema)
    .mutation(({ input }) => deleteDeal(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`CRM TRPC server listening at port: ${port}`);
}

start();