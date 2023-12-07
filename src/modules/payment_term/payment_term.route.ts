import { FastifyInstance } from 'fastify';
import {
  createPaymentTermHandler,
  deletePaymentTermByIdHandler,
  deletePaymentTermsHandler,
  getNewPaymentTermIdHandler,
  getPaymentTermsHandler,
  updatePaymentTermByIdHandler,
} from './payment_term.controller';
import { $ref } from './payment_term.schema';

const paymentTermRoutes = async (server: FastifyInstance) => {
  server.post(
    '/',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Payment Term'],
        security: [{ bearerToken: [] }],
        body: $ref('createPaymentTermSchema'),
        response: {
          201: $ref('createPaymentTermSchema'),
        },
      },
    },
    createPaymentTermHandler
  );

  server.get(
    '/id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Payment Term'],
        security: [{ bearerToken: [] }],
      },
    },
    getNewPaymentTermIdHandler
  );

  server.get(
    '/',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Payment Term'],
        security: [{ bearerToken: [] }],
        // response: {
        //   200: $ref('getPaymentTermsSchema'),
        // },
      },
    },
    getPaymentTermsHandler
  );

  server.delete(
    '/all',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Payment Term'],
        security: [{ bearerToken: [] }],
      },
    },
    deletePaymentTermsHandler
  );

  server.delete(
    '/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Payment Term'],
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
    deletePaymentTermByIdHandler
  );

  server.put(
    '/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Payment Term'],
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
        body: $ref('createPaymentTermSchema'),
        response: {
          200: $ref('createPaymentTermSchema'),
        },
      },
    },
    updatePaymentTermByIdHandler
  );
};

export default paymentTermRoutes;
