import { z } from 'zod';
import { buildJsonSchemas } from 'fastify-zod';
import refineZod from '../../utils/refine_zod';

const royalityCore = {
  id: z.number(),
  paid: z.boolean(),
  paymentDate: z.string(),
  paymentDate1: z.string(),
  saletaxinvoicedate: z.string(),
  payment: z.string(),
  invoice: z.string().optional(),
  royalityrate: z.number().optional(),
  
};

const royalityAdmDenimCore = {
  //id:z.number(),
  salesContract: z.string(),
  customer: z.string(),
  royalityrate: z.number().optional(),
};

const royalitypageSchema = z.object({
  pageno: z.number(),
  perPage: z.number(),
});
const royalityReportSchema=z.object({
  otherthanadmdenim : z.string(),
  Admdenim: z.string(),
  product:z.array(z.any()),
  salesContract:z.array(z.any()),
  customer:z.array(z.any()),
  pageno: z.number(),
  perPage: z.number(),
  fromDate: z.date(),
  toDate: z.date(),
})
const royalityReportPrintSchema=z.object({
  otherthanadmdenim : z.string(),
  Admdenim: z.string(),
  product:z.array(z.any()),
  salesContract:z.array(z.any()),
  customer:z.array(z.any()),
  fromDate: z.date(),
  toDate: z.date(),
})

const createRoyalityAdmDenimSchema = z.object(royalityAdmDenimCore);
const createRoyalitySchema = z.object(royalityCore);
const royalitycore = {
  fromDate: z.date(),
  toDate: z.date(),
  customer: z.string(),
};

const updateroyalityrateSchema = z.object(royalitycore);
const reportSchema = z.object({
  fromDate: z.date(),
  toDate: z.date(),

  //payment: z.string(),
  //customer: z.string(),
});

const royalityamountSchema = z.object({
  payment: z.string(),
  salescontract: z.string(),
});

export type CreateRoyalitySchema = z.infer<typeof createRoyalitySchema>;
export type RoyalityPaginationSchema = z.infer<typeof royalitypageSchema>;
export type CreateRoyalityAdmDenimSchema = z.infer<
  typeof createRoyalityAdmDenimSchema
>;
export type RoyalityReportSchema = z.infer<
  typeof royalityReportSchema
>;
export type RoyalityReportPrintSchema = z.infer<
  typeof royalityReportPrintSchema
>;
export type ReportSchema = z.infer<typeof reportSchema>;
export type RoyalityamountSchema = z.infer<typeof royalityamountSchema>;
export type updateRoyalityrateSchema = z.infer<typeof updateroyalityrateSchema>;
export const { schemas: royalitySchema, $ref } = buildJsonSchemas(
  {
    createRoyalitySchema,
    reportSchema,
    royalityamountSchema,
    updateroyalityrateSchema,
    createRoyalityAdmDenimSchema,
    royalitypageSchema,
    royalityReportSchema,
    royalityReportPrintSchema
    
  },
  { $id: 'royalitySchema' }
);
