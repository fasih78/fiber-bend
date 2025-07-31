import { z } from 'zod';
import { buildJsonSchemas } from 'fastify-zod';
import refineZod from '../../utils/refine_zod';


const productCore = {
  id: z.number({
    required_error: 'Id is required',
  }),
  name: z.string({
    required_error: 'Name is required',
  }),
  price: z.string({}).optional(),
  royaltyRate:z.number(),
  productDtl: z.array(z.any()).optional(),
  // producttype:z.string()
  // currency: z.string({}).optional(),
};

const createProductSchema = z.object(productCore);

const newProductId = z.object({
  id: z.number({}),
});

const productPaginationSchema=z.object({
 
  pageno: z.number(),
  perPage: z.number(),
  name:z.string().optional(),
  sort:z.number().optional(),

})

const stockTransactionReportSchema=z.object({
  fromDate: z.date(),
  toDate: z.date(),
  pageno: z.number(),
  perPage: z.number(),
  product_id:z.array(z.any()).optional(),
  transactiongroup:z.string().optional(),
  name:z.string().optional(),
  sort:z.number().optional()
})

const productPrintSchema=z.object({
  product_id:z.array(z.any()).optional(),
  transactiongroup:z.string().optional(),
  fromDate: z.date(),
  toDate: z.date(),
  name:z.string().optional(),
  sort:z.number().optional()
})
const productSummarySchema = z.object({
  fromDate: z.date(), 
  toDate: z.date(),
  pageno: z.number(),
  perPage: z.number(),
  product_id: z.array(z.any()).optional(),
  customer_id : z.array(z.any()).optional(),
  customerGroup:z.boolean().optional(),
  productGroup:z.boolean().optional(),
});
const productSummaryPrintSchema = z.object({
  fromDate: z.date(), 
  toDate: z.date(),
  product_id: z.array(z.any()).optional(),
  customer_id : z.array(z.any()).optional(),
  customerGroup:z.boolean().optional(),
  productGroup:z.boolean().optional(),

});


const getProductsSchema = z.array(z.object({ _id: z.string(), ...productCore }))
  .refine((elements) => refineZod(elements, ['_id', 'id', 'name']));


  const productdrop_downSchema =z.object({
    limit:z.number().optional(),
    name:z.string().optional(),
    record : z.boolean().optional()
  })

export type CreateProductSchema = z.infer<typeof createProductSchema>;
export type Productdrop_downSchema = z.infer<typeof productdrop_downSchema>;
export type ProductPaginationSchema = z.infer<typeof productPaginationSchema>;
export type ProductPrintSchema = z.infer<typeof productPrintSchema>;
export type ProductSummarySchema = z.infer<typeof productSummarySchema>
export type ProductSummaryPrintSchema = z.infer<typeof productSummaryPrintSchema>
export type StockTransactionReportSchema = z.infer<typeof stockTransactionReportSchema>;
export const { schemas: productSchemas, $ref } = buildJsonSchemas(
  {
    createProductSchema,
    getProductsSchema,
    newProductId,
    productdrop_downSchema,
    productPaginationSchema,
    productSummarySchema,
    productPrintSchema,
    productSummaryPrintSchema,
    stockTransactionReportSchema
  },
  { $id: 'productSchemas' }
);
