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
  RoyalitydtlReportPrint

} from './royality.service';

export const createRoyalityHandler = async (
  request: FastifyRequest<{
    Body: CreateRoyalitySchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;

  try {
    const royality = await createRoyality(body);

    return reply.code(201).send(royality);
  } catch (e) {
    return reply.code(400).send(e);
  }
};


export const createRoyalityAdmDenimHandler = async (
  request: FastifyRequest<{
    Body: CreateRoyalityAdmDenimSchema;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;

  try {
    const royality = await createRoyalityAdmDenim(body);

    return reply.code(201).send(royality);
  } catch (e) {
    return reply.code(400).send(e);
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
  const royality = await deleteRoyalityById(params['id']);

  return royality;
};

export const updateRoyalityByIdHandler = async (
  request: FastifyRequest<{
    Params: IParsms;
    Body: CreateRoyalitySchema;
  }>,
  reply: FastifyReply
) => {
  const params = request.params;
  const body = request.body;

  const royality = await updateRoyalityById(params['id'], body);

  return royality;
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