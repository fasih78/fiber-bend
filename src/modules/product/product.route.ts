import { FastifyInstance } from 'fastify';
import {
  createProductHandler,
  deleteProductByIdHandler,
  deleteProductsHandler,
  getProductsHandler,
  getNewProductIdHandler,
  updateProductByIdHandler,
  Product_drop_downHandler,
} from './product.controller';
import { $ref } from './product.schema';

const productRoutes = async (server: FastifyInstance) => {
  server.post(
    '/',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Product'],
        security: [{ bearerToken: [] }],
        body: $ref('createProductSchema'),
        response: {
          201: $ref('createProductSchema'),
        },
      },
    },
    createProductHandler
  );

  server.get(
    '/id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Product'],
        security: [{ bearerToken: [] }],
      },
    },
    getNewProductIdHandler
  );

  server.get(
    '/',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Product'],
        security: [{ bearerToken: [] }],
        // response: {
        //   200: $ref('getProductsSchema'),
        // },
      },
    },
    getProductsHandler
  );

  server.delete(
    '/all',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Product'],
        security: [{ bearerToken: [] }],
      },
    },
    deleteProductsHandler
  );

  server.delete(
    '/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Product'],
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
    deleteProductByIdHandler
  );

  server.put(
    '/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Product'],
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
        body: $ref('createProductSchema'),
        response: {
          200: $ref('createProductSchema'),
        },
      },
    },
    updateProductByIdHandler
  );


  server.post(
    '/dropdown',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Product'],
        security: [{ bearerToken: [] }],
        body: $ref('productdrop_downSchema'),
        response: {
          201: $ref('productdrop_downSchema'),
        },
      },
    },
    Product_drop_downHandler
  );






};

export default productRoutes;
