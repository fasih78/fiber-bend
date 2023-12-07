import { FastifyInstance } from 'fastify';
import { CreatePaymentSchema } from './payement.schema';
import {
  createPaymentHandler,
  updatePaymentByIdHandler,
  deletePaymentByIdHandler,
  deletePaymentHandler,
  //findPayementHandler,
  getNewPaymentIdHandler,
  //royalitynotPayementHandler,
  findPaymentDtlsByDateHandler,
  findextraPayementHandler,
  PaymentPaginationHandler,
} from './payement.controller';

import { $ref } from './payement.schema';

const paymentRoutes = async (server: FastifyInstance) => {
  server.post(
    '/',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Payment'],
        security: [{ bearerToken: [] }],
        body: $ref('createPaymentSchema'),
        response: {
          201: $ref('createPaymentSchema'),
        },
      },
    },
    createPaymentHandler
  );

  server.post(
    '/Pagination',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Payment'],

        security: [{ bearerToken: [] }],
        body:$ref('paymentpageSchema')
        // response: {
        //   200: $ref('createPaymentSchema'),
        // },
      },
    },
    PaymentPaginationHandler
  );

  server.delete(
    '/all',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Payment'],
        security: [{ bearerToken: [] }],
      },
    },
    deletePaymentHandler
  );

  server.delete(
    '/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Payment'],
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
    deletePaymentByIdHandler
  );

  server.put(
    '/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Payment'],
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
        body: $ref('createPaymentSchema'),
        // response: {
        //   200: $ref('createPaymentSchema'),
        // },
      },
    },
    updatePaymentByIdHandler
  );

  server.get(
    '/id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Payment'],
        security: [{ bearerToken: [] }],
      },
    },
    getNewPaymentIdHandler
  );

  // server.get(
  //   '/notpayment',
  //   {
  //     preHandler: [server.authenticate],
  //     schema: {
  //       tags: ['Payment'],

  //       security: [{ bearerToken: [] }],
  //       // response: {
  //       //   200: $ref('createPaymentSchema'),
  //       // },
  //     },
  //   },
  //   royalitynotPayementHandler
  // );
  server.post(
    '/details/dtl/dtl-by-date-Payment-Dtls',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Payment'],
        body: $ref('paymentReportSchema'),
        security: [{ bearerToken: [] }],
      },
    },

    findPaymentDtlsByDateHandler
  );

  server.get(
    '/extrapayment',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Payment'],

        security: [{ bearerToken: [] }],
        // response: {
        //   200: $ref('createPaymentSchema'),
        // },
      },
    },
    findextraPayementHandler
  );
};

export default paymentRoutes;
