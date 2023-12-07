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

  try {
    const customer = await createCustomer(body);

    return reply.code(201).send(customer);
  } catch (e) {
    return reply.code(400).send(e);
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
  const customers = await deleteCustomerById(params['id']);

  return customers;
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

  const customers = await updateCustomerById(params['id'], body);

  return customers;
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