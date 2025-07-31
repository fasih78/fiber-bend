import { FastifyReply, FastifyRequest } from 'fastify';
import { CreateProductSchema, ProductPaginationSchema, ProductPrintSchema, ProductSummaryPrintSchema, ProductSummarySchema, Productdrop_downSchema, StockTransactionReportSchema } from './product.schema';
import {
  createProduct,
  deleteProductById,
  deleteProducts,
  findProducts,
  getNewProductId,
  updateProductById,
  Productdrop_down,
  findProductsPagination,
  stockReport,
  stockReportPrint,
  ProductdtlsbyId,
  productSummarydtlsByDate,
  productSummarydtlsByDatePrint
} from './product.service';
import { ObjectId } from 'mongoose';
import { userLog } from '../../user_histroy/userhistroy.service';
interface DecodedPayload {
  _doc: {
    email: string;
    name: string;
    _id: ObjectId;


  };
}

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
  let token: string | undefined;
  let product;
  try {
    product = await createProduct(body);

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

    if (!product) {
      console.error('Failed to create product!');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress, body);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to create product!' });
    } else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress, body);
      //////////// user log //////////
      return reply.code(201).send(product);
    }
  } catch (error) {

    console.error('An error occurred:', error)
    if(error.code == 11000 ){
      return reply.code(400).send({ message:'This product Already Exsist!'});
    }
    return reply.code(400).send({ error: 'An error occurred ' });

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
export const getProductsHandlerPagination = async (
  request: FastifyRequest<{
    Body: ProductPaginationSchema;
  }>,
  reply: FastifyReply

) => {
  const body = request.body
  const products = await findProductsPagination(body);

  return products;
};
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
  let token: string | undefined;
  let product;
  try {
    product = await deleteProductById(params['id']);
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

    if (!product) {
      console.error('Failed to delete product!');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress, params);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to delete product!' });
    } else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress, params);
      //////////// user log //////////
      return reply.code(201).send(product);
    }
  } catch (error) {
    console.error('An error occurred:', error)
    return reply.code(400).send({ error: 'An error occurred' });

  }

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
  let token: string | undefined;
  let product;
  try {

    product = await updateProductById(params['id'], body);
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

    if (!product) {
      console.error('Failed to delete product!');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress, body);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to delete product!' });
    } else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress, body);
      //////////// user log //////////
      return reply.code(201).send(product);
    }
  } catch (error) {
    console.error('An error occurred:', error)
    return reply.code(400).send({ error: 'An error occurred' });

  }


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
export const stockReportHandler = async (
  request: FastifyRequest<{
    Body: StockTransactionReportSchema
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  const detail = await stockReport(body);
  return detail;
};
export const stockReportPrintHandler = async (
  request: FastifyRequest<{
    Body: ProductPrintSchema
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  const detail = await stockReportPrint(body);
  return detail;
};


export const findProductDtlsHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  const productsDtls = await   ProductdtlsbyId(params['id']);
  return productsDtls;
};


export const productSummarydtlsByDateHandler  = async (
  request: FastifyRequest<{
    Body: ProductSummarySchema
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  const detail = await productSummarydtlsByDate(body);
  return detail;
};
export const productSummarydtlsByDatePrintHandler  = async (
  request: FastifyRequest<{
    Body: ProductSummaryPrintSchema
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  const detail = await productSummarydtlsByDatePrint(body);
  return detail;
};