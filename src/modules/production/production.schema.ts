import { z } from 'zod';
import { buildJsonSchemas } from 'fastify-zod';
import refineZod from '../../utils/refine_zod';

const productionCore = {
  tran: z.number(),
  date: z.string(),
  productionType: z.string(),
  machine: z.string().optional(),
  specialInstruction: z.string(),
  productionDtl: z.array(z.any()),
  lot_no: z.string(),
};

const createProductionSchema = z.object(productionCore);

const productionReportSchema = z.object({
  fromDate: z.date(),
  toDate: z.date(),
  machine: z.string(),
  isDeleted: z.string().optional(),
  product: z.string(),
  pageno: z.number(),
  perPage: z.number(),
  lotNo_group  : z.string(),
  product_group: z.string(),
  supplierCode_group: z.string(),
  month_group: z.string(),
});
const productionpageSchema = z.object({
  pageno: z.number(),
  perPage: z.number(),
  name: z.string(),
});
const lotnumSchema = z.object({
  id: z.string(),
});

const productionReportPrintSchema = z.object({
  fromDate: z.date(),
  toDate: z.date(),
  machine: z.string(),
  isDeleted: z.string().optional(),
  lotNo_group  : z.string(),
  product: z.string(),
  product_group: z.string(),
  supplierCode_group: z.string(),
  month_group: z.string(),
});


const productionLotQtyAdjustSchema=z.object({

  product: z.string(),
  lot:z.string(),
})



export type CreateProductionSchema = z.infer<typeof createProductionSchema>;
export type ProductionReportSchema = z.infer<typeof productionReportSchema>;
export type ProductionPaginationSchema = z.infer<typeof productionpageSchema>;
export type ProductionLotQtyAdjustSchema = z.infer<typeof productionLotQtyAdjustSchema>;
export type LotNumSchema = z.infer<typeof lotnumSchema>;
export type ProductionReportPrintSchema = z.infer<
  typeof productionReportPrintSchema
>;

export const { schemas: productionSchema, $ref } = buildJsonSchemas(
  {
    createProductionSchema,
    productionReportSchema,
    lotnumSchema,
    productionpageSchema,
    productionReportPrintSchema,
    productionLotQtyAdjustSchema
  },
  { $id: 'productionSchema' }
);
