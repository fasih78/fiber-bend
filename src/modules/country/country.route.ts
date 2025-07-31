import { FastifyInstance } from 'fastify';
import {
  createCountryHandler,
  deleteCountriesHandler,
  deleteCountryByIdHandler,
  getCountriesHandlePagination,
  getCountriesHandler,
  getNewCountryIdHandler,
  updateCountryByIdHandler,
} from './country.controller';
import { $ref } from './country.schema';

const countryRoutes = async (server: FastifyInstance) => {
  server.post(
    '/',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Country'],
        security: [{ bearerToken: [] }],
        body: $ref('createCountrySchema'),
        response: {
          201: $ref('createCountrySchema'),
        },
      },
    },
    createCountryHandler
  );

  server.get(
    '/id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Country'],
        security: [{ bearerToken: [] }],
      },
    },
    getNewCountryIdHandler
  );

  server.post(
    '/pagination',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Country'],
        security: [{ bearerToken: [] }],
        body: $ref('countryPaginationSchema'),
        // response: {
        //   200: $ref('getCountrysSchema'),
        // },
      },
    },
    getCountriesHandlePagination
  );
  server.get(
    '/',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Country'],
        security: [{ bearerToken: [] }],
        // response: {
        //   200: $ref('getCountrysSchema'),
        // },
      },
    },
    getCountriesHandler
  );

  server.delete(
    '/all',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Country'],
        security: [{ bearerToken: [] }],
      },
    },
    deleteCountriesHandler
  );

  server.delete(
    '/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Country'],
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
    deleteCountryByIdHandler
  );

  server.put(
    '/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Country'],
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
        body: $ref('createCountrySchema'),
        response: {
          200: $ref('createCountrySchema'),
        },
      },
    },
    updateCountryByIdHandler
  );
};

export default countryRoutes;
