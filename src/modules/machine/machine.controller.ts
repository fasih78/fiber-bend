import { FastifyReply, FastifyRequest } from 'fastify';
import { CreateMachineSchema, MachinePaginationSchema } from './machine.schema';
import {
  createMachine,
  deleteMachineById,
  deleteMachines,
  findMachines,
  findMachinesPagination,
  getNewMachineId,
  updateMachineById,
} from './machine.service';
import { userLog } from '../../user_histroy/userhistroy.service';
import { ObjectId } from 'mongoose';

// @desc    Create new machine
// @route   POST /machine/
// @access  Private
interface DecodedPayload {
  _doc: {
    email: string;
    name: string;
    _id: ObjectId;


  };
}
export const createMachineHandler = async (
  request: FastifyRequest<{
    Body: CreateMachineSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  let token: string | undefined;
  let machine;
  try {
    machine = await createMachine(body);
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

    if (!machine) {
      console.error('Failed to create machine!');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress,body);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to create machine!' });
    } 
    
    else if (machine === 'Machine already exists with this name in a case-sensitive manner.') {
      return reply.code(400).send({ message: 'Machine already exists ' });
    }
    
    else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress,body);
      //////////// user log //////////
      return reply.code(201).send(machine);
    }
  } catch (error) {
    console.error('An error occurred:', error)
    return reply.code(400).send({ error: 'An error occurred' });

  }



};

// @desc    Get new machine id
// @route   GET /machine/id
// @access  Private
export const getNewMachineIdHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const id = await getNewMachineId();

  return reply.code(200).send({ id });
};

// @desc    Get all machines
// @route   GET /machine/
// @access  Private
export const getMachinesHandlerPagination = async (request: FastifyRequest<{
  Body: MachinePaginationSchema;
}>,) => {
  const body = request.body
  const machines = await findMachinesPagination(body);

  return machines;
};
export const getMachinesHandler = async () => {
  const machines = await findMachines();

  return machines;
};

// @desc    Delete all machines
// @route   DELETE /machine/all
// @access  Private
export const deleteMachinesHandler = async () => {
  const machines = await deleteMachines();

  return machines;
};

// @desc    Delete machine by id
// @route   DELETE /machine/:id
// @access  Private
export const deleteMachineByIdHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  let token: string | undefined;
  let machine;
  try {
    machine = await deleteMachineById(params['id']);
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

    if (!machine) {
      console.error('Failed to delete machine!');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress,params);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to delete  machine!' });
    } else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress,params);
      //////////// user log //////////
      return reply.code(201).send(machine);
    }
  } catch (error) {
    console.error('An error occurred:', error)
    return reply.code(400).send({ error: 'An error occurred' });

  }


};

// @desc    Update machine by id
// @route   PUT /machine/:id
// @access  Private
export const updateMachineByIdHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
    Body: CreateMachineSchema;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  const body = request.body;
  let token: string | undefined;
  let machine;
  try {
    machine = await updateMachineById(params['id'], body.name);
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

    if (!machine) {
      console.error('Failed to update machine!');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress,body);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to update  machine!' });
    } else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress, body);
      //////////// user log //////////
      return reply.code(201).send(machine);
    }
  } catch (error) {
    console.error('An error occurred:', error)
    return reply.code(400).send({ error: 'An error occurred' });

  }



}
