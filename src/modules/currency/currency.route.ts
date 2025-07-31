import { FastifyInstance } from 'fastify';
import {
  createCurrencyHandler,
  deleteCurrenciesHandler,
  deleteCurrencyByIdHandler,
  getCurrenciesHandler,
  getCurrenciesHandlerPagination,
  getNewCurrencyIdHandler,
  updateCurrencyByIdHandler,
} from './currency.controller';
import { $ref } from './currency.schema';

const currencyRoutes = async (server: FastifyInstance) => {
  server.post(
    '/',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Currency'],
        security: [{ bearerToken: [] }],
        body: $ref('createCurrencySchema'),
        response: {
          201: $ref('createCurrencySchema'),
        },
      },
    },
    createCurrencyHandler
  );

  server.get(
    '/id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Currency'],
        security: [{ bearerToken: [] }],
      },
    },
    getNewCurrencyIdHandler
  );

  server.post(
    '/pagination',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Currency'],
        security: [{ bearerToken: [] }],
        body:$ref('currencyPaginationSchema')
        // response: {
        //   200: $ref('getCurrencysSchema'),
        // },
      },
    },
    getCurrenciesHandlerPagination
  );
  server.get(
    '/',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Currency'],
        security: [{ bearerToken: [] }],
        // response: {
        //   200: $ref('getCurrencysSchema'),
        // },
      },
    },
    getCurrenciesHandler
  );
  
  server.delete(
    '/all',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Currency'],
        security: [{ bearerToken: [] }],
      },
    },
    deleteCurrenciesHandler
  );

  server.delete(
    '/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Currency'],
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
    deleteCurrencyByIdHandler
  );

  server.put(
    '/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Currency'],
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
        body: $ref('createCurrencySchema'),
        response: {
          200: $ref('createCurrencySchema'),
        },
      },
    },
    updateCurrencyByIdHandler
  );
};

export default currencyRoutes;
