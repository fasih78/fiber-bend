import { FastifyReply, FastifyRequest } from 'fastify';
import { CreateShipViaSchema } from './shipvia.schema';
import {
  createShipVia,
  deleteShipVia,
  updateShipViaById,
  findShipVia,
  deleteShipViaById,
} from './shipvia.service';
import { ObjectId } from 'mongoose';
import { userLog } from '../../user_histroy/userhistroy.service';
interface DecodedPayload {
  _doc: {
    email: string;
    name: string;
    _id: ObjectId;


  };
}

export const createShipViaHandler = async (
  request: FastifyRequest<{
    Body: CreateShipViaSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;

  let token: string | undefined;
  let shipvia
  try {
    shipvia = await createShipVia(body);


    token = request.headers.authorization;
    const publicIP = request.headers['public_ip']

    type publicIP = string | undefined;
    const ipAddress: IpAddress = publicIP;

    if (!token) {
      console.error('Authorization header is missing');
      return reply.code(400).send({ error: 'Authorization header is missing' });
    }

    const decoded = request.jwt.decode(token.split(" ")[1]) as DecodedPayload;
    const { email, name, _id } = decoded._doc;

    if (!shipvia) {
      console.error('Failed to create shipvia!');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress, body);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to create shipvia!' });
    } else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress, body);
      //////////// user log //////////
      return reply.code(201).send(shipvia);
    }
  } catch (error) {
    console.error('An error occurred:', error)
    return reply.code(400).send({ error: 'An error occurred' });

  }
};
export const getShipViaHandler = async () => {
  const findshipvia = await findShipVia();

  return findshipvia;
};
export const deleteShipViaHandler = async () => {
  const deleteshipvia = await deleteShipVia();

  return deleteshipvia;
};

export const deleteShipViaByIdHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  let token: string | undefined;
  let shipvia
  try {
    shipvia = await deleteShipViaById(params['id']);
    token = request.headers.authorization;
    const publicIP = request.headers['public_ip']

    type publicIP = string | undefined;
    const ipAddress: IpAddress = publicIP;

    if (!token) {
      console.error('Authorization header is missing');
      return reply.code(400).send({ error: 'Authorization header is missing' });
    }

    const decoded = request.jwt.decode(token.split(" ")[1]) as DecodedPayload;
    const { email, name, _id } = decoded._doc;

    if (!shipvia) {
      console.error('Failed to delete shipvia!');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress, params);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to delete shipvia!' });
    } else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress, params);
      //////////// user log //////////
      return reply.code(201).send(shipvia);
    }
  } catch (error) {
    console.error('An error occurred:', error)
    return reply.code(400).send({ error: 'An error occurred' });

  }
};
export const updateShipViaByIdHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
    Body: CreateShipViaSchema;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  const body = request.body;
  let token: string | undefined;
  let shipvia
  try {
    shipvia = await updateShipViaById(params['id'], body);
    token = request.headers.authorization;
    const publicIP = request.headers['public_ip']

    type publicIP = string | undefined;
    const ipAddress: IpAddress = publicIP;

    if (!token) {
      console.error('Authorization header is missing');
      return reply.code(400).send({ error: 'Authorization header is missing' });
    }

    const decoded = request.jwt.decode(token.split(" ")[1]) as DecodedPayload;
    const { email, name, _id } = decoded._doc;

    if (!shipvia) {
      console.error('Failed to update shipvia!');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress, params);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to update shipvia!' });
    } else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress, params);
      //////////// user log //////////
      return reply.code(201).send(shipvia);
    }
  } catch (error) {
    console.error('An error occurred:', error)
    return reply.code(400).send({ error: 'An error occurred' });

  }
};
