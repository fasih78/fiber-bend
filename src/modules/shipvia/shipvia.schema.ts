import { z } from 'zod';
import { buildJsonSchemas } from 'fastify-zod';
import refineZod from '../../utils/refine_zod';

const ShipViaCore = {
  id: z.number({
    required_error: 'Id is required',
  }),
  ship_via: z.string({
    required_error: 'ship_via is required',
  }),
};

const createShipViaSchema = z.object(ShipViaCore);

const newShipViaId = z.object({
  id: z.number({}),
});
const getShipviaSchema = z
  .array(z.object({ _id: z.string(), ...ShipViaCore }))
  .refine((elements) => refineZod(elements, ['_id', 'id', 'name']));

export type CreateShipViaSchema = z.infer<typeof createShipViaSchema>;
export const { schemas: shipviaSchemas, $ref } = buildJsonSchemas(
  {
    createShipViaSchema,
    newShipViaId,
    getShipviaSchema,
  },
  { $id: 'shipviaSchemas' }
);
