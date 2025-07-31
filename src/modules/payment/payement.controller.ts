import { FastifyReply, FastifyRequest } from 'fastify';
import { request } from 'http';
import { deletePaymentTermByIdHandler } from '../payment_term/payment_term.controller';
import { CreatePaymentSchema, ExtraPaymentDropDownSchema, PaymentReportSchema } from './payement.schema';
import { Payment } from './payment.model';
import {
  createPayment,
  findPayementbyId,
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
import { userLog } from '../../user_histroy/userhistroy.service';
import { ObjectId } from 'mongoose';
import { boolean } from 'zod';
interface DecodedPayload {
  _doc: {
    email: string;
    name: string;
    _id: ObjectId;


  };
}
export const createPaymentHandler = async (
  request: FastifyRequest<{
    Body: CreatePaymentSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  let token: string | undefined;
  let payement;
  try {
     payement = await createPayment(body);
 

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

    if (!payement) {
      console.error('Failed to create payement!');

      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress,body);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to create payement!' });
    } else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress,body);
      //////////// user log //////////
      return reply.code(201).send(payement);
    }
  } catch (error) {
    console.error('An error occurred:', error)
    return reply.code(400).send({ error: 'An error occurred' });

  }
};

export const findPaymentbyIdHandler = async(   request: FastifyRequest<{
  Params: IParsms;
}>,
reply: FastifyReply
)=>{
  try{
  const params = request.params;
  const paymentfindOne = await findPayementbyId(params['id'])
  return paymentfindOne
  }
  catch(error){
    return reply.code(400).send({ error: 'No Record Found!' });
  }
}

export const updatePaymentByIdHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
    Body: CreatePaymentSchema;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  const body = request.body;
  let token: string | undefined;
  let payement;
  try {
   payement = await updatePaymentById(params['id'], body);
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

  if (!payement) {
    console.error('Failed to update payement!');
    //////////// user log //////////
    await userLog(request, false, email, _id, name, ipAddress,body);
    //////////// user log //////////
    return reply.code(400).send({ error: 'Failed to update payement!' });
  } else {
    //////////// user log //////////
    await userLog(request, true, email, _id, name, ipAddress,body);
    //////////// user log //////////
    return reply.code(201).send(payement);
  }
} catch (error) {
  console.error('An error occurred:', error)
  return reply.code(400).send({ error: 'An error occurred' });

}

 
};

export const deletePaymentByIdHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  let token: string | undefined;
  let payement;
  try {
   payement = await deletePaymentById(params['id']);

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

  if (!payement) {
    console.error('Failed to delete payement!');
    //////////// user log //////////
    await userLog(request, false, email, _id, name, ipAddress,params);
    //////////// user log //////////
    return reply.code(400).send({ error: 'Failed to delete payement!' });
  } else {
    //////////// user log //////////
    await userLog(request, true, email, _id, name, ipAddress,params);
    //////////// user log //////////
    return reply.code(201).send(payement);
  }
} catch (error) {
  console.error('An error occurred:', error)
  return reply.code(400).send({ error: 'An error occurred' });

}

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
export const findextraPayementHandler = async (
  request: FastifyRequest<{
    Body: ExtraPaymentDropDownSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  const payement = await findextraPayement(body);

  return payement;
};
