import { FastifyReply, FastifyRequest } from 'fastify';
import { CreateStateSchema, StatePaginationSchema } from './state.schema';
import {
  createState,
  deleteStateById,
  deleteStates,
  findStates,
  findStatesPagination,
  getNewStateId,
  updateStateById,
} from './state.service';
import { ObjectId } from 'mongoose';
import { userLog } from '../../user_histroy/userhistroy.service';
import { boolean } from 'zod';
import { State } from './state.model';
interface DecodedPayload {
  _doc: {
    email: string;
    name: string;
    _id: ObjectId;


  };
}
// @desc    Create new state
// @route   POST /state/
// @access  Private
export const createStateHandler = async (
  request: FastifyRequest<{
    Body: CreateStateSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  let token: string | undefined;
  let state
  try {
     state = await createState(body);

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

    if (!state) {
      console.error('Failed to create state!');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress,body);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to create state!' });
    }
    else if (state === 'State already exists with this name in a case-sensitive manner.') {
      return reply.code(400).send({ message: 'State already exists ' });
    }
    
    else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress,body);
      //////////// user log //////////
      return reply.code(201).send(state);
    }
  } catch (error) {
    console.error('An error occurred:', error)
    return reply.code(400).send({ error: 'An error occurred' });

  }
};

// @desc    Get new state id
// @route   GET /state/id
// @access  Private
export const getNewStateIdHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const id = await getNewStateId();

  return reply.code(200).send({ id });
};

// @desc    Get all states
// @route   GET /state/
// @access  Private
export const getStatesHandlerPagination = async (request: FastifyRequest<{
  Body:StatePaginationSchema;
}>) => {
  const body = request.body
  const states = await findStatesPagination(body);

  return states;
};
export const getStatesHandler = async () => {
  const states = await findStates();

  return states;
};
// @desc    Delete all states
// @route   DELETE /state/
// @access  Private
export const deleteStatesHandler = async () => {
  const states = await deleteStates();

  return states;
};

// @desc    Delete state by id
// @route   DELETE /state/:id
// @access  Private
export const deleteStateByIdHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  let token: string | undefined;
  let state
  try {
   state = await deleteStateById(params['id']);
  
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

  if (!state) {
    console.error('Failed to delete state!');
    //////////// user log //////////
    await userLog(request, false, email, _id, name, ipAddress,params);
    //////////// user log //////////
    return reply.code(400).send({ error: 'Failed to delete state!' });
  } else {
    //////////// user log //////////
    await userLog(request, true, email, _id, name, ipAddress,params);
    //////////// user log //////////
    return reply.code(201).send(state);
  }
} catch (error) {
  console.error('An error occurred:', error)
  return reply.code(400).send({ error: 'An error occurred' });

}


};

// @desc    Update state by id
// @route   PUT /state/:id
// @access  Private
export const updateStateByIdHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
    Body: CreateStateSchema;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  const body = request.body;
  let token: string | undefined;
  let state
  try {

   state = await updateStateById(params['id'], body.name);
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

  if (!state) {
    console.error('Failed to update state!');
    //////////// user log //////////
    await userLog(request, false, email, _id, name, ipAddress,body);
    //////////// user log //////////
    return reply.code(400).send({ error: 'Failed to update state!' });
  } else {
    //////////// user log //////////
    await userLog(request, true, email, _id, name, ipAddress,body);
    //////////// user log //////////
    return reply.code(201).send(state);
  }
} catch (error) {
  console.error('An error occurred:', error)
  return reply.code(400).send({ error: 'An error occurred' });

}

};
