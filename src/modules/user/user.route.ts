import { FastifyInstance } from 'fastify';
import {
  loginHandler,
  registerUserHandler,
  getUsersHandler,
  updatePasswordHandler,
} from './user.controller';
import { $ref } from './user.schema';

const userRoutes = async (server: FastifyInstance) => {
  server.post(
    '/signup',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['User'],
        security: [{ bearerToken: [] }],
        body: $ref('createUserSchema'),
        response: {
          201: $ref('createUserResponseSchema'),
        },
      },
    },
    registerUserHandler
  );

  server.post(
    '/login',
    {
      schema: {
        tags: ['User'],
        body: $ref('loginSchema'),
        response: {
          200: $ref('loginResponseSchema'),
        },
      },
    },
    loginHandler
  );

  server.get(
    '/',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['User'],
        security: [{ bearerToken: [] }],
        response: {
          200: $ref('usersResponseSchema'),
        },
      },
    },
    getUsersHandler
  );

  server.put(
    '/update-password',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['User'],
        security: [{ bearerToken: [] }],
        body: $ref('updatePasswordSchema'),
        response: {
          //200: $ref('loginResponseSchema'),
        },
      },
    },
    updatePasswordHandler
  );
};

export default userRoutes;
