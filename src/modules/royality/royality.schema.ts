import { z } from 'zod';
import { buildJsonSchemas } from 'fastify-zod';
import refineZod from '../../utils/refine_zod';

const royalityCore = {
  id: z.number(),
  paid: z.boolean().optional(),
  paymentDate: z.string().optional(),
  paymentDate1: z.string().optional(),
  saletaxinvoicedate: z.string().optional(),
  payment: z.string().optional(),
  invoice: z.string().optional(),
  brand: z.string().optional(),
  royalityrate: z.number().optional(),
  salesContract: z.string().optional(),
  customer: z.string().optional(),
  shipment_date: z.string().optional(),
  amount: z.number().optional(),
  salesTaxInvoiceNo: z.string().optional(),
  product: z.string().optional(),
  contract: z.string().optional(),
};
// const createRoyalitySchema2=z.object({
//   id: z.number(),
//   paid: z.boolean().optional(),
//   paymentDate: z.string().optional(),
//   paymentDate1: z.string().optional(),
//   saletaxinvoicedate: z.string(),
//   payment: z.string(),
//   invoice: z.string(),
//   royalityrate: z.number(),
// })

const royalityAdmDenimCore = {
  //id:z.number(),
  salesContract: z.string(),
  customer: z.string(),
  royalityrate: z.number().optional(),
  shipment_date: z.date(),
  amount: z.number().optional(),
};

const royalitypageSchema = z.object({
  pageno: z.number(),
  perPage: z.number(),
  contract: z.string(),
});



const updateRoyalitySchema=z.object({
  
  paid: z.boolean(),
  paymentDate: z.string(),
  paymentDate1: z.string(),
  saletaxinvoicedate: z.string(),
  payment: z.string(),
  invoice: z.string(),
  brand: z.string(),
  royalityrate: z.number(),
  salesContract: z.string(),
  customer: z.string(),
  shipment_date: z.string(),
  amount: z.number(),
  salesTaxInvoiceNo: z.string(),
  product: z.string(),
  contract: z.string(),
})

const royalityReportSchema = z.object({
  otherthanadmdenim: z.string(),
  Admdenim: z.string(),
  product: z.array(z.any()),
  brand: z.array(z.any()),
  isDeleted: z.string().optional(),
  salesContract: z.array(z.any()),
  customer: z.array(z.any()),
  pageno: z.number(),
  perPage: z.number(),
  fromDate: z.date(),
  toDate: z.date(),
  royality_return: z.string(),
  order_status: z.string().optional(),
  royality_approval: z.string().optional(),
  productgroup: z.string(),
  customergroup: z.string(),
  brandgroup: z.string(),
});
const royalityReportPrintSchema = z.object({
  otherthanadmdenim: z.string(),
  Admdenim: z.string(),
  product: z.array(z.any()),
  isDeleted: z.string().optional(),
  brand: z.array(z.any()),
  salesContract: z.array(z.any()),
  customer: z.array(z.any()),
  royality_return: z.string(),
  fromDate: z.date(),
  toDate: z.date(),
  order_status: z.string().optional(),
  royality_approval: z.string().optional(),
  productgroup: z.string(),
  customergroup: z.string(),
  brandgroup: z.string(),
});

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
  royaltyRate: z.number(),
  contractDate: z.date().optional(),
});

export type CreateRoyalitySchema = z.infer<typeof createRoyalitySchema>;
export type UpdateRoyalitySchema = z.infer<typeof updateRoyalitySchema>;
export type RoyalityPaginationSchema = z.infer<typeof royalitypageSchema>;
export type CreateRoyalityAdmDenimSchema = z.infer<
  typeof createRoyalityAdmDenimSchema
>;
export type RoyalityReportSchema = z.infer<typeof royalityReportSchema>;
export type RoyalityReportPrintSchema = z.infer<
  typeof royalityReportPrintSchema
>;
export type ReportSchema = z.infer<typeof reportSchema>;
// export type CreateRoyalitySchema2  = z.infer<typeof createRoyalitySchema2>;
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
    updateRoyalitySchema,
    royalityReportPrintSchema,
    // createRoyalitySchema2
  },
  { $id: 'royalitySchema' }
);
