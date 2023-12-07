import { z } from 'zod';
import { buildJsonSchemas } from 'fastify-zod';
import refineZod from '../../utils/refine_zod';

const countryCore = {
  id: z.number({
    required_error: 'Id is required',
  }),
  name: z.string({
    required_error: 'Name is required',
  }),
};

const createCountrySchema = z.object(countryCore);

const newCountryId = z.object({
  id: z.number({}),
});

const getCountrysSchema = z
  .array(z.object({ _id: z.string(), ...countryCore }))
  .refine((elements) => refineZod(elements, ['_id', 'id', 'name']));

export type CreateCountrySchema = z.infer<typeof createCountrySchema>;

export const { schemas: countrySchemas, $ref } = buildJsonSchemas(
  {
    createCountrySchema,
    getCountrysSchema,
    newCountryId,
  },
  { $id: 'countrySchemas' }
);
