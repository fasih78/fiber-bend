import { FastifyReply, FastifyRequest } from 'fastify';
import {
  CreateProductionSchema,
  ProductionReportSchema,
  LotNumSchema,
  ProductionPaginationSchema,
  ProductionReportPrintSchema,
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
  findProductionsDtlsPrintByDate
} from './production.service';

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

  try {
    const production = await createProduction(body);

    return reply.code(201).send(production);
  } catch (e) {
    return reply.code(400).send(e);
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
    Body:ProductionPaginationSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;


    const production =await findProductions(body);
return production
  
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
  const productions = await deleteProductionById(params['id']);

  return productions;
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

  const productions = await updateProductionById(params['id'], body);

  return productions;
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
