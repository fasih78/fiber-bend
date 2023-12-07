import { FastifyInstance } from 'fastify';
import {
  createCityHandler,
  deleteCitiesHandler,
  deleteCityByIdHandler,
  getCitiesHandler,
  getNewCityIdHandler,
  updateCityByIdHandler,
} from './city.controller';
import { $ref } from './city.schema';

const cityRoutes = async (server: FastifyInstance) => {
  server.post(
    '/',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['City'],
        security: [{ bearerToken: [] }],
        body: $ref('createCitySchema'),
        response: {
          201: $ref('createCitySchema'),
        },
      },
    },
    createCityHandler
  );

  server.get(
    '/id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['City'],
        security: [{ bearerToken: [] }],
      },
    },
    getNewCityIdHandler
  );

  server.get(
    '/',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['City'],
        security: [{ bearerToken: [] }],
        // response: {
        //   200: $ref('getCitysSchema'),
        // },
      },
    },
    getCitiesHandler
  );

  server.delete(
    '/all',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['City'],
        security: [{ bearerToken: [] }],
      },
    },
    deleteCitiesHandler
  );

  server.delete(
    '/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['City'],
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
    deleteCityByIdHandler
  );

  server.put(
    '/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['City'],
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
        body: $ref('createCitySchema'),
        response: {
          200: $ref('createCitySchema'),
        },
      },
    },
    updateCityByIdHandler
  );
};

export default cityRoutes;
