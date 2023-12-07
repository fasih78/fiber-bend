import { FastifyInstance } from 'fastify';
import {
  createMachineHandler,
  deleteMachineByIdHandler,
  deleteMachinesHandler,
  getMachinesHandler,
  getNewMachineIdHandler,
  updateMachineByIdHandler,
} from './machine.controller';
import { $ref } from './machine.schema';

const machineRoutes = async (server: FastifyInstance) => {
  server.post(
    '/',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Machine'],
        security: [{ bearerToken: [] }],
        body: $ref('createMachineSchema'),
        response: {
          201: $ref('createMachineSchema'),
        },
      },
    },
    createMachineHandler
  );

  server.get(
    '/id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Machine'],
        security: [{ bearerToken: [] }],
      },
    },
    getNewMachineIdHandler
  );

  server.get(
    '/',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Machine'],
        security: [{ bearerToken: [] }],
        // response: {
        //   200: $ref('getMachinesSchema'),
        // },
      },
    },
    getMachinesHandler
  );

  server.delete(
    '/all',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Machine'],
        security: [{ bearerToken: [] }],
      },
    },
    deleteMachinesHandler
  );

  server.delete(
    '/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Machine'],
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
    deleteMachineByIdHandler
  );

  server.put(
    '/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Machine'],
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
        body: $ref('createMachineSchema'),
        response: {
          200: $ref('createMachineSchema'),
        },
      },
    },
    updateMachineByIdHandler
  );
};

export default machineRoutes;
