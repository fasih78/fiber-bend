import { FastifyInstance } from 'fastify';
import {
  createCustomerHandler,
  deleteCustomerByIdHandler,
  deleteCustomersHandler,
  getCustomersHandler,
  getCustomersHandlerPagination,
  getNewCustomerIdHandler,
  updateCustomerByIdHandler,
  Customer_drop_downHandler,
} from './customer.controller';
import { $ref } from './customer.schema';

const customerRoutes = async (server: FastifyInstance) => {
  server.post(
    '/',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Customer'],
        security: [{ bearerToken: [] }],
        body: $ref('createCustomerSchema'),
        response: {
          201: $ref('createCustomerSchema'),
        },
      },
    },
    createCustomerHandler
  );

  server.get(
    '/id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Customer'],
        security: [{ bearerToken: [] }],
      },
    },
    getNewCustomerIdHandler
  );

  server.post(
    '/pagination',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Customer'],
        security: [{ bearerToken: [] }],
        body: $ref('customerpageSchema'),
        response: {
          201: $ref('customerpageSchema'),
        },
      },
    },
    getCustomersHandlerPagination
  );
  server.get(
    '/',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Customer'],
        security: [{ bearerToken: [] }],
        // response: {
        //   200: $ref('getCustomersSchema'),
        // },
      },
    },
    getCustomersHandler
  );

  server.delete(
    '/all',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Customer'],
        security: [{ bearerToken: [] }],
      },
    },
    deleteCustomersHandler
  );

  server.delete(
    '/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Customer'],
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
    deleteCustomerByIdHandler
  );

  server.put(
    '/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Customer'],
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
        body: $ref('createCustomerSchema'),
        response: {
          200: $ref('createCustomerSchema'),
        },
      },
    },
    updateCustomerByIdHandler
  );

  server.post(
    '/dropdown',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Customer'],
        security: [{ bearerToken: [] }],
        body: $ref('customerdrop_downSchema'),
        response: {
          201: $ref('customerdrop_downSchema'),
        },
      },
    },
    Customer_drop_downHandler
  );
};

export default customerRoutes;
