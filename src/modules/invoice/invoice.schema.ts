import { z } from 'zod';
import { buildJsonSchemas } from 'fastify-zod';
import refineZod from '../../utils/refine_zod';

const invoiceCore = {
  inv: z.number(),
  date: z.string(),
  salesContract: z.string(),
  specialInstruction: z.string(),
  invoiceDtl: z.array(z.any()).optional(),
  salesTaxInvoiceNo: z.string(),
};

//z.array(z.any())
const createInvoiceSchema = z.object(invoiceCore);
const InvoicepaginationSchema = z.object({
  pageno: z.number(),
  perPage: z.number(),
});
export type CreateInvoiceSchema = z.infer<typeof createInvoiceSchema>;
export type InvoicePagintionSchema = z.infer<typeof InvoicepaginationSchema>;
const invoiceReportSchema = z.object({
  fromDate: z.date(),
  toDate: z.date(),
  pageno: z.number(),
  perPage: z.number(),
  salesContract: z.array(z.any()).optional(),
  product:z.array(z.any()).optional(),
  customer:z.array(z.any()).optional(),
  product_group:z.string().optional(),
  customer_group:z.string().optional(),
  salesContract_group:z.string().optional()

});
const invoicePrintSchema=z.object({
  fromDate: z.date(),
  toDate: z.date(),
  salesContract: z.array(z.any()).optional()|| [],
  product:z.array(z.any()).optional() || [],
  customer:z.array(z.any()).optional() || [],
  product_group:z.string().optional() || [],
  customer_group:z.string().optional() || [],
  salesContract_group:z.string().optional()|| []
})

export type createInvoiceSchema = z.infer<typeof createInvoiceSchema>;

export type InvoiceReportSchema = z.infer<typeof invoiceReportSchema>;

export type InvoiceReportPrintSchema = z.infer<typeof invoicePrintSchema>;
export const { schemas: invoiceSchema, $ref } = buildJsonSchemas(
  {
    createInvoiceSchema,
    invoiceReportSchema,
    InvoicepaginationSchema,
    invoicePrintSchema,

  },
  { $id: 'invoiceSchema' }
);
