import { FastifyReply, FastifyRequest } from 'fastify';
import { RoyalityModel } from './royality.model';
import {
  CreateRoyalitySchema,
  ReportSchema,
  RoyalityamountSchema,
  updateRoyalityrateSchema,
  CreateRoyalityAdmDenimSchema,
  RoyalityPaginationSchema,
  RoyalityReportSchema,
  RoyalityReportPrintSchema,
  UpdateRoyalitySchema
  
} from './royality.schema';
import {
  updateRoyalityById,
  deleteRoyality,
  deleteRoyalityById,
  findRoyality,
  getNewRoyalityId,
  createRoyality,
  // findAllDetailToReport,
  findroyalityamount,
  RoyalityDtlsByDate,
  royalityrateipdate,
  createRoyalityAdmDenim,
  findAdmroyalityamount,
  royalityAdmdenimReport,
  getNewRoyalityAdmDenimId,
  RoyalityReportDtlwithAdmDenim,
  RoyalitydtlReportPrint,
  RoyalityReportDtlNetwithAdmDenim,
  RoyalitydtlNetReportPrint

} from './royality.service';
import { userLog } from '../../user_histroy/userhistroy.service';
import { ObjectId } from 'mongoose';
interface DecodedPayload {
  _doc: {
    email: string;
    name: string;
    _id: ObjectId;


  };
}
export const createRoyalityHandler = async (
  request: FastifyRequest<{
    Body: CreateRoyalitySchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  let token: string | undefined;
  let royality;
  try {
     royality = await createRoyality(body);
     console.log(royality , "controller");

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

    if (!royality) {
      console.error('Failed to create royality!');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress,body);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to create royality!' });
    } else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress,body);
      //////////// user log //////////
      return reply.code(201).send(royality);
    }
  } catch (error) {
    console.error('An error occurred:', error)
    return reply.code(400).send({ error: 'An error occurred' });

  }
};


export const createRoyalityAdmDenimHandler = async (
  request: FastifyRequest<{
    Body: CreateRoyalityAdmDenimSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;

  let token: string | undefined;
  let royality:any;
  try {
     royality = await createRoyalityAdmDenim(body);
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

    if (!royality) {
      console.error('Failed to create royality!');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress,body);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to create royality!' });
    } else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress,body);
      //////////// user log //////////
      return reply.code(201).send(royality);
    }
  } catch (error) {
    console.error('An error occurred:', error)
    return reply.code(400).send({ error: 'An error occurred' });

  }
};


export const getNewRoyalityIdHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const id = await getNewRoyalityId();

  return reply.code(200).send({ id });
};



export const getNewRoyalityAdmDenimIdHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const id = await getNewRoyalityAdmDenimId();

  return reply.code(200).send({ id });
};




export const RoyalityPaginationHandler = async (
  request: FastifyRequest<{
    Body: RoyalityPaginationSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;

  
    const royality = await findRoyality(body);
return royality
  
};
export const deleteRoyalityByIdHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  let token: string | undefined;
  let royality:any;
  try {
  const royality = await deleteRoyalityById(params['id']);
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

    if (!royality) {
      console.error('Failed to delete royality!');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress,params);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to delete royality!' });
    } else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress,params);
      //////////// user log //////////
      return reply.code(201).send(royality);
    }
  } catch (error) {
    console.error('An error occurred:', error)
    return reply.code(400).send({ error: 'An error occurred' });

  }

 
};

export const updateRoyalityByIdHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
    Body: UpdateRoyalitySchema;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  const body = request.body;
  let token: string | undefined;
  let payement;
  try {
   payement = await updateRoyalityById(params['id'], body);
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

    if (!payement) {
      console.error('Failed to update payement!');
      //////////// user log //////////
      await userLog(request, false, email, _id, name, ipAddress,body);
      //////////// user log //////////
      return reply.code(400).send({ error: 'Failed to update payement!' });
    } else {
      //////////// user log //////////
      await userLog(request, true, email, _id, name, ipAddress,body);
      //////////// user log //////////
      return reply.code(201).send(payement);
    }
  } catch (error) {
    console.error('An error occurred:', error)
    return reply.code(400).send({ error: 'An error occurred' });

  }
};

export const deleteRoyalityHandler = async () => {
  const royality = deleteRoyality();
  return royality;
};
// export const findAllDetailToReportHandler = async (
//   request: FastifyRequest<{
//     Body: ReportSchema;
//   }>,
//   reply: FastifyReply
// ) => {
//   const body = request.body;
//   const findalldetail = await findAllDetailToReport(body);
//   return findalldetail;
// };

export const findRoyalityAmountHandler = async (
  request: FastifyRequest<{
    Body: RoyalityamountSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  const royalityamount = await findroyalityamount(body);
  return { amount: royalityamount };
};





export const findRoyalityDtlsByDateHandler = async (
  request: FastifyRequest<{
    Body: ReportSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  const royalityDtls = await RoyalityDtlsByDate(body);
  return royalityDtls;
};
export const RoyalityrateByIdHandler = async (
  request: FastifyRequest<{
    Body: updateRoyalityrateSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;

  const royality = await royalityrateipdate(body);

  return royality;
};
export const findRoyalityAdmAmountHandler = async (
  request: FastifyRequest<{
    Body: RoyalityamountSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  const royalityamount = await findAdmroyalityamount(body);
  return { amount: royalityamount };
};
export const findRoyalityAdmdenimByDateHandler = async (
  request: FastifyRequest<{
    Body: updateRoyalityrateSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  const royalityDtls = await royalityAdmdenimReport(body);
  return royalityDtls;
};

export const RoyalityReportDtlwithAdmDenimHandler = async (
  request: FastifyRequest<{
    Body: RoyalityReportSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  const royalityDtls = await RoyalityReportDtlwithAdmDenim(body);
  return royalityDtls;
};


export const RoyalityReportDtlPrintHandler = async (
  request: FastifyRequest<{
    Body: RoyalityReportPrintSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  const royalityDtls = await RoyalitydtlReportPrint(body);
  return royalityDtls;
};

export const RoyalityReportDtlNetwithAdmDenimHandler = async (
  request: FastifyRequest<{
    Body: RoyalityReportSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  const royalityDtls = await RoyalityReportDtlNetwithAdmDenim(body);
  return royalityDtls;
};
export const RoyalityReportDtlNetPrintHandler = async (
  request: FastifyRequest<{
    Body: RoyalityReportPrintSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;
  const royalityDtls = await RoyalitydtlNetReportPrint(body);
  return royalityDtls;
};