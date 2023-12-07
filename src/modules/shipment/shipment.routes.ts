import { FastifyInstance } from 'fastify';
import {
  createShipmentHandler,
  deleteShipmentByIdHandler,
  ShipmentPaginationHandler,
  getNewShipmentIdHandler,
  updateShipmentByIdHandler,
  findShipmentDtlsByDateHandler,
  findIsDeletedShipmentDtlsByDateHandler,
  deleteShipmentHandler,
  getSalesContractsWithMoreQtyHandler,
  //findSalesContractsWithInvoiceHandler,
  findSalesContractsWithShipmentHandler,
  findShipmentDtlsHandler,
  findShipmentcustomerHandler,
  findShipmentDtlsByDatePrintHandler
} from './shipment.controller';
import { $ref } from './shipment.schema';
import { ShipmentReportSchema } from './shipment.schema';
import { deleteShipment } from './shipment.service';
const shipmentRoutes = async (server: FastifyInstance) => {
  server.post(
    '/',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Shipment'],
        security: [{ bearerToken: [] }],
        body: $ref('createShipmentSchema'),
        response: {
          201: $ref('createShipmentSchema'),
        },
      },
    },
    createShipmentHandler
  );

  server.get(
    '/id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Shipment'],
        security: [{ bearerToken: [] }],
      },
    },
    getNewShipmentIdHandler
  );

  server.post(
    '/Pagination',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Shipment'],
        security: [{ bearerToken: [] }],
        body:$ref('ShipmentpageSchema')
        // response: {
        //   200: $ref('getShipmentsSchema'),
        // },
      },
    },
    ShipmentPaginationHandler
  );

  server.delete(
    '/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Shipment'],
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
    deleteShipmentByIdHandler
  );

  server.put(
    '/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Shipment'],
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
        body: $ref('createShipmentSchema'),
        // response: {
        //   200: $ref('createShipmentSchema'),
        // },
      },
    },
    updateShipmentByIdHandler
  );

  server.post(
    '/details/dtl/dtl-by-date-Shipment-Dtls',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Shipment'],
        body: $ref('shipmentReportSchema'),
        security: [{ bearerToken: [] }],
      },
    },

    findShipmentDtlsByDateHandler
  );
  server.post(
    '/details/dtl/dtl-by-date-Shipment-Dtls-print',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Shipment'],
        body: $ref('shipmentprintSchema'),
        security: [{ bearerToken: [] }],
      },
    },

    findShipmentDtlsByDatePrintHandler
  );
  server.post(
    '/details/dtl/dtl-is-deleted-by-date-Shipment-Dtls',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Shipment'],
        body: $ref('shipmentReportSchema'),
        security: [{ bearerToken: [] }],
      },
    },

    findIsDeletedShipmentDtlsByDateHandler
  );

  server.delete(
    '/all',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Shipment'],
        security: [{ bearerToken: [] }],
      },
    },
    deleteShipmentHandler
  );
  server.get(
    '/qty',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Shipment'],
        security: [{ bearerToken: [] }],
        // response: {
        //   200: $ref('getSalesContractsSchema'),
        // },
      },
    },
    getSalesContractsWithMoreQtyHandler
  );
  server.get(
    '/shipment-details/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Shipment'],
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
    findSalesContractsWithShipmentHandler
  );
  server.get(
    '/details/:id',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Shipment'],
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
    findShipmentDtlsHandler
  );

  server.post(
    '/customer',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['Shipment'],
        body: $ref('shipegroupSchema'),
        security: [{ bearerToken: [] }],
      },
    },

    findShipmentcustomerHandler
  );
};

export default shipmentRoutes;
