import { FastifyReply, FastifyRequest } from 'fastify';
import { CreateMachineSchema } from './machine.schema';
import {
  createMachine,
  deleteMachineById,
  deleteMachines,
  findMachines,
  getNewMachineId,
  updateMachineById,
} from './machine.service';

// @desc    Create new machine
// @route   POST /machine/
// @access  Private
export const createMachineHandler = async (
  request: FastifyRequest<{
    Body: CreateMachineSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;

  try {
    const machine = await createMachine(body);

    return reply.code(201).send(machine);
  } catch (e) {
    return reply.code(400).send(e);
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
  const machines = await deleteMachineById(params['id']);

  return machines;
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

  const machines = await updateMachineById(params['id'], body.name);

  return machines;
};
