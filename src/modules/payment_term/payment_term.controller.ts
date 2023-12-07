import { FastifyReply, FastifyRequest } from 'fastify';
import { CreatePaymentTermSchema } from './payment_term.schema';
import {
  createPaymentTerm,
  deletePaymentTermById,
  deletePaymentTerms,
  findPaymentTerms,
  getNewPaymentTermId,
  updatePaymentTermById,
} from './payment_term.service';

// @desc    Create new paymentTerm
// @route   POST /paymentTerm/
// @access  Private
export const createPaymentTermHandler = async (
  request: FastifyRequest<{
    Body: CreatePaymentTermSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;

  try {
    const paymentTerm = await createPaymentTerm(body);

    return reply.code(201).send(paymentTerm);
  } catch (e) {
    return reply.code(400).send(e);
  }
};

// @desc    Get new paymentTerm id
// @route   GET /paymentTerm/id
// @access  Private
export const getNewPaymentTermIdHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const id = await getNewPaymentTermId();

  return reply.code(200).send({ id });
};

// @desc    Get all paymentTerms
// @route   GET /paymentTerm/
// @access  Private
export const getPaymentTermsHandler = async () => {
  const paymentTerms = await findPaymentTerms();

  return paymentTerms;
};

// @desc    Delete all paymentTerms
// @route   DELETE /paymentTerm/
// @access  Private
export const deletePaymentTermsHandler = async () => {
  const paymentTerms = await deletePaymentTerms();

  return paymentTerms;
};

// @desc    Delete payment term by id
// @route   DELETE /payment_term/:id
// @access  Private
export const deletePaymentTermByIdHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  const paymentTerms = await deletePaymentTermById(params['id']);

  return paymentTerms;
};

// @desc    Update Payment Term by id
// @route   PUT /payment_term/:id
// @access  Private
export const updatePaymentTermByIdHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
    Body: CreatePaymentTermSchema;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  const body = request.body;

  const paymentTerms = await updatePaymentTermById(params['id'], body.name);

  return paymentTerms;
};
