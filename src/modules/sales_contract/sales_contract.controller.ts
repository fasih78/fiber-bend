import { FastifyReply, FastifyRequest } from 'fastify';
import {
  CreateSalesContractSchema,
  SaleContractReportProductSchema,
  SaleContractReportSchema,
  SaleContractReportPrintSchema,
  tempSchema,
  Salecontractdrop_downSchema,
  DashboardDetailsGroupSchema,
  PendingContractSchema,
  PendingContractBalanceSchema,
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
  updateInvoice_Noadmdenim,
  findSalesContractswithPagination,
  findSalesContractDtlsByDatePrint,
  Salecontract_drop_down,
  findNotShipmentSalesContract_new,
  Dashboard_details_groups,
  pending_contract_dtl,
  pending_contract_dtlPrint,
  pending_invoices_dtl,
  pending_invoices_dtlPrint,
  pendingContractBalanceClose,

  //findSalesContractDtlsByProductDate,
} from './sales_contract.service';
import { ObjectId } from 'mongoose';
import { userLog } from '../../user_histroy/userhistroy.service';

// @desc    Create new salesContract
// @route   POST /sales-contract/
// @access  Private
interface DecodedPayload {
  _doc: {
    email: string;
    name: string;
    _id: ObjectId;
  };
}
export const createSalesContractHandler = async (
  request: FastifyRequest<{
    Body: CreateSalesContractSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;

  let token: string | undefined;
  let salesContract;
  try {
    salesContract = await createSalesContract(body);
    console.log(salesContract, 'response');

    token = request.headers.authorization;
    const publicIP = request.headers['public_ip'];

    type publicIP = string | undefined;
    const ipAddress: IpAddress = publicIP;

    if (!token) {
      console.error('Authorization header is missing');
      return reply.code(400).send({ error: 'Authorization header is missing' });
    }

    const decoded = request.jwt.decode(token.split(' ')[1]) as DecodedPayload;
    const { email, name, _id } = decoded._doc;

    if (!salesContract) {
      console.error('Failed to create salecontract!');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress, body);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to create salecontract!' });
    } else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress, body);
      //////////// user log //////////
      return reply.code(201).send(salesContract);
    }
  } catch (error) {
    console.error('An error occurred:', error);
    if (error.code == 11000) {
      return reply.code(400).send({ error: 'This Contract Already Exsist!' });
    }
    return reply.code(400).send({ error: 'An error occurred' });
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
    const salesContract = await updateInvoice_Noadmdenim(body);
    console.log(salesContract, 'controller');
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
    Body: Salecontractdrop_downSchema;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  const body = request.body;
  let token: string | undefined;
  let salesContract;
  try {
    salesContract = await deleteSalesContractById(params['id'], body);

    token = request.headers.authorization;
    const publicIP = request.headers['public_ip'];

    type publicIP = string | undefined;
    const ipAddress: IpAddress = publicIP;

    if (!token) {
      console.error('Authorization header is missing');
      return reply.code(400).send({ error: 'Authorization header is missing' });
    }

    const decoded = request.jwt.decode(token.split(' ')[1]) as DecodedPayload;
    const { email, name, _id } = decoded._doc;

    if (!salesContract) {
      console.error('Failed to delete salecontract!');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress, params);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to delete salecontract!' });
    } else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress, params);
      //////////// user log //////////

      return { message: salesContract };
    }
  } catch (error) {
    console.error('An error occurred:', error);
    return reply.code(400).send({ error: 'An error occurred' });
  }
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
  let token: string | undefined;
  let salesContract;
  try {
    salesContract = await updateSalesContractById(params['id'], body);
    token = request.headers.authorization;
    const publicIP = request.headers['public_ip'];

    type publicIP = string | undefined;
    const ipAddress: IpAddress = publicIP;

    if (!token) {
      console.error('Authorization header is missing');
      return reply.code(400).send({ error: 'Authorization header is missing' });
    }

    const decoded = request.jwt.decode(token.split(' ')[1]) as DecodedPayload;
    const { email, name, _id } = decoded._doc;

    if (!salesContract) {
      console.error('Failed to update salecontract!');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress, body);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to update salecontract!' });
    } else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress, body);
      //////////// user log //////////
      return reply.code(201).send(salesContract);
    }
  } catch (error) {
    console.error('An error occurred:', error);
    return reply.code(400).send({ error: 'An error occurred' });
  }
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

export const findNotShipmentSalesContractHandler_new = async (
  request: FastifyRequest<{
    Body: Salecontractdrop_downSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  const isDeleted = await findNotShipmentSalesContract_new(body);
  return isDeleted;
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
export const Dashboard_details_groupsHandler = async (
  request: FastifyRequest<{
    Body: DashboardDetailsGroupSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  const isDeleted = await Dashboard_details_groups(body);
  return isDeleted;
};
export const findPendingSalesContractDtlsByDateHandler = async (
  request: FastifyRequest<{
    Body: SaleContractReportSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  const salesContract = await pending_contract_dtl(body);
  return salesContract;
};
export const findPendingSalesContractDtlsByDatePrintHandler = async (
  request: FastifyRequest<{
    Body: SaleContractReportPrintSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  const salesContract = await pending_contract_dtlPrint(body);
  return salesContract;
};
export const findPendingInvoiceDtlsByDateHandler = async (
  request: FastifyRequest<{
    Body: SaleContractReportSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  const salesContract = await pending_invoices_dtl(body);
  return salesContract;
};
export const findPendingInvoiceDtlsByDatePrintHandler = async (
  request: FastifyRequest<{
    Body: SaleContractReportPrintSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  const salesContract = await pending_invoices_dtlPrint(body);
  return salesContract;
};

export const PendingContractBalanceCloseHandler = async (
  request: FastifyRequest<{
    Body: PendingContractBalanceSchema;
  }>,
  reply: FastifyReply
) => {
  const { body } = request;
  const token = request.headers.authorization;
  const publicIP = request.headers['public_ip'] as string | undefined;
  try {
    type publicIP = string | undefined;
    const ipAddress: IpAddress = publicIP;
    if (!token) {
      console.error('Authorization header is missing');
      return reply.code(400).send({ error: 'Authorization header is missing' });
    }

    // Decode JWT token
    const decoded = request.jwt.decode(token.split(' ')[1]) as DecodedPayload;
    const { email, name, _id } = decoded._doc;

    // Call service to update sales contract
    const salesContract = await pendingContractBalanceClose(body);

    console.log(salesContract, 'reply');

    // Handle service response
    if (salesContract === 'No data found') {
      console.error('No Record Found!');
      await userLog(request, false, email, _id, name, ipAddress, body);
      return reply.code(400).send({ error: 'No Record Found!' });
    } else if (!salesContract) {
      console.error('Failed to update sales contract qty!');
      await userLog(request, false, email, _id, name, ipAddress, body);
      return reply
        .code(400)
        .send({ error: 'Failed to update sales contract qty!' });
    }

    // Log success and send response
    await userLog(request, true, email, _id, name, ipAddress, body);
    return reply.code(201).send(salesContract);
  } catch (error) {
    console.error('An error occurred:', error);
    return reply.code(500).send({ error: 'An internal server error occurred' });
  }
};
