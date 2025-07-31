import { FastifyInstance } from 'fastify';
import {
  createBrandHandler,
  deleteBrandByIdHandler,
  deleteBrandsHandler,
  getBrandsHandler,
  getNewBrandIdHandler,
  updateBrandByIdHandler,
  Brand_drop_down_Handler,
  getBrandsHandlerPagination
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

  server.post(
    '/pagination',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Brand'],
        security: [{ bearerToken: [] }],
        body:$ref('brandPaginationSchema')
        // response: {
        //   200: $ref('getBrandsSchema'),
        // },
      },
    },
    getBrandsHandlerPagination
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

  server.post(
    '/drop_down',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Brand'],
        security: [{ bearerToken: [] }],
        body: $ref('brand_drop_down_Schema'),
        response: {
          201: $ref('brand_drop_down_Schema'),
        },
      },
    },
    Brand_drop_down_Handler
  );








};

export default brandRoutes;
