import { z } from 'zod';
import { buildJsonSchemas } from 'fastify-zod';
import refineZod from '../../utils/refine_zod';

const salesContractCore = {
  tran: z.number(),
  po: z.string(),
  contract: z.string(),
  specialInstruction: z.string().optional(),
  customer: z.string(),
  brand: z.string(),
  paymentTerm: z.string(),
  shipvia: z.string(),
  salesContractDtl: z.any(),
  poDate: z.string(),
  contractDate: z.string(),
  tc_no: z.string().optional(),
  vendorgarment: z.string().optional(),
};
const tepCore = z.object({
  customer: z.string().optional(),
});

const createSalesContractSchema = z.object(salesContractCore);

const saleContractReportSchema = z.object({
  fromDate: z.date(),
  toDate: z.date(),
  pageno: z.number(),
  perPage: z.number(),
  customer: z.array(z.any()).optional(),
  product: z.array(z.any()).optional(),
  brand:z.array(z.any()).optional(),
  product_group:z.string().optional(),
  customer_group:z.string().optional(),
  brand_group:z.string().optional(),
});

const salesContractPrintSchema =z.object({
  fromDate: z.date(),
  toDate: z.date(),
  customer: z.array(z.any()).optional(),
  product: z.array(z.any()).optional(),
  brand:z.array(z.any()).optional(),
  product_group:z.string().optional(),
  customer_group:z.string().optional(),
  brand_group:z.string().optional(),
})



const saleContractReportProductSchema = z.object({
  pageno: z.number(),
  perPage: z.number(),
});


const salecontractdrop_downSchema = z.object({
limit:z.number().optional(),
contract:z.string().optional(),
record:z.boolean().optional()

})



export type CreateSalesContractSchema = z.infer<
  typeof createSalesContractSchema
>;

export type SaleContractReportSchema = z.infer<typeof saleContractReportSchema>;
export type tempSchema = z.infer<typeof tepCore>;
export type SaleContractReportProductSchema = z.infer<
  typeof saleContractReportProductSchema
>;
export type SaleContractReportPrintSchema = z.infer<
  typeof salesContractPrintSchema
>;

export type Salecontractdrop_downSchema = z.infer<
  typeof salecontractdrop_downSchema
>;
export const { schemas: salesContractSchema, $ref } = buildJsonSchemas(
  {
    createSalesContractSchema,
    saleContractReportSchema,
    saleContractReportProductSchema,
    tepCore,
    salesContractPrintSchema,
    salecontractdrop_downSchema,
  },
  { $id: 'salesContractSchema' }
);
