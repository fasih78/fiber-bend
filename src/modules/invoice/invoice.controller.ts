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
  invoiceReportfilterSalesContract
} from './invoice.service';

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
  try {
    const invoice = await createInvoice(body);

    return reply.code(201).send(invoice);
  } catch (e) {
    return reply.code(400).send(e);
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
  const invoices = await deleteInvoiceById(params['id']);

  return invoices;
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

  const invoices = await updateInvoiceById(params['id'], body);

  return invoices;
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
