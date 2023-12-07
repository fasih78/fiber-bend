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

const getBrandsSchema = z
  .array(z.object({ _id: z.string(), ...brandCore }))
  .refine((elements) => refineZod(elements, ['_id', 'id', 'name']));

export type CreateBrandSchema = z.infer<typeof createBrandSchema>;

export const { schemas: brandSchemas, $ref } = buildJsonSchemas(
  {
    createBrandSchema,
    getBrandsSchema,
    newBrandId,
  },
  { $id: 'brandSchemas' }
);
