import { FastifyReply, FastifyRequest } from 'fastify';
import { CreateShipmentSchema, ShipmentPrintSchema, ShipmentgroupSchema, ShipmentpaginationSchema } from './shipment.schema';
import { ShipmentReportSchema } from './shipment.schema';
import {
  createShipment,
  deleteShipmentById,
  findShipments,
  getNewShipmentId,
  updateShipmentById,
  findShipmentDtlsByDate,
  findIsDeletedShipmentDtlsByDate,
  deleteShipment,
  findSalesContractsWithMoreQty,
  findSalesContractsWithShipment,
  Productgroupby,
  ShipmrntdtlsforPrint,
  // findShipmentDetail,
  findShipmentDtls,
} from './shipment.service';

// @desc    Create new shipment
// @route   POST /shipment/
// @access  Private
export const createShipmentHandler = async (
  request: FastifyRequest<{
    Body: CreateShipmentSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  try {
    const shipment = await createShipment(body);

    return reply.code(201).send(shipment);
  } catch (e) {
    return reply.code(400).send(e);
  }
};

// @desc    Get new shipment id
// @route   GET /shipment/id
// @access  Private
export const getNewShipmentIdHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const id = await getNewShipmentId();

  return reply.code(200).send({ id });
};

// @desc    Get all shipments
// @route   GET /shipment/
// @access  Private
export const ShipmentPaginationHandler = async (
  request: FastifyRequest<{
    Body: ShipmentpaginationSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  
    const shipment = await findShipments(body);
return shipment
  
};

// @desc    Delete shipment by id
// @route   DELETE /shipment/:id
// @access  Private
export const deleteShipmentByIdHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  const shipments = await deleteShipmentById(params['id']);

  return shipments;
};

// @desc    Update shipment by id
// @route   PUT /shipment/:id
// @access  Private
export const updateShipmentByIdHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
    Body: CreateShipmentSchema;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  const body = request.body;

  const shipments = await updateShipmentById(params['id'], body);

  return shipments;
};

export const findShipmentDtlsByDateHandler = async (
  request: FastifyRequest<{
    Body: ShipmentReportSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;

  const shipmentsDtls = await findShipmentDtlsByDate(body);

  return shipmentsDtls;
};


export const findShipmentDtlsByDatePrintHandler = async (
  request: FastifyRequest<{
    Body: ShipmentPrintSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;

  const shipmentsDtls = await ShipmrntdtlsforPrint(body);

  return shipmentsDtls;
};


export const findIsDeletedShipmentDtlsByDateHandler = async (
  request: FastifyRequest<{
    Body: ShipmentReportSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;

  const shipmentsDtls = await findIsDeletedShipmentDtlsByDate(body);

  return shipmentsDtls;
};
export const deleteShipmentHandler = async () => {
  const salesContracts = await deleteShipment();

  return salesContracts;
};
export const getSalesContractsWithMoreQtyHandler = async () => {
  const salesContracts = await findSalesContractsWithMoreQty();

  return salesContracts;
};
export const findSalesContractsWithShipmentHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  const salesContractsDtls = await findSalesContractsWithShipment(params['id']);
  return salesContractsDtls;
};
export const findShipmentDtlsHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  const invoicesDtls = await findShipmentDtls(params['id']);
  return invoicesDtls;
};
export const findShipmentcustomerHandler = async (
  request: FastifyRequest<{
    Body: ShipmentgroupSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  console.log(body);
  const shipmentsDtls = await Productgroupby(body);
  console.log(shipmentsDtls);
  return shipmentsDtls;
};
