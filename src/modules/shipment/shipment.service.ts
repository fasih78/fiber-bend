import mongoose, { model } from 'mongoose';
import dayjs, { Dayjs } from 'dayjs';
import {
  SalesContract,
  SalesContractModel,
} from '../sales_contract/sales_contract.model';
import { CustomerModel } from '../customer/customer.model';
import { BrandModel } from '../brand/brand.model';
import { PaymentTermModel } from '../payment_term/payment_term.model';
import { Shipment, ShipmentModel } from './shipment.model';
import {
  CreateShipmentSchema,
  ShipmentPrintSchema,
  ShipmentReportSchema,
  ShipmentgroupSchema,
  ShipmentpaginationSchema,
} from './shipment.schema';
import { any, string } from 'zod';
import moment = require('moment');
//import momentTimezone = require('moment-timezone');
//momentTimezone.tz.setDefault('Asia/Karachi');
import {
  SalesContractDtl,
  SalesContractDtlModel,
} from '../sales_contract/sales_contract_dtl.model';
import { ProductModel } from '../product/product.model';
import { CurrencyModel } from '../currency/currency.model';
import { ShipmentDtlModel, ShipmentDtl } from './shipment_dtls.model';
import { InvoiceModel } from '../invoice/invoice.model';
import { result } from 'lodash';
//import utc from 'dayjs/plugin/utc';
//dayjs.extend(utc);
// momentTimezone(dcDate).format('MM-DD-YYYY')
//momentTimezone(dcDate).format('MM-DD-YYYY')
export const createShipment = async (input: CreateShipmentSchema) => {
  const {
    shipmentNumber,
    gpNumber,
    gpDate,
    dcNumber,
    dcDate,
    salesContract,
    ShipmentDtl,
    specialInstruction,
  } = input;

  const shipment = await ShipmentModel.create({
    shipment: shipmentNumber,
    gpNumber,
    gpDate,
    dcNumber,
    dcDate,
    salesContract: new mongoose.Types.ObjectId(salesContract),
    specialInstruction,
  });
  console.log('gpDate***', gpDate);
  console.log('dcDate*******', dcDate);

  const sale = await SalesContractModel.findOne({ _id: salesContract }).lean();

  for (const shipDtl of ShipmentDtl) {
    const newInvoiceDtl = await ShipmentDtlModel.create({
      qty: shipDtl.qty,
      rate: shipDtl.rate,
      shipment_no: shipmentNumber,
      amount: +shipDtl.qty * +shipDtl.rate,
      uom: shipDtl.uom,
      gpDate: gpDate,
      customer: new mongoose.Types.ObjectId(sale?.customer),
      salesContract: new mongoose.Types.ObjectId(salesContract),
      product: new mongoose.Types.ObjectId(shipDtl.product),
      currency: new mongoose.Types.ObjectId(shipDtl.currency),
      shipment: new mongoose.Types.ObjectId(shipment._id),
    });
  }

  const shipments = await ShipmentModel.find({
    salesContract: salesContract,
    isDeleted: false,
  });
  let shipmentsDtlsQty = 0;
  for (let ship of shipments) {
    const dtl = await ShipmentDtlModel.find({ shipment: ship._id });
    if (dtl) {
      for (let d of dtl) {
        shipmentsDtlsQty += +d.qty;
      }
    }
  }

  let salesContractDtlsQty = 0;

  const dtl = await SalesContractDtlModel.find({
    salesContract: salesContract,
  });
  if (dtl) {
    for (let d of dtl) {
      salesContractDtlsQty += +d.qty;
    }
  }

  if (shipmentsDtlsQty >= salesContractDtlsQty) {
    const sales = await SalesContractModel.findByIdAndUpdate(salesContract, {
      shipment: true,
    });

    // console.log(sales?.modifiedPaths);
    const salesContractDetails = await SalesContractDtlModel.updateMany(
      { salesContract: salesContract },
      {
        shipment: true,
      }
    );

    // console.log(salesContractDetails?.modifiedCount);
  }
  return shipment;
};

export const getNewShipmentId = async () => {
  const shipment = await ShipmentModel.findOne()
    .sort({ field: 'asc', _id: -1 })
    .limit(1);

  let newId: number = 1;
  if (shipment != null) {
    newId = shipment.shipment + 1;
  }

  return newId;
};

export const findShipments = async (input: ShipmentpaginationSchema) => {
  const limit = input.perPage;
  const skipCount = (input.pageno - 1) * limit;
  const shipmenrecords = await ShipmentModel.countDocuments();
  const data = await ShipmentModel.find({ isDeleted: false })
    .populate({
      path: 'salesContract',
      model: SalesContractModel,
    })
    .limit(limit)
    .skip(skipCount)
    .sort({ shipment: 1 });
  const result = {
    shipment_dtl: data,
    total_Records: shipmenrecords,
  };
  return result;
};

export const deleteShipmentById = async (id: string) => {
  const shipment = await ShipmentModel.findById(id);

  const sales = await SalesContractModel.findByIdAndUpdate(
    shipment?.salesContract,
    {
      shipment: false,
    }
  );

  const salesdtl = await SalesContractDtlModel.updateOne(
    { salesContract: shipment?.salesContract },
    {
      shipment: false,
    }
  );

  const delete1 = await ShipmentDtlModel.updateOne(
    { shipment: id },
    {
      isDeleted: true,
    }
  );

  const delete2 = await ShipmentModel.updateOne(
    { _id: id },
    { isDeleted: true }
  );

  return shipment;
};

export const updateShipmentById = async (
  id: string,
  input: CreateShipmentSchema
) => {
  const {
    shipmentNumber,
    gpNumber,
    gpDate,
    dcNumber,
    dcDate,
    salesContract,
    ShipmentDtl,
    specialInstruction,
  } = input;

  const shipment = await ShipmentModel.findByIdAndUpdate(id, {
    shipmentNumber,
    gpNumber,
    //gpDate: moment(gpDate).format('YYYY-MM-DD'),
    gpDate,
    dcNumber,
    dcDate,
    // dcDate: momentTimezone(dcDate).format('MM-DD-YYYY'),
    salesContract: new mongoose.Types.ObjectId(salesContract),
    specialInstruction,
  });

  await ShipmentDtlModel.deleteMany({ shipment: id });

  for (const shipDtl of ShipmentDtl) {
    const newshipDtl = await ShipmentDtlModel.create({
      qty: shipDtl.qty,
      rate: shipDtl.rate,
      amount: +shipDtl.qty * +shipDtl.rate,
      exchangeRate: +shipDtl.exchangeRate,
      product: new mongoose.Types.ObjectId(shipDtl.product),
      currency: new mongoose.Types.ObjectId(shipDtl.currency),
      shipment: new mongoose.Types.ObjectId(shipment?._id),
    });
  }

  return { success: true };
};

export const Productgroupby = async (input: ShipmentgroupSchema) => {
  console.log(input);
  if (input.product !== '') {
    const product = await ProductModel.aggregate([
      {
        $lookup: {
          from: 'shipmentdtls',
          localField: '_id',
          foreignField: 'product',
          as: 'shipmentdtls',
          pipeline: [
            {
              $project: {
                qty: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          totalQty: {
            $sum: {
              $map: {
                input: '$shipmentdtls',
                as: 'item',
                in: '$$item.qty',
              },
            },
          },
        },
      },
      {
        $project: {
          name: 1,
          createdAt: 1,
          totalQty: 1,
          totalShipment: {
            $size: '$shipmentdtls',
          },
        },
      },
    ]);
    return product;

    // const product = await ProductModel.find();
    // let product_data = [];
    // for (let i = 0; i < product.length; i++) {
    //   console.log(product[i]._id, 'product[i]._id');
    //   let result = await ShipmentDtlModel.find({ product: product[i]._id });
    //   console.log(result.length, 'result');
    //   product_data[i] = {
    //     product_id: product[i].name,
    //     shipment: result.length,
    //   };
    // }
    // return product_data;
  } else if (input.salesContract !== '') {
    const salecontract = await SalesContractModel.aggregate([
      {
        $lookup: {
          from: 'shipments',
          localField: '_id',
          foreignField: 'salesContract',
          as: 'salesContractData',
        },
      },
      {
        $project: {
          contract: 1,
          totalshipments: {
            $size: '$salesContractData',
          },
        },
      },
    ]);

    return salecontract;
    // const shipment = await ShipmentModel.find({ isDeleted: false });
    // let salecontract_data = [];
    // for (let i = 0; i < shipment.length; i++) {
    //   console.log(shipment[i].salesContract, 'shipment[i].salesContract');
    //   let result = await SalesContractModel.find({
    //     _id: shipment[i].salesContract,
    //   });
    //   console.log(result, 'result');
    //   salecontract_data[i] = {
    //     // salesContracts: shipment[i].shipment,
    //     salesContracts: result[0].contract,
    //     shipment: result.length,
    //   };
    //   console.log(result.length);
    // }
    // return salecontract_data;
  } else if (input.customer !== '') {
    const customer = await CustomerModel.aggregate([
      {
        $lookup: {
          from: 'salescontracts',
          localField: '_id',
          foreignField: 'customer',
          as: 'salesContractData',
        },
      },
      {
        $lookup: {
          from: 'shipmentdtls',
          localField: '_id',
          foreignField: 'customer',
          as: 'shipmentData',
        },
      },
      {
        $project: {
          name: 1,
          totalcontracts: {
            $size: '$salesContractData',
          },
          totalshipments: {
            $size: '$shipmentData',
          },
        },
      },
    ]);
    return customer;
    // let customer_data = [];
    // const customer = await CustomerModel.find();
    // console.log(customer.length, 'length');
    // for (let i = 0; i < customer.length; i++) {
    //   let result1 = await SalesContractModel.find({
    //     customer: customer[i]._id,
    //   });
    //   const ship = await SalesContractModel.find({
    //     customer: customer[i]._id,
    //     shipment: true,
    //   });
    //   console.log(ship.length, i);
    //   customer_data[i] = {
    //     customer: customer[i].name,
    //     salecontract: result1.length,
    //     shipment: ship.length,
    //   };
    // }
    // return customer_data;
  }
};

export const findShipmentDtlsByDate = async (input: ShipmentReportSchema) => {
  // if (input.customergroup || input.salesContractgroup || input.productgroup) {
  //   if (input.productgroup !== '') {
  //     const limit = input.perPage;
  //     const skipCount = (input.pageno - 1) * limit;
  //     const shipmentgroup = await ShipmentDtlModel.aggregate([
  //       {
  //         $match: {
  //           product: new mongoose.Types.ObjectId(input.productgroup),
  //           isDeleted: false,
  //         },
  //       },

  //       {
  //         $group: {
  //           _id: 'null',
  //           rate: {
  //             $sum: '$rate',
  //           },
  //           amount: {
  //             $sum: '$amount',
  //           },
  //           qty: {
  //             $sum: '$qty',
  //           },
  //         },
  //       },
  //     ]);
  //     const totalQty = shipmentgroup.map((item) => item.qty);
  //     const totalRate = shipmentgroup.map((item) => item.rate);
  //     const totalAmount = shipmentgroup.map((item) => item.amount);
  //     const productLength = await ProductModel.countDocuments();
  //     const product = await ProductModel.aggregate([
  //       {
  //         $lookup: {
  //           from: 'shipmentdtls',
  //           localField: '_id',
  //           foreignField: 'product',
  //           as: 'shipmentdtls',
  //           pipeline: [
  //             {
  //               $project: {
  //                 qty: 1,
  //               },
  //             },
  //           ],
  //         },
  //       },
  //       {
  //         $addFields: {
  //           totalQty: {
  //             $sum: {
  //               $map: {
  //                 input: '$shipmentdtls',
  //                 as: 'item',
  //                 in: '$$item.qty',
  //               },
  //             },
  //           },
  //         },
  //       },
  //       {
  //         $project: {
  //           name: 1,
  //           createdAt: 1,
  //           totalQty: 1,
  //           totalShipment: {
  //             $size: '$shipmentdtls',
  //           },
  //         },
  //       },
  //       { $skip: skipCount },
  //       { $limit: limit },
  //     ]);
  //     const result = {
  //       product_info: product,
  //       Total_records: productLength,
  //       totalQty: totalQty,
  //       totalRate: totalRate,
  //       totalAmount: totalAmount,
  //     };
  //     return result;
  //   }
  //   if (input.salesContractgroup !== '') {
  //     const limit = input.perPage;
  //     const skipCount = (input.pageno - 1) * limit;
  //     const salecontractLength = await SalesContractModel.countDocuments();
  //     const shipmentgroup = await ShipmentDtlModel.aggregate([
  //       {
  //         $match: {
  //           isDeleted: false,
  //         },
  //       },

  //       {
  //         $group: {
  //           _id: '$salesContract',
  //           rate: {
  //             $sum: '$rate',
  //           },
  //           amount: {
  //             $sum: '$amount',
  //           },
  //           qty: {
  //             $sum: '$qty',
  //           },
  //         },
  //       },
  //     ]);
  //     const totalQty = shipmentgroup.map((item) => item.qty);
  //     const totalRate = shipmentgroup.map((item) => item.rate);
  //     const totalAmount = shipmentgroup.map((item) => item.amount);
  //     const salecontract = await SalesContractModel.aggregate([
  //       {
  //         $lookup: {
  //           from: 'shipments',
  //           localField: '_id',
  //           foreignField: 'salesContract',
  //           as: 'salesContractData',
  //         },
  //       },
  //       {
  //         $project: {
  //           contract: 1,
  //           totalshipments: {
  //             $size: '$salesContractData',
  //           },
  //         },
  //       },
  //       { $skip: skipCount },
  //       { $limit: limit },
  //     ]);

  //     const result = {
  //       salecontract_info: salecontract,
  //       Total_records: salecontractLength,
  //       totalQty: totalQty,
  //       totalRate: totalRate,
  //       totalAmount: totalAmount,
  //     };
  //     return result;
  //   }
  //   if (input.customergroup !== '') {
  //     const shipmentgroup = await ShipmentDtlModel.aggregate([
  //       {
  //         $match: {
  //           isDeleted: false,
  //         },
  //       },

  //       {
  //         $group: {
  //           _id: '$customer',
  //           rate: {
  //             $sum: '$rate',
  //           },
  //           amount: {
  //             $sum: '$amount',
  //           },
  //           qty: {
  //             $sum: '$qty',
  //           },
  //         },
  //       },
  //     ]);

  //     const totalQty = shipmentgroup.map((item) => item.qty);
  //     const totalRate = shipmentgroup.map((item) => item.rate);
  //     const totalAmount = shipmentgroup.map((item) => item.amount);

  //     const limit = input.perPage;
  //     const skipCount = (input.pageno - 1) * limit;
  //     const customerLength = await CustomerModel.countDocuments();
  //     const customer = await CustomerModel.aggregate([
  //       {
  //         $lookup: {
  //           from: 'salescontracts',
  //           localField: '_id',
  //           foreignField: 'customer',
  //           as: 'salesContractData',
  //         },
  //       },
  //       {
  //         $lookup: {
  //           from: 'shipmentdtls',
  //           localField: '_id',
  //           foreignField: 'customer',
  //           as: 'shipmentData',
  //         },
  //       },
  //       {
  //         $project: {
  //           name: 1,
  //           totalcontracts: {
  //             $size: '$salesContractData',
  //           },
  //           totalshipments: {
  //             $size: '$shipmentData',
  //           },
  //         },
  //       },
  //       { $skip: skipCount },
  //       { $limit: limit },
  //     ]);

  //     const result = {
  //       customer_info: customer,
  //       Total_records: customerLength,
  //       totalQty: totalQty,
  //       totalRate: totalRate,
  //       totalAmount: totalAmount,
  //     };
  //     return result;
  //   }
  // }
  // else {
  //   let totalQty;
  //   let totalRate;
  //   let totalAmount;

  //   if (input.product_id !== '') {
  //     const shipmentgroup = await ShipmentDtlModel.aggregate([
  //       {
  //         $match: {
  //           product: new mongoose.Types.ObjectId(input.product_id),
  //           isDeleted: false,
  //         },
  //       },

  //       {
  //         $group: {
  //           _id: '$product',
  //           rate: {
  //             $sum: '$rate',
  //           },
  //           amount: {
  //             $sum: '$amount',
  //           },
  //           qty: {
  //             $sum: '$qty',
  //           },
  //         },
  //       },
  //     ]);

  //     totalQty = shipmentgroup.map((item) => item.qty);
  //     totalRate = shipmentgroup.map((item) => item.rate);
  //     totalAmount = shipmentgroup.map((item) => item.amount);
  //   }

  //   if (input.salesContract !== '') {
  //     const shipmentgroup = await SalesContractDtlModel.aggregate([
  //       {
  //         $match: {
  //           salesContract: new mongoose.Types.ObjectId(input.salesContract),
  //           isDeleted: false,
  //         },
  //       },

  //       {
  //         $group: {
  //           _id: '$salesContract',
  //           rate: {
  //             $sum: '$rate',
  //           },
  //           amount: {
  //             $sum: '$amount',
  //           },
  //           qty: {
  //             $sum: '$qty',
  //           },
  //         },
  //       },
  //     ]);

  //     totalQty = shipmentgroup.map((item) => item.qty);
  //     totalRate = shipmentgroup.map((item) => item.rate);
  //     totalAmount = shipmentgroup.map((item) => item.amount);
  //   }
  //   if (input.customer !== '') {
  //     const shipmentgroup = await ShipmentDtlModel.aggregate([
  //       {
  //         $match: {
  //           customer: new mongoose.Types.ObjectId(input.customer),
  //           isDeleted: false,
  //         },
  //       },

  //       {
  //         $group: {
  //           _id: '$customer',
  //           rate: {
  //             $sum: '$rate',
  //           },
  //           amount: {
  //             $sum: '$amount',
  //           },
  //           qty: {
  //             $sum: '$qty',
  //           },
  //         },
  //       },
  //     ]);

  //     totalQty = shipmentgroup.map((item) => item.qty);
  //     totalRate = shipmentgroup.map((item) => item.rate);
  //     totalAmount = shipmentgroup.map((item) => item.amount);
  //   }
  //   if (!input.customer && !input.salesContract && !input.product_id) {
  //     const shipmentgroup = await ShipmentDtlModel.aggregate([
  //       {
  //         $match: {
  //           isDeleted: false,
  //         },
  //       },

  //       {
  //         $group: {
  //           _id: 'null',
  //           rate: {
  //             $sum: '$rate',
  //           },
  //           amount: {
  //             $sum: '$amount',
  //           },
  //           qty: {
  //             $sum: '$qty',
  //           },
  //         },
  //       },
  //     ]);
  //     console.log(shipmentgroup);

  //     totalQty = shipmentgroup.map((item) => item.qty);
  //     totalRate = shipmentgroup.map((item) => item.rate);
  //     totalAmount = shipmentgroup.map((item) => item.amount);
  //   }
  //   let where1: any = {
  //     gpDate: {
  //       $gte: moment(input.fromDate).format('YYYY-MM-DD'),
  //       $lte: moment(input.toDate).format('YYYY-MM-DD'),
  //     },
  //     isDeleted: false,
  //   };

  //   let arr1 = [];
  //   let filter1: any = {};
  //   let filter3: any = {};
  //   if (input.product_id) {
  //     filter3.product = new mongoose.Types.ObjectId(input.product_id);
  //   }
  //   if (input.customer) {
  //     filter1.customer = new mongoose.Types.ObjectId(input.customer);
  //   }
  //   if (input.salesContract) {
  //     filter1.salesContract = new mongoose.Types.ObjectId(input.salesContract);
  //   }
  //   if (input.dcNumber) {
  //     filter1.dcNumber = input.dcNumber;
  //   }

  //   if (input.gpNumber) {
  //     filter1.gpNumber = input.gpNumber;
  //   }

  //   const ship1 = await ShipmentDtlModel.aggregate([
  //     {
  //       $match: {
  //         gpDate: {
  //           // $gte: input.fromDate.toISOString,
  //           // $lte: input.toDate.toISOString,
  //           $gte: new Date(input.fromDate),
  //           $lte: new Date(input.toDate),
  //         },

  //         isDeleted: false,
  //       },
  //     },
  //     {
  //       $match: filter3,
  //     },
  //     {
  //       $lookup: {
  //         from: 'products',
  //         localField: 'product',
  //         foreignField: '_id',
  //         as: 'product',
  //       },
  //     },
  //     {
  //       $lookup: {
  //         from: 'shipments',
  //         localField: 'shipment',
  //         foreignField: '_id',
  //         as: 'shipmentDetails',
  //         pipeline: [
  //           {
  //             $lookup: {
  //               from: 'salescontracts',
  //               localField: 'salesContract',
  //               foreignField: '_id',
  //               as: 'salesContractsDetails',
  //               pipeline: [
  //                 {
  //                   $lookup: {
  //                     from: 'customers',
  //                     localField: 'customer',
  //                     foreignField: '_id',
  //                     as: 'customerDetails',
  //                   },
  //                 },
  //               ],
  //             },
  //           },
  //         ],
  //       },
  //     },
  //     {
  //       $project: {
  //         qty: 1,
  //         rate: 1,
  //         amount: 1,
  //         uom: 1,
  //         isDeleted: 1,
  //         shipment: 1,
  //         shipment_no: 1,
  //         product: 1,
  //         createdAt: 1,
  //         name: {
  //           $first: '$product.name',
  //         },
  //         product_id: {
  //           $first: '$product._id',
  //         },
  //         gpNumber: {
  //           $first: '$shipmentDetails.gpNumber',
  //         },
  //         gpDate: {
  //           $first: '$shipmentDetails.gpDate',
  //         },
  //         dcNumber: {
  //           $first: '$shipmentDetails.dcNumber',
  //         },
  //         salesContract: {
  //           $first: '$shipmentDetails.salesContract',
  //         },
  //         createdShipmentAt: {
  //           $first: '$shipmentDetails.createdAt',
  //         },
  //         salesContractsDetails: {
  //           $first: '$shipmentDetails.salesContractsDetails',
  //         },
  //         customer: {
  //           $first: '$shipmentDetails.salesContractsDetails.customer',
  //         },
  //       },
  //     },
  //     {
  //       $match: filter1,
  //     },
  //     {
  //       $unwind: {
  //         path: '$customer',
  //       },
  //     },
  //   ]);

  //   ///////////////////////////////////////////////////////////////////

  //   let where: any = {
  //     gpDate: {
  //       $gte: moment(input.fromDate).format('YYYY-MM-DD'),
  //       $lte: moment(input.toDate).format('YYYY-MM-DD'),
  //     },
  //     isDeleted: false,
  //   };
  //   const limit = input.perPage;
  //   const skipCount = (input.pageno - 1) * limit;
  //   const shipmenrecords = await ShipmentModel.countDocuments();
  //   let arr = [];
  //   let filter: any = {};
  //   let filter2: any = {};
  //   if (input.product_id) {
  //     filter2.product = new mongoose.Types.ObjectId(input.product_id);
  //   }
  //   if (input.customer) {
  //     filter.customer = new mongoose.Types.ObjectId(input.customer);
  //   }
  //   if (input.salesContract) {
  //     filter.salesContract = new mongoose.Types.ObjectId(input.salesContract);
  //   }
  //   if (input.dcNumber) {
  //     filter.dcNumber = input.dcNumber;
  //   }

  //   if (input.gpNumber) {
  //     filter.gpNumber = input.gpNumber;
  //   }

  //   const ship = await ShipmentDtlModel.aggregate([
  //     {
  //       $match: {
  //         gpDate: {
  //           // $gte: input.fromDate.toISOString,
  //           // $lte: input.toDate.toISOString,
  //           $gte: new Date(input.fromDate),
  //           $lte: new Date(input.toDate),
  //         },

  //         isDeleted: false,
  //       },
  //     },
  //     {
  //       $match: filter2,
  //     },
  //     {
  //       $lookup: {
  //         from: 'products',
  //         localField: 'product',
  //         foreignField: '_id',
  //         as: 'product',
  //       },
  //     },
  //     {
  //       $lookup: {
  //         from: 'shipments',
  //         localField: 'shipment',
  //         foreignField: '_id',
  //         as: 'shipmentDetails',
  //         pipeline: [
  //           {
  //             $lookup: {
  //               from: 'salescontracts',
  //               localField: 'salesContract',
  //               foreignField: '_id',
  //               as: 'salesContractsDetails',
  //               pipeline: [
  //                 {
  //                   $lookup: {
  //                     from: 'customers',
  //                     localField: 'customer',
  //                     foreignField: '_id',
  //                     as: 'customerDetails',
  //                   },
  //                 },
  //               ],
  //             },
  //           },
  //         ],
  //       },
  //     },
  //     {
  //       $project: {
  //         qty: 1,
  //         totalRate: '$rate',
  //         totalAmount: '$amount',
  //         totalQty: '$qty',
  //         rate: 1,
  //         amount: 1,
  //         uom: 1,
  //         isDeleted: 1,
  //         shipment: 1,
  //         shipment_no: 1,
  //         product: 1,
  //         createdAt: 1,
  //         name: {
  //           $first: '$product.name',
  //         },
  //         product_id: {
  //           $first: '$product._id',
  //         },
  //         gpNumber: {
  //           $first: '$shipmentDetails.gpNumber',
  //         },
  //         gpDate: {
  //           $first: '$shipmentDetails.gpDate',
  //         },
  //         dcNumber: {
  //           $first: '$shipmentDetails.dcNumber',
  //         },
  //         salesContract: {
  //           $first: '$shipmentDetails.salesContract',
  //         },
  //         createdShipmentAt: {
  //           $first: '$shipmentDetails.createdAt',
  //         },
  //         salesContractsDetails: {
  //           $first: '$shipmentDetails.salesContractsDetails',
  //         },
  //         customer: {
  //           $first: '$shipmentDetails.salesContractsDetails.customer',
  //         },
  //       },
  //     },
  //     {
  //       $match: filter,
  //     },
  //     {
  //       $unwind: {
  //         path: '$customer',
  //       },
  //     },
  //     { $skip: skipCount },
  //     { $limit: limit },
  //     { $sort: { shipment_no: 1 } },
  //   ]);

  //   if (
  //     !input.salesContract &&
  //     !input.customer &&
  //     !input.product_id &&
  //     !input.gpNumber &&
  //     !input.dcNumber
  //   ) {
  //     let result = {
  //       shipmentdtl: ship,
  //       total_records: shipmenrecords,
  //       totalQty: totalQty,
  //       totalRate: totalRate,
  //       totalAmount: totalAmount,
  //     };
  //     return result;
  //   } else {
  //     let result = {
  //       shipmentdtl: ship,
  //       total_records: ship1.length,
  //       totalQty: totalQty,
  //       totalRate: totalRate,
  //       totalAmount: totalAmount,
  //     };
  //     return result;
  //   }
  // }
  console.log('hhh');
  if (
    Array.isArray(input.product_id) &&
    input.product_id.length == 0 &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0 &&
    input.customergroup == '' &&
    input.productgroup == '' &&
    input.salesContractgroup == '' &&
    input.dcNumber == '' &&
    input.gpNumber == ''
  ) {
    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;

    console.log('no filter condition execute');

    const total_record = await ShipmentDtlModel.aggregate([
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },

          isDeleted: false,
        },
      },
    ]);

    const allrecordgroupby = await ShipmentDtlModel.aggregate([
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },

          isDeleted: false,
        },
      },
      {
        $group: {
          _id: 'null',
          rate: {
            $sum: '$rate',
          },
          amount: {
            $sum: '$amount',
          },
          qty: {
            $sum: '$qty',
          },
        },
      },
    ]);
    console.log(allrecordgroupby);
    const totalQty = allrecordgroupby.map((item: any) => item.qty);
    const totalRate = allrecordgroupby.map((item: any) => item.rate);
    const totalAmount = allrecordgroupby.map((item: any) => item.amount);

    let where: any = {
      gpDate: {
        $gte: new Date(input.fromDate),
        $lte: new Date(input.toDate),
      },

      isDeleted: false,
    };

    const salesContract = await ShipmentDtlModel.find(where);

    const shipment = await ShipmentDtlModel.aggregate([
      {
        $match: where,
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
          from: 'shipments',
          localField: 'shipment',
          foreignField: '_id',
          as: 'shipmentDetails',
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractsDetails',
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customerDetails',
        },
      },
      { $skip: skipCount },
      { $limit: limit },
      { $sort: { id: 1 } },
    ]);
    let result = {
      shipmentdtl: shipment,
      total_records: total_record.length,
      paginated_record: shipment.length,
      totalQty: totalQty,
      totalRate: totalRate,
      totalAmount: totalAmount,
    };
    return result;
  } else if (
    input.customergroup !== '' ||
    input.salesContractgroup !== '' ||
    input.productgroup !== ''
  ) {
    console.log('grouping');
    if (input.productgroup !== '') {
      const shipmentgroup = await ShipmentDtlModel.aggregate([
        {
          $match: {
            product: new mongoose.Types.ObjectId(input.productgroup),
            isDeleted: false,
          },
        },

        {
          $group: {
            _id: 'null',
            rate: {
              $sum: '$rate',
            },
            amount: {
              $sum: '$amount',
            },
            qty: {
              $sum: '$qty',
            },
          },
        },
      ]);
      const totalQty = shipmentgroup.map((item) => item.qty);
      const totalRate = shipmentgroup.map((item) => item.rate);
      const totalAmount = shipmentgroup.map((item) => item.amount);
      const productLength = await ProductModel.countDocuments();
      const product = await ProductModel.aggregate([
        {
          $lookup: {
            from: 'shipmentdtls',
            localField: '_id',
            foreignField: 'product',
            as: 'shipmentdtls',
            pipeline: [
              {
                $project: {
                  qty: 1,
                },
              },
            ],
          },
        },
        {
          $addFields: {
            totalQty: {
              $sum: {
                $map: {
                  input: '$shipmentdtls',
                  as: 'item',
                  in: '$$item.qty',
                },
              },
            },
          },
        },
        {
          $project: {
            name: 1,
            createdAt: 1,
            totalQty: 1,
            totalShipment: {
              $size: '$shipmentdtls',
            },
          },
        },
      ]);
      const result = {
        Group: product,
        total_records: productLength,
        // totalQty: totalQty,
        // totalRate: totalRate,
        // totalAmount: totalAmount,
      };
      return result;
    } else if (input.salesContractgroup !== '') {
      const salecontractLength = await SalesContractModel.countDocuments();
      const shipmentgroup = await ShipmentDtlModel.aggregate([
        {
          $match: {
            isDeleted: false,
          },
        },

        {
          $group: {
            _id: '$salesContract',
            rate: {
              $sum: '$rate',
            },
            amount: {
              $sum: '$amount',
            },
            qty: {
              $sum: '$qty',
            },
          },
        },
      ]);
      const totalQty = shipmentgroup.map((item) => item.qty);
      const totalRate = shipmentgroup.map((item) => item.rate);
      const totalAmount = shipmentgroup.map((item) => item.amount);
      const salecontract = await SalesContractModel.aggregate([
        {
          $lookup: {
            from: 'shipments',
            localField: '_id',
            foreignField: 'salesContract',
            as: 'salesContractData',
          },
        },
        {
          $project: {
            contract: 1,
            totalshipments: {
              $size: '$salesContractData',
            },
          },
        },
      ]);

      const result = {
        Group: salecontract,
        total_records: salecontractLength,
        // totalQty: totalQty,
        // totalRate: totalRate,
        // totalAmount: totalAmount,
      };
      return result;
    } else if (input.customergroup !== '') {
      const shipmentgroup = await ShipmentDtlModel.aggregate([
        {
          $match: {
            isDeleted: false,
          },
        },

        {
          $group: {
            _id: '$customer',
            rate: {
              $sum: '$rate',
            },
            amount: {
              $sum: '$amount',
            },
            qty: {
              $sum: '$qty',
            },
          },
        },
      ]);

      const totalQty = shipmentgroup.map((item) => item.qty);
      const totalRate = shipmentgroup.map((item) => item.rate);
      const totalAmount = shipmentgroup.map((item) => item.amount);

      const customerLength = await CustomerModel.countDocuments();
      const customer = await CustomerModel.aggregate([
        {
          $lookup: {
            from: 'salescontracts',
            localField: '_id',
            foreignField: 'customer',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'shipmentdtls',
            localField: '_id',
            foreignField: 'customer',
            as: 'shipmentData',
          },
        },
        {
          $project: {
            name: 1,
            totalcontracts: {
              $size: '$salesContractData',
            },
            totalshipments: {
              $size: '$shipmentData',
            },
          },
        },
      ]);

      const result = {
        Group: customer,
        total_records: customerLength,
        // totalQty: totalQty,
        // totalRate: totalRate,
        // totalAmount: totalAmount,
      };
      return result;
    }
  } else if (
    (Array.isArray(input.salesContract) && input.salesContract.length !== 0) ||
    (Array.isArray(input.customer) && input.customer.length !== 0) ||
    (Array.isArray(input.product_id) && input.product_id.length !== 0) ||
    input.gpNumber !== '' ||
    input.dcNumber !== ''
  ) {
    console.log('main qury');
    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;

    const salesContractArr = input.salesContract
      ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const customerArr = input.customer
      ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const productArr = input.product_id
      ? input.product_id.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    let where: any = {};
    let extrafilter: any = {};
    let filter: any = {};
    let filter_records: any = {};

    if (
      customerArr.length > 0 &&
      salesContractArr.length > 0 &&
      productArr.length > 0
    ) {
      where.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          product: { $in: productArr },
        },
      ];
      filter = {
        product: { $in: productArr },
        customer: { $in: customerArr },
        salesContract: { $in: salesContractArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          product: { $in: productArr },
        },
      ];
    } else if (customerArr.length > 0 && salesContractArr.length > 0) {
      where.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
        },
      ];
      filter.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
        },
      ];
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
        },
      ];
    } else if (customerArr.length > 0 && productArr.length > 0) {
      where.$and = [
        {
          customer: { $in: customerArr },
          product: { $in: productArr },
        },
      ];
      filter = {
        product: { $in: productArr },
        customer: { $in: customerArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          product: { $in: productArr },
        },
      ];
    } else if (salesContractArr.length > 0 && productArr.length > 0) {
      where.$and = [
        {
          salesContract: { $in: salesContractArr },
          product: { $in: productArr },
        },
      ];
      filter = {
        product: { $in: productArr },
        salesContract: { $in: salesContractArr },
      };
      filter_records.$and = [
        {
          salesContract: { $in: salesContractArr },
          product: { $in: productArr },
        },
      ];
    } else if (customerArr.length > 0) {
      where = {
        customer: { $in: customerArr },
      };
      filter = {
        customer: { $in: customerArr },
      };
      filter_records = {
        customer: { $in: customerArr },
      };
    } else if (salesContractArr.length > 0) {
      (where = {
        salesContract: { $in: salesContractArr },
      }),
        (filter = {
          salesContract: { $in: salesContractArr },
        });
      filter_records = {
        salesContract: { $in: salesContractArr },
      };
    } else if (productArr.length > 0) {
      where = {
        product: { $in: productArr },
      };
      filter = {
        product: { $in: productArr },
      };
      filter_records = {
        product: { $in: productArr },
      };
    }
    if (input.dcNumber) {
      extrafilter.dcNumber = input.dcNumber;
    }

    if (input.gpNumber) {
      extrafilter.gpNumber = input.gpNumber;
    }
    const total_record = await ShipmentDtlModel.aggregate([
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },

          isDeleted: false,
        },
      },
      {
        $match: filter_records,
      },

      {
        $lookup: {
          from: 'shipments',
          localField: 'shipment',
          foreignField: '_id',
          as: 'shipmentDetails',
        },
      },
      {
        $project: {
          gpNumber: {
            $first: '$shipmentDetails.gpNumber',
          },
          dcNumber: {
            $first: '$shipmentDetails.dcNumber',
          },
        },
      },
      { $match: extrafilter },
    ]);
    const shipmentgroupby = await ShipmentDtlModel.aggregate([
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },

          isDeleted: false,
        },
      },
      {
        $match: filter,
      },
      {
        $group: {
          _id: 'null',
          rate: {
            $sum: '$rate',
          },
          amount: {
            $sum: '$amount',
          },
          qty: {
            $sum: '$qty',
          },
        },
      },
    ]);

    const totalQty = shipmentgroupby.map((item: any) => item.qty);
    const totalRate = shipmentgroupby.map((item: any) => item.rate);
    const totalAmount = shipmentgroupby.map((item: any) => item.amount);
    const ship = await ShipmentDtlModel.aggregate([
      // {
      //   $match: {
      //     gpDate: {
      //       $gte: new Date(input.fromDate),
      //       $lte: new Date(input.toDate),
      //     },

      //     isDeleted: false,
      //   },
      // },
      // {
      //   $match: where,
      // },
      {
        $match: where,
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
          from: 'shipments',
          localField: 'shipment',
          foreignField: '_id',
          as: 'shipmentDetails',
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractsDetails',
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customerDetails',
        },
      },
      {
        $project: {
          qty: 1,
          totalRate: '$rate',
          totalAmount: '$amount',
          totalQty: '$qty',
          rate: 1,
          amount: 1,
          gpDate: 1,
          uom: 1,
          isDeleted: 1,
          shipment: 1,
          shipment_no: 1,
          product: 1,
          createdAt: 1,
          customerDetails: 1,
          shipmentDetails: 1,
          salesContractsDetails: 1,
          salesContract: 1,
          customer: 1,
          gpNumber: {
            $first: '$shipmentDetails.gpNumber',
          },
          dcNumber: {
            $first: '$shipmentDetails.dcNumber',
          },
        },
      },
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },

          isDeleted: false,
        },
      },
    
      {
        $match: extrafilter,
      },
      { $skip: skipCount },
      { $limit: limit },
      { $sort: { id: 1 } },
    ]);
    let result = {
      shipmentdtl: ship,
      paginated_record:ship.length,
      total_records: total_record.length,
      totalQty: totalQty,
      totalRate: totalRate,
      totalAmount: totalAmount,
    };
    return result;
  }
};

export const findIsDeletedShipmentDtlsByDate = async (
  input: ShipmentReportSchema
) => {
  let where: any = {
    gpDate: {
      $gte: dayjs(input.fromDate).utc(true).startOf('date'),
      $lte: dayjs(input.toDate).utc(true).endOf('date'),
    },
    isDeleted: true,
  };

  if (input?.salesContract != '') {
    where.salesContract = input.salesContract;
    // console.log(input);
  }
  // console.log(input);
  const isDeleted = await ShipmentModel.find(where);

  // .populate({

  //   path: 'salesContract',
  //   model: SalesContractModel,
  //   populate: [
  //     { path: 'brand', model: BrandModel },
  //     { path: 'customer', model: CustomerModel },
  //     { path: 'paymentTerm', model: PaymentTermModel },
  //   ],

  return isDeleted;
};
export const deleteShipment = async () => {
  let query = {};
  const deleteall = await ShipmentModel.deleteMany({});
  const delete2 = await ShipmentDtlModel.deleteMany({});

  return deleteShipment;
};

export const findSalesContractsWithShipment = async (id: string) => {
  // console.log(id, 'aaaaa');
  const shipments = await ShipmentModel.find({
    salesContract: id,
    isDeleted: false,
  });
  // console.log(shipments, 'shipments');
  const shipmentDtls: any[] = [];
  for (let ship of shipments) {
    const dtl = await ShipmentDtlModel.find({ shipment: ship._id });
    if (dtl) {
      for (let d of dtl) {
        shipmentDtls.push(d);
      }
    }
  }

  // console.log(shipmentDtls, 'shipmentDtls');

  let salesDtl = await SalesContractDtlModel.find({
    salesContract: new mongoose.Types.ObjectId(id),
  })
    .populate({ path: 'product', model: ProductModel })
    .populate({ path: 'currency', model: CurrencyModel });

  if (salesDtl && shipmentDtls.length > 0) {
    salesDtl.forEach((sale, index) => {
      shipmentDtls.forEach((ship) => {
        if (ship.product.toString() == sale.product._id.toString()) {
          salesDtl[index].qty -= ship.qty;
        }
      });
    });
  }

  const res = salesDtl.filter((s) => s.qty > 0);
  return res;
};

export const findSalesContractsWithMoreQty = async () => {
  const sales = await SalesContractModel.find({ isDeleted: false })
    .populate({
      path: 'customer',
      model: CustomerModel,
    })
    .populate({ path: 'brand', model: BrandModel })
    .populate({ path: 'paymentTerm', model: PaymentTermModel });

  const res: any[] = [];

  for (let s of sales) {
    const dtls = await findSalesContractsWithShipment(s._id);
    if (dtls.length > 0) res.push(s);
    // console.log(s.id);
  }
  return res;
};
export const findShipmentDtls = async (id: string) => {
  return await ShipmentDtlModel.find({
    shipment: new mongoose.Types.ObjectId(id),
  })
    .populate({ path: 'product', model: ProductModel })
    .populate({ path: 'currency', model: CurrencyModel });
};

export const ShipmrntdtlsforPrint = async (input: ShipmentPrintSchema) => {
  if (
    Array.isArray(input.product_id) &&
    input.product_id.length == 0 &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0 &&
    input.customergroup == '' &&
    input.productgroup == '' &&
    input.salesContractgroup == '' &&
    input.dcNumber == '' &&
    input.gpNumber == ''
  ) {
    console.log('no filter condition execute');

    const allrecordgroupby = await ShipmentDtlModel.aggregate([
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },

          isDeleted: false,
        },
      },
      {
        $group: {
          _id: 'null',
          rate: {
            $sum: '$rate',
          },
          amount: {
            $sum: '$amount',
          },
          qty: {
            $sum: '$qty',
          },
        },
      },
    ]);
    console.log(allrecordgroupby);
    const totalQty = allrecordgroupby.map((item: any) => item.qty);
    const totalRate = allrecordgroupby.map((item: any) => item.rate);
    const totalAmount = allrecordgroupby.map((item: any) => item.amount);

    let where: any = {
      gpDate: {
        $gte: new Date(input.fromDate),
        $lte: new Date(input.toDate),
      },

      isDeleted: false,
    };

    const salesContract = await ShipmentDtlModel.find(where);

    const shipment = await ShipmentDtlModel.aggregate([
      {
        $match: where,
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
          from: 'shipments',
          localField: 'shipment',
          foreignField: '_id',
          as: 'shipmentDetails',
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractsDetails',
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customerDetails',
        },
      },
    ]);
    let result = {
      shipmentdtl: shipment,
      total_records: shipment ? shipment.length : 0,
      totalQty: totalQty,
      totalRate: totalRate,
      totalAmount: totalAmount,
    };
    return result;
  } else if (
    input.customergroup !== '' ||
    input.salesContractgroup !== '' ||
    input.productgroup !== ''
  ) {
    console.log('grouping');
    if (input.productgroup !== '') {
      const shipmentgroup = await ShipmentDtlModel.aggregate([
        {
          $match: {
            product: new mongoose.Types.ObjectId(input.productgroup),
            isDeleted: false,
          },
        },

        {
          $group: {
            _id: 'null',
            rate: {
              $sum: '$rate',
            },
            amount: {
              $sum: '$amount',
            },
            qty: {
              $sum: '$qty',
            },
          },
        },
      ]);
      const totalQty = shipmentgroup.map((item) => item.qty);
      const totalRate = shipmentgroup.map((item) => item.rate);
      const totalAmount = shipmentgroup.map((item) => item.amount);
      const productLength = await ProductModel.countDocuments();
      const product = await ProductModel.aggregate([
        {
          $lookup: {
            from: 'shipmentdtls',
            localField: '_id',
            foreignField: 'product',
            as: 'shipmentdtls',
            pipeline: [
              {
                $project: {
                  qty: 1,
                },
              },
            ],
          },
        },
        {
          $addFields: {
            totalQty: {
              $sum: {
                $map: {
                  input: '$shipmentdtls',
                  as: 'item',
                  in: '$$item.qty',
                },
              },
            },
          },
        },
        {
          $project: {
            name: 1,
            createdAt: 1,
            totalQty: 1,
            totalShipment: {
              $size: '$shipmentdtls',
            },
          },
        },
      ]);
      const result = {
        Group: product,
        total_records: productLength,
        // totalQty: totalQty,
        // totalRate: totalRate,
        // totalAmount: totalAmount,
      };
      return result;
    } else if (input.salesContractgroup !== '') {
      const salecontractLength = await SalesContractModel.countDocuments();
      const shipmentgroup = await ShipmentDtlModel.aggregate([
        {
          $match: {
            isDeleted: false,
          },
        },

        {
          $group: {
            _id: '$salesContract',
            rate: {
              $sum: '$rate',
            },
            amount: {
              $sum: '$amount',
            },
            qty: {
              $sum: '$qty',
            },
          },
        },
      ]);
      const totalQty = shipmentgroup.map((item) => item.qty);
      const totalRate = shipmentgroup.map((item) => item.rate);
      const totalAmount = shipmentgroup.map((item) => item.amount);
      const salecontract = await SalesContractModel.aggregate([
        {
          $lookup: {
            from: 'shipments',
            localField: '_id',
            foreignField: 'salesContract',
            as: 'salesContractData',
          },
        },
        {
          $project: {
            contract: 1,
            totalshipments: {
              $size: '$salesContractData',
            },
          },
        },
      ]);

      const result = {
        Group: salecontract,
        total_records: salecontractLength,
        // totalQty: totalQty,
        // totalRate: totalRate,
        // totalAmount: totalAmount,
      };
      return result;
    } else if (input.customergroup !== '') {
      const shipmentgroup = await ShipmentDtlModel.aggregate([
        {
          $match: {
            isDeleted: false,
          },
        },

        {
          $group: {
            _id: '$customer',
            rate: {
              $sum: '$rate',
            },
            amount: {
              $sum: '$amount',
            },
            qty: {
              $sum: '$qty',
            },
          },
        },
      ]);

      const totalQty = shipmentgroup.map((item) => item.qty);
      const totalRate = shipmentgroup.map((item) => item.rate);
      const totalAmount = shipmentgroup.map((item) => item.amount);

      const customerLength = await CustomerModel.countDocuments();
      const customer = await CustomerModel.aggregate([
        {
          $lookup: {
            from: 'salescontracts',
            localField: '_id',
            foreignField: 'customer',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'shipmentdtls',
            localField: '_id',
            foreignField: 'customer',
            as: 'shipmentData',
          },
        },
        {
          $project: {
            name: 1,
            totalcontracts: {
              $size: '$salesContractData',
            },
            totalshipments: {
              $size: '$shipmentData',
            },
          },
        },
      ]);

      const result = {
        Group: customer,
        total_records: customerLength,
        // totalQty: totalQty,
        // totalRate: totalRate,
        // totalAmount: totalAmount,
      };
      return result;
    }
  } else if (
    (Array.isArray(input.salesContract) && input.salesContract.length !== 0) ||
    (Array.isArray(input.customer) && input.customer.length !== 0) ||
    (Array.isArray(input.product_id) && input.product_id.length !== 0) ||
    input.gpNumber !== '' ||
    input.dcNumber !== ''
  ) {
    console.log('main qury');
    const salesContractArr = input.salesContract
      ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const customerArr = input.customer
      ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const productArr = input.product_id
      ? input.product_id.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    let where: any = {};
    let extrafilter: any = {};
    let filter: any = {};
    let filter_records: any = {};

    if (
      customerArr.length > 0 &&
      salesContractArr.length > 0 &&
      productArr.length > 0
    ) {
      where.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          product: { $in: productArr },
        },
      ];
      filter = {
        product: { $in: productArr },
        customer: { $in: customerArr },
        salesContract: { $in: salesContractArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          product: { $in: productArr },
        },
      ];
    } else if (customerArr.length > 0 && salesContractArr.length > 0) {
      where.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
        },
      ];
      filter.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
        },
      ];
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
        },
      ];
    } else if (customerArr.length > 0 && productArr.length > 0) {
      where.$and = [
        {
          customer: { $in: customerArr },
          product: { $in: productArr },
        },
      ];
      filter = {
        product: { $in: productArr },
        customer: { $in: customerArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          product: { $in: productArr },
        },
      ];
    } else if (salesContractArr.length > 0 && productArr.length > 0) {
      where.$and = [
        {
          salesContract: { $in: salesContractArr },
          product: { $in: productArr },
        },
      ];
      filter = {
        product: { $in: productArr },
        salesContract: { $in: salesContractArr },
      };
      filter_records.$and = [
        {
          salesContract: { $in: salesContractArr },
          product: { $in: productArr },
        },
      ];
    } else if (customerArr.length > 0) {
      where = {
        customer: { $in: customerArr },
      };
      filter = {
        customer: { $in: customerArr },
      };
      filter_records = {
        customer: { $in: customerArr },
      };
    } else if (salesContractArr.length > 0) {
      (where = {
        salesContract: { $in: salesContractArr },
      }),
        (filter = {
          salesContract: { $in: salesContractArr },
        });
      filter_records = {
        salesContract: { $in: salesContractArr },
      };
    } else if (productArr.length > 0) {
      where = {
        product: { $in: productArr },
      };
      filter = {
        product: { $in: productArr },
      };
      filter_records = {
        product: { $in: productArr },
      };
    }
    if (input.dcNumber) {
      extrafilter.dcNumber = input.dcNumber;
    }

    if (input.gpNumber) {
      extrafilter.gpNumber = input.gpNumber;
    }
    const total_record = await ShipmentDtlModel.aggregate([
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },

          isDeleted: false,
        },
      },
      {
        $match: filter_records,
      },

      {
        $lookup: {
          from: 'shipments',
          localField: 'shipment',
          foreignField: '_id',
          as: 'shipmentDetails',
        },
      },
      {
        $project: {
          gpNumber: {
            $first: '$shipmentDetails.gpNumber',
          },
          dcNumber: {
            $first: '$shipmentDetails.dcNumber',
          },
        },
      },
      { $match: extrafilter },
    ]);
    const shipmentgroupby = await ShipmentDtlModel.aggregate([
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },

          isDeleted: false,
        },
      },
      {
        $match: filter,
      },
      {
        $group: {
          _id: 'null',
          rate: {
            $sum: '$rate',
          },
          amount: {
            $sum: '$amount',
          },
          qty: {
            $sum: '$qty',
          },
        },
      },
    ]);

    const totalQty = shipmentgroupby.map((item: any) => item.qty);
    const totalRate = shipmentgroupby.map((item: any) => item.rate);
    const totalAmount = shipmentgroupby.map((item: any) => item.amount);
    const ship = await ShipmentDtlModel.aggregate([
      // {
      //   $match: {
      //     gpDate: {
      //       $gte: new Date(input.fromDate),
      //       $lte: new Date(input.toDate),
      //     },

      //     isDeleted: false,
      //   },
      // },
      // {
      //   $match: where,
      // },

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
          from: 'shipments',
          localField: 'shipment',
          foreignField: '_id',
          as: 'shipmentDetails',
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractsDetails',
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customerDetails',
        },
      },
      {
        $project: {
          qty: 1,
          totalRate: '$rate',
          totalAmount: '$amount',
          totalQty: '$qty',
          rate: 1,
          amount: 1,
          gpDate: 1,
          uom: 1,
          isDeleted: 1,
          shipment: 1,
          shipment_no: 1,
          product: 1,
          createdAt: 1,
          customerDetails: 1,
          shipmentDetails: 1,
          salesContractsDetails: 1,
          salesContract: 1,
          customer: 1,
          gpNumber: {
            $first: '$shipmentDetails.gpNumber',
          },
          dcNumber: {
            $first: '$shipmentDetails.dcNumber',
          },
        },
      },
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },

          isDeleted: false,
        },
      },
      {
        $match: where,
      },
      {
        $match: extrafilter,
      },
    ]);
    let result = {
      shipmentdtl: ship,
      total_records: total_record.length,
      totalQty: totalQty,
      totalRate: totalRate,
      totalAmount: totalAmount,
    };
    return result;
  }
};
