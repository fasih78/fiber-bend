import { FastifyInstance } from 'fastify';
import { $ref } from './shipvia.schema';
import {
  createShipViaHandler,
  getShipViaHandler,
  deleteShipViaHandler,
  deleteShipViaByIdHandler,
  updateShipViaByIdHandler,
} from './shipvia.controller';

const shipviaRoutes = async (server: FastifyInstance) => {
  server.post(
    '/',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['ShipVia'],
        security: [{ bearerToken: [] }],
        body: $ref('createShipViaSchema'),
        response: {
          201: $ref('createShipViaSchema'),
        },
      },
    },
    createShipViaHandler
  );

  server.get(
    '/',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['ShipVia'],
        security: [{ bearerToken: [] }],
        response: {
          200: $ref('getShipviaSchema'),
        },
      },
    },
    getShipViaHandler
  );

  server.delete(
    '/all',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['ShipVia'],
        security: [{ bearerToken: [] }],
      },
    },
    deleteShipViaHandler
  );

  server.delete(
    '/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['ShipVia'],
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
    deleteShipViaByIdHandler
  );

  server.put(
    '/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['ShipVia'],
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
        body: $ref('createShipViaSchema'),
        response: {
          200: $ref('createShipViaSchema'),
        },
      },
    },
    updateShipViaByIdHandler
  );
};
export default shipviaRoutes;
