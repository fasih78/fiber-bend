import { FastifyReply, FastifyRequest } from 'fastify';
import { BrandPaginationSchema, Brand_drop_down_Schema, CreateBrandSchema } from './brand.schema';
import {
  createBrand,
  deleteBrandById,
  deleteBrands,
  findBrands,
  getNewBrandId,
  updateBrandById,
  Brand_drop_down,
  findBrandsPagnation,
} from './brand.service';
import { userLog } from '../../user_histroy/userhistroy.service';
import { ObjectId } from 'mongoose';
import { BrandModel } from './brand.model';
interface DecodedPayload {
  _doc: {
    email: string;
    name: string;
    _id: ObjectId;


  };
}

// @desc    Create new brand
// @route   POST /brand/
// @access  Private
export const createBrandHandler = async (
  request: FastifyRequest<{
    Body: CreateBrandSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;

  let token: string | undefined;
  let brand;
  try {
   
    brand = await createBrand(body);
    console.log(brand, "controller response");

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
    if (brand == 'Brand already exists with this name in a case-sensitive manner.') {
      return reply.code(400).send({ message: 'Brand already exists!' });
    }
     else if (!brand) {
      console.error('Failed to create brand');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress, body);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to create brand' });

    } 
    else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress, body);
      //////////// user log //////////
      return reply.code(201).send(brand);
    }
  } catch (error) {
    console.error('An error occurred:', error)
    if (error.code == 11000) {
      return reply.code(400).send({ error: 'This Product Already Exsist!' });
    }

    return reply.code(400).send({ error: 'An error occurred' });
  }
}



// @desc    Get new brand id
// @route   GET /brand/id
// @access  Private
export const getNewBrandIdHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const id = await getNewBrandId();

  return reply.code(200).send({ id });
};

// @desc    Get all brands
// @route   GET /brand/
// @access  Private
export const getBrandsHandlerPagination = async (request: FastifyRequest<{
  Body: BrandPaginationSchema;
}>,) => {
  const body = request.body
  const brands = await findBrandsPagnation(body);

  return brands;
};
export const getBrandsHandler = async () => {
  const brands = await findBrands();

  return brands;
};

// @desc    Delete all brands
// @route   DELETE /brand/all
// @access  Private
export const deleteBrandsHandler = async () => {
  const brands = await deleteBrands();

  return brands;
};

// @desc    Delete brand by id
// @route   DELETE /brand/:id
// @access  Private
export const deleteBrandByIdHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
  }>,
  reply: FastifyReply
) => {
  let token: string | undefined;
  let brand;
  try {
    const params = request.params;
    brand = await deleteBrandById(params['id']);

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

    if (!brand) {
      console.error('Failed to delete brand');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress, params);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to create brand' });
    } else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress, params);
      //////////// user log //////////
      return reply.code(201).send(brand);
    }
  } catch (error) {
    console.error('An error occurred:', error)
    return reply.code(400).send({ error: 'An error occurred' });

  }
}



// @desc    Update brand by id
// @route   PUT /brand/:id
// @access  Private
export const updateBrandByIdHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
    Body: CreateBrandSchema;
  }>,
  reply: FastifyReply
) => {

  const params = request.params;
  const body = request.body;
  let token: string | undefined;
  let brand;
  try {
    const params = request.params;
    brand = await updateBrandById(params['id'], body.name);
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

    if (!brand) {
      console.error('Failed to delete brand');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress, body);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to create brand' });
    } else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress, body);
      //////////// user log //////////
      return reply.code(201).send(brand);
    }
  } catch (error) {
    console.error('An error occurred:', error)
    return reply.code(400).send({ error: 'An error occurred' });

  }
};

export const Brand_drop_down_Handler = async (
  request: FastifyRequest<{

    Body: Brand_drop_down_Schema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;


  const brand = await Brand_drop_down(body)
  return brand
}
