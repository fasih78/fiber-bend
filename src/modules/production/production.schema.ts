import { z } from 'zod';
import { buildJsonSchemas } from 'fastify-zod';
import refineZod from '../../utils/refine_zod';

const productionCore = {
  tran: z.number(),
  date: z.string(),
  productionType: z.string(),
  machine: z.string(),
  specialInstruction: z.string(),
  productionDtl: z.array(z.any()),
};

const createProductionSchema = z.object(productionCore);

const productionReportSchema = z.object({
  fromDate: z.date(),
  toDate: z.date(),
  machine: z.string(),
  pageno: z.number(),
  perPage: z.number(),
});
const productionpageSchema = z.object({
  pageno: z.number(),
  perPage: z.number(),
});
const lotnumSchema = z.object({
  id: z.string(),
});

const productionReportPrintSchema = z.object({
  fromDate: z.date(),
  toDate: z.date(),
  machine: z.string(),

});


export type CreateProductionSchema = z.infer<typeof createProductionSchema>;
export type ProductionReportSchema = z.infer<typeof productionReportSchema>;
export type ProductionPaginationSchema = z.infer<typeof productionpageSchema>;
export type LotNumSchema = z.infer<typeof lotnumSchema>;
export type ProductionReportPrintSchema = z.infer<typeof productionReportPrintSchema>;

export const { schemas: productionSchema, $ref } = buildJsonSchemas(
  {
    createProductionSchema,
    productionReportSchema,
    lotnumSchema,
    productionpageSchema,
    productionReportPrintSchema
  },
  { $id: 'productionSchema' }
);
