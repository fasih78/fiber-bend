import { FastifyReply, FastifyRequest } from 'fastify';

const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify();
  } catch (e) {
    return reply.send(e);
  }
};

export default authenticate;
