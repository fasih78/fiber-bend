import { z } from 'zod';
import { buildJsonSchemas } from 'fastify-zod';
import refineZod from '../../utils/refine_zod';

const cityCore = {
  id: z.number({
    required_error: 'Id is required',
  }),
  name: z.string({
    required_error: 'Name is required',
    
  }
).trim(),
};

const createCitySchema = z.object(cityCore);

const newCityId = z.object({
  id: z.number({}),
});
const cityPaginationSchema=z.object({
  pageno: z.number(),
  perPage: z.number(),
  name:z.string().optional(),
})

const getCitysSchema = z
  .array(z.object({ _id: z.string(), ...cityCore }))
  .refine((elements) => refineZod(elements, ['_id', 'id', 'name']));

export type CreateCitySchema = z.infer<typeof createCitySchema>;
export type CityPaginationSchema = z.infer<typeof cityPaginationSchema>;
export const { schemas: citySchemas, $ref } = buildJsonSchemas(
  {
    createCitySchema,
    getCitysSchema,
    newCityId,
    cityPaginationSchema
  },
  { $id: 'citySchemas' }
);
