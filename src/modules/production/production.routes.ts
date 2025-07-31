import { FastifyInstance } from 'fastify';
import {
  createProductionHandler,
  deleteProductionByIdHandler,
  deleteProductionsHandler,
  // getProductionsHandler,
  getNewProductionIdHandler,
  updateProductionByIdHandler,
  findProductionsDtlsHandler,
  findProductionsDtlsByDateHandler,
  getLotNumHandler,
  findProductionsisDeletedDtlsByDateHandler,
  ProductionpaginaionHandler,
  findProductionsDtlsPrintByDateHandler,
  productionLotQtyAdjustHandler
} from './production.controller';
import { $ref } from './production.schema';

const productiontRoutes = async (server: FastifyInstance) => {
  server.post(
    '/',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Production'],
        security: [{ bearerToken: [] }],
        // body: $ref('createProductionSchema'),
        // response: {
        //   201: $ref('createProductionSchema'),
        // },
      },
    },
    createProductionHandler
  );

  server.get(
    '/id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Production'],
        security: [{ bearerToken: [] }],
      },
    },
    getNewProductionIdHandler
  );

  server.post(
    '/Pagination',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Production'],
        security: [{ bearerToken: [] }],
        body: $ref('productionpageSchema'),
        // response: {
        //   200: $ref('getProductionsSchema'),
        // },
      },
    },
    ProductionpaginaionHandler
  );

  server.get(
    '/details/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Production'],
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
    findProductionsDtlsHandler
  );

  server.post(
    '/details/dtl-by-date',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Production'],
        body: $ref('productionReportSchema'),
        security: [{ bearerToken: [] }],
      },
    },
    findProductionsDtlsByDateHandler
  );

  server.delete(
    '/all',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Production'],
        security: [{ bearerToken: [] }],
      },
    },
    deleteProductionsHandler
  );

  server.delete(
    '/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Production'],
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
    deleteProductionByIdHandler
  );

  server.put(
    '/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Production'],
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
        body: $ref('createProductionSchema'),
        // response: {
        //   200: $ref('createProductionSchema'),
        // },
      },
    },
    updateProductionByIdHandler
  );

  server.post(
    '/get-lot-num',

    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Production'],
        body: $ref('lotnumSchema'),
        security: [{ bearerToken: [] }],
      },
    },
    getLotNumHandler
  );

  server.post(
    '/details/dtl-is-deleted-by-date',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Production'],
        body: $ref('productionReportSchema'),
        security: [{ bearerToken: [] }],
      },
    },
    findProductionsisDeletedDtlsByDateHandler
  );

  server.post(
    '/details/dtl-by-date-print',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Production'],
        body: $ref('productionReportPrintSchema'),
        security: [{ bearerToken: [] }],
      },
    },
    findProductionsDtlsPrintByDateHandler
  );


  server.post(
    '/lot-qty-adjust',

    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Production'],
        body: $ref('productionLotQtyAdjustSchema'),
        security: [{ bearerToken: [] }],
      },
    },
    productionLotQtyAdjustHandler
  );

};

export default productiontRoutes;
