import { FastifyReply, FastifyRequest } from 'fastify';
import { CountryPaginationSchema, CreateCountrySchema } from './country.schema';
import {
  createCountry,
  deleteCountries,
  deleteCountryById,
  findCountries,
  findCountriesPagination,
  getNewCountryId,
  updateCountryById,
} from './country.service';
import { userLog } from '../../user_histroy/userhistroy.service';
import { ObjectId } from 'mongoose';


interface DecodedPayload {
  _doc: {
    email: string;
    name: string;
    _id: ObjectId;


  };
}
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
  let token: string | undefined;
  let country;
  try {
     country = await createCountry(body);
 
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

    if (!country) {
      console.error('Failed to create country!');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress,body);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to create country!' });
    }
    else if (country === 'Country already exists with this name in a case-sensitive manner.') {
      return reply.code(400).send({ message: 'Country already exists' });
    } 
    else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress,body);
      //////////// user log //////////
      return reply.code(201).send(country);
    }
  } catch (error) {
    console.error('An error occurred:', error)
    return reply.code(400).send({ error: 'An error occurred' });

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
export const getCountriesHandlePagination = async (
  request: FastifyRequest<{
    Body:CountryPaginationSchema;
  }>,
  ) => {
  const body = request.body
  const country = await findCountriesPagination(body);

  return country;
};
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
  let token: string | undefined;
  let country;
  try {
    country = await deleteCountryById(params['id']);
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

  if (!country) {
    console.error('Failed to delete country!');
    //////////// user log //////////
    await userLog(request, false, email, _id, name, ipAddress,params);
    //////////// user log //////////
    return reply.code(400).send({ error: 'Failed to delete country!' });
  } else {
    //////////// user log //////////
    await userLog(request, true, email, _id, name, ipAddress,params);
    //////////// user log //////////
    return reply.code(201).send(country);
  }
} catch (error) {
  console.error('An error occurred:', error)
  return reply.code(400).send({ error: 'An error occurred' });

}

}


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
  let token: string | undefined;
  let country;
  try {
   country = await updateCountryById(params['id'], body.name);
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

  if (!country) {
    console.error('Failed to update country!');
    //////////// user log //////////
    await userLog(request, false, email, _id, name, ipAddress,body);
    //////////// user log //////////
    return reply.code(400).send({ error: 'Failed to update country!' });
  } else {
    //////////// user log //////////
    await userLog(request, true, email, _id, name, ipAddress, body);
    //////////// user log //////////
    return reply.code(201).send(country);
  }
} catch (error) {
  console.error('An error occurred:', error)
  return reply.code(400).send({ error: 'An error occurred' });

}


};
