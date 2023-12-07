import { FastifyReply, FastifyRequest } from 'fastify';
import { CreateProductSchema, Productdrop_downSchema } from './product.schema';
import {
  createProduct,
  deleteProductById,
  deleteProducts,
  findProducts,
  getNewProductId,
  updateProductById,
  Productdrop_down
} from './product.service';

// @desc    Create new product
// @route   POST /product/
// @access  Private
export const createProductHandler = async (
  request: FastifyRequest<{
    Body: CreateProductSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;

  try {
    const product = await createProduct(body);

    return reply.code(201).send(product);
  } catch (e) {
    return reply.code(400).send(e);
  }
};

// @desc    Get new product id
// @route   GET /product/id
// @access  Private
export const getNewProductIdHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const id = await getNewProductId();

  return reply.code(200).send({ id });
};

// @desc    Get all products
// @route   GET /product/
// @access  Private
export const getProductsHandler = async () => {
  const products = await findProducts();

  return products;
};

// @desc    Delete all products
// @route   DELETE /product/all
// @access  Private
export const deleteProductsHandler = async () => {
  const products = await deleteProducts();

  return products;
};

// @desc    Delete product by id
// @route   DELETE /product/:id
// @access  Private
export const deleteProductByIdHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  const products = await deleteProductById(params['id']);

  return products;
};

// @desc    Update product by id
// @route   PUT /product/:id
// @access  Private
export const updateProductByIdHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
    Body: CreateProductSchema;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  const body = request.body;

  const products = await updateProductById(params['id'], body);

  return products;
};
export const Product_drop_downHandler = async (
  request: FastifyRequest<{
    Body: Productdrop_downSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  const isDeleted = await Productdrop_down(body);
  return isDeleted;
};