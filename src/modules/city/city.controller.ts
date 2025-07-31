import { FastifyReply, FastifyRequest } from 'fastify';
import { CityPaginationSchema, CreateCitySchema } from './city.schema';
import {
  createCity,
  deleteCities,
  deleteCityById,
  findCities,
  findCitiesPagination,
  getNewCityId,
  updateCityById,
} from './city.service';
import { userLog } from '../../user_histroy/userhistroy.service';
import { ObjectId } from 'mongoose';
interface DecodedPayload {
  _doc: {
    email: string;
    name: string;
    _id: ObjectId;


  };
}
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
  let token: string | undefined;
  let city;
  try {
    city = await createCity(body);

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
    if (!city) {
      console.error('Failed to create city!');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress, body);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to create city!' });
    }
    else if (city === 'City already exists with this name in a case-sensitive manner.') {
      return reply.code(400).send({ message: 'City already exists ' });
    }

    else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress, body);
      //////////// user log //////////
      return reply.code(201).send(city);
    }
  } catch (error) {
    console.error('An error occurred:', error)
    return reply.code(400).send({ error: 'An error occurred' });

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
export const getCitiesHandlerPagination = async (request: FastifyRequest<{
  Body: CityPaginationSchema;
}>,) => {
  const body = request.body
  const city = await findCitiesPagination(body);
  return city;
};
export const getCitiesHandler = async () => {
  const city = await findCities();
  return city;
};

// @desc    Delete all citys
// @route   DELETE /city/
// @access  Private
export const deleteCitiesHandler = async () => {
  const city = await deleteCities();

  return city;
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
  let token: string | undefined;
  let city;
  try {
    city = await deleteCityById(params['id']);
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

    if (!city) {
      console.error('Failed to update city!');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress, params);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to update city!' });
    } else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress, params);
      //////////// user log //////////
      return reply.code(201).send(city);
    }
  } catch (error) {
    console.error('An error occurred:', error)
    return reply.code(400).send({ error: 'An error occurred' });

  }


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
  let token: string | undefined;
  let city;
  try {
    city = await updateCityById(params['id'], body.name);
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

    if (!city) {
      console.error('Failed to update city!');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress, body);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to update city!' });
    } else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress, body);
      //////////// user log //////////
      return reply.code(201).send(city);
    }
  } catch (error) {
    console.error('An error occurred:', error)
    return reply.code(400).send({ error: 'An error occurred' });

  }


};
