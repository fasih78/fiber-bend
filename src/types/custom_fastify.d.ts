import { JWT } from '@fastify/jwt';
import prisma from '../utils/prisma';

declare module 'fastify' {
  interface FastifyRequest {
    jwt: JWT;
    prisma: typeof prisma;
  }
  export interface FastifyInstance {
    authenticate: any;
    apiKey: any;
    prisma: typeof prisma;
  }
}
