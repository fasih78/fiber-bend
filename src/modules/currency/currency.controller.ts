import { FastifyReply, FastifyRequest } from 'fastify';
import { CreateCurrencySchema, CurrencyPaginationSchema } from './currency.schema';
import {
  createCurrency,
  deleteCurrencies,
  deleteCurrencyById,
  findCurrencies,
  findCurrenciesPagination,
  getNewCurrencyId,
  updateCurrencyById,
} from './currency.service';
import { userLog } from '../../user_histroy/userhistroy.service';
import { ObjectId } from 'mongoose';
interface DecodedPayload {
  _doc: {
    email: string;
    name: string;
    _id: ObjectId;


  };
}

// @desc    Create new currency
// @route   POST /currency/
// @access  Private
export const createCurrencyHandler = async (
  request: FastifyRequest<{
    Body: CreateCurrencySchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;

  let token: string | undefined;
  let currency;
  try {
    currency = await  createCurrency(body);
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

    if (!currency) {
      console.error('Failed to create currency!');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress, body);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to create currency!' });
    }
    
    else if (currency === 'Currency already exists with this name in a case-sensitive manner.') {
      return reply.code(400).send({ message: 'Currency already exists ' });
    }
    else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress, body);
      //////////// user log //////////
      return reply.code(201).send(currency);
    }
  } catch (error) {
    console.error('An error occurred:', error)
    return reply.code(400).send({ error: 'An error occurred' });

  }
};

// @desc    Get new currency id
// @route   GET /currency/id
// @access  Private
export const getNewCurrencyIdHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const id = await getNewCurrencyId();

  return reply.code(200).send({ id });
};

// @desc    Get all currencies
// @route   GET /currency/
// @access  Private
export const getCurrenciesHandlerPagination = async (
  request: FastifyRequest<{
    Body: CurrencyPaginationSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body
  const currencies = await findCurrenciesPagination(body);

  return currencies;
};
export const getCurrenciesHandler = async () => {
  const currencies = await findCurrencies();

  return currencies;
}
// @desc    Delete all currencies
// @route   DELETE /currency/
// @access  Private
export const deleteCurrenciesHandler = async () => {
  const currencies = await deleteCurrencies();

  return currencies;
};


// @desc    Delete currency by id
// @route   DELETE /currency/:id
// @access  Private
export const deleteCurrencyByIdHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  let token: string | undefined;
  let currency;
  try {
    currency = await deleteCurrencyById(params['id']);
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

    if (!currency) {
      console.error('Failed to delete currency!');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress, params);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to delete currency!' });
    } else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress, params);
      //////////// user log //////////
      return reply.code(201).send(currency);
    }
  } catch (error) {
    console.error('An error occurred:', error)
    return reply.code(400).send({ error: 'An error occurred' });

  }

};

// @desc    Update currency by id
// @route   PUT /currency/:id
// @access  Private
export const updateCurrencyByIdHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
    Body: CreateCurrencySchema;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  const body = request.body;
  let token: string | undefined;
  let currency;
  try {
    currency = await updateCurrencyById(params['id'], body.name);

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

    if (!currency) {
      console.error('Failed to update currency!');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress, body);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to update currency!' });
    } else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress, body);
      //////////// user log //////////
      return reply.code(201).send(currency);
    }
  } catch (error) {
    console.error('An error occurred:', error)
    return reply.code(400).send({ error: 'An error occurred' });

  }

};
