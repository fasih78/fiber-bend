import { FastifyInstance } from 'fastify';
import {
  createBrandHandler,
  deleteBrandByIdHandler,
  deleteBrandsHandler,
  getBrandsHandler,
  getNewBrandIdHandler,
  updateBrandByIdHandler,
} from './brand.controller';
import { $ref } from './brand.schema';

const brandRoutes = async (server: FastifyInstance) => {
  server.post(
    '/',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Brand'],
        security: [{ bearerToken: [] }],
        body: $ref('createBrandSchema'),
        response: {
          201: $ref('createBrandSchema'),
        },
      },
    },
    createBrandHandler
  );

  server.get(
    '/id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Brand'],
        security: [{ bearerToken: [] }],
      },
    },
    getNewBrandIdHandler
  );

  server.get(
    '/',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Brand'],
        security: [{ bearerToken: [] }],
        // response: {
        //   200: $ref('getBrandsSchema'),
        // },
      },
    },
    getBrandsHandler
  );

  server.delete(
    '/all',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Brand'],
        security: [{ bearerToken: [] }],
      },
    },
    deleteBrandsHandler
  );

  server.delete(
    '/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Brand'],
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
    deleteBrandByIdHandler
  );

  server.put(
    '/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Brand'],
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
        body: $ref('createBrandSchema'),
        response: {
          200: $ref('createBrandSchema'),
        },
      },
    },
    updateBrandByIdHandler
  );
};

export default brandRoutes;
