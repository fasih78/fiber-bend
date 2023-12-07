import { FastifyReply, FastifyRequest } from 'fastify';
import { CreateCurrencySchema } from './currency.schema';
import {
  createCurrency,
  deleteCurrencies,
  deleteCurrencyById,
  findCurrencies,
  getNewCurrencyId,
  updateCurrencyById,
} from './currency.service';

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

  try {
    const currency = await createCurrency(body);

    return reply.code(201).send(currency);
  } catch (e) {
    return reply.code(400).send(e);
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
export const getCurrenciesHandler = async () => {
  const currencies = await findCurrencies();

  return currencies;
};

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
  const currencies = await deleteCurrencyById(params['id']);

  return currencies;
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

  const currencies = await updateCurrencyById(params['id'], body.name);

  return currencies;
};
