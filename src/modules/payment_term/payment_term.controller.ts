import { FastifyReply, FastifyRequest } from 'fastify';
import { CreatePaymentTermSchema, Payment_Term_drop_down_Schema, Payment_termPaginationSchema } from './payment_term.schema';
import {
  createPaymentTerm,
  deletePaymentTermById,
  deletePaymentTerms,
  findPaymentTerms,
  getNewPaymentTermId,
  updatePaymentTermById,
  Payment_Term__drop_down,
  findPaymentTermsPagination
} from './payment_term.service';
import { ObjectId } from 'mongoose';
import { userLog } from '../../user_histroy/userhistroy.service';
interface DecodedPayload {
  _doc: {
    email: string;
    name: string;
    _id: ObjectId;


  };
}
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
  let token: string | undefined;
  let paymentTerm;
  try {
     paymentTerm = await createPaymentTerm(body);

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

    if (!paymentTerm) {
      console.error('Failed to create payementTerm!');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress,body);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to create payementTerm!' });
    } else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress,body);
      //////////// user log //////////
      return reply.code(201).send(paymentTerm);
    }
  } catch (error) {
    console.error('An error occurred:', error)
    return reply.code(400).send({ error: 'An error occurred' });

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
export const getPaymentTermsHandlerPagination = async (request: FastifyRequest<{
  Body:Payment_termPaginationSchema;
}>,) => {
  const body = request.body
  const paymentTerms = await findPaymentTermsPagination(body);

  return paymentTerms;
};
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
  let token: string | undefined;
  let paymentTerm;
  try {
   paymentTerm = await deletePaymentTermById(params['id']);
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

    if (!paymentTerm) {
      console.error('Failed to delete payementTerm!');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress,params);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to delete payementTerm!' });
    } else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress,params);
      //////////// user log //////////
      return reply.code(201).send(paymentTerm);
    }
  } catch (error) {
    console.error('An error occurred:', error)
    return reply.code(400).send({ error: 'An error occurred' });

  }


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
  let token: string | undefined;
  let paymentTerm;
  try {
 paymentTerm = await updatePaymentTermById(params['id'], body.name);
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

    if (!paymentTerm) {
      console.error('Failed to update payementTerm!');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress,body);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to update payementTerm!' });
    } else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress,body);
      //////////// user log //////////
      return reply.code(201).send(paymentTerm);
    }
  } catch (error) {
    console.error('An error occurred:', error)
    return reply.code(400).send({ error: 'An error occurred' });

  }

};
export const paymentTerm_drop_down_Handler = async(
  request: FastifyRequest<{
 
    Body: Payment_Term_drop_down_Schema;
  }>,
  reply: FastifyReply
)=>{
  const body = request.body;


  const brand = await Payment_Term__drop_down(body)
  return brand
}