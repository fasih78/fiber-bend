import { FastifyReply, FastifyRequest } from 'fastify';
import {  CreateShipmentSchema, ShipmentPrintSchema, ShipmentgroupSchema, ShipmentpaginationSchema } from './shipment.schema';
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
  findNetShipmentDtlsByDate,
  findNetShipmentDtlsByDatePrint,
  
} from './shipment.service';
import { ObjectId } from 'mongoose';
import { userLog } from '../../user_histroy/userhistroy.service';

// @desc    Create new shipment
// @route   POST /shipment/
// @access  Private
interface DecodedPayload {
  _doc: {
    email: string;
    name: string;
    _id: ObjectId;


  };
}
export const createShipmentHandler = async (
  request: FastifyRequest<{
    Body: CreateShipmentSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  let token: string | undefined;
  let shipment;
  try {
    shipment = await createShipment(body);
console.log(shipment);
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

    if (!shipment) {
      console.error('Failed to create shipment!');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress,body);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to create shipment!' });
    }
    else if(shipment === 'Shipmentdtl Total Qty Is Greater Than SalesContractdtl Total Qty'){
      return reply.code(400).send({ error: 'Shipmentdtl Total Qty Is Greater Than SalesContractdtl Total Qty!' });
    } 
    else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress,body);
      //////////// user log //////////
      return reply.code(201).send(shipment);
    }
  } catch (error) {
    console.error('An error occurred:', error)
    return reply.code(400).send({ error: 'An error occurred' });

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
  let token: string | undefined;
  let shipment;
  try {
    shipment = await deleteShipmentById(params['id']);
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

    if (!shipment) {
      console.error('Failed to delete shipment!');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress,params);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to delete shipment!' });
    } else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress,params);
      //////////// user log //////////
      return reply.code(201).send(shipment);
    }
  } catch (error) {
    console.error('An error occurred:', error)
    return reply.code(400).send({ error: 'An error occurred' });

  }

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
  let token: string | undefined;
  let shipment;
  try {
    shipment = await updateShipmentById(params['id'], body);
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

    if (!shipment) {
      console.error('Failed to update shipment!');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress,body);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to update shipment!' });
    }
    else if(shipment === 'Shipmentdtl Total Qty Is Greater Than SalesContractdtl Total Qty'){
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress,body);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Shipmentdtl Total Qty Is Greater Than SalesContractdtl Total Qty!' });
    } 
    else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress,body);
      //////////// user log //////////
      return reply.code(201).send(shipment);
    }
  } catch (error) {
    console.error('An error occurred:', error)
    return reply.code(400).send({ error: 'An error occurred' });

  }


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
export const findNetShipmentDtlsByDateHandler = async (
  request: FastifyRequest<{
    Body: ShipmentReportSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;

  const shipmentsDtls = await findNetShipmentDtlsByDate(body);

  return shipmentsDtls;
};
export const findNetShipmentDtlsByDatePrintHandler = async (
  request: FastifyRequest<{
    Body: ShipmentReportSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;

  const shipmentsDtls = await findNetShipmentDtlsByDatePrint(body);

  return shipmentsDtls;
};
