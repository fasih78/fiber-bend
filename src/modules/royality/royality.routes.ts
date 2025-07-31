import { FastifyInstance } from 'fastify';
import { $ref } from './royality.schema';
import { CreateRoyalitySchema } from './royality.schema';
import {
  getNewRoyalityIdHandler,
  RoyalityPaginationHandler,
  deleteRoyalityByIdHandler,
  updateRoyalityByIdHandler,
  deleteRoyalityHandler,
  createRoyalityHandler,
  // findAllDetailToReportHandler,
  findRoyalityAmountHandler,
  findRoyalityDtlsByDateHandler,
  RoyalityrateByIdHandler,
  createRoyalityAdmDenimHandler,
  findRoyalityAdmAmountHandler,
  findRoyalityAdmdenimByDateHandler,
  getNewRoyalityAdmDenimIdHandler,
  RoyalityReportDtlwithAdmDenimHandler,
  RoyalityReportDtlPrintHandler,
  RoyalityReportDtlNetwithAdmDenimHandler,
  RoyalityReportDtlNetPrintHandler
} from './royality.controller';

export const royalityRoutes = async (server: FastifyInstance) => {
  server.post(
    '/',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Royality'],
        security: [{ bearerToken: [] }],
        body: $ref('createRoyalitySchema'),
        response: {
          201: $ref('createRoyalitySchema'),
        },
      },
    },
    createRoyalityHandler
  );

  server.post(
    '/admdenim',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Royality'],
        security: [{ bearerToken: [] }],
        body: $ref('createRoyalityAdmDenimSchema'),
        response: {
          201: $ref('createRoyalityAdmDenimSchema'),
        },
      },
    },
    createRoyalityAdmDenimHandler
  );

  server.post(
    '/Pagination',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Royality'],
        security: [{ bearerToken: [] }],
        body: $ref('royalitypageSchema')
        // response: {
        //   200: $ref('createPaymentSchema'),
        // },
      },
    },
    RoyalityPaginationHandler
  );

  server.delete(
    '/all',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Royality'],
        security: [{ bearerToken: [] }],
      },
    },
    deleteRoyalityHandler
  );

  server.put(
    '/:id',

    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Royality'],
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
        body: $ref('updateRoyalitySchema'),
        // response: {
        //   200: $ref('createPaymentSchema'),
        // },
      },
    },
    updateRoyalityByIdHandler
  );

  server.delete(
    '/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Royality'],
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
    deleteRoyalityByIdHandler
  );

  server.get(
    '/id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Royality'],
        security: [{ bearerToken: [] }],
      },
    },
    getNewRoyalityIdHandler
  );


  server.get(
    '/AdmDenim/id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Royality'],
        security: [{ bearerToken: [] }],
      },
    },
    getNewRoyalityAdmDenimIdHandler
  );









  // server.post(
  //   '/report',
  //   {
  //     preHandler: [server.authenticate],
  //     schema: {
  //       tags: ['Report'],
  //       security: [{ bearerToken: [] }],
  //       body: $ref('reportSchema'),
  //     },
  //   },
  //   findAllDetailToReportHandler
  // );

  server.post(
    '/royalityamount',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Royality'],
        security: [{ bearerToken: [] }],
        body: $ref('royalityamountSchema'),
      },
    },
    findRoyalityAmountHandler
  );



  server.post(
    '/royalityAdmamount',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Royality'],
        security: [{ bearerToken: [] }],
        body: $ref('royalityamountSchema'),
      },
    },
    findRoyalityAdmAmountHandler
  );
  server.post(
    '/details/dtl/dtl-by-date-Royality-Dtls',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Royality'],
        body: $ref('reportSchema'),
        security: [{ bearerToken: [] }],
      },
    },

    findRoyalityDtlsByDateHandler
  );
  server.put(
    '/royalityrateupdate',

    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Royality'],
        // params: {
        //   type: 'object',
        //   properties: {
        //     id: {
        //       type: 'string',
        //       description: 'user id',
        //     },
        //   },
        // },
        security: [{ bearerToken: [] }],
        body: $ref('updateroyalityrateSchema'),
        // response: {
        //   200: $ref('createPaymentSchema'),
        // },
      },
    },
    RoyalityrateByIdHandler
  );

  server.post(
    '/AdmDenim/Royality-Dtls',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Royality'],
        body: $ref('updateroyalityrateSchema'),
        security: [{ bearerToken: [] }],
      },
    },

    findRoyalityAdmdenimByDateHandler
  );

  server.post(
    '/details/dtl/dtl-by-date-Royality-Dtls-full-option',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Royality'],
        body: $ref('royalityReportSchema'),
        security: [{ bearerToken: [] }],
      },
    },

    RoyalityReportDtlwithAdmDenimHandler
  );

  server.post(
    '/details/dtl/dtl-by-date-Royality-Dtls-print',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Royality'],
        body: $ref('royalityReportPrintSchema'),
        security: [{ bearerToken: [] }],
      },
    },

    RoyalityReportDtlPrintHandler
  );

  server.post(
    '/details/dtl/dtl-by-date-Royality-Dtls-Net-full-option',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Royality'],
        body: $ref('royalityReportSchema'),
        security: [{ bearerToken: [] }],
      },
    },

RoyalityReportDtlNetwithAdmDenimHandler  
);
  server.post(
    '/details/dtl/dtl-by-date-Royality-Dtls-Net-print',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Royality'],
        body: $ref('royalityReportPrintSchema'),
        security: [{ bearerToken: [] }],
      },
    },

    RoyalityReportDtlNetPrintHandler

  );


};

export default royalityRoutes;
