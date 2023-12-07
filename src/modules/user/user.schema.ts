import { z } from 'zod';
import { buildJsonSchemas } from 'fastify-zod';
import refineZod from '../../utils/refine_zod';

const userCore = {
  email: z
    .string({
      required_error: 'Email is required',
      invalid_type_error: 'Email must be a string',
    })
    .email(),
  name: z.string(),
};

const createUserSchema = z.object({
  ...userCore,
  password: z.string({
    required_error: 'Password is required',
    invalid_type_error: 'Password must be a string',
  }),
});

const createUserResponseSchema = z.object({
  _id: z.string(),
  ...userCore,
});

const loginSchema = z.object({
  email: z
    .string({
      required_error: 'Email is required',
      invalid_type_error: 'Email must be a string',
    })
    .email(),
  password: z.string(),
});

const loginResponseSchema = z.object({
  ...userCore,
  accessToken: z.string(),
});

const usersResponseSchema = z
  .array(z.object(userCore))
  .refine((elements) => refineZod(elements, ['email', 'name']));

const updatePasswordSchema = z.object({
  id: z.string({
    required_error: 'id is required',
  }),
  password: z.string({ required_error: 'password is required' }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export type LoginInput = z.infer<typeof loginSchema>;

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

export const { schemas: userSchemas, $ref } = buildJsonSchemas(
  {
    createUserSchema,
    createUserResponseSchema,
    loginSchema,
    loginResponseSchema,
    usersResponseSchema,
    updatePasswordSchema,
  },
  { $id: 'userSchemas' }
);
