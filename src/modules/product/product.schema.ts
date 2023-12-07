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
  currency: z.string({}).optional(),
};

const createProductSchema = z.object(productCore);

const newProductId = z.object({
  id: z.number({}),
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
export const { schemas: productSchemas, $ref } = buildJsonSchemas(
  {
    createProductSchema,
    getProductsSchema,
    newProductId,
    productdrop_downSchema,
  },
  { $id: 'productSchemas' }
);
