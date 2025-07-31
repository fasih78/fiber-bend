import { z } from 'zod';
import { buildJsonSchemas } from 'fastify-zod';

const returnCore = z.object({
  retNo: z.number().optional().optional(),
  contract: z.string().optional(),
  shipmentTran: z.number().optional(),
  returnDate: z.string().optional(),
  shipmentDate: z.string().optional(),
  returndtl: z.array(z.any()).optional(),
  salesContract: z.string().optional(),
  brand: z.string().optional(),
  customer: z.string().optional(),
  shipment: z.string().optional(),
  specialInstruction: z.string().optional(),
});
const returnReportSchema = z.object({
  fromDate: z.date(),
  toDate: z.date(),
  brand: z.array(z.any()),
  salesContract: z.array(z.any()),
  customer: z.array(z.any()),
  product: z.array(z.any()),
  pageno: z.number(),
  perPage: z.number(),
  productgroup: z.string(),
  salesContractgroup: z.string(),
  customergroup: z.string(),
  brandgroup: z.string(),
  Adm: z.string().optional(),
  nonAdm: z.string().optional(),
  royality_approval: z.string().optional(),
});
const returnReportPrintSchema = z.object({
  fromDate: z.date(),
  toDate: z.date(),
  brand: z.array(z.any()),
  salesContract: z.array(z.any()),
  customer: z.array(z.any()),
  product: z.array(z.any()),
  productgroup: z.string(),
  salesContractgroup: z.string(),
  customergroup: z.string(),
  brandgroup: z.string(),
  Adm: z.string().optional(),
  nonAdm: z.string().optional(),
  royality_approval: z.string().optional(),
});

const returnContractPaginationSchema = z.object({
  pageno: z.number(),
  perPage: z.number(),
  contract: z.string().optional(),
});

const returndropdownSchema = z.object({
  limit: z.number().optional(),
  tran: z.string().optional(),
  record: z.boolean().optional(),
});
export type createReturnSchema = z.infer<typeof returnCore>;
export type ReturndropdownSchema = z.infer<typeof returndropdownSchema>;
export type ReturnContractPaginationSchema = z.infer<
  typeof returnContractPaginationSchema
>;
export type ReturnReportSchema = z.infer<typeof returnReportSchema>;
export type ReturnReportPrintSchema = z.infer<typeof returnReportPrintSchema>;
export const { schemas: returnSchema, $ref } = buildJsonSchemas(
  {
    returnCore,
    returndropdownSchema,
    returnContractPaginationSchema,
    returnReportSchema,
    returnReportPrintSchema,
  },
  { $id: 'returnSchema' }
);
