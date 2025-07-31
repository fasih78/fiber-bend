import { FastifyInstance } from 'fastify';
import {
  findUserHistroyDtlsByDateHandler,
  UserHistroyDeleteAllHandler
} from './userhistroy.controller'
import { $ref } from './userhistroy.schema';
const userHistroyRoutes = async (server: FastifyInstance) => {

  server.post(
    '/details/dtl/dtl-by-date-UserHistroy-Dtls',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['UserHistroy'],
        body: $ref('userhistroyCore'),
        security: [{ bearerToken: [] }],
      },
    },

    findUserHistroyDtlsByDateHandler
  )
  server.delete(
    '/deleteall',
    {
      preHandler: [server.authenticate],
      schema: {
        tags: ['UserHistroy'],
        security: [{ bearerToken: [] }],
      },
    },

    UserHistroyDeleteAllHandler
  )

}
export default userHistroyRoutes;