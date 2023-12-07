import { FastifyReply, FastifyRequest } from 'fastify';
import { CreateShipViaSchema } from './shipvia.schema';
import {
  createShipVia,
  deleteShipVia,
  updateShipViaById,
  findShipVia,
  deleteShipViaById,
} from './shipvia.service';

export const createShipViaHandler = async (
  request: FastifyRequest<{
    Body: CreateShipViaSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;

  try {
    const shipvia = await createShipVia(body);

    return reply.code(201).send(shipvia);
  } catch (e) {
    return reply.code(400).send(e);
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
  const paymentTerms = await deleteShipViaById(params['id']);

  return paymentTerms;
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

  const updateshipvia = await updateShipViaById(params['id'], body);

  return updateshipvia;
};
