import { z } from 'zod';
import { buildJsonSchemas } from 'fastify-zod';
import refineZod from '../../utils/refine_zod';

const cityCore = {
  id: z.number({
    required_error: 'Id is required',
  }),
  name: z.string({
    required_error: 'Name is required',
  }),
};

const createCitySchema = z.object(cityCore);

const newCityId = z.object({
  id: z.number({}),
});

const getCitysSchema = z
  .array(z.object({ _id: z.string(), ...cityCore }))
  .refine((elements) => refineZod(elements, ['_id', 'id', 'name']));

export type CreateCitySchema = z.infer<typeof createCitySchema>;

export const { schemas: citySchemas, $ref } = buildJsonSchemas(
  {
    createCitySchema,
    getCitysSchema,
    newCityId,
  },
  { $id: 'citySchemas' }
);
