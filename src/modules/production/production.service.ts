import mongoose, { mongo } from 'mongoose';
import { ProductionModel } from './production.model';
import {
  CreateProductionSchema,
  ProductionPaginationSchema,
  ProductionReportPrintSchema,
  ProductionReportSchema,
} from './production.schema';
import { ProductionDtlModel } from './production_dtl.model';
import dayjs from 'dayjs';
const utc = require('dayjs/plugin/utc');
import { ProductModel } from '../product/product.model';
import { MachineModel } from '../machine/machine.model';
import { date } from 'zod';
import moment from 'moment';

dayjs.extend(utc);

export const createProduction = async (input: CreateProductionSchema) => {
  const {
    tran,
    date,
    productionType,
    machine,
    specialInstruction,
    productionDtl,
  } = input;

  const production = await ProductionModel.create({
    tran,
    date: dayjs(date).format('YYYY-MM-DD'),
    productionType,
    machine: new mongoose.Types.ObjectId(machine),
    specialInstruction,
  });

  for (const prod of productionDtl) {
    const newProductionDtl = await ProductionDtlModel.create({
      lot: prod.lot,
      date: dayjs(date).format('YYYY-MM-DD'),
      bales: prod.bales,
      qty: prod.qty,
      uom: prod.uom,
      product: new mongoose.Types.ObjectId(prod.product),
      production: new mongoose.Types.ObjectId(production._id),
      machine: new mongoose.Types.ObjectId(machine),
    });
  }

  return production;
};

export const getNewProductionId = async () => {
  const production = await ProductionModel.findOne()
    .sort({ field: 'asc', _id: -1 })
    .limit(1);

  let newId: number = 1;
  if (production != null) {
    newId = production.tran + 1;
  }

  return newId;
};

export const findProductions = async (input: ProductionPaginationSchema) => {
  const limit = input.perPage;
  const skipCount = (input.pageno - 1) * limit;
  const productionrecords = await ProductionModel.countDocuments();
  const production = await ProductionModel.find({ isDeleted: false })
    .populate({
      path: 'machine',
      model: MachineModel,
    })
    .limit(limit)
    .skip(skipCount);
  //.sort({ tran: 1 });
  const result = {
    production_dtl: production,
    total_Records: productionrecords,
  };
  return result;
};

export const findProductionsDtls = async (id: string) => {
  return await ProductionDtlModel.find({
    production: new mongoose.Types.ObjectId(id),
  }).populate({ path: 'product', model: ProductModel });
};

export const findProductionsDtlsByDate = async (
  input: ProductionReportSchema
) => {
  if (input.machine == '') {
    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;

    const total_Records = await ProductionDtlModel.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
        },
      },
    ]);
    const group_by = await ProductionDtlModel.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: 'null',
          qty: {
            $sum: '$qty',
          },
          totalBales: {
            $sum: {
              $toInt: '$bales',
            },
          },
        },
      },
    ]);
    const total_Qty = group_by.map((item) => item.qty);
    const total_Bales = group_by.map((item) => item.totalBales);

    const production_dtl = await ProductionDtlModel.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: 'productions',
          localField: 'production',
          foreignField: '_id',
          as: 'production',
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product',
        },
      },
      {
        $lookup: {
          from: 'machines',
          localField: 'machine',
          foreignField: '_id',
          as: 'machine',
        },
      },
      { $skip: skipCount },
      { $limit: limit },
    ]);

    const result = {
      production_dtl: production_dtl,
      total_records: total_Records.length,
      pagianted_record: production_dtl.length,
      total_Qty: total_Qty[0],
      total_Bales: total_Bales[0],
    };
    return result;
  } else if (input.machine !== '') {
    console.log('machine');
    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;

    const machineObjectId = new mongoose.Types.ObjectId(input.machine);

    const total_Records = await ProductionDtlModel.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          machine: machineObjectId, // Use the ObjectId within the $match expression
        },
      },
    ]);

    const group_by = await ProductionDtlModel.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          machine: machineObjectId,
        },
      },
      {
        $group: {
          _id: 'null',
          qty: {
            $sum: '$qty',
          },
          totalBales: {
            $sum: {
              $toInt: '$bales',
            },
          },
        },
      },
    ]);

    const total_Qty = group_by.map((item) => item.qty);
    const total_Bales = group_by.map((item) => item.bales);

    const production_dtl = await ProductionDtlModel.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          machine: machineObjectId, // Use the ObjectId within the $match expression
        },
      },
      {
        $lookup: {
          from: 'productions',
          localField: 'production',
          foreignField: '_id',
          as: 'production',
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product',
        },
      },
      {
        $lookup: {
          from: 'machines',
          localField: 'machine',
          foreignField: '_id',
          as: 'machine',
        },
      },
      { $skip: skipCount },
      { $limit: limit },
    ]);

    const result = {
      production_dtl: production_dtl,
      total_records: total_Records.length,
      paginated_record: production_dtl.length,
      total_Qty: total_Qty[0],
      total_Bales: total_Bales[0],
    };

    return result;
  }
};
export const findProductionsDtlsPrintByDate = async (
  input: ProductionReportPrintSchema
) => {
  if (input.machine == '') {
    const total_Records = await ProductionDtlModel.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
        },
      },
    ]);
    const group_by = await ProductionDtlModel.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: 'null',
          qty: {
            $sum: '$qty',
          },
          totalBales: {
            $sum: {
              $toInt: '$bales',
            },
          },
        },
      },
    ]);
    const total_Qty = group_by.map((item) => item.qty);
    const total_Bales = group_by.map((item) => item.totalBales);

    const production_dtl = await ProductionDtlModel.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: 'productions',
          localField: 'production',
          foreignField: '_id',
          as: 'production',
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product',
        },
      },
      {
        $lookup: {
          from: 'machines',
          localField: 'machine',
          foreignField: '_id',
          as: 'machine',
        },
      },
    ]);

    const result = {
      production_dtl: production_dtl,
      total_records: total_Records.length,
      pagianted_record: production_dtl.length,
      total_Qty: total_Qty[0],
      total_Bales: total_Bales[0],
    };
    return result;
  } else if (input.machine !== '') {
    console.log('machine');

    const machineObjectId = new mongoose.Types.ObjectId(input.machine);

    const total_Records = await ProductionDtlModel.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          machine: machineObjectId,
        },
      },
    ]);

    const group_by = await ProductionDtlModel.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          machine: machineObjectId,
        },
      },
      {
        $group: {
          _id: 'null',
          qty: {
            $sum: '$qty',
          },
          totalBales: {
            $sum: {
              $toInt: '$bales',
            },
          },
        },
      },
    ]);

    const total_Qty = group_by.map((item) => item.qty);
    const total_Bales = group_by.map((item) => item.bales);

    const production_dtl = await ProductionDtlModel.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          machine: machineObjectId, // Use the ObjectId within the $match expression
        },
      },
      {
        $lookup: {
          from: 'productions',
          localField: 'production',
          foreignField: '_id',
          as: 'production',
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product',
        },
      },
      {
        $lookup: {
          from: 'machines',
          localField: 'machine',
          foreignField: '_id',
          as: 'machine',
        },
      },
    ]);

    const result = {
      production_dtl: production_dtl,
      total_records: total_Records.length,
      paginated_record: production_dtl.length,
      total_Qty: total_Qty[0],
      total_Bales: total_Bales[0],
    };

    return result;
  }
};

export const deleteProductions = async () => {
  await ProductionDtlModel.deleteMany({});
  return await ProductionModel.deleteMany({});
};

export const deleteProductionById = async (id: string) => {
  //await ProductionDtlModel.deleteMany({ production: id });

  return ProductionModel.findByIdAndUpdate(id, { isDeleted: true });
};

export const updateProductionById = async (
  id: string,
  input: CreateProductionSchema
) => {
  const {
    tran,
    date,
    productionType,
    machine,
    specialInstruction,
    productionDtl,
  } = input;

  const production = await ProductionModel.findByIdAndUpdate(id, {
    tran,
    date: dayjs(date).format('YYYY-MM-DD'),
    productionType,
    machine: new mongoose.Types.ObjectId(machine),
    specialInstruction,
  });

  await ProductionDtlModel.deleteMany({ production: id });

  for (const prod of productionDtl) {
    const newProdDtl = await ProductionDtlModel.create({
      date: dayjs(date).format('YYYY-MM-DD'),
      lot: prod.lot,
      bales: prod.bales,
      qty: prod.qty,
      uom: prod.uom,
      product: new mongoose.Types.ObjectId(prod.product),
      production: new mongoose.Types.ObjectId(production?._id),
      machine: new mongoose.Types.ObjectId(machine),
    });
  }
  return { success: true };
};

export const getLotNum = async (id: string) => {
  const lots = await ProductionDtlModel.find({ product: id }).select({
    lot: 1,
  });

  return lots;
};

export const findProductionsIsDeletedDtlsByDate = async (
  input: ProductionReportSchema
) => {
  if (input.machine == '') {
    return await ProductionModel.find({
      date: {
        $gte: dayjs(input.fromDate).startOf('date'),
        $lte: dayjs(input.toDate).endOf('date'),
      },

      isDeleted: true,
    });

    // .populate({
    //   path: 'product',
    //   model: ProductModel,
    // })
    // .populate({
    //   path: 'production',
    //   model: ProductionModel,
    // });
  } else {
    const Production = await ProductionModel.find({
      machine: input.machine,
    });
    console.log(input);
    return await ProductionModel.find({
      date: {
        $gte: dayjs(input.fromDate).startOf('date'),
        $lte: dayjs(input.toDate).endOf('date'),
      },
      isDeleted: true,
    });

    // .populate({
    //   path: 'product',
    //   model: ProductModel,
    // })
    // .populate({
    //   path: 'production',
    //   model: ProductionModel,
    // });
  }
};
