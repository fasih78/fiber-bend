import { FastifyReply, FastifyRequest } from 'fastify';
import {
  CreateProductionSchema,
  ProductionReportSchema,
  LotNumSchema,
  ProductionPaginationSchema,
  ProductionReportPrintSchema,
  ProductionLotQtyAdjustSchema,
} from './production.schema';
import {
  createProduction,
  deleteProductionById,
  deleteProductions,
  findProductions,
  findProductionsDtls,
  findProductionsDtlsByDate,
  getNewProductionId,
  updateProductionById,
  getLotNum,
  findProductionsIsDeletedDtlsByDate,
  findProductionsDtlsPrintByDate,
  productionLotQtyAdjust
} from './production.service';
import { ObjectId } from 'mongoose';
import { userLog } from '../../user_histroy/userhistroy.service';
interface DecodedPayload {
  _doc: {
    email: string;
    name: string;
    _id: ObjectId;
  };
}
// @desc    Create new production
// @route   POST /production/
// @access  Private
export const createProductionHandler = async (
  request: FastifyRequest<{
    Body: CreateProductionSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  let token: string | undefined;
  let production;
  try {
    production = await createProduction(body);
    token = request.headers.authorization;
    const publicIP = request.headers['public_ip'];

    type publicIP = string | undefined;
    const ipAddress: any = publicIP;

    if (!token) {
      console.error('Authorization header is missing');
      return reply.code(400).send({ error: 'Authorization header is missing' });
    }

    const decoded = request.jwt.decode(token.split(' ')[1]) as DecodedPayload;
    const { email, name, _id } = decoded._doc;

    if (!production) {
      console.error('Failed to create production!');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress, body);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to create production!' });
    } else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress, body);
      //////////// user log //////////
      return reply.code(201).send(production);
    }
  } catch (error) {
    console.error('An error occurred:', error);
    return reply.code(400).send({ error: 'An error occurred' });
  }
};

// @desc    Get new production id
// @route   GET /production/id
// @access  Private
export const getNewProductionIdHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const id = await getNewProductionId();

  return reply.code(200).send({ id });
};

// @desc    Get all productions
// @route   GET /production/
// @access  Private
// export const getProductionsHandler = async () => {
//   const productions = await findProductions();

//   return productions;
// };
export const ProductionpaginaionHandler = async (
  request: FastifyRequest<{
    Body: ProductionPaginationSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;

  const production = await findProductions(body);
  return production;
};

// @desc    Delete all productions
// @route   DELETE /production/all
// @access  Private
export const deleteProductionsHandler = async () => {
  const productions = await deleteProductions();

  return productions;
};

// @desc    Get production details by id
// @route   GET /sales-contract/details/:id
// @access  Private
export const findProductionsDtlsHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  const productionsDtls = await findProductionsDtls(params['id']);
  return productionsDtls;
};

// @desc    Delete production by id
// @route   DELETE /production/:id
// @access  Private
export const deleteProductionByIdHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  let token: string | undefined;
  let production;
  try {
    production = await deleteProductionById(params['id']);
    token = request.headers.authorization;
    const publicIP = request.headers['public_ip'];

    type publicIP = string | undefined;
    const ipAddress: any = publicIP;

    if (!token) {
      console.error('Authorization header is missing');
      return reply.code(400).send({ error: 'Authorization header is missing' });
    }

    const decoded = request.jwt.decode(token.split(' ')[1]) as DecodedPayload;
    const { email, name, _id } = decoded._doc;

    if (!production) {
      console.error('Failed to delete production!');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress, params);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to delete production!' });
    } else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress, params);
      //////////// user log //////////
      return reply.code(201).send(production);
    }
  } catch (error) {
    console.error('An error occurred:', error);
    return reply.code(400).send({ error: 'An error occurred' });
  }
};

// @desc    Update production by id
// @route   PUT /production/:id
// @access  Private
export const updateProductionByIdHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
    Body: CreateProductionSchema;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  const body = request.body;
  let token: string | undefined;
  let production;
  try {
    production = await updateProductionById(params['id'], body);

    token = request.headers.authorization;
    const publicIP = request.headers['public_ip'];

    type publicIP = string | undefined;
    const ipAddress: any = publicIP;

    if (!token) {
      console.error('Authorization header is missing');
      return reply.code(400).send({ error: 'Authorization header is missing' });
    }

    const decoded = request.jwt.decode(token.split(' ')[1]) as DecodedPayload;
    const { email, name, _id } = decoded._doc;

    if (!production) {
      console.error('Failed to update production!');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress, params);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to update production!' });
    } else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress, params);
      //////////// user log //////////
      return reply.code(201).send(production);
    }
  } catch (error) {
    console.error('An error occurred:', error);
    return reply.code(400).send({ error: 'An error occurred' });
  }
};

// @desc    Production details by date
// @route   POST /production/dtl-by-date
// @access  Private
export const findProductionsDtlsByDateHandler = async (
  request: FastifyRequest<{
    Body: ProductionReportSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;

  const productions = await findProductionsDtlsByDate(body);

  return productions;
};

export const findProductionsDtlsPrintByDateHandler = async (
  request: FastifyRequest<{
    Body: ProductionReportPrintSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;

  const productions = await findProductionsDtlsPrintByDate(body);

  return productions;
};

export const getLotNumHandler = async (
  request: FastifyRequest<{
    Body: LotNumSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;

  const productions = await getLotNum(body.id);

  return productions;
};
export const findProductionsisDeletedDtlsByDateHandler = async (
  request: FastifyRequest<{
    Body: ProductionReportSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;

  const isDeleted = await findProductionsIsDeletedDtlsByDate(body);

  return isDeleted;
};
export const productionLotQtyAdjustHandler = async (
  request: FastifyRequest<{
    Body: ProductionLotQtyAdjustSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;

  const production = await productionLotQtyAdjust(body);

  return production;
};