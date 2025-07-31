import { z } from 'zod';
import { buildJsonSchemas } from 'fastify-zod';
import refineZod from '../../utils/refine_zod';

const currencyCore = {
  id: z.number({
    required_error: 'Id is required',
  }),
  name: z.string({
    required_error: 'Name is required',
  }),
};

const createCurrencySchema = z.object(currencyCore);

const newCurrencyId = z.object({
  id: z.number({}),
});

const currencyPaginationSchema=z.object({
  pageno: z.number(),
  perPage: z.number(),
  name:z.string().optional(),
})
const getCurrencysSchema = z
  .array(z.object({ _id: z.string(), ...currencyCore }))
  .refine((elements) => refineZod(elements, ['_id', 'id', 'name']));

export type CreateCurrencySchema = z.infer<typeof createCurrencySchema>;
export type CurrencyPaginationSchema = z.infer<typeof currencyPaginationSchema>;
export const { schemas: currencySchemas, $ref } = buildJsonSchemas(
  {
    createCurrencySchema,
    getCurrencysSchema,
    newCurrencyId,
    currencyPaginationSchema
  },
  { $id: 'currencySchemas' }
);
