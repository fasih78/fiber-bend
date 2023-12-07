import { FastifyReply, FastifyRequest } from 'fastify';
import { CreateCitySchema } from './city.schema';
import {
  createCity,
  deleteCities,
  deleteCityById,
  findCities,
  getNewCityId,
  updateCityById,
} from './city.service';

// @desc    Create new city
// @route   POST /city/
// @access  Private
export const createCityHandler = async (
  request: FastifyRequest<{
    Body: CreateCitySchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;

  try {
    const city = await createCity(body);

    return reply.code(201).send(city);
  } catch (e) {
    return reply.code(400).send(e);
  }
};

// @desc    Get new city id
// @route   GET /city/id
// @access  Private
export const getNewCityIdHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const id = await getNewCityId();

  return reply.code(200).send({ id });
};

// @desc    Get all citys
// @route   GET /city/
// @access  Private
export const getCitiesHandler = async () => {
  const city = await findCities();
  return city;
};

// @desc    Delete all citys
// @route   DELETE /city/
// @access  Private
export const deleteCitiesHandler = async () => {
  const citys = await deleteCities();

  return citys;
};

// @desc    Delete city by id
// @route   DELETE /city/:id
// @access  Private
export const deleteCityByIdHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  const cities = await deleteCityById(params['id']);

  return cities;
};

// @desc    Update city by id
// @route   PUT /city/:id
// @access  Private
export const updateCityByIdHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
    Body: CreateCitySchema;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  const body = request.body;

  const cities = await updateCityById(params['id'], body.name);

  return cities;
};
