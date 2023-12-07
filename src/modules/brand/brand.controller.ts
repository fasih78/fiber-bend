import { FastifyReply, FastifyRequest } from 'fastify';
import { CreateBrandSchema } from './brand.schema';
import {
  createBrand,
  deleteBrandById,
  deleteBrands,
  findBrands,
  getNewBrandId,
  updateBrandById,
} from './brand.service';

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

  try {
    const brand = await createBrand(body);

    return reply.code(201).send(brand);
  } catch (e) {
    return reply.code(400).send(e);
  }
};

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
  const params = request.params;
  const brands = await deleteBrandById(params['id']);

  return brands;
};

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

  const brands = await updateBrandById(params['id'], body.name);

  return brands;
};
