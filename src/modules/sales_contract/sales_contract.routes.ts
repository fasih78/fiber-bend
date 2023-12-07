import { FastifyInstance } from 'fastify';
import {
  createSalesContractHandler,
  deleteSalesContractByIdHandler,
  deleteSalesContractsHandler,
  getSalesContractsHandler,
  getNewSalesContractIdHandler,
  updateSalesContractByIdHandler,
  findSalesContractsDtlsHandler,
  findSalesContractsWithInvoiceHandler,
  getSalesContractsWithMoreQtyHandler,
  findSalesContractDtlsByDateHandler,
  getSalesContractsNotInvoicedHandler,
  findIsDeletedDtlsByDateHandler,
  getSalesContractsAdmdenimHandler,
  tempContractHandler,
  getSalesContractsWithPaginatonHandler,
  findSalesContractDtlsByDatePrintHandler,
  Salecontract_drop_downHandler

  // findSalesContractDtlsByProductDateHandler,
} from './sales_contract.controller';
import { $ref } from './sales_contract.schema';
import { SaleContractReportSchema } from './sales_contract.schema';
import { findNotShipmentSalesContract } from './sales_contract.service';

const salesContractRoutes = async (server: FastifyInstance) => {
  server.post(
    '/',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Sales Contract'],
        security: [{ bearerToken: [] }],
        body: $ref('createSalesContractSchema'),
        response: {
          201: $ref('createSalesContractSchema'),
        },
      },
    },
    createSalesContractHandler
  );
  

  server.get(
    '/id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Sales Contract'],
        security: [{ bearerToken: [] }],
      },
    },
    getNewSalesContractIdHandler
  );

  server.get(
    '/',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Sales Contract'],
        security: [{ bearerToken: [] }],
       //  body: $ref('saleContractReportProductSchema'),
        // response: {
        //   200: $ref('getSalesContractsSchema'),
        // },
      },
    },
    getSalesContractsHandler
  );

  server.post(
    '/pagination',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Sales Contract'],
        security: [{ bearerToken: [] }],
         body: $ref('saleContractReportProductSchema'),
        // response: {
        //   200: $ref('getSalesContractsSchema'),
        // },
      },
    },
    getSalesContractsWithPaginatonHandler
  );
  server.get(
    '/not-invoiced',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Sales Contract'],
        security: [{ bearerToken: [] }],
        // response: {
        //   200: $ref('getSalesContractsSchema'),
        // },
      },
    },
    getSalesContractsNotInvoicedHandler
  );

  server.get(
    '/qty',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Sales Contract'],
        security: [{ bearerToken: [] }],
        // response: {
        //   200: $ref('getSalesContractsSchema'),
        // },
      },
    },
    getSalesContractsWithMoreQtyHandler
  );

  server.get(
    '/details/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Sales Contract'],
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
    findSalesContractsDtlsHandler
  );

  server.get(
    '/invoive-details/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Sales Contract'],
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
    findSalesContractsWithInvoiceHandler
  );

  server.delete(
    '/all',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Sales Contract'],
        security: [{ bearerToken: [] }],
      },
    },
    deleteSalesContractsHandler
  );

  server.post(
    '/details/dtl/dtl-by-date-sales-contract',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Sales Contract'],
        body: $ref('saleContractReportSchema'),
        security: [{ bearerToken: [] }],
      },
    },

    findSalesContractDtlsByDateHandler
  );
  
  server.post(
    '/details/dtl/dtl-by-date-sales-contract-print',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Sales Contract'],
        body: $ref('salesContractPrintSchema'),
        security: [{ bearerToken: [] }],
      },
    },

    findSalesContractDtlsByDatePrintHandler
  );
  













  server.delete(
    '/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Sales Contract'],
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
    deleteSalesContractByIdHandler
  );

  server.put(
    '/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Sales Contract'],
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
        body: $ref('createSalesContractSchema'),
        // response: {
        //   200: $ref('createSalesContractSchema'),
        // },
      },
    },
    updateSalesContractByIdHandler
  );

  server.post(
    '/details/dtl/dtl-by-date-is-deleted-sales-contract',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Sales Contract'],
        body: $ref('saleContractReportSchema'),
        security: [{ bearerToken: [] }],
      },
    },

    findIsDeletedDtlsByDateHandler
  );

  server.get(
    '/not-shipment',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Sales Contract'],
        security: [{ bearerToken: [] }],
        // response: {
        //   200: $ref('getSalesContractsSchema'),
        // },
      },
    },
    findNotShipmentSalesContract
  );

  //   server.post(
  //     '/details/product/dtl/dtl-by-date-sales-contract',
  //     {
  //       preHandler: [server.authenticate],
  //       schema: {
  //         tags: ['Sales Contract'],
  //         body: $ref('saleContractReportSchema'),
  //         security: [{ bearerToken: [] }],
  //       },
  //     },

  //     findSalesContractDtlsByProductDateHandler
  //   );
  // };
  server.get(
    '/salecontract/AdmDenim',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Sales Contract'],
        security: [{ bearerToken: [] }],

        // response: {
        //   200: $ref('getSalesContractsSchema'),
        // },
      },
    },
    getSalesContractsAdmdenimHandler
  )


  server.post(
    '/invoice_no/test',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Sales Contract'],
        security: [{ bearerToken: [] }],
        body: $ref('tepCore'),
        response: {
          201: $ref('tepCore'),
        },
      },
    },
    tempContractHandler
  );
  
  
  
  
  server.post(
    '/dropdown',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Sales Contract'],
        security: [{ bearerToken: [] }],
        body: $ref('salecontractdrop_downSchema'),
        response: {
          201: $ref('salecontractdrop_downSchema'),
        },
      },
    },
    Salecontract_drop_downHandler
  );
  
  
  
  
  
  
  ;
};




export default salesContractRoutes;
