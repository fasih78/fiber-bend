import { z } from 'zod';
import { buildJsonSchemas } from 'fastify-zod';
import refineZod from '../../utils/refine_zod';

const stateCore = {
  id: z.number({
    required_error: 'Id is required',
  }),
  name: z.string({
    required_error: 'Name is required',
  }),
};

const createStateSchema = z.object(stateCore);

const newStateId = z.object({
  id: z.number({}),
});

const getStatesSchema = z
  .array(z.object({ _id: z.string(), ...stateCore }))
  .refine((elements) => refineZod(elements, ['_id', 'id', 'name']));

export type CreateStateSchema = z.infer<typeof createStateSchema>;

export const { schemas: stateSchemas, $ref } = buildJsonSchemas(
  {
    createStateSchema,
    getStatesSchema,
    newStateId,
  },
  { $id: 'stateSchemas' }
);
