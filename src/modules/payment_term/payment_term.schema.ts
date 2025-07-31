import { z } from 'zod';
import { buildJsonSchemas } from 'fastify-zod';
import refineZod from '../../utils/refine_zod';

const paymentTermCore = {
  id: z.number({
    required_error: 'Id is required',
  }),
  name: z.string({
    required_error: 'Name is required',
  }),
};

const createPaymentTermSchema = z.object(paymentTermCore);

const newPaymentTermId = z.object({
  id: z.number({}),
});
const payment_termPaginationSchema=z.object({
  pageno: z.number(),
  perPage: z.number(),
  name:z.string().optional(),
})
const getPaymentTermsSchema = z
  .array(z.object({ _id: z.string(), ...paymentTermCore }))
  .refine((elements) => refineZod(elements, ['_id', 'id', 'name']));

const payment_term_drop_down_Schema = z.object({
  name:z.string(),
  limit:z.number(),
  record:z.boolean()
})

export type CreatePaymentTermSchema = z.infer<typeof createPaymentTermSchema>;
export type Payment_termPaginationSchema = z.infer<typeof payment_termPaginationSchema>;
export type Payment_Term_drop_down_Schema = z.infer<typeof payment_term_drop_down_Schema>;

export const { schemas: paymentTermSchemas, $ref } = buildJsonSchemas(
  {
    createPaymentTermSchema,
    getPaymentTermsSchema,
    newPaymentTermId,
    payment_term_drop_down_Schema,
    payment_termPaginationSchema
  },
  { $id: 'paymentTermSchemas' }
);
