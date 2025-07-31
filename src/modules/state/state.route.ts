import { FastifyInstance } from 'fastify';
import {
  createStateHandler,
  deleteStateByIdHandler,
  deleteStatesHandler,
  getNewStateIdHandler,
  getStatesHandler,
  getStatesHandlerPagination,
  updateStateByIdHandler,
} from './state.controller';
import { $ref } from './state.schema';
import { getNewStateId } from './state.service';

const stateRoutes = async (server: FastifyInstance) => {
  server.post(
    '/',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['State'],
        security: [{ bearerToken: [] }],
        body: $ref('createStateSchema'),
        response: {
          201: $ref('createStateSchema'),
        },
      },
    },
    createStateHandler
  );

  server.get(
    '/id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['State'],
        security: [{ bearerToken: [] }],
      },
    },
    getNewStateIdHandler
  );

  server.post(
    '/pagination',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['State'],
        security: [{ bearerToken: [] }],
        body:$ref('statePaginationSchema')
        // response: {
        //   200: $ref('getStatesSchema'),
        // },
      },
    },
    getStatesHandlerPagination
  );
  server.get(
    '/',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['State'],
        security: [{ bearerToken: [] }],
        // response: {
        //   200: $ref('getStatesSchema'),
        // },
      },
    },
    getStatesHandler
  );

  server.delete(
    '/all',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['State'],
        security: [{ bearerToken: [] }],
      },
    },
    deleteStatesHandler
  );

  server.delete(
    '/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['State'],
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
    deleteStateByIdHandler
  );

  server.put(
    '/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['State'],
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
        body: $ref('createStateSchema'),
        response: {
          200: $ref('createStateSchema'),
        },
      },
    },
    updateStateByIdHandler
  );
};

export default stateRoutes;
