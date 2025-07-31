import { FastifyReply, FastifyRequest } from 'fastify';
import { CreateInvoiceSchema, InvoicePagintionSchema, InvoiceReportPrintSchema } from './invoice.schema';
import { InvoiceReportSchema } from './invoice.schema';
import {
  createInvoice,
  deleteInvoiceById,
  deleteInvoices,
  findInvoices,
  findInvoicesDtls,
  getNewInvoiceId,
  updateInvoiceById,
  findInvoiceDtlsByDate,
  findNotPaymentInvoice,
  updatePaymentfalse,
  findInvoicesWithPagination,
  findInvoiceDtlsByDatePrint,
  findNetInovioceDtlsByDate,
  invoiceReportfilterSalesContract,
  findNetInovioceDtlsByDatePrint
} from './invoice.service';
import { userLog } from '../../user_histroy/userhistroy.service';
import { ObjectId } from 'mongoose';
interface DecodedPayload {
  _doc: {
    email: string;
    name: string;
    _id: ObjectId;


  };
}

// @desc    Create new invoice
// @route   POST /invoice/
// @access  Private
export const createInvoiceHandler = async (
  request: FastifyRequest<{
    Body: CreateInvoiceSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  let token: string | undefined;
  let invoice;
  try {
    invoice = await createInvoice(body);

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

    if (!invoice) {
      console.error('Failed to create invoice!');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress,body);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to create invoice!' });
    } 
    else if(invoice === 'Invoicedtl Total Quantity Is Greater Than SalesContractdtl Total Quantity'){
      return reply.code(400).send({ error: 'Invoicedtl Total Quantity Is Greater Than SalesContractdtl Total Quantity!' });
    }
    
    else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress,body);
      //////////// user log //////////
      return reply.code(201).send(invoice);
    }
  } catch (error) {
    console.error('An error occurred:', error)
    return reply.code(400).send({ error: 'An error occurred' });

  }
};

// @desc    Get new invoice id
// @route   GET /invoice/id
// @access  Private
export const getNewInvoiceIdHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const id = await getNewInvoiceId();

  return reply.code(200).send({ id });
};

// @desc    Get all invoices
// @route   GET /invoice/
// @access  Private
export const getInvoicesHandler = async () => {
  const invoices = await findInvoices();

  return invoices;
};

export const invoiceReportfilterSalesContractHandler = async () => {
  const contract = await invoiceReportfilterSalesContract();

  return contract;
};




export const InvoicepaginationHandler = async (
  request: FastifyRequest<{
    Body: InvoicePagintionSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;

  const invoice = await findInvoicesWithPagination(body);
  return invoice;
};

// @desc    Delete all invoices
// @route   DELETE /invoice/all
// @access  Private
export const deleteInvoicesHandler = async () => {
  const invoices = await deleteInvoices();

  return invoices;
};

// @desc    Get invoice details by id
// @route   GET /sales-contract/details/:id
// @access  Private
export const findInvoicesDtlsHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  const invoicesDtls = await findInvoicesDtls(params['id']);
  return invoicesDtls;
};

// @desc    Delete invoice by id
// @route   DELETE /invoice/:id
// @access  Private
export const deleteInvoiceByIdHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  let token: string | undefined;
  let invoice;
  try {
    invoice = await deleteInvoiceById(params['id']);
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

    if (!invoice) {
      console.error('Failed to delete invoice!');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress,params);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to delete invoice!' });
    } else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress,params);
      //////////// user log //////////
      return reply.code(201).send(invoice);
    }
  } catch (error) {
    console.error('An error occurred:', error)
    return reply.code(400).send({ error: 'An error occurred' });

  }


};

// @desc    Update invoice by id
// @route   PUT /invoice/:id
// @access  Private
export const updateInvoiceByIdHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
    Body: CreateInvoiceSchema;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  const body = request.body;
  let token: string | undefined;
  let invoice;
  try {
    invoice = await updateInvoiceById(params['id'], body);
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

    if (!invoice) {
      console.error('Failed to update invoice!');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress,body);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to update invoice!' });
    } 
    
    else if(invoice ===  'Invoicedtl Total Quantity Is Greater Than SalesContractdtl Total Quantity'){
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress,body);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Invoicedtl Total Quantity Is Greater Than SalesContractdtl Total Quantity!' });
    }
    else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress,body);
      //////////// user log //////////
      return reply.code(201).send(invoice);
    }
  } catch (error) {
    console.error('An error occurred:', error)
    return reply.code(400).send({ error: 'An error occurred' });

  }



};

export const findInvoiceDtlsByDateHandler = async (
  request: FastifyRequest<{
    Body: InvoiceReportSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  const invoicesDtls = await findInvoiceDtlsByDate(body);
  return invoicesDtls
};


export const findInvoiceDtlsByDatePrintHandler = async (
  request: FastifyRequest<{
    Body: InvoiceReportPrintSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  const invoicesDtls = await findInvoiceDtlsByDatePrint(body);
  return invoicesDtls
};












export const findNotPaymentInvoiceHandler = async () => {
  const invoices = await findNotPaymentInvoice();

  return invoices;
};
export const getPaymentfalseHandler = async () => {
  const shipment = await updatePaymentfalse();

  return shipment;
};
export const findNetInvoiceDtlsByDateHandler = async (
  request: FastifyRequest<{
    Body: InvoiceReportSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  const invoicesDtls = await findNetInovioceDtlsByDate(body);
  return invoicesDtls
};

export const findNetInovioceDtlsByDatePrintHandler = async (
  request: FastifyRequest<{
    Body: InvoiceReportPrintSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  const invoicesDtls = await findNetInovioceDtlsByDatePrint(body);
  return invoicesDtls
};