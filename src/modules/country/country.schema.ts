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

const countryPaginationSchema=z.object({
  pageno: z.number(),
  perPage: z.number(),
  name:z.string().optional(),
})

const getCountrysSchema = z
  .array(z.object({ _id: z.string(), ...countryCore }))
  .refine((elements) => refineZod(elements, ['_id', 'id', 'name']));

export type CreateCountrySchema = z.infer<typeof createCountrySchema>;
export type CountryPaginationSchema = z.infer<typeof countryPaginationSchema>;
export const { schemas: countrySchemas, $ref } = buildJsonSchemas(
  {
    createCountrySchema,
    getCountrysSchema,
    newCountryId,
    countryPaginationSchema
  },
  { $id: 'countrySchemas' }
);
