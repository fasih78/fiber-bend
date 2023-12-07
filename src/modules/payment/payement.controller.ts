import { FastifyReply, FastifyRequest } from 'fastify';
import { request } from 'http';
import { deletePaymentTermByIdHandler } from '../payment_term/payment_term.controller';
import { CreatePaymentSchema, PaymentReportSchema } from './payement.schema';
import { Payment } from './payment.model';
import {
  createPayment,
  updatePaymentById,
  deletePayment,
  deletePaymentById,
  findPayement,
  getNewPaymentId,
  // royalitynotpayment,
  findPayementDtlsByDate,
  // findnotroyality,
  findextraPayement,
} from './payment.service';
import { CustomerPaginationSchema } from '../customer/customer.schema';

export const createPaymentHandler = async (
  request: FastifyRequest<{
    Body: CreatePaymentSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  try {
    const payement = await createPayment(body);
    return reply.code(201).send(payement);
  } catch (e) {
    return reply.code(400).send(e);
  }
};

export const updatePaymentByIdHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
    Body: CreatePaymentSchema;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  const body = request.body;

  const payement = await updatePaymentById(params['id'], body);

  return payement;
};

export const deletePaymentByIdHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  const payement = await deletePaymentById(params['id']);

  return payement;
};

export const deletePaymentHandler = async () => {
  const payement = await deletePayment();

  return payement;
};
export const PaymentPaginationHandler = async (
  request: FastifyRequest<{
    Body: CustomerPaginationSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
    const payement = await findPayement(body);
    return payement
   
};

export const getNewPaymentIdHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const id = await getNewPaymentId();

  return reply.code(200).send({ id });
};
// export const royalitynotPayementHandler = async () => {
//   const payement = await royalitynotpayment();

//   return payement;
// };
export const findPaymentDtlsByDateHandler = async (
  request: FastifyRequest<{
    Body: PaymentReportSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  const invoicesDtls = await findPayementDtlsByDate(body);
  return invoicesDtls;
};
export const findextraPayementHandler = async () => {
  const payement = await findextraPayement();

  return payement;
};
