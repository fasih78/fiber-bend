import { z } from 'zod';
import { buildJsonSchemas } from 'fastify-zod';
import refineZod from '../../utils/refine_zod';

const permissionCore = {
  id: z.number({
    required_error: 'Id is required',
  }),

  name: z.string({
    required_error: 'Permission is required',
  }),
};

const createPermissionSchema = z.object(permissionCore);

export type CreatePermissionSchema = z.infer<typeof createPermissionSchema>;

export const { schemas: permissionSchemas, $ref } = buildJsonSchemas(
  {
    createPermissionSchema,
  },
  { $id: 'permissionSchemas' }
);
