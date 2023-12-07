import { z } from 'zod';
import { buildJsonSchemas } from 'fastify-zod';
import { type } from 'os';

//import { ShipmentDtl } from './shipment_dtls.model';

const shipmentCore = {
  shipmentNumber: z.number().optional(),
  gpNumber: z.string(),
  gpDate: z.string(),
  dcNumber: z.string(),
  dcDate: z.string(),
  ShipmentDtl: z.array(z.any()).optional(),
  salesContract: z.string(),
  specialInstruction: z.string(),
};

const createShipmentSchema = z.object(shipmentCore);

export type CreateShipmentSchema = z.infer<typeof createShipmentSchema>;

const shipmentReportSchema = z.object({
  fromDate: z.date(),
  toDate: z.date(),
  salesContract: z.array(z.any()),
  customer: z.array(z.any()),
  product_id: z.array(z.any()),
  dcNumber: z.string(),
  gpNumber: z.string(),
  pageno: z.number(),
  perPage: z.number(),
  productgroup: z.string(),
  salesContractgroup: z.string(),
  customergroup: z.string(),
});
const shipegroupSchema = z.object({
  product: z.string(),
  salesContract: z.string(),
  customer: z.string(),
});
const ShipmentpageSchema = z.object({
  pageno: z.number(),
  perPage: z.number(),
});

const shipmentprintSchema = z.object({
  fromDate: z.date(),
  toDate: z.date(),
  salesContract: z.array(z.any()),
  customer: z.array(z.any()),
  product_id: z.array(z.any()),
  dcNumber: z.string(),
  gpNumber: z.string(),
  productgroup: z.string().optional(),
  salesContractgroup: z.string().optional(),
  customergroup: z.string().optional(),
});

export type createShipmentSchema = z.infer<typeof createShipmentSchema>;

export type ShipmentReportSchema = z.infer<typeof shipmentReportSchema>;
export type ShipmentgroupSchema = z.infer<typeof shipegroupSchema>;
export type ShipmentpaginationSchema = z.infer<typeof ShipmentpageSchema>;
export type ShipmentPrintSchema = z.infer<typeof shipmentprintSchema>;
export const { schemas: shipmentSchema, $ref } = buildJsonSchemas(
  {
    createShipmentSchema,
    shipmentReportSchema,
    shipegroupSchema,
    ShipmentpageSchema,
    shipmentprintSchema,
  },
  { $id: 'shipmentSchema' }
);
