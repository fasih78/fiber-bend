import { z } from 'zod';
import { buildJsonSchemas } from 'fastify-zod';
import refineZod from '../../utils/refine_zod';

const paymentCore = {
  id: z.number(),
  paymentRecieveDate: z.string(),
  cheaqueNo: z.string(),
  invoice: z.string(),
  specialInstruction: z.string().optional(),
};

const createPaymentSchema = z.object(paymentCore);

export type CreatePaymentSchema = z.infer<typeof createPaymentSchema>;

const paymentReportSchema = z.object({
  fromDate: z.date(),
  toDate: z.date(),
  invoice: z.string(),
});
const paymentpageSchema = z.object({
  pageno: z.number(),
  perPage: z.number(),
  contract:z.string()
});
const extrapaymentdrop_downSchema = z.object({
  limit:z.number().optional(),
  salesTaxInvoiceNo:z.string().optional(),
record:z.boolean().optional()
  
  })

export type PaymentReportSchema = z.infer<typeof paymentReportSchema>;
export type PaymentPaginationSchema = z.infer<typeof paymentpageSchema>;
export type ExtraPaymentDropDownSchema = z.infer<typeof extrapaymentdrop_downSchema>;
export const { schemas: payementSchema, $ref } = buildJsonSchemas(
  {
    createPaymentSchema,
    paymentReportSchema,
    paymentpageSchema,
    extrapaymentdrop_downSchema
  },
  { $id: 'payementSchema' }
);
