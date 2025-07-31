import mongoose, { mongo } from 'mongoose';
import { ProductionModel } from './production.model';
import {
  CreateProductionSchema,
  ProductionLotQtyAdjustSchema,
  ProductionPaginationSchema,
  ProductionReportPrintSchema,
  ProductionReportSchema,
} from './production.schema';
import { ProductionDtlModel } from './production_dtl.model';
import dayjs from 'dayjs';
const utc = require('dayjs/plugin/utc');


dayjs.extend(utc);

export const createProduction = async (input: CreateProductionSchema) => {
  const {
    tran,
    date,
    productionType,
    machine,
    specialInstruction,
    productionDtl,
    lot_no,
  } = input;

  const production = await ProductionModel.create({
    tran,
    date: dayjs(date).format('YYYY-MM-DD'),
    productionType,
    // machine: new mongoose.Types.ObjectId(machine),
    specialInstruction,
    lot_no,
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
      machine: new mongoose.Types.ObjectId(prod.machine),
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
  const searchQuery = input.name ? new RegExp(`^${input.name}`, 'i') : null; // Adjusted the searchQuery initialization
  const skipCount = (input.pageno - 1) * limit;
  const productionrecords = await ProductionModel.countDocuments();

  const production_filter = searchQuery
    ? await ProductionDtlModel.find({
      machine_no: { $regex: searchQuery },
    })
    : [];

  if (searchQuery !== null) {
    const productdtl = await ProductionDtlModel.aggregate([
      {
        $match: {
          machine_no: { $regex: searchQuery },
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
      production_dtl: productdtl,
      total_records: production_filter.length,
    };

    return result;
  } else {
    console.log('else');
    const productdtl = await ProductionModel.aggregate([
      {
        $match: {
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: 'productiondtls',
          localField: '_id',
          foreignField: 'production',
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
      production_dtl: productdtl,
      total_records: productionrecords,
    };
    return result;
  }
};

export const findProductionsDtls = async (id: string) => {
  const product = await ProductionModel.aggregate([
    {
      $match: {
        isDeleted: false,
        _id: new mongoose.Types.ObjectId(id),
      },
    },
    {
      $lookup: {
        from: 'productiondtls',
        localField: '_id',
        foreignField: 'production',
        as: 'productiondtlData',
        pipeline: [
          {
            $lookup: {
              from: 'products',
              localField: 'product',
              foreignField: '_id',
              as: 'productData',
              pipeline: [
                {
                  $lookup: {
                    from: 'productdtls',
                    localField: '_id',
                    foreignField: 'product',
                    as: 'productdtlData',
                  },
                },
              ],
            },
          },
        ],
      },
    },
    // {
    //   $lookup: {
    //     from: 'machines',
    //     localField: 'machine',
    //     foreignField: '_id',
    //     as: 'machine'
    //   }
    // }
  ]);

  return product;
};

// export const findProductionsDtlsByDate_old = async (
//   input: ProductionReportSchema
// ) => {
//   if (
//     input.machine == '' &&
//     input.product == '' &&
//     input.product_group == '' &&
//     input.lot_group == '' &&
//     input.month_group == '' &&
//     input.lot_summary == ''
//   ) {
//     console.log('default filter');
//     const limit = input.perPage;
//     const skipCount = (input.pageno - 1) * limit;

//     const total_Records = await ProductionDtlModel.aggregate([
//       {
//         $match: {
//           date: {
//             $gte: new Date(input.fromDate),
//             $lte: new Date(input.toDate),
//           },
//           isDeleted: false,
//         },
//       },
//     ]);
//     const group_by = await ProductionDtlModel.aggregate([
//       {
//         $match: {
//           date: {
//             $gte: new Date(input.fromDate),
//             $lte: new Date(input.toDate),
//           },
//           isDeleted: false,
//         },
//       },
//       {
//         $group: {
//           _id: 'null',
//           qty: {
//             $sum: '$qty',
//           },
//           totalBales: {
//             $sum: {
//               $toInt: '$bales',
//             },
//           },
//         },
//       },
//     ]);
//     const total_Qty = group_by.map((item: { qty: any; }) => item.qty);
//     const total_Bales = group_by.map((item: { totalBales: any; }) => item.totalBales);

//     const production_dtl = await ProductionDtlModel.aggregate([
//       {
//         $match: {
//           date: {
//             $gte: new Date(input.fromDate),
//             $lte: new Date(input.toDate),
//           },
//           isDeleted: false,
//         },
//       },
//       {
//         $lookup: {
//           from: 'productions',
//           localField: 'production',
//           foreignField: '_id',
//           as: 'production',
//         },
//       },
//       {
//         $lookup: {
//             from: 'products',
//             localField: 'product',
//             foreignField: '_id',
//             as: 'product',
//         },
//       },
//       {
//         $lookup: {
//           from: 'machines',
//           localField: 'machine',
//           foreignField: '_id',
//           as: 'machine',
//         },
//       },
//       { $skip: skipCount },
//       { $limit: limit },
//     ]);

//     const result = {
//       production_dtl: production_dtl,
//       total_records: total_Records.length,
//       pagianted_record: production_dtl.length,
//       total_Qty: total_Qty[0],
//       total_Bales: total_Bales[0],
//     };
//     return result;
//   }

//   else if (
//     input.product_group !== '' &&
//     input.lot_summary == '' && 
//     input.machine == '' &&
//     input.product == ''
//   ) {
//     const limit = input.perPage;
//     const skipCount = (input.pageno - 1) * limit;
//     console.log('product group general');

//     const total_record = await ProductionDtlModel.aggregate([
//       {
//         $match: {
//           date: {
//             $gte: new Date(input.fromDate),
//             $lte: new Date(input.toDate),
//           },
//           isDeleted: false,
//         },
//       },
//       {
//         $lookup: {
//           from: 'products',
//           localField: 'product',
//           foreignField: '_id',
//           as: 'productDetails',
//         },
//       },
//       {
//         $unwind: '$productDetails',
//       },
//       {
//         $group: {
//           _id: '$productDetails',
//           productName: {
//             $first: '$productDetails.name',
//           },
//           totalContracts: {
//             $sum: 1,
//           },
//           totalQty: {
//             $sum: '$qty',
//           },
//           totalbales: {
//             $sum: {
//               $convert: {
//                 input: '$bales',
//                 to: 'int',
//               },
//             },
//           },
//         },
//       },
//       {
//         $match: {
//           totalQty: {
//             $gt: 0,
//           },
//           totalbales: {
//             $gt: 0,
//           },
//         },
//       },
//       {
//         $project: {
//           productName: 1,
//           totalContracts: 1,
//           totalQty: 1,
//           totalbales: 1,
//         },
//       },
//       {
//         $sort: {
//           totalQty: -1,
//           totalbales: -1,
//         },
//       },


//     ]);

//     const productdtl = await ProductionDtlModel.aggregate([
//       {
//         $match: {
//           date: {
//             $gte: new Date(input.fromDate),
//             $lte: new Date(input.toDate),
//           },
//           isDeleted: false,
//         },
//       },
//       {
//         $lookup: {
//           from: 'products',
//           localField: 'product',
//           foreignField: '_id',
//           as: 'productDetails',
//         },
//       },
//       {
//         $unwind: '$productDetails',
//       },
//       {
//         $group: {
//           _id: '$productDetails',
//           productName: {
//             $first: '$productDetails.name',
//           },
//           totalContracts: {
//             $sum: 1,
//           },
//           totalQty: {
//             $sum: '$qty',
//           },
//           totalbales: {
//             $sum: {
//               $convert: {
//                 input: '$bales',
//                 to: 'int',
//               },
//             },
//           },
//         },
//       },
//       {
//         $match: {
//           totalQty: {
//             $gt: 0,
//           },
//           totalbales: {
//             $gt: 0,
//           },
//         },
//       },
//       {
//         $project: {
//           productName: 1,
//           totalContracts: 1,
//           totalQty: 1,
//           totalbales: 1,
//         },
//       },
//       {
//         $sort: {
//           totalQty: -1,
//           totalbales: -1,
//         },
//       },

//       { $skip: skipCount },
//       { $limit: limit },
//     ]);
//     const totalQtySum = total_record.reduce(
//       (sum: any, item: { totalQty: any; }) => sum + item.totalQty,
//       0
//     );
//     const totalbalesSum = total_record.reduce(
//       (sum: any, item: { totalbales: any; }) => sum + item.totalbales,
//       0
//     );
//     const totalContractSum = total_record.reduce(
//       (sum: any, item: { totalContracts: any; }) => sum + item.totalContracts,
//       0
//     );
//     const result = {
//       groupby: productdtl,
//       totalQtySum: totalQtySum,
//       totalbalesSum: totalbalesSum,
//       totalContractSum: totalContractSum,
//       total_records: productdtl.length,
//     };
//     return result;
//   } 
//  else if (input.month_group !== '' && input.product == '') {

// console.log('month group')

//   const limit = input.perPage;
//   const skipCount = (input.pageno - 1) * limit;

//   const total_records = await ProductionDtlModel.aggregate([
//     {
//       $match: {
//         date: {
//           $gte: new Date(input.fromDate),
//           $lte: new Date(input.toDate),
//         },
//         isDeleted: false,
//       },
//     },
//     {
//       $group: {
//         _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
//         totalQty: { $sum: '$qty' },
//         totalBales: { $sum: { $toInt: '$bales' } },
//       },
//     },
//   ]);
//   const monthdtl = await ProductionDtlModel.aggregate([
//     {
//       $match: {
//         date: {
//           $gte: new Date(input.fromDate),
//           $lte: new Date(input.toDate),
//         },
//         isDeleted: false,
//       },
//     },
//     {
//       $group: {
//         _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
//         totalQty: { $sum: '$qty' },
//         totalBales: { $sum: { $toInt: '$bales' } },
//       },
//     },
//     {
//       $addFields: {
//         dateAsDate: { $dateFromString: { dateString: '$_id' } },
//       },
//     },
//     {
//       $sort: { dateAsDate: 1 },
//     },
//     {
//       $project: {
//         _id: 1,
//         totalQty: 1,
//         totalBales: 1,
//       },
//     },
//     { $skip: skipCount },
//     { $limit: limit },
//   ]);

//   const totalQtySum = total_records.reduce((sum: any, item: { totalQty: any; }) => sum + item.totalQty, 0);
//   const totalbalesSum = total_records.reduce(
//     (sum: any, item: { totalBales: any; }) => sum + item.totalBales,
//     0
//   );

//   const result = {
//     groupby: monthdtl,
//     totalQtySum: totalQtySum,
//     totalbalesSum: totalbalesSum,
//     total_records: total_records.length,
//   };
// return result
//  }

//   else if (input.month_group !== '' && input.product !== '') {

//     console.log('month product wise ')
//     const limit = input.perPage;
//     const skipCount = (input.pageno - 1) * limit;
//     const productObjectId = new mongoose.Types.ObjectId(input.product);
//     const total_records = await ProductionDtlModel.aggregate([
//       {
//         $match: {
//           date: {
//             $gte: new Date(input.fromDate),
//             $lte: new Date(input.toDate),
//           },
//           product: productObjectId,
//           isDeleted: false,
//         },
//       },
//       {
//         $group: {
//           _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
//           totalQty: { $sum: '$qty' },
//           totalBales: { $sum: { $toInt: '$bales' } },
//         },
//       },
//     ]);


//     const monthdtl = await ProductionDtlModel.aggregate([
//       {
//         $match: {
//           date: {
//             $gte: new Date(input.fromDate),
//             $lte: new Date(input.toDate),
//           },
//           product: productObjectId,
//           isDeleted: false,
//         },
//       },
//       {
//         $group: {
//           _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
//           totalQty: { $sum: '$qty' },
//           totalBales: { $sum: { $toInt: '$bales' } },
//         },
//       },
//       {
//         $addFields: {
//           dateAsDate: { $dateFromString: { dateString: '$_id' } },
//         },
//       },
//       {
//         $sort: { dateAsDate: 1 },
//       },
//       {
//         $project: {
//           _id: 1,
//           totalQty: 1,
//           totalBales: 1,
//         },
//       },
//       { $skip: skipCount },
//       { $limit: limit },
//     ]);

//     const totalQtySum = total_records.reduce((sum: any, item: { totalQty: any; }) => sum + item.totalQty, 0);
//     const totalbalesSum = total_records.reduce(
//       (sum: any, item: { totalBales: any; }) => sum + item.totalBales,
//       0
//     );

//     const result = {
//       groupby: monthdtl,
//       totalQtySum: totalQtySum,
//       totalbalesSum: totalbalesSum,
//       total_records: total_records.length,
//     };
//     return result
//   }
//   else if  (
//     (input.product !== '' || input.machine !== '') &&
//     input.month_group === '' &&
//     input.product_group === '' && input.lot_summary == ''
//    ) {

//     console.log('machine  to product ');

//     const limit = input.perPage;
//     const skipCount = (input.pageno - 1) * limit;
//     interface MatchConditions {
//       date: {
//         $gte: Date;
//         $lte: Date;
//       };
//       isDeleted: boolean;
//       product?: mongoose.Types.ObjectId;
//       machine?: mongoose.Types.ObjectId;
//     }
//     const matchConditions :MatchConditions = {
//       date: {
//         $gte: new Date(input.fromDate),
//         $lte: new Date(input.toDate),
//       },
//       isDeleted: false,
//     };


//     if (input.machine) {
//       matchConditions.machine = new mongoose.Types.ObjectId(input.machine);
//     }

//     if (input.product) {
//       matchConditions.product = new mongoose.Types.ObjectId(input.product);
//     }
//     if(input.machine && input.product){
//       matchConditions.product = new mongoose.Types.ObjectId(input.product);
//       matchConditions.machine = new mongoose.Types.ObjectId(input.machine);
//     }

//     const total_Records = await ProductionDtlModel.aggregate([
//       {
//         $match: matchConditions 

//       },
//     ]);

//     const group_by = await ProductionDtlModel.aggregate([
//       {
//         $match: matchConditions 

//       },
//       {
//         $group: {
//           _id: 'null',
//           qty: {
//             $sum: '$qty',
//           },
//           totalBales: {
//             $sum: {
//               $toInt: '$bales',
//             },
//           },
//         },
//       },
//     ]);

//     const total_Qty = group_by.map((item: { qty: any; }) => item.qty);

//     const total_Bales = group_by.map((item: { totalBales: any; }) => item.totalBales);

//     const production_dtl = await ProductionDtlModel.aggregate([
//       {
//         $match: matchConditions 

//       },
//       {
//         $lookup: {
//           from: 'productions',
//           localField: 'production',
//           foreignField: '_id',
//           as: 'production',
//         },
//       },
//       {
//         $lookup: {
//           from: 'products',
//           localField: 'product',
//           foreignField: '_id',
//           as: 'product',
//         },
//       },
//       {
//         $lookup: {
//           from: 'machines',
//           localField: 'machine',
//           foreignField: '_id',
//           as: 'machine',
//         },
//       },
//       { $limit: limit },
//       { $skip: skipCount },
//     ]);

//     const result = {
//       groupby: production_dtl,
//       total_records: total_Records.length,
//       paginated_record: production_dtl.length,
//       total_Qty: total_Qty,
//       total_Bales: total_Bales,
//     };

//     return result;
//   }
//  else if (
//   (!input.lot_summary || input.lot_summary.trim() === '') &&
//   input.product_group && input.product_group.trim() !== '' &&
//   (!input.machine || input.machine.trim() === '') &&
//   (!input.product || input.product.trim() === '')
// )
//  {
//     console.log('product to product && machine ');
//     interface MatchConditions {
//       date: {
//         $gte: Date;
//         $lte: Date;
//       };
//       isDeleted: boolean;
//       product?: mongoose.Types.ObjectId;
//       machine?: mongoose.Types.ObjectId;
//     }
//     const matchConditions :MatchConditions = {
//       date: {
//         $gte: new Date(input.fromDate),
//         $lte: new Date(input.toDate),
//       },
//       isDeleted: false,
//     };

//     if (input.machine) {
//       matchConditions.machine = new mongoose.Types.ObjectId(input.machine);
//     }

//     if (input.product) {
//       matchConditions.product = new mongoose.Types.ObjectId(input.product);
//     }
//     if (input.product !=='' && input.machine !==''){
//       matchConditions.machine = new mongoose.Types.ObjectId(input.machine);
//       matchConditions.product = new mongoose.Types.ObjectId(input.product);
//     }

//     const machinedtl = await ProductionDtlModel.aggregate([
// {
//   $match:matchConditions
// },
//       {
//         $lookup: {
//           from: 'products',
//           localField: 'product',
//           foreignField: '_id',
//           as: 'product',
//         },
//       },
//       {
//         $lookup: {
//           from: 'machines',
//           localField: 'machine',
//           foreignField: '_id',
//           as: 'machine',
//         },
//       },
//       {
//         $group: {
//           _id: '$product._id',
//           productName: { $first: '$product.name' },
//           machineName: { $first: '$machine.name' },
//           totalContracts: { $sum: 1 },
//           totalQty: { $sum: '$qty' },
//           totalbales: {
//             $sum: {
//               $toInt: '$bales',
//             },
//           },
//         },
//       },
//       {
//         $match: {
//           totalQty: { $gt: 0 },
//           totalbales: { $gt: 0 },
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           productName: 1,
//           machineName: 1,
//           totalContracts: 1,
//           totalQty: 1,
//           totalbales: 1,
//         },
//       },
//       {
//         $sort: {
//           totalQty: -1,
//           totalbales: -1,
//         },
//       },
//     ]);


//     const totalQtySum = machinedtl.reduce(
//       (sum: any, item: { totalQty: any; }) => sum + item.totalQty,
//       0
//     );
//     const totalbalesSum = machinedtl.reduce(
//       (sum: any, item: { totalbales: any; }) => sum + item.totalbales,
//       0
//     );
//     const totalContractSum = machinedtl.reduce(
//       (sum: any, item: { totalContracts: any; }) => sum + item.totalContracts,
//       0
//     );
//     const result = {
//       groupby: machinedtl,
//       totalQtySum: totalQtySum,
//       totalbalesSum: totalbalesSum,
//       totalContractSum: totalContractSum,
//     };
//     return result;
//   }
//  else if (
//     input.product == '' &&
//     input.product_group !== '' &&
//     input.machine !== ''
//   ) {
//     console.log('product to machine');

//     const machinedtl = await ProductionDtlModel.aggregate([
//       {
//         $match: {
//           date: {
//             $gte: new Date(input.fromDate),
//             $lte: new Date(input.toDate),
//           },
//           isDeleted: false,
//           machine: new mongoose.Types.ObjectId(input.machine),
//         },
//       },
//       {
//         $lookup: {
//           from: 'machines',
//           localField: 'machine',
//           foreignField: '_id',
//           as: 'machineDetails',
//         },
//       },
//       {
//         $lookup: {
//           from: 'products',
//           localField: 'product',
//           foreignField: '_id',
//           as: 'product',
//         },
//       },
//       {
//         $group: {
//           _id: '$product._id',
//           productName: { $first: '$product.name' },
//           machineName: { $first: '$machineDetails.name' },
//           totalContracts: { $sum: 1 },
//           totalQty: { $sum: '$qty' },
//           totalbales: {
//             $sum: {
//               $toInt: '$bales',
//             },
//           },
//         },
//       },
//       {
//         $match: {
//           totalQty: { $gt: 0 },
//           totalbales: { $gt: 0 },
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           productName: 1,
//           machineName: 1,
//           totalContracts: 1,
//           totalQty: 1,
//           totalbales: 1,
//         },
//       },
//       {
//         $sort: {
//           totalQty: -1,
//           totalbales: -1,
//         },
//       },
//     ]);

//     const totalQtySum = machinedtl.reduce(
//       (sum: any, item: { totalQty: any; }) => sum + item.totalQty,
//       0
//     );
//     const totalbalesSum = machinedtl.reduce(
//       (sum: any, item: { totalbales: any; }) => sum + item.totalbales,
//       0
//     );
//     const totalContractSum = machinedtl.reduce(
//       (sum: any, item: { totalContracts: any; }) => sum + item.totalContracts,
//       0
//     );
//     const result = {
//       groupby: machinedtl,
//       totalQtySum: totalQtySum,
//       totalbalesSum: totalbalesSum,
//       totalContractSum: totalContractSum,
//     };
//     return result;
//   } else if (
//     input.lot_group !== '' &&
//     input.machine == '' &&
//     input.product_group == '' &&
//     input.product == ''
//   ) {
//     console.log('supplier code');
//     const limit = input.perPage;
//     const skipCount = (input.pageno - 1) * limit;
//     const total_records = await ProductionDtlModel.aggregate([
//       {
//         $match: {
//           date: {
//             $gte: new Date(input.fromDate),
//             $lte: new Date(input.toDate),
//           },
//           isDeleted: false,
//         },
//       },
//       {
//         $group: {
//           _id: '$lot',
//           qty: {
//             $sum: '$qty',
//           },
//           bales: {
//             $sum: {
//               $toInt: '$bales',
//             },
//           },
//           totalrecords: {
//             $sum: 1,
//           },
//         },
//       },
//       { $sort: { qty: -1, bales: -1 } },
//     ]);
//     const lotdetails = await ProductionDtlModel.aggregate([
//       {
//         $match: {
//           date: {
//             $gte: new Date(input.fromDate),
//             $lte: new Date(input.toDate),
//           },
//           isDeleted: false,
//         },
//       },
//       {
//         $lookup: {
//           from: 'products',
//           localField: 'product',
//           foreignField: '_id',
//           as: 'productDetails',
//         },
//       },
//       {
//         $unwind: '$productDetails',
//       },
//       {
//         $group: {
//           _id: '$lot',
//           productName: { $first: '$productDetails.name' },
//           qty: { $sum: '$qty' },
//           bales: { $sum: { $toInt: '$bales' } },
//           totalrecords: { $sum: 1 },
//         },
//       },
//       { $sort: { qty: -1, bales: -1 } },
//       {
//         $project: {
//           _id: 0,
//           lot: '$_id',
//           productName: 1,
//           qty: 1,
//           bales: 1,
//           totalrecords: 1,
//         },
//       },
//       { $skip: skipCount },
//       { $limit: limit },
//     ]);

//     const totalQtySum = total_records.reduce((sum: any, item: { qty: any; }) => sum + item.qty, 0);
//     const totalbalesSum = total_records.reduce((sum: any, item: { bales: any; }) => sum + item.bales, 0);

//     const result = {
//       groupby: lotdetails,
//       totalQtySum: totalQtySum,
//       totalbalesSum: totalbalesSum,
//       total_records: total_records.length,
//     };
//     return result;


// }

// else if (
//   input.lot_summary !== '' &&
//   input.lot_group == '' &&
//   input.machine == '' &&
//   input.product_group == '' &&
//   input.product !== ''
// ) {
//   console.log('lot_no + product filter group');

//   const limit = input.perPage;
//   const skipCount = (input.pageno - 1) * limit;


//   const productObjectId = new mongoose.Types.ObjectId(input.product);

//   const baseMatch = {
//     date: { $gte: new Date(input.fromDate), $lte: new Date(input.toDate) },
//     isDeleted: false,
//     product: productObjectId, // match directly here
//   };

//   // === TOTAL RECORDS ===
//   const total_records = await ProductionDtlModel.aggregate([
//     { $match: baseMatch },
//     {
//       $lookup: {
//         from: 'productions',
//         localField: 'production',
//         foreignField: '_id',
//         as: 'productionDetails',
//       },
//     },
//     { $unwind: '$productionDetails' },
//     {
//       $group: {
//         _id: '$productionDetails.lot_no',
//         qty: { $sum: '$qty' },
//         bales: { $sum: { $toInt: '$bales' } },
//         totalrecords: { $sum: 1 },
//       },
//     },
//     { $sort: { qty: -1, bales: -1 } },
//   ]);

//   // === PAGINATED DETAILS ===
//   const lotdetails = await ProductionDtlModel.aggregate([
//     { $match: baseMatch },
//     {
//       $lookup: {
//         from: 'products',
//         localField: 'product',
//         foreignField: '_id',
//         as: 'productDetails',
//       },
//     },
//     { $unwind: '$productDetails' },
//     {
//       $lookup: {
//         from: 'productions',
//         localField: 'production',
//         foreignField: '_id',
//         as: 'productionDetails',
//       },
//     },
//     { $unwind: '$productionDetails' },
//     {
//       $group: {
//         _id: '$productionDetails.lot_no',
//         productName: { $first: '$productDetails.name' },
//         qty: { $sum: '$qty' },
//         bales: { $sum: { $toInt: '$bales' } },
//         totalrecords: { $sum: 1 },
//       },
//     },
//     { $sort: { qty: -1, bales: -1 } },
//     {
//       $project: {
//         _id: 0,
//         lot: '$_id',
//         productName: 1,
//         qty: 1,
//         bales: 1,
//         totalrecords: 1,
//       },
//     },
//     { $skip: skipCount },
//     { $limit: limit },
//   ]);

//   const totalQtySum = total_records.reduce((sum, item) => sum + (item.qty || 0), 0);
//   const totalbalesSum = total_records.reduce((sum, item) => sum + (item.bales || 0), 0);

//   const result = {
//     groupby: lotdetails,
//     totalQtySum,
//     totalbalesSum,
//     total_records: total_records.length,
//   };

//   return result;
// }

// }

export const findProductionsDtlsByDate = async (input: ProductionReportSchema) => {
  const {
    fromDate,
    toDate,
    pageno = 1,
    perPage = 10,
    supplierCode_group,
    month_group,
    machine,
    product,
    isDeleted,
    lotNo_group,
    product_group,
  } = input;

  // pagination contants
  const limit = perPage;
  const skipCount = (pageno - 1) * limit;

  //  Group condition setter
  const groupId: any = {};
  const shouldGroup = product_group || supplierCode_group || month_group || lotNo_group;

  if (product_group) groupId.product = '$products';
  if (supplierCode_group) groupId.supplierCode = '$supplierCode';
  if (lotNo_group) groupId.lotNo = '$lotNo';
  if (month_group) groupId.month = { $dateToString: { format: '%Y-%m', date: '$date' } };

  const matchStage: any = { isDeleted: false };

  if (fromDate && toDate) {
    matchStage.date = {
      $gte: new Date(fromDate),
      $lte: new Date(toDate),
    };
  }


  if (product && product.trim() !== '') {
    matchStage.product = new mongoose.Types.ObjectId(product);
  }

  if (machine && machine.trim() !== '') {
    matchStage.machine = new mongoose.Types.ObjectId(machine);
  }
      if (isDeleted && isDeleted.toString().toLowerCase() === "true") {

  matchStage.isDeleted = true;
}


  const basePipeline: any[] = [
    {
      $match: matchStage
    },
    {
      $lookup: {
        from: "productions",
        localField: "production",
        foreignField: "_id",
        as: "productions"
      }
    },
    {
      $unwind: {
        path: "$productions",
        preserveNullAndEmptyArrays: false
      }
    },
    {
      $lookup: {
        from: "products",
        localField: "product",
        foreignField: "_id",
        as: "products"
      }
    },
    {
      $unwind: {
        path: "$products",
        preserveNullAndEmptyArrays: false
      }
    },
    {
      $lookup: {
        from: "machines",
        localField: "machine",
        foreignField: "_id",
        as: "machines"
      }
    },
    {
      $unwind: {
        path: "$machines",
        preserveNullAndEmptyArrays: false
      }
    },
    {
      $project: {
        date: "$date",
        tran: "$productions.tran",
        machines: "$machines.name",
        products: "$products.name",
        lotNo: "$productions.lot_no",
        supplierCode: "$lot",
        bales: "$bales",
        qty: "$qty"
      }
    },
    {
      $sort: { date: -1 }
    },

  ]

  const basePipelineSummary: any[] = [
    {
      $match: matchStage
    },
    {
      $lookup: {
        from: "productions",
        localField: "production",
        foreignField: "_id",
        as: "productions"
      }
    },
    {
      $unwind: {
        path: "$productions",
        preserveNullAndEmptyArrays: false
      }
    },
    {
      $lookup: {
        from: "products",
        localField: "product",
        foreignField: "_id",
        as: "products"
      }
    },
    {
      $unwind: {
        path: "$products",
        preserveNullAndEmptyArrays: false
      }
    },
    {
      $lookup: {
        from: "machines",
        localField: "machine",
        foreignField: "_id",
        as: "machines"
      }
    },
    {
      $unwind: {
        path: "$machines",
        preserveNullAndEmptyArrays: false
      }
    },
    {
      $project: {
        date: "$date",
        machines: "$machines.name",
        tran: "$productions.tran",
        products: "$products.name",
        lotNo: "$productions.lot_no",
        supplierCode: "$lot",
        bales: "$bales",
        qty: "$qty"
      }
    },
    {
      $sort: { date: -1 }
    },

  ]
  const sortStage = { $sort: { totalQty: -1, totalBales: -1 } };




  const groupStage = {
    $group:
    {
      _id: groupId,
      products: { $first: "$products" },
      lotNo: { $first: "$lotNo" },
      machine: { $first: "$machines" },
      totalProductions: { $sum: 1 },
      supplierCode: { $first: "$supplierCode" },
      totalQty: { $sum: "$qty" },
      totalBales: { $sum: { $toInt: "$bales" } }

    }
  }
  const groupStageSummary = {
    $group:
    {
      _id: '',
      // products:{$first:"$products"},
      // lotNo:{$first:"$lotNo"},
      // supplierCode:{$first:"$supplierCode"},
      totalProductions: { $sum: 1 },
      totalQty: { $sum: "$qty" },
      totalBales: { $sum: { $toInt: "$bales" } }

    }
  }

  // If grouping is not required, we can skip the group stage
  const dataPipeline = shouldGroup
    ? [...basePipeline, groupStage, sortStage, { $skip: skipCount }, { $limit: limit }]
    : [...basePipeline, { $skip: skipCount }, { $limit: limit }]

  // Count pipeline for total records
  const countPipeline = shouldGroup
    ? [...basePipeline, groupStage, { $count: 'totalRecords' }]
    : [...basePipeline, { $count: 'totalRecords' }];


  const summaryPipeline = shouldGroup
    ? [...basePipelineSummary, groupStageSummary]
    : [
      ...basePipelineSummary,
      {
        $group: {
          _id: null,
          totalProductions: { $sum: 1 },
          totalQty: { $sum: "$qty" },
          totalBales: { $sum: { $toInt: "$bales" } }
        },
      },
    ];
  // Executing the pipelines in parallel
  const [productiondtl, totalResult, summaryResult] = await Promise.all([
    ProductionDtlModel.aggregate(dataPipeline, { allowDiskUse: true }),
    ProductionDtlModel.aggregate(countPipeline, { allowDiskUse: true }),
    ProductionDtlModel.aggregate(summaryPipeline, { allowDiskUse: true }),
  ]);

  const totalRecords = totalResult?.[0]?.totalRecords || 0;
  const summary = summaryResult?.[0] || {
    totalProductions: 0,
    totalQty: 0,
    totalBales: 0,

  };
  return {
    productiondtl,
    summary,
    pagination: {
      page: pageno,
      perPage,
      totalRecords,
      totalPages: Math.ceil(totalRecords / perPage),
    },
  };

}




// export const findProductionsDtlsPrintByDate_old = async (
//   input: ProductionReportPrintSchema
// ) => {
//   if (
//     input.machine == '' &&
//     input.product == '' &&
//     input.product_group == '' &&
//     input.lot_group == '' &&
//     input.month_group == '' && input.lot_summary == ''
//   ) {
//     console.log('default filter');


//     const total_Records = await ProductionDtlModel.aggregate([
//       {
//         $match: {
//           date: {
//             $gte: new Date(input.fromDate),
//             $lte: new Date(input.toDate),
//           },
//           isDeleted: false,
//         },
//       },
//     ]);
//     const group_by = await ProductionDtlModel.aggregate([
//       {
//         $match: {
//           date: {
//             $gte: new Date(input.fromDate),
//             $lte: new Date(input.toDate),
//           },
//           isDeleted: false,
//         },
//       },
//       {
//         $group: {
//           _id: 'null',
//           qty: {
//             $sum: '$qty',
//           },
//           totalBales: {
//             $sum: {
//               $toInt: '$bales',
//             },
//           },
//         },
//       },
//     ]);
//     const total_Qty = group_by.map((item: { qty: any; }) => item.qty);
//     const total_Bales = group_by.map((item: { totalBales: any; }) => item.totalBales);

//     const production_dtl = await ProductionDtlModel.aggregate([
//       {
//         $match: {
//           date: {
//             $gte: new Date(input.fromDate),
//             $lte: new Date(input.toDate),
//           },
//           isDeleted: false,
//         },
//       },
//       {
//         $lookup: {
//           from: 'productions',
//           localField: 'production',
//           foreignField: '_id',
//           as: 'production',
//         },
//       },
//       {
//         $lookup: {
//           from: 'products',
//           localField: 'product',
//           foreignField: '_id',
//           as: 'product',
//         },
//       },
//       {
//         $lookup: {
//           from: 'machines',
//           localField: 'machine',
//           foreignField: '_id',
//           as: 'machine',
//         },
//       },

//     ]);

//     const result = {
//       production_dtl: production_dtl,
//       total_records: total_Records.length,
//       pagianted_record: production_dtl.length,
//       total_Qty: total_Qty[0],
//       total_Bales: total_Bales[0],
//     };
//     return result;
//   }

//   else if (
//     input.product_group !== '' &&
//     input.machine == '' &&
//     input.product == '' && input.lot_summary == ''
//   ) {

//     console.log('product group general');

//     const total_record = await ProductionDtlModel.aggregate([
//       {
//         $match: {
//           date: {
//             $gte: new Date(input.fromDate),
//             $lte: new Date(input.toDate),
//           },
//           isDeleted: false,
//         },
//       },
//       {
//         $lookup: {
//           from: 'products',
//           localField: 'product',
//           foreignField: '_id',
//           as: 'productDetails',
//         },
//       },
//       {
//         $unwind: '$productDetails',
//       },
//       {
//         $group: {
//           _id: '$productDetails',
//           productName: {
//             $first: '$productDetails.name',
//           },
//           totalContracts: {
//             $sum: 1,
//           },
//           totalQty: {
//             $sum: '$qty',
//           },
//           totalbales: {
//             $sum: {
//               $convert: {
//                 input: '$bales',
//                 to: 'int',
//               },
//             },
//           },
//         },
//       },
//       {
//         $match: {
//           totalQty: {
//             $gt: 0,
//           },
//           totalbales: {
//             $gt: 0,
//           },
//         },
//       },
//       {
//         $project: {
//           productName: 1,
//           totalContracts: 1,
//           totalQty: 1,
//           totalbales: 1,
//         },
//       },
//       {
//         $sort: {
//           totalQty: -1,
//           totalbales: -1,
//         },
//       },


//     ]);

//     const productdtl = await ProductionDtlModel.aggregate([
//       {
//         $match: {
//           date: {
//             $gte: new Date(input.fromDate),
//             $lte: new Date(input.toDate),
//           },
//           isDeleted: false,
//         },
//       },
//       {
//         $lookup: {
//           from: 'products',
//           localField: 'product',
//           foreignField: '_id',
//           as: 'productDetails',
//         },
//       },
//       {
//         $unwind: '$productDetails',
//       },
//       {
//         $group: {
//           _id: '$productDetails',
//           productName: {
//             $first: '$productDetails.name',
//           },
//           totalContracts: {
//             $sum: 1,
//           },
//           totalQty: {
//             $sum: '$qty',
//           },
//           totalbales: {
//             $sum: {
//               $convert: {
//                 input: '$bales',
//                 to: 'int',
//               },
//             },
//           },
//         },
//       },
//       {
//         $match: {
//           totalQty: {
//             $gt: 0,
//           },
//           totalbales: {
//             $gt: 0,
//           },
//         },
//       },
//       {
//         $project: {
//           productName: 1,
//           totalContracts: 1,
//           totalQty: 1,
//           totalbales: 1,
//         },
//       },
//       {
//         $sort: {
//           totalQty: -1,
//           totalbales: -1,
//         },
//       },


//     ]);
//     const totalQtySum = total_record.reduce(
//       (sum: any, item: { totalQty: any; }) => sum + item.totalQty,
//       0
//     );
//     const totalbalesSum = total_record.reduce(
//       (sum: any, item: { totalbales: any; }) => sum + item.totalbales,
//       0
//     );
//     const totalContractSum = total_record.reduce(
//       (sum: any, item: { totalContracts: any; }) => sum + item.totalContracts,
//       0
//     );
//     const result = {
//       groupby: productdtl,
//       totalQtySum: totalQtySum,
//       totalbalesSum: totalbalesSum,
//       totalContractSum: totalContractSum,
//       total_records: productdtl.length,
//     };
//     return result;
//   } 
//  else if (input.month_group !== '' && input.product == '') {

// console.log('month group')


//   const total_records = await ProductionDtlModel.aggregate([
//     {
//       $match: {
//         date: {
//           $gte: new Date(input.fromDate),
//           $lte: new Date(input.toDate),
//         },
//         isDeleted: false,
//       },
//     },
//     {
//       $group: {
//         _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
//         totalQty: { $sum: '$qty' },
//         totalBales: { $sum: { $toInt: '$bales' } },
//       },
//     },
//   ]);
//   const monthdtl = await ProductionDtlModel.aggregate([
//     {
//       $match: {
//         date: {
//           $gte: new Date(input.fromDate),
//           $lte: new Date(input.toDate),
//         },
//         isDeleted: false,
//       },
//     },
//     {
//       $group: {
//         _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
//         totalQty: { $sum: '$qty' },
//         totalBales: { $sum: { $toInt: '$bales' } },
//       },
//     },
//     {
//       $addFields: {
//         dateAsDate: { $dateFromString: { dateString: '$_id' } },
//       },
//     },
//     {
//       $sort: { dateAsDate: 1 },
//     },
//     {
//       $project: {
//         _id: 1,
//         totalQty: 1,
//         totalBales: 1,
//       },
//     },

//   ]);

//   const totalQtySum = total_records.reduce((sum: any, item: { totalQty: any; }) => sum + item.totalQty, 0);
//   const totalbalesSum = total_records.reduce(
//     (sum: any, item: { totalBales: any; }) => sum + item.totalBales,
//     0
//   );

//   const result = {
//     groupby: monthdtl,
//     totalQtySum: totalQtySum,
//     totalbalesSum: totalbalesSum,
//     total_records: total_records.length,
//   };
// return result
//  }

//   else if (input.month_group !== '' && input.product !== '') {

//     console.log('month product wise ')

//     const productObjectId = new mongoose.Types.ObjectId(input.product);
//     const total_records = await ProductionDtlModel.aggregate([
//       {
//         $match: {
//           date: {
//             $gte: new Date(input.fromDate),
//             $lte: new Date(input.toDate),
//           },
//           product: productObjectId,
//           isDeleted: false,
//         },
//       },
//       {
//         $group: {
//           _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
//           totalQty: { $sum: '$qty' },
//           totalBales: { $sum: { $toInt: '$bales' } },
//         },
//       },
//     ]);


//     const monthdtl = await ProductionDtlModel.aggregate([
//       {
//         $match: {
//           date: {
//             $gte: new Date(input.fromDate),
//             $lte: new Date(input.toDate),
//           },
//           product: productObjectId,
//           isDeleted: false,
//         },
//       },
//       {
//         $group: {
//           _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
//           totalQty: { $sum: '$qty' },
//           totalBales: { $sum: { $toInt: '$bales' } },
//         },
//       },
//       {
//         $addFields: {
//           dateAsDate: { $dateFromString: { dateString: '$_id' } },
//         },
//       },
//       {
//         $sort: { dateAsDate: 1 },
//       },
//       {
//         $project: {
//           _id: 1,
//           totalQty: 1,
//           totalBales: 1,
//         },
//       },

//     ]);

//     const totalQtySum = total_records.reduce((sum: any, item: { totalQty: any; }) => sum + item.totalQty, 0);
//     const totalbalesSum = total_records.reduce(
//       (sum: any, item: { totalBales: any; }) => sum + item.totalBales,
//       0
//     );

//     const result = {
//       groupby: monthdtl,
//       totalQtySum: totalQtySum,
//       totalbalesSum: totalbalesSum,
//       total_records: total_records.length,
//     };
//     return result
//   }
//   else if  (
//     (input.product !== '' || input.machine !== '') &&
//     input.month_group === '' &&
//     input.product_group === '' && input.lot_summary == ''
//    ) {

//     console.log('machine  to product ');

//     interface MatchConditions {
//       date: {
//         $gte: Date;
//         $lte: Date;
//       };
//       isDeleted: boolean;
//       product?: mongoose.Types.ObjectId;
//       machine?: mongoose.Types.ObjectId;
//     }
//     const matchConditions :MatchConditions = {
//       date: {
//         $gte: new Date(input.fromDate),
//         $lte: new Date(input.toDate),
//       },
//       isDeleted: false,
//     };


//     if (input.machine) {
//       matchConditions.machine = new mongoose.Types.ObjectId(input.machine);
//     }

//     if (input.product) {
//       matchConditions.product = new mongoose.Types.ObjectId(input.product);
//     }
//     if(input.machine && input.product){
//       matchConditions.product = new mongoose.Types.ObjectId(input.product);
//       matchConditions.machine = new mongoose.Types.ObjectId(input.machine);
//     }

//     const total_Records = await ProductionDtlModel.aggregate([
//       {
//         $match: matchConditions 

//       },
//     ]);

//     const group_by = await ProductionDtlModel.aggregate([
//       {
//         $match: matchConditions 

//       },
//       {
//         $group: {
//           _id: 'null',
//           qty: {
//             $sum: '$qty',
//           },
//           totalBales: {
//             $sum: {
//               $toInt: '$bales',
//             },
//           },
//         },
//       },
//     ]);

//     const total_Qty = group_by.map((item: { qty: any; }) => item.qty);

//     const total_Bales = group_by.map((item: { totalBales: any; }) => item.totalBales);

//     const production_dtl = await ProductionDtlModel.aggregate([
//       {
//         $match: matchConditions 

//       },
//       {
//         $lookup: {
//           from: 'productions',
//           localField: 'production',
//           foreignField: '_id',
//           as: 'production',
//         },
//       },
//       {
//         $lookup: {
//           from: 'products',
//           localField: 'product',
//           foreignField: '_id',
//           as: 'product',
//         },
//       },
//       {
//         $lookup: {
//           from: 'machines',
//           localField: 'machine',
//           foreignField: '_id',
//           as: 'machine',
//         },
//       },

//     ]);

//     const result = {
//       groupby: production_dtl,
//       total_records: total_Records.length,
//       paginated_record: production_dtl.length,
//       total_Qty: total_Qty,
//       total_Bales: total_Bales,
//     };

//     return result;
//   }

//   else if (
//   (!input.lot_summary || input.lot_summary.trim() === '') &&
//   input.product_group && input.product_group.trim() !== '' &&
//   (!input.machine || input.machine.trim() === '') &&
//   (!input.product || input.product.trim() === '')
// ) {
//     console.log('product to product && machine ');
//     interface MatchConditions {
//       date: {
//         $gte: Date;
//         $lte: Date;
//       };
//       isDeleted: boolean;
//       product?: mongoose.Types.ObjectId;
//       machine?: mongoose.Types.ObjectId;
//     }
//     const matchConditions :MatchConditions = {
//       date: {
//         $gte: new Date(input.fromDate),
//         $lte: new Date(input.toDate),
//       },
//       isDeleted: false,
//     };

//     if (input.machine) {
//       matchConditions.machine = new mongoose.Types.ObjectId(input.machine);
//     }

//     if (input.product) {
//       matchConditions.product = new mongoose.Types.ObjectId(input.product);
//     }
//     if (input.product !=='' && input.machine !==''){
//       matchConditions.machine = new mongoose.Types.ObjectId(input.machine);
//       matchConditions.product = new mongoose.Types.ObjectId(input.product);
//     }

//     const machinedtl = await ProductionDtlModel.aggregate([
// {
//   $match:matchConditions
// },
//       {
//         $lookup: {
//           from: 'products',
//           localField: 'product',
//           foreignField: '_id',
//           as: 'product',
//         },
//       },
//       {
//         $lookup: {
//           from: 'machines',
//           localField: 'machine',
//           foreignField: '_id',
//           as: 'machine',
//         },
//       },
//       {
//         $group: {
//           _id: '$product._id',
//           productName: { $first: '$product.name' },
//           machineName: { $first: '$machine.name' },
//           totalContracts: { $sum: 1 },
//           totalQty: { $sum: '$qty' },
//           totalbales: {
//             $sum: {
//               $toInt: '$bales',
//             },
//           },
//         },
//       },
//       {
//         $match: {
//           totalQty: { $gt: 0 },
//           totalbales: { $gt: 0 },
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           productName: 1,
//           machineName: 1,
//           totalContracts: 1,
//           totalQty: 1,
//           totalbales: 1,
//         },
//       },
//       {
//         $sort: {
//           totalQty: -1,
//           totalbales: -1,
//         },
//       },
//     ]);


//     const totalQtySum = machinedtl.reduce(
//       (sum: any, item: { totalQty: any; }) => sum + item.totalQty,
//       0
//     );
//     const totalbalesSum = machinedtl.reduce(
//       (sum: any, item: { totalbales: any; }) => sum + item.totalbales,
//       0
//     );
//     const totalContractSum = machinedtl.reduce(
//       (sum: any, item: { totalContracts: any; }) => sum + item.totalContracts,
//       0
//     );
//     const result = {
//       groupby: machinedtl,
//       totalQtySum: totalQtySum,
//       totalbalesSum: totalbalesSum,
//       totalContractSum: totalContractSum,
//     };
//     return result;
//   }


//  else if (
//     input.product == '' &&
//     input.product_group !== '' &&
//     input.machine !== ''
//   ) {
//     console.log('product to machine');

//     const machinedtl = await ProductionDtlModel.aggregate([
//       {
//         $match: {
//           date: {
//             $gte: new Date(input.fromDate),
//             $lte: new Date(input.toDate),
//           },
//           isDeleted: false,
//           machine: new mongoose.Types.ObjectId(input.machine),
//         },
//       },
//       {
//         $lookup: {
//           from: 'machines',
//           localField: 'machine',
//           foreignField: '_id',
//           as: 'machineDetails',
//         },
//       },
//       {
//         $lookup: {
//           from: 'products',
//           localField: 'product',
//           foreignField: '_id',
//           as: 'product',
//         },
//       },
//       {
//         $group: {
//           _id: '$product._id',
//           productName: { $first: '$product.name' },
//           machineName: { $first: '$machineDetails.name' },
//           totalContracts: { $sum: 1 },
//           totalQty: { $sum: '$qty' },
//           totalbales: {
//             $sum: {
//               $toInt: '$bales',
//             },
//           },
//         },
//       },
//       {
//         $match: {
//           totalQty: { $gt: 0 },
//           totalbales: { $gt: 0 },
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           productName: 1,
//           machineName: 1,
//           totalContracts: 1,
//           totalQty: 1,
//           totalbales: 1,
//         },
//       },
//       {
//         $sort: {
//           totalQty: -1,
//           totalbales: -1,
//         },
//       },
//     ]);

//     const totalQtySum = machinedtl.reduce(
//       (sum: any, item: { totalQty: any; }) => sum + item.totalQty,
//       0
//     );
//     const totalbalesSum = machinedtl.reduce(
//       (sum: any, item: { totalbales: any; }) => sum + item.totalbales,
//       0
//     );
//     const totalContractSum = machinedtl.reduce(
//       (sum: any, item: { totalContracts: any; }) => sum + item.totalContracts,
//       0
//     );
//     const result = {
//       groupby: machinedtl,
//       totalQtySum: totalQtySum,
//       totalbalesSum: totalbalesSum,
//       totalContractSum: totalContractSum,
//     };
//     return result;
//   } else if (
//     input.lot_group !== '' &&
//     input.machine == '' &&
//     input.product_group == '' &&
//     input.product == ''
//   ) {
//     console.log('supplier code');

//     const total_records = await ProductionDtlModel.aggregate([
//       {
//         $match: {
//           date: {
//             $gte: new Date(input.fromDate),
//             $lte: new Date(input.toDate),
//           },
//           isDeleted: false,
//         },
//       },
//       {
//         $group: {
//           _id: '$lot',
//           qty: {
//             $sum: '$qty',
//           },
//           bales: {
//             $sum: {
//               $toInt: '$bales',
//             },
//           },
//           totalrecords: {
//             $sum: 1,
//           },
//         },
//       },
//       { $sort: { qty: -1, bales: -1 } },
//     ]);
//     const lotdetails = await ProductionDtlModel.aggregate([
//       {
//         $match: {
//           date: {
//             $gte: new Date(input.fromDate),
//             $lte: new Date(input.toDate),
//           },
//           isDeleted: false,
//         },
//       },
//       {
//         $lookup: {
//           from: 'products',
//           localField: 'product',
//           foreignField: '_id',
//           as: 'productDetails',
//         },
//       },
//       {
//         $unwind: '$productDetails',
//       },
//       {
//         $group: {
//           _id: '$lot',
//           productName: { $first: '$productDetails.name' },
//           qty: { $sum: '$qty' },
//           bales: { $sum: { $toInt: '$bales' } },
//           totalrecords: { $sum: 1 },
//         },
//       },
//       { $sort: { qty: -1, bales: -1 } },
//       {
//         $project: {
//           _id: 0,
//           lot: '$_id',
//           productName: 1,
//           qty: 1,
//           bales: 1,
//           totalrecords: 1,
//         },
//       },

//     ]);

//     const totalQtySum = total_records.reduce((sum: any, item: { qty: any; }) => sum + item.qty, 0);
//     const totalbalesSum = total_records.reduce((sum: any, item: { bales: any; }) => sum + item.bales, 0);

//     const result = {
//       groupby: lotdetails,
//       totalQtySum: totalQtySum,
//       totalbalesSum: totalbalesSum,
//       total_records: total_records.length,
//     };
//     return result;


// }
// else if (
//   input.lot_summary !== '' &&
//   input.lot_group == '' &&
//   input.machine == '' &&
//   input.product_group == '' &&
//   input.product !== ''
// ) {
//   console.log('lot_no + product filter group');




//   const productObjectId = new mongoose.Types.ObjectId(input.product);

//   const baseMatch = {
//     date: { $gte: new Date(input.fromDate), $lte: new Date(input.toDate) },
//     isDeleted: false,
//     product: productObjectId, // match directly here
//   };

//   // === TOTAL RECORDS ===
//   const total_records = await ProductionDtlModel.aggregate([
//     { $match: baseMatch },
//     {
//       $lookup: {
//         from: 'productions',
//         localField: 'production',
//         foreignField: '_id',
//         as: 'productionDetails',
//       },
//     },
//     { $unwind: '$productionDetails' },
//     {
//       $group: {
//         _id: '$productionDetails.lot_no',
//         qty: { $sum: '$qty' },
//         bales: { $sum: { $toInt: '$bales' } },
//         totalrecords: { $sum: 1 },
//       },
//     },
//     { $sort: { qty: -1, bales: -1 } },
//   ]);

//   // === PAGINATED DETAILS ===
//   const lotdetails = await ProductionDtlModel.aggregate([
//     { $match: baseMatch },
//     {
//       $lookup: {
//         from: 'products',
//         localField: 'product',
//         foreignField: '_id',
//         as: 'productDetails',
//       },
//     },
//     { $unwind: '$productDetails' },
//     {
//       $lookup: {
//         from: 'productions',
//         localField: 'production',
//         foreignField: '_id',
//         as: 'productionDetails',
//       },
//     },
//     { $unwind: '$productionDetails' },
//     {
//       $group: {
//         _id: '$productionDetails.lot_no',
//         productName: { $first: '$productDetails.name' },
//         qty: { $sum: '$qty' },
//         bales: { $sum: { $toInt: '$bales' } },
//         totalrecords: { $sum: 1 },
//       },
//     },
//     { $sort: { qty: -1, bales: -1 } },
//     {
//       $project: {
//         _id: 0,
//         lot: '$_id',
//         productName: 1,
//         qty: 1,
//         bales: 1,
//         totalrecords: 1,
//       },
//     },

//   ]);

//   const totalQtySum = total_records.reduce((sum, item) => sum + (item.qty || 0), 0);
//   const totalbalesSum = total_records.reduce((sum, item) => sum + (item.bales || 0), 0);

//   const result = {
//     groupby: lotdetails,
//     totalQtySum,
//     totalbalesSum,
//     total_records: total_records.length,
//   };

//   return result;
// }
// };


export const findProductionsDtlsPrintByDate = async (input: ProductionReportPrintSchema) => {
  const {
    fromDate,
    toDate,
    supplierCode_group,
    month_group,
    machine,
    isDeleted,
    product,
    lotNo_group,
    product_group,
  } = input;



  //  Group condition setter
  const groupId: any = {};
  const shouldGroup = product_group || supplierCode_group || month_group || lotNo_group;

  if (product_group) groupId.product = '$products';
  if (supplierCode_group) groupId.supplierCode = '$supplierCode';
  if (lotNo_group) groupId.lotNo = '$lotNo';
  if (month_group) groupId.month = { $dateToString: { format: '%Y-%m', date: '$date' } };

  const matchStage: any = { isDeleted: false };

  if (fromDate && toDate) {
    matchStage.date = {
      $gte: new Date(fromDate),
      $lte: new Date(toDate),
    };
  }


  if (product && product.trim() !== '') {
    matchStage.product = new mongoose.Types.ObjectId(product);
  }

  if (machine && machine.trim() !== '') {
    matchStage.machine = new mongoose.Types.ObjectId(machine);
  }
      if (isDeleted && isDeleted.toString().toLowerCase() === "true") {

  matchStage.isDeleted = true;
}


  const basePipeline: any[] = [
    {
      $match: matchStage
    },
    {
      $lookup: {
        from: "productions",
        localField: "production",
        foreignField: "_id",
        as: "productions"
      }
    },
    {
      $unwind: {
        path: "$productions",
        preserveNullAndEmptyArrays: false
      }
    },
    {
      $lookup: {
        from: "products",
        localField: "product",
        foreignField: "_id",
        as: "products"
      }
    },
    {
      $unwind: {
        path: "$products",
        preserveNullAndEmptyArrays: false
      }
    },
    {
      $lookup: {
        from: "machines",
        localField: "machine",
        foreignField: "_id",
        as: "machines"
      }
    },
    {
      $unwind: {
        path: "$machines",
        preserveNullAndEmptyArrays: false
      }
    },
    {
      $project: {
         tran: "$productions.tran",
        date: "$date",
        lotNo: "$productions.lot_no",
        machines: "$machines.name",
        products: "$products.name",
        supplierCode: "$lot",
        totalBales: { $toInt: '$bales' } ,
        totalQty: "$qty"
      }
    },
    {
      $sort: { date: -1 }
    },

  ]

  const basePipelineSummary: any[] = [
    {
      $match: matchStage
    },
    {
      $lookup: {
        from: "productions",
        localField: "production",
        foreignField: "_id",
        as: "productions"
      }
    },
    {
      $unwind: {
        path: "$productions",
        preserveNullAndEmptyArrays: false
      }
    },
    {
      $lookup: {
        from: "products",
        localField: "product",
        foreignField: "_id",
        as: "products"
      }
    },
    {
      $unwind: {
        path: "$products",
        preserveNullAndEmptyArrays: false
      }
    },
    {
      $lookup: {
        from: "machines",
        localField: "machine",
        foreignField: "_id",
        as: "machines"
      }
    },
    {
      $unwind: {
        path: "$machines",
        preserveNullAndEmptyArrays: false
      }
    },
    {
      $project: {
        tran: "$productions.tran",
        date: "$date",
        lotNo: "$productions.lot_no",
        machines: "$machines.name",
        products: "$products.name",
        supplierCode: "$lot",
        totalBales: "$bales",
        totalQty: "$qty"
      }
    },
    {
      $sort: { date: -1 }
    },

  ]
  const sortStage = { $sort: { totalQty: -1, totalBales: -1 } };

  const groupFields: { [key: string]: any } = {
    _id: groupId,

    // totalProductions: { $sum: 1 },
    // machines: { $first: '$machines' },

  }

  const groupFieldsSummary: { [key: string]: any } = {
    _id: null,

  };

  // Conditionally include fields based on flags
  if (product_group) {
    groupFields.products = { $first: '$products' };
    groupFields.totalBales = { $sum: { $toInt: '$totalBales' } };
    groupFields.totalQty = { $sum: '$totalQty' };
    groupFieldsSummary.totalBales = { $sum: { $toInt: '$totalBales' } };
    groupFieldsSummary.totalQty = { $sum: '$totalQty' };
  }

  if (supplierCode_group) {
    groupFields.products = { $first: '$products' };
    groupFields.supplierCode = { $first: '$supplierCode' };
     groupFields.totalBales = { $sum: { $toInt: '$totalBales' } };
    groupFields.totalQty = { $sum: '$totalQty' };
    // groupFields.totalProductions = { $sum: 1 },
    // groupFields.machine = { $first: '$machines' };
    // groupFields.lotNo = { $first: '$lotNo' };
   groupFieldsSummary.totalBales = { $sum: { $toInt: '$totalBales' } };
 groupFieldsSummary.totalQty = { $sum: '$totalQty' };
    // groupFieldsSummary.totalProductions = { $sum: 1 };
  }

  if (lotNo_group) {
    groupFields.products = { $first: '$products' };
    groupFields.lotNo = { $first: '$lotNo' };
   groupFields.totalBales = { $sum: { $toInt: '$totalBales' } };
  groupFields.totalQty = { $sum: '$totalQty' };
    // groupFields.totalProductions = { $sum: 1 },
    // groupFields.machine = { $first: '$machines' };
    groupFieldsSummary.totalBales = { $sum: { $toInt: '$totalBales' } };
 groupFieldsSummary.totalQty = { $sum: '$totalQty' };
    // groupFieldsSummary.totalProductions = { $sum: 1 };


  }
  if (month_group) {
    groupFields.month = { $first: { $dateToString: { format: '%Y-%m', date: '$date' } } };
   groupFields.totalBales = { $sum: { $toInt: '$totalBales' } };
  groupFields.totalQty = { $sum: '$totalQty' };
     groupFieldsSummary.totalBales = { $sum: { $toInt: '$totalBales' } };
 groupFieldsSummary.totalQty = { $sum: '$totalQty' };

  }
  const groupStage = {
    $group: groupFields
  };




  // const groupStage = {
  //   $group: 
  // {
  //   _id: groupId,
  //   products:{$first:"$products"},
  //   machine:{$first:"$machines"},
  //   lotNo:{$first:"$lotNo"},
  //   totalProductions:{$sum:1},
  //   supplierCode:{$first:"$supplierCode"},
  //   totalQty:{$sum:"$qty"},
  //   totalBales:{$sum:{$toInt:"$bales"}}
  // }
  // }
  const groupStageSummary = {
    $group: groupFieldsSummary

  }

  // If grouping is not required, we can skip the group stage
  const dataPipeline = shouldGroup
    ? [...basePipeline, groupStage, sortStage]
    : [...basePipeline]

  // Count pipeline for total records
  // const countPipeline = shouldGroup
  //   ? [...basePipeline, groupStage, { $count: 'totalRecords' }]
  //   : [...basePipeline, { $count: 'totalRecords' }];


  const summaryPipeline = shouldGroup
    ? [...basePipelineSummary, groupStageSummary]
    : [
      ...basePipelineSummary,
      {
        $group: {
          _id: null,
          totalBales: { $sum: { $toInt: "$totalBales" } },
          totalQty: { $sum: "$totalQty" },
          // totalProductions: { $sum: 1 },
        },
      },
    ];
  // Executing the pipelines in parallel
  const [productiondtl, summaryResult] = await Promise.all([
    ProductionDtlModel.aggregate(dataPipeline, { allowDiskUse: true }),
    // ProductionDtlModel.aggregate(countPipeline, { allowDiskUse: true }),
    ProductionDtlModel.aggregate(summaryPipeline, { allowDiskUse: true }),
  ]);

  //  const totalRecords = totalResult?.[0]?.totalRecords || 0;
  const summary = summaryResult?.[0] || {
    // totalProductions: 0,
    totalQty: 0,
    totalBales: 0,

  };
  return {
    productiondtl,
    summary,
    // pagination: {
    //   page: pageno,
    //   perPage,
    //   totalRecords,
    //   totalPages: Math.ceil(totalRecords / perPage),
    // },
  };

}

export const deleteProductions = async () => {
  await ProductionDtlModel.deleteMany({});
  return await ProductionModel.deleteMany({});
};

export const deleteProductionById = async (id: string) => {
  const production = await ProductionModel.findByIdAndUpdate(
    { _id: id },
    {
      $set: {
        isDeleted: true,
      },
    }
  );

  const productdetail = await ProductionDtlModel.updateMany(
    { production: new mongoose.Types.ObjectId(id) },
    {
      $set: {
        isDeleted: true,
      },
    }
  );

  console.log(productdetail);
  return { success: true };
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
    lot_no,
  } = input;

  const production = await ProductionModel.findByIdAndUpdate(id, {
    tran,
    date: dayjs(date).format('YYYY-MM-DD'),
    productionType,
    // machine: new mongoose.Types.ObjectId(machine),
    specialInstruction,
    lot_no,
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
      machine: new mongoose.Types.ObjectId(prod.machine),
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
export const productionLotQtyAdjust = async (input: ProductionLotQtyAdjustSchema) => {

  try {
    const {
      product,
      lot
    } = input

    if (!product || !lot) {
      throw new Error('Product and Lot must  provided');
    }

    const production = await ProductionDtlModel.aggregate([
      {
        $match: {
          isDeleted: false,
          product: new mongoose.Types.ObjectId(product),
          lot: lot
        }
      },
      {
        $lookup: {
          from: 'productions',
          localField: 'production',
          foreignField: '_id',
          as: 'production'
        }
      },
      {
        $unwind: '$production',
      },
      {
        $project: {
          bales: 1,
          _id: "$production._id",
          qty: 1,
          lot_no: "$production.lot_no"
        }
      }
    ])

    return production

  } catch (error) {
    throw new Error('Failed to fetch production details. Please try again later.');
  }


}