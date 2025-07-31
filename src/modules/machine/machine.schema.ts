import { z } from 'zod';
import { buildJsonSchemas } from 'fastify-zod';
import refineZod from '../../utils/refine_zod';

const MachineCore = {
  id: z.number({
    required_error: 'Id is required',
  }),
  name: z.string({
    required_error: 'Name is required',
  }),
};

const createMachineSchema = z.object(MachineCore);

const newMachineId = z.object({
  id: z.number({}),
});
const machinePaginationSchema=z.object({
  pageno: z.number(),
  perPage: z.number(),
  name:z.string().optional(),
})
const getMachinesSchema = z
  .array(z.object({ _id: z.string(), ...MachineCore }))
  .refine((elements) => refineZod(elements, ['_id', 'id', 'name']));

export type CreateMachineSchema = z.infer<typeof createMachineSchema>;

export type MachinePaginationSchema = z.infer<typeof machinePaginationSchema>;

export const { schemas: MachineSchemas, $ref } = buildJsonSchemas(
  {
    createMachineSchema,
    getMachinesSchema,
    newMachineId,
    machinePaginationSchema,
  },
  { $id: 'MachineSchemas' }
);
