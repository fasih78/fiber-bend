import { FastifyReply, FastifyRequest } from 'fastify';
import { CreateStateSchema } from './state.schema';
import {
  createState,
  deleteStateById,
  deleteStates,
  findStates,
  getNewStateId,
  updateStateById,
} from './state.service';

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

  try {
    const state = await createState(body);

    return reply.code(201).send(state);
  } catch (e) {
    return reply.code(400).send(e);
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
  const states = await deleteStateById(params['id']);

  return states;
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

  const states = await updateStateById(params['id'], body.name);

  return states;
};
