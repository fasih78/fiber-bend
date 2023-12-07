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

const getPaymentTermsSchema = z
  .array(z.object({ _id: z.string(), ...paymentTermCore }))
  .refine((elements) => refineZod(elements, ['_id', 'id', 'name']));

export type CreatePaymentTermSchema = z.infer<typeof createPaymentTermSchema>;

export const { schemas: paymentTermSchemas, $ref } = buildJsonSchemas(
  {
    createPaymentTermSchema,
    getPaymentTermsSchema,
    newPaymentTermId,
  },
  { $id: 'paymentTermSchemas' }
);
