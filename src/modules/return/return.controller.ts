import { FastifyReply, FastifyRequest } from 'fastify';
import {
  createReturnSchema,
  ReturnContractPaginationSchema,
  ReturndropdownSchema,
  ReturnReportPrintSchema,
  ReturnReportSchema,
} from './return.schema';

import {
  createReturnContract,
  getNewReturnId,
  Returndropdown,
  findReturnContractWithMoreQty,
  findReturnContractWithPagination,
  deleteReturnContractById,
  returnContractUpdateById,
  findReturnDtls,
  findReturnDtlsByDate,
  findReturnDtlsByDatePrint,
} from './return.service';
import { error } from 'console';
import { ObjectId } from 'mongoose';
import { userLog } from '../../user_histroy/userhistroy.service';
interface DecodedPayload {
  _doc: {
    email: string;
    name: string;
    _id: ObjectId;
  };
}

export const createReturnContractHandler = async (
  request: FastifyRequest<{
    Body: createReturnSchema;
  }>,
  reply: FastifyReply
) => {
  let token: string | undefined;
  let returnContract;

  try {
    const body = request.body;
    returnContract = await createReturnContract(body);

    token = request.headers.authorization;
    const publicIP = request.headers['public_ip'];

    type publicIP = string | undefined;
    const ipAddress: any = publicIP;

    if (!token) {
      console.error('Authorization header is missing');
      return reply.code(400).send({ error: 'Authorization header is missing' });
    }
    const decoded = request.jwt.decode(token.split(' ')[1]) as DecodedPayload;
    const { email, name, _id } = decoded._doc;

    if (!returnContract) {
      console.error('Failed to create return!');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress, body);
      //////////// user log //////////
      return reply.code(500).send({ error: 'Error creating return contract' });
    }

    if (returnContract == 'Actual Quantity is greater than  shipmentQty!') {
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress, body);
      //////////// user log //////////
      return reply
        .code(400)
        .send({ error: 'Actual Quantity is greater than shipmentQty!' });
    }

    if (returnContract === 'Return contract created successfully') {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress, body);
      //////////// user log //////////
      return reply
        .code(201)
        .send({ message: 'Return contract created successfully' });
    }

    return reply.code(500).send({ error: 'Unexpected error occurred' });
  } catch (error) {
    console.error('Error in createReturnContractHandler:', error);

    return reply.code(500).send({ error: 'Internal Server Error' });
  }
};

export const getNewReturnIdHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const id = await getNewReturnId();

  return reply.code(200).send({ id });
};

export const ReturndropdownSchemaHandler = async (
  request: FastifyRequest<{
    Body: ReturndropdownSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  const dropdowntran = await Returndropdown(body);
  return dropdowntran;
};
export const findReturnContractWithMoreQtyHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  const returnDtls = await findReturnContractWithMoreQty(params['id']);

  return returnDtls;
};

export const findReturnContractWithPaginationHandler = async (
  request: FastifyRequest<{
    Body: ReturnContractPaginationSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  const returns = await findReturnContractWithPagination(body);
  return returns;
};

export const deleteReturnContractByIdHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  const returnDtls = await deleteReturnContractById(params['id']);

  return returnDtls;
};

export const returnContractUpdateByIdHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
    Body: createReturnSchema;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  const body = request.body;
  let returns;
  let token: string | undefined;

  returns = await returnContractUpdateById(params['id'], body);

  token = request.headers.authorization;
  const publicIP = request.headers['public_ip'];

  type publicIP = string | undefined;
  const ipAddress: any = publicIP;
  if (!token) {
    console.error('Authorization header is missing');
    return reply.code(400).send({ error: 'Authorization header is missing' });
  }
  const decoded = request.jwt.decode(token.split(' ')[1]) as DecodedPayload;
  const { email, name, _id } = decoded._doc;
  if (!returns) {
    console.error('Failed to create return!');
    //////////// user log //////////
    await userLog(request, false, email, _id, name, ipAddress, body);
    //////////// user log //////////
    return reply.code(500).send({ error: 'Error creating return contract' });
  } else {
    console.error('create return success!');
    //////////// user log //////////
    await userLog(request, true, email, _id, name, ipAddress, body);
    //////////// user log //////////
    return reply
      .code(201)
      .send({ message: 'return contract created successfully!' });
  }
};
export const findReturndetailsHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;

  const returnDtls = await findReturnDtls(params['id']);

  return returnDtls;
};
export const findReturnDtlsByDateHandler = async (
  request: FastifyRequest<{
    Body: ReturnReportSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;

  const returnsDtls = await findReturnDtlsByDate(body);

  return returnsDtls;
};
export const findReturnDtlsByDatePrintHandler = async (
  request: FastifyRequest<{
    Body: ReturnReportPrintSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;

  const returnsDtls = await findReturnDtlsByDatePrint(body);

  return returnsDtls;
};
