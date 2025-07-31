import { z } from 'zod';
import { buildJsonSchemas } from 'fastify-zod';
import refineZod from '../../utils/refine_zod';

const brandCore = {
  id: z.number({
    required_error: 'Id is required',
  }),
  name: z.string({
    required_error: 'Name is required',
  }),
};

const createBrandSchema = z.object(brandCore);

const newBrandId = z.object({
  id: z.number({}),
});
const brand_drop_down_Schema=z.object({
  limit:z.number(),
  name:z.string().optional(),
  record:z.boolean()
})
const brandPaginationSchema=z.object({
  pageno: z.number(),
  perPage: z.number(),
  name:z.string().optional(),
})

const getBrandsSchema = z
  .array(z.object({ _id: z.string(), ...brandCore }))
  .refine((elements) => refineZod(elements, ['_id', 'id', 'name']));

export type CreateBrandSchema = z.infer<typeof createBrandSchema>;
export type Brand_drop_down_Schema = z.infer<typeof brand_drop_down_Schema>;
export type BrandPaginationSchema = z.infer<typeof brandPaginationSchema>;
export const { schemas: brandSchemas, $ref } = buildJsonSchemas(
  {
    createBrandSchema,
    getBrandsSchema,
    newBrandId,
    brand_drop_down_Schema,
    brandPaginationSchema,

  },
  { $id: 'brandSchemas' }
);
