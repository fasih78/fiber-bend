import { FastifyReply, FastifyRequest } from 'fastify';
import { CreateCountrySchema } from './country.schema';
import {
  createCountry,
  deleteCountries,
  deleteCountryById,
  findCountries,
  getNewCountryId,
  updateCountryById,
} from './country.service';

// @desc    Create new country
// @route   POST /country/
// @access  Private
export const createCountryHandler = async (
  request: FastifyRequest<{
    Body: CreateCountrySchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;

  try {
    const country = await createCountry(body);

    return reply.code(201).send(country);
  } catch (e) {
    return reply.code(400).send(e);
  }
};

// @desc    Get new country id
// @route   GET /country/id
// @access  Private
export const getNewCountryIdHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const id = await getNewCountryId();

  return reply.code(200).send({ id });
};

// @desc    Get all countrys
// @route   GET /country/
// @access  Private
export const getCountriesHandler = async () => {
  const countrys = await findCountries();

  return countrys;
};

// @desc    Delete all countrys
// @route   DELETE /country/
// @access  Private
export const deleteCountriesHandler = async () => {
  const countrys = await deleteCountries();

  return countrys;
};

// @desc    Delete country by id
// @route   DELETE /country/:id
// @access  Private
export const deleteCountryByIdHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  const countries = await deleteCountryById(params['id']);

  return countries;
};

// @desc    Update country by id
// @route   PUT /country/:id
// @access  Private
export const updateCountryByIdHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
    Body: CreateCountrySchema;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  const body = request.body;

  const countries = await updateCountryById(params['id'], body.name);

  return countries;
};
