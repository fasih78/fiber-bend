import { FastifyInstance } from 'fastify';
import {
  createInvoiceHandler,
  deleteInvoiceByIdHandler,
  deleteInvoicesHandler,
  getInvoicesHandler,
  getNewInvoiceIdHandler,
  updateInvoiceByIdHandler,
  findInvoicesDtlsHandler,
  findInvoiceDtlsByDateHandler,
  findNotPaymentInvoiceHandler,
  getPaymentfalseHandler,
  InvoicepaginationHandler,
  findInvoiceDtlsByDatePrintHandler,
  invoiceReportfilterSalesContractHandler
} from './invoice.controller';
import { $ref } from './invoice.schema';
import { InvoiceReportSchema } from './invoice.schema';
const invoiceRoutes = async (server: FastifyInstance) => {
  server.post(
    '/',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Invoice'],
        security: [{ bearerToken: [] }],
        body: $ref('createInvoiceSchema'),
        response: {
          201: $ref('createInvoiceSchema'),
        },
      },
    },
    createInvoiceHandler
  );

  server.get(
    '/id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Invoice'],
        security: [{ bearerToken: [] }],
      },
    },
    getNewInvoiceIdHandler
  );

  server.get(
    '/',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Invoice'],
        security: [{ bearerToken: [] }],
        // response: {
        //   200: $ref('getInvoicesSchema'),
        // },
      },
    },
    getInvoicesHandler
  );
  server.get(
    '/salecontract',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Invoice'],
        security: [{ bearerToken: [] }],
        // response: {
        //   200: $ref('getInvoicesSchema'),
        // },
      },
    },
    invoiceReportfilterSalesContractHandler
  );

  server.post(
    '/pagination',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Invoice'],
        security: [{ bearerToken: [] }],
        body: $ref('InvoicepaginationSchema'),
        // response: {
        //   201: $ref('InvoicepaginationSchema'),
        // },
      },
    },
    InvoicepaginationHandler
  );

  server.get(
    '/details/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Invoice'],
        params: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'user id',
            },
          },
        },
        security: [{ bearerToken: [] }],
      },
    },
    findInvoicesDtlsHandler
  );

  server.delete(
    '/all',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Invoice'],
        security: [{ bearerToken: [] }],
      },
    },
    deleteInvoicesHandler
  );

  server.delete(
    '/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Invoice'],
        params: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'user id',
            },
          },
        },
        security: [{ bearerToken: [] }],
      },
    },
    deleteInvoiceByIdHandler
  );

  server.put(
    '/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Invoice'],
        params: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'user id',
            },
          },
        },
        security: [{ bearerToken: [] }],
        body: $ref('createInvoiceSchema'),
        // response: {
        //   200: $ref('createInvoiceSchema'),
        // },
      },
    },
    updateInvoiceByIdHandler
  );

  server.post(
    '/details/dtl/dtl-by-date-Invoice-Dtls',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Invoice'],
        body: $ref('invoiceReportSchema'),
        security: [{ bearerToken: [] }],
      },
    },

    findInvoiceDtlsByDateHandler
  );
  server.post(
    '/details/dtl/dtl-by-date-Invoice-Dtls-print',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Invoice'],
        body: $ref('invoicePrintSchema'),
        security: [{ bearerToken: [] }],
      },
    },

    findInvoiceDtlsByDatePrintHandler
  );

  server.get(
    '/not-payment',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Invoice'],
        security: [{ bearerToken: [] }],
        // response: {
        //   200: $ref('getInvoicesSchema'),
        // },
      },
    },
    findNotPaymentInvoiceHandler
  );

  server.put(
    '/update',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Invoice'],
        security: [{ bearerToken: [] }],
        // response: {
        //   200: $ref('getSalesContractsSchema'),
        // },
      },
    },
    getPaymentfalseHandler
  );
};

export default invoiceRoutes;
