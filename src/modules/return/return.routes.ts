import { FastifyInstance } from 'fastify';
import {
  createReturnContractHandler,
  getNewReturnIdHandler,
  ReturndropdownSchemaHandler,
  findReturnContractWithMoreQtyHandler,
  findReturnContractWithPaginationHandler,
  deleteReturnContractByIdHandler,
  returnContractUpdateByIdHandler,
  findReturndetailsHandler,
  findReturnDtlsByDateHandler,
  findReturnDtlsByDatePrintHandler,
} from './return.controller';
import { $ref } from './return.schema';

const ReturnRoutes = async (server: FastifyInstance) => {
  server.post(
    '/',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Return Contract'],
        security: [{ bearerToken: [] }],
        body: $ref('returnCore'),
        response: {
          201: $ref('returnCore'),
        },
      },
    },
    createReturnContractHandler
  );

  server.get(
    '/id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Return Contract'],
        security: [{ bearerToken: [] }],
      },
    },
    getNewReturnIdHandler
  );

  server.post(
    '/dropdown',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Return Contract'],
        security: [{ bearerToken: [] }],
        body: $ref('returndropdownSchema'),
        response: {
          201: $ref('returndropdownSchema'),
        },
      },
    },
    ReturndropdownSchemaHandler
  );

  server.get(
    '/return-details/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Return Contract'],
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
    findReturnContractWithMoreQtyHandler
  );
  server.post(
    '/pagination',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Return Contract'],
        security: [{ bearerToken: [] }],
        body: $ref('returnContractPaginationSchema'),
        response: {
          201: $ref('returnContractPaginationSchema'),
        },
      },
    },
    findReturnContractWithPaginationHandler
  );
  server.delete(
    '/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Return Contract'],
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
    deleteReturnContractByIdHandler
  );

  server.put(
    '/:id',

    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Return Contract'],
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
        body: $ref('returnCore'),
        // response: {
        //   200: $ref('createPaymentSchema'),
        // },
      },
    },
    returnContractUpdateByIdHandler
  );
  server.get(
    '/details/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Return Contract'],
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
    findReturndetailsHandler
  );
  server.post(
    '/details/dtl/dtl-by-date-Return-Dtls',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Return'],
        body: $ref('returnReportSchema'),
        security: [{ bearerToken: [] }],
      },
    },

    findReturnDtlsByDateHandler
  );
  server.post(
    '/details/dtl/dtl-by-date-Return-Dtls-Print',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Return'],
        body: $ref('returnReportPrintSchema'),
        security: [{ bearerToken: [] }],
      },
    },

    findReturnDtlsByDatePrintHandler
  );
};
export default ReturnRoutes;
