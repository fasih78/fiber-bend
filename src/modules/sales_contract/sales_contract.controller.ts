import { FastifyReply, FastifyRequest } from 'fastify';
import {
  CreateSalesContractSchema,
  SaleContractReportProductSchema,
  SaleContractReportSchema,
  SaleContractReportPrintSchema,
  tempSchema,
  Salecontractdrop_downSchema,
} from './sales_contract.schema';
import {
  createSalesContract,
  deleteSalesContractById,
  deleteSalesContracts,
  findSalesContracts,
  findSalesContractsDtls,
  findSalesContractsWithInvoice,
  findSalesContractsWithMoreQty,
  getNewSalesContractId,
  updateSalesContractById,
  findSalesContractDtlsByDate,
  findNotInvoicedSalesContracts,
  findIsDeletedSalesContractByDate,
  findNotShipmentSalesContract,
  findSaleContractAdmdenim,
  updateinvoice_Noadmdenim,
  findSalesContractswithPagination,
  findSalesContractDtlsByDatePrint,
  Salecontract_drop_down
  //findSalesContractDtlsByProductDate,
} from './sales_contract.service';

// @desc    Create new salesContract
// @route   POST /sales-contract/
// @access  Private
export const createSalesContractHandler = async (
  request: FastifyRequest<{
    Body: CreateSalesContractSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;

  try {
    const salesContract = await createSalesContract(body);

    return reply.code(201).send(salesContract);
  } catch (e) {
    return reply.code(400).send(e);
  }
};

export const tempContractHandler = async (
  request: FastifyRequest<{
    Body: tempSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;

  try {
    const salesContract = await updateinvoice_Noadmdenim(body);

    return reply.code(201).send(salesContract);
  } catch (e) {
    return reply.code(400).send(e);
  }
};


// @desc    Get new salesContract id
// @route   GET /sales-contract/id
// @access  Private
export const getNewSalesContractIdHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const id = await getNewSalesContractId();

  return reply.code(200).send({ id });
};

// @desc    Get all sales contracts
// @route   GET /sales-contract/
// @access  Private
export const getSalesContractsHandler = async (
  request: FastifyRequest<{
    // Body: SaleContractReportProductSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  const salesContracts = await findSalesContracts();

  return salesContracts;
};


export const getSalesContractsWithPaginatonHandler = async (
  request: FastifyRequest<{
    Body: SaleContractReportProductSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  const salesContracts = await findSalesContractswithPagination(body);

  return salesContracts;
};
// @desc    Get all sales contracts which not invoiced
// @route   GET /sales-contract/not-invoiced
// @access  Private
export const getSalesContractsNotInvoicedHandler = async () => {
  const salesContracts = await findNotInvoicedSalesContracts();

  return salesContracts;
};

// @desc    Get all sales contracts with more than 0 qty
// @route   GET /sales-contract/qty
// @access  Private
export const getSalesContractsWithMoreQtyHandler = async () => {
  const salesContracts = await findSalesContractsWithMoreQty();

  return salesContracts;
};

// @desc    Delete all sales contracts
// @route   DELETE /sales-contract/all
// @access  Private
export const deleteSalesContractsHandler = async () => {
  const salesContracts = await deleteSalesContracts();

  return salesContracts;
};

// @desc    Get sales contract details by id
// @route   GET /sales-contract/details/:id
// @access  Private
export const findSalesContractsDtlsHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  const salesContractsDtls = await findSalesContractsDtls(params['id']);
  return salesContractsDtls;
};

// @desc    Get sales contract details by id
// @route   GET /sales-contract/invoive-details/:id
// @access  Private
export const findSalesContractsWithInvoiceHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  const salesContractsDtls = await findSalesContractsWithInvoice(params['id']);
  return salesContractsDtls;
};

// @desc    Delete sales contract by id
// @route   DELETE /sales-contract/:id
// @access  Private
export const deleteSalesContractByIdHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  const salesContracts = await deleteSalesContractById(params['id']);

  return salesContracts;
};

// @desc    Update sales contract by id
// @route   PUT /sales-contract/:id
// @access  Private
export const updateSalesContractByIdHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
    Body: CreateSalesContractSchema;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  const body = request.body;

  const salesContracts = await updateSalesContractById(params['id'], body);

  return salesContracts;
};

export const findSalesContractDtlsByDateHandler = async (
  request: FastifyRequest<{
    Body: SaleContractReportSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  const salesContract = await findSalesContractDtlsByDate(body);
  return salesContract;
};

export const findSalesContractDtlsByDatePrintHandler = async (
  request: FastifyRequest<{
    Body: SaleContractReportPrintSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  const salesContract = await findSalesContractDtlsByDatePrint(body);
  return salesContract;
};


export const findIsDeletedDtlsByDateHandler = async (
  request: FastifyRequest<{
    Body: SaleContractReportSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  const isDeleted = await findIsDeletedSalesContractByDate(body);
  return isDeleted;
};
export const findNotShipmentSalesContractHandler = async () => {
  const salesContracts = await findNotShipmentSalesContract();

  return salesContracts;
};



export const getSalesContractsAdmdenimHandler = async (
  request: FastifyRequest<{
    // Body: SaleContractReportProductSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  const salesContracts = await findSaleContractAdmdenim();

  return salesContracts;
};

// export const findSalesContractDtlsByProductDateHandler = async (
//   request: FastifyRequest<{
//     Body: SaleContractReportProductSchema;
//   }>,
//   reply: FastifyReply
// ) => {
//   const body = request.body;
//   const salesContract = await findSalesContractDtlsByProductDate(body);
//   return salesContract;
// };

export const Salecontract_drop_downHandler = async (
  request: FastifyRequest<{
    Body: Salecontractdrop_downSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  const isDeleted = await Salecontract_drop_down(body);
  return isDeleted;
};