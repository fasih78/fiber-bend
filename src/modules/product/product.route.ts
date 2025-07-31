import { FastifyInstance } from 'fastify';
import {
  createProductHandler,
  deleteProductByIdHandler,
  deleteProductsHandler,
  getProductsHandler,
  getNewProductIdHandler,
  updateProductByIdHandler,
  Product_drop_downHandler,
  getProductsHandlerPagination,
  stockReportHandler,
  stockReportPrintHandler,
  findProductDtlsHandler,
  productSummarydtlsByDateHandler,
  productSummarydtlsByDatePrintHandler
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

  server.post(
    '/pagination',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Product'],
        security: [{ bearerToken: [] }],
        body:$ref('productPaginationSchema')
        // response: {
        //   200: $ref('getProductsSchema'),
        // },
      },
    },
    getProductsHandlerPagination
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


  server.post(
    '/stockreport',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Product'],
        security: [{ bearerToken: [] }],
        body: $ref('stockTransactionReportSchema'),
        // response: {
        //   200: $ref('getProductsSchema'),
        // },
      },
    },
    stockReportHandler
  );
  server.post(
    '/stockreport-print',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Product'],
        security: [{ bearerToken: [] }],
        body: $ref('productPrintSchema'),
        // response: {
        //   200: $ref('getProductsSchema'),
        // },
      },
    },
    stockReportPrintHandler
  );

  server.get(
    '/details/:id',
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
    findProductDtlsHandler
  );
  server.post(
    '/product-summary',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Product'],
        security: [{ bearerToken: [] }],
        body: $ref('productSummarySchema'),
        // response: {
        //   200: $ref('getProductsSchema'),
        // },
      },
    },
    productSummarydtlsByDateHandler
  );
  server.post(
    '/product-summary-print',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Product'],
        security: [{ bearerToken: [] }],
        body: $ref('productSummaryPrintSchema'),
        // response: {
        //   200: $ref('getProductsSchema'),
        // },
      },
    },
    productSummarydtlsByDatePrintHandler
  );

};

export default productRoutes;
