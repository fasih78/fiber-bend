import { FastifyReply, FastifyRequest } from 'fastify';
import {
  userLogReport, userLogDeleteAll
} from './userhistroy.service'
import { userHistroyReportSchema } from './userhistroy.schema';


export const findUserHistroyDtlsByDateHandler = async (
  request: FastifyRequest<{
    Body: userHistroyReportSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;

  const userhistroyDtls = await userLogReport(body);

  return userhistroyDtls;
};



export const UserHistroyDeleteAllHandler = async () => {


  const userhistroyDtls = await userLogDeleteAll();

  return userhistroyDtls;
};

