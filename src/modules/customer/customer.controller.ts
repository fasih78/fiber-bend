import { FastifyReply, FastifyRequest } from 'fastify';
import { CreateCustomerSchema, CustomerPaginationSchema, Customerdrop_downSchema } from './customer.schema';
import {
  createCustomer,
  deleteCustomerById,
  deleteCustomers,
  findCustomer,
  findCustomers,
  getNewCustomerId,
  updateCustomerById,
  Customer_drop_down
} from './customer.service';
import { userLog } from '../../user_histroy/userhistroy.service';
import { ObjectId } from 'mongoose';
interface DecodedPayload {
  _doc: {
    email: string;
    name: string;
    _id: ObjectId;


  };
}
// @desc    Create new customer
// @route   POST /customer/
// @access  Private
export const createCustomerHandler = async (
  request: FastifyRequest<{
    Body: CreateCustomerSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  let token: string | undefined;
  let customer;
  try {
    customer = await createCustomer(body);
 

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

    if (!customer) {
      console.error('Failed to create customer!');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress,body);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to create customer!' });
    } 
    else if (customer === 'Customer already exists with this name in a case-sensitive manner.') {
      return reply.code(400).send({ message: 'Customer already exists ' });
    }
    else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress,body);
      //////////// user log //////////
      return reply.code(201).send(customer);
    }
  } catch (error) {
    console.error('An error occurred:', error)
    return reply.code(400).send({ error: 'An error occurred' });

  }
};

// @desc    Get new customer id
// @route   GET /customer/id
// @access  Private
export const getNewCustomerIdHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const id = await getNewCustomerId();

  return reply.code(200).send({ id });
};

// @desc    Get all customers
// @route   GET /customer/
// @access  Private
export const getCustomersHandler = async () => {
  const customers = await findCustomer();

  return customers;
};
export const getCustomersHandlerPagination = async (
  request: FastifyRequest<{
    Body: CustomerPaginationSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;


  const customer = await findCustomers(body);
  return customer

  //    return reply.code(201).send(customer);
  //  } catch (e) {
  // return reply.code(400).send(e);
  //  }
};

// @desc    Delete all customers
// @route   DELETE /customer/
// @access  Private
export const deleteCustomersHandler = async () => {
  const customers = await deleteCustomers();

  return customers;
};

// @desc    Delete customer by id
// @route   DELETE /customer/:id
// @access  Private
export const deleteCustomerByIdHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  let token: string | undefined;
  let customer;
  try {
    customer = await deleteCustomerById(params['id']);
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

    if (!customer) {
      console.error('Failed to delete customer!');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress,params);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to delete customer!' });
    } else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress,params);
      //////////// user log //////////
      return reply.code(201).send(customer);
    }
  } catch (error) {
    console.error('An error occurred:', error)
    return reply.code(400).send({ error: 'An error occurred' });

  }


};

// @desc    Update customer by id
// @route   PUT /customer/:id
// @access  Private
export const updateCustomerByIdHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
    Body: CreateCustomerSchema;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  const body = request.body;
  let token: string | undefined;
  let customer;
  try {
    customer = await updateCustomerById(params['id'], body);
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

    if (!customer) {
      console.error('Failed to update customer!');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress,body);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to update customer!' });
    } else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress,body);
      //////////// user log //////////
      return reply.code(201).send(customer);
    }
  } catch (error) {
    console.error('An error occurred:', error)
    return reply.code(400).send({ error: 'An error occurred' });

  }



};
export const Customer_drop_downHandler = async (
  request: FastifyRequest<{
    Body: Customerdrop_downSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  const isDeleted = await Customer_drop_down(body);
  return isDeleted;
};