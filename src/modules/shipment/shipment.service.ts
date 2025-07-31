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
  ShipmentNetReportSchema,
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
import { cloneDeep, result } from 'lodash';
import { ProductDtlModel } from '../product/product_dtl.model';
import { pipeline } from 'stream';
import { ResolveTypegooseNameError } from '@typegoose/typegoose/lib/internal/errors';
import { fileURLToPath } from 'url';
import { match } from 'assert';
import { ShipmentLotModel } from './shipment_lot.model';
//import utc from 'dayjs/plugin/utc';
//dayjs.extend(utc);
// momentTimezone(dcDate).format('MM-DD-YYYY')
//momentTimezone(dcDate).format('MM-DD-YYYY')
interface ShipmentMaster {
  _id: string;
  shipmentId: string;
  salesContract: string;
  deliveryChallanNum: string;
  deliveryChallanDate: Date;
  gatePassNum: string;
  gatePassDate: Date;
  specialInstruction: string;
}
export const createShipment = async (input: CreateShipmentSchema) => {
  const {
    shipmentNumber,
    gpNumber,
    gpDate,
    dcNumber,
    dcDate,
    salesContract,
    ShipmentDtl,
    ShipmentLotDtl,
    specialInstruction,
  } = input;
  if (!ShipmentDtl || ShipmentDtl.length === 0) {
    throw new Error('returndtl is undefined or empty');
  }
  const saleDetailQty = await SalesContractDtlModel.find({
    salesContract: salesContract,
  });
  const saleQty = saleDetailQty[0].qty;
  const shipqty = await ShipmentDtlModel.find({
    salesContract: salesContract,
    isDeleted: false,
  });

  const totalship = shipqty.reduce((sum, item) => sum + item.qty, 0);
  const totalShipmentqty = ShipmentDtl.reduce(
    (sum, item) => sum + Number(item.qty),
    0
  );
  const salecontract = await SalesContractModel.findOne({
    _id: salesContract,
  }).lean();

  const totalShipmentQty = Number(totalShipmentqty) + Number(totalship);

  if (totalShipmentQty <= saleQty) {
    const shipment = await ShipmentModel.create({
      shipment: shipmentNumber,
      gpNumber,
      gpDate,
      dcNumber,
      dcDate,
      salesContract: new mongoose.Types.ObjectId(salesContract),
      contract: salecontract?.contract,
      specialInstruction,
    });

    const sale = await SalesContractModel.findOne({
      _id: salesContract,
    }).lean();

    for (const shipDtl of ShipmentDtl || []) {
      const newInvoiceDtl = await ShipmentDtlModel.create({
        qty: shipDtl.qty,
        rate: shipDtl.rate,
        shipment_no: shipmentNumber,
        amount: +shipDtl.qty * +shipDtl.rate,
        uom: shipDtl.uom,
        gpNumber: gpNumber,
        dcNumber: dcNumber,
        gpDate: gpDate,
        supplierCode: shipDtl.supplierCode,
        royaltyRate: shipDtl.royaltyRate,
        brand: new mongoose.Types.ObjectId(sale?.brand),
        customer: new mongoose.Types.ObjectId(sale?.customer),
        salesContract: new mongoose.Types.ObjectId(salesContract),
        product: new mongoose.Types.ObjectId(shipDtl.product),
        currency: new mongoose.Types.ObjectId(shipDtl.currency),
        shipment: new mongoose.Types.ObjectId(shipment._id),
      });
    }
    const prof= ShipmentDtl[0].product
    const lastLot = await ShipmentLotModel.findOne().sort({ _id: -1 }).lean();
    const nextId = lastLot?.id ? lastLot.id + 1 : 1;

    for (const shipLotDtl of ShipmentLotDtl || []) {
      const newInvoiceDtl = await ShipmentLotModel.create({
        id:nextId,
        qty: shipLotDtl.qty,
        shipment_no: shipmentNumber,
        lot: shipLotDtl.lot,
        bales: shipLotDtl.bales,
        contract:salecontract?.contract,
        date:new Date(),
        balance:shipLotDtl.balance,
        selectTableQty:shipLotDtl.selectedQty,
        gpDate: gpDate,
        supplierCode: shipLotDtl.supplierCode,
        production: new mongoose.Types.ObjectId(shipLotDtl?.production),
        salesContract: new mongoose.Types.ObjectId(salesContract),
        customer:new mongoose.Types.ObjectId(sale?.customer),
        product: new mongoose.Types.ObjectId(prof),
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

      const salesContractDetails = await SalesContractDtlModel.updateOne(
        { salesContract: salesContract },
        {
          shipment: true,
        }
      );
    }
    try {
      const saleData = await SalesContractModel.findOne({
        _id: salesContract,
      }).lean();

      if (
        saleData &&
        String(saleData.customer) === '648d7c960cee8c1de3294415'
      ) {
        await Promise.all([
          ShipmentModel.updateOne(
            { salesContract: salesContract, isDeleted: false },
            { $set: { adm_ship: true } }
          ),
          ShipmentDtlModel.updateOne(
            { salesContract: salesContract, isDeleted: false },
            { $set: { adm_ship: true } }
          ),
        ]);
      }
    } catch (error) {
      console.error('An error occurred:', error);
    }
    return shipment;
  } else {
    console.log('false');
    return 'Shipmentdtl Total Qty Is Greater Than SalesContractdtl Total Qty';
  }
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
  const searchQuery = new RegExp(`^${input?.contract}`, 'i');

  const getShipmentAggregation = (
    matchQuery:
      | { contract: { $regex: RegExp }; isDeleted: boolean }
      | { isDeleted: boolean; contract?: undefined }
  ) => {
    return ShipmentModel.aggregate([
      {
        $match: matchQuery,
      },
      {
        $lookup: {
          from: 'shipmentdtls',
          localField: '_id',
          foreignField: 'shipment',
          as: 'shipdtl',
          pipeline: [
            {
              $lookup: {
                from: 'customers',
                localField: 'customer',
                foreignField: '_id',
                as: 'customer',
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
                from: 'currencies',
                localField: 'currency',
                foreignField: '_id',
                as: 'currency',
              },
            },
            {
              $lookup: {
                from: 'salescontracts',
                localField: 'salesContract',
                foreignField: '_id',
                as: 'salesContract',
                pipeline: [
                  {
                    $lookup: {
                      from: 'brands',
                      localField: 'brand',
                      foreignField: '_id',
                      as: 'brand',
                    },
                  },
                  {
                    $lookup: {
                      from: 'paymentterms',
                      localField: 'paymentTerm',
                      foreignField: '_id',
                      as: 'paymentTerm',
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      { $skip: skipCount },
      { $limit: limit },
      { $sort: { shipment: 1 } },
    ]);
  };

  const matchQuery = input.contract
    ? { contract: { $regex: searchQuery }, isDeleted: false }
    : { isDeleted: false };

  const [shipment, totalRecords] = await Promise.all([
    getShipmentAggregation(matchQuery),
    ShipmentModel.countDocuments(matchQuery),
  ]);

  const result = {
    shipment: shipment,
    total_records: totalRecords,
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
  if (!ShipmentDtl || ShipmentDtl.length === 0) {
    throw new Error('ShipmentDtl is undefined or empty');
  }
  const salecontract = await SalesContractModel.findOne({
    _id: salesContract,
  }).lean();
  const shipmentForAdmShip = await ShipmentModel.findOne({ _id: id });
  const adm_ship = shipmentForAdmShip?.adm_ship;

  const updatedRecord = ShipmentDtl[0];
  const saleDetailQty = await SalesContractDtlModel.find({
    salesContract,
    isDeleted: false,
  });
  const shipqty = await ShipmentDtlModel.find({
    salesContract: salesContract,
    isDeleted: false,
  });

  const shiptotalqty = shipqty.reduce((sum, item) => {
    if (item.shipment.toString() !== id) {
      return sum + item.qty;
    }
    return sum;
  }, 0);

  const shipmentTotalQty = Number(shiptotalqty) + Number(updatedRecord.qty);
  const saleTotalQty = saleDetailQty[0].qty;

  if (shipmentTotalQty <= saleTotalQty) {
    const shipment = await ShipmentModel.findByIdAndUpdate(id, {
      shipmentNumber,
      gpNumber,
      //gpDate: moment(gpDate).format('YYYY-MM-DD'),
      gpDate,
      dcNumber,
      dcDate,
      return:shipmentForAdmShip?.return,
      // dcDate: moment(dcDate).format('YYYY-MM-DD'),
      // dcDate: momentTimezone(dcDate).format('MM-DD-YYYY'),
      salesContract: new mongoose.Types.ObjectId(salesContract),
      specialInstruction,
      contract: salecontract?.contract,
      adm_ship: adm_ship,
    });

    await ShipmentDtlModel.deleteMany({ shipment: id });

    for (const shipDtl of ShipmentDtl || []) {
      const newshipDtl = await ShipmentDtlModel.create({
        qty: shipDtl.qty,
        rate: shipDtl.rate,
        uom: shipDtl.uom,
        dcNumber,
        gpNumber,
        return:shipmentForAdmShip?.return,
        supplierCode: shipDtl.supplierCode,
        gpDate: gpDate,
        royaltyRate: shipDtl.royaltyRate,
        amount: +shipDtl.qty * +shipDtl.rate,
        exchangeRate: +shipDtl.exchangeRate,
        product: new mongoose.Types.ObjectId(shipDtl.product),
        currency: new mongoose.Types.ObjectId(shipDtl.currency),
        shipment: new mongoose.Types.ObjectId(shipment?._id),
        salesContract: new mongoose.Types.ObjectId(salesContract),
        customer: new mongoose.Types.ObjectId(salecontract?.customer),
        shipment_no: shipmentNumber,
        brand: new mongoose.Types.ObjectId(salecontract?.brand),
        adm_ship: adm_ship,
      });
    }

    const shipmentqty = await ShipmentDtlModel.find({
      salesContract: salesContract,
      isDeleted: false,
    });

    const shipmentTotalQtyAfterUpdate = shipmentqty.reduce((sum, item) => {
      return sum + item.qty;
    }, 0);
    if (shipmentTotalQtyAfterUpdate < saleTotalQty) {
      await SalesContractDtlModel.updateOne(
        { isDeleted: false, salesContract: salesContract },
        { $set: { shipment: false } }
      );

      await SalesContractModel.updateOne(
        { isDeleted: false, _id: salesContract },
        { $set: { shipment: false } }
      );
    } else if (shipmentTotalQtyAfterUpdate === saleTotalQty) {
      await SalesContractDtlModel.updateOne(
        { isDeleted: false, salesContract: salesContract },
        { $set: { shipment: true } }
      );

      await SalesContractModel.updateOne(
        { isDeleted: false, _id: salesContract },
        { $set: { shipment: true } }
      );
    }
    return { success: true };
  } else {
    return 'Shipmentdtl Total Qty Is Greater Than SalesContractdtl Total Qty';
  }
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
  console.log(shipments, 'shipments');
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

  let salesDtl = await SalesContractDtlModel.aggregate([
    {
      $match: {
        salesContract: new mongoose.Types.ObjectId(id),
      },
    },
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
    {
      $lookup: {
        from: 'brands',
        localField: 'brand',
        foreignField: '_id',
        as: 'brandData',
      },
    },
    {
      $lookup: {
        from: 'salescontracts',
        localField: 'salesContract',
        foreignField: '_id',
        as: 'salescontractData',
        pipeline: [
          {
            $lookup: {
              from: 'paymentterms',
              localField: 'paymentTerm',
              foreignField: '_id',
              as: 'paymentterm',
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: 'customers',
        localField: 'customer',
        foreignField: '_id',
        as: 'customerData',
      },
    },
    {
      $lookup: {
        from: 'currencies',
        localField: 'currency',
        foreignField: '_id',
        as: 'currencyData',
      },
    },
  ]);
  // .populate({ path: 'product', model: ProductModel })
  // .populate({ path: 'currency', model: CurrencyModel });

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
  const shipmentdtl = await ShipmentDtlModel.aggregate([
    {
      $match: {
        isDeleted: false,
        shipment: new mongoose.Types.ObjectId(id),
      },
    },
    {
      $lookup: {
        from: 'shipments',
        localField: 'shipment',
        foreignField: '_id',
        as: 'shipmentData',
      },
    },
    {
      $lookup: {
        from: 'customers',
        localField: 'customer',
        foreignField: '_id',
        as: 'customerData',
      },
    },
    {
      $lookup: {
        from: 'currencies',
        localField: 'currency',
        foreignField: '_id',
        as: 'currencyData',
      },
    },
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
    {
      $lookup: {
        from: 'brands',
        localField: 'brand',
        foreignField: '_id',
        as: 'brandData',
      },
    },
    {
      $lookup: {
        from: 'salescontracts',
        localField: 'salesContract',
        foreignField: '_id',
        as: 'salescontractData',
        pipeline: [
          {
            $lookup: {
              from: 'paymentterms',
              localField: 'paymentTerm',
              foreignField: '_id',
              as: 'paymentterm',
            },
          },
        ],
      },
    },
  ]);
  return shipmentdtl;
};

export const findIsDeletedShipmentDtlsByDate = async (
  input: ShipmentReportSchema
) => {
  let where: any = {
    gpDate: {
      $gte: dayjs(input.fromDate).startOf('date'),
      $lte: dayjs(input.toDate).endOf('date'),
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

export const findShipmentDtlsByDatedd = async (input: ShipmentReportSchema) => {
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
    input.gpNumber == '' &&
    input.brandgroup == '' &&
    input.transactiongroup == '' &&
    input.royality_approval == ''
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

    const totalQty = allrecordgroupby.map((item: any) => item.qty);
    const totalRate = allrecordgroupby.map((item: any) => item.rate);
    const totalAmount = allrecordgroupby.map((item: any) => item.amount);

    let where: any = {
      // gpDate: {
      //   $gte: new Date(input.fromDate),
      //   $lte: new Date(input.toDate),
      // },

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
    input.productgroup !== '' ||
    input.brandgroup !== '' ||
    input.transactiongroup !== ''
  ) {
    console.log('grouping');

    if (input.productgroup !== '') {
      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;

      const productAggregationPipeline: any = [
        {
          $lookup: {
            from: 'shipmentdtls',
            localField: '_id',
            foreignField: 'product',
            as: 'shipmentdtls',
            pipeline: [
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
                $project: {
                  qty: 1,
                  amount: 1, // Include the amount field as well
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
            totalAmount: {
              $sum: {
                $map: {
                  input: '$shipmentdtls',
                  as: 'item',
                  in: '$$item.amount',
                },
              },
            },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 }, // Optional: Match only products with a positive total amount
          },
        },
        {
          $project: {
            name: 1,
            createdAt: 1,
            totalQty: 1,
            totalAmount: 1, // Include the totalAmount in the final output
            totalShipment: {
              $size: '$shipmentdtls',
            },
          },
        },
        { $limit: limit },
        { $skip: skipCount },
        { $sort: { totalQty: 1 } }, // You can also sort by totalAmount if needed
      ];

      // const productAggregationPipeline1: any = [
      //   {
      //     $lookup: {
      //       from: 'shipmentdtls',
      //       localField: '_id',
      //       foreignField: 'product',
      //       as: 'shipmentdtls',
      //       pipeline: [
      //         {
      //           $project: {
      //             qty: 1,
      //           },
      //         },
      //       ],
      //     },
      //   },
      //   {
      //     $addFields: {
      //       totalQty: {
      //         $sum: {
      //           $map: {
      //             input: '$shipmentdtls',
      //             as: 'item',
      //             in: '$$item.qty',
      //           },
      //         },
      //       },
      //     },
      //   },
      //   {
      //     $match: {
      //       totalQty: { $gt: 0 }
      //     },
      //   },
      //   {
      //     $project: {
      //       name: 1,
      //       createdAt: 1,
      //       totalQty: 1,
      //       totalShipment: {
      //         $size: '$shipmentdtls',
      //       },
      //     },
      //   },
      //   { $limit: limit },
      //   { $skip: skipCount },
      //   { $sort: { totalQty: 1 } }
      // ]
      const productAggregationPipelineRecord: any = [
        {
          $lookup: {
            from: 'shipmentdtls',
            localField: '_id',
            foreignField: 'product',
            as: 'shipmentdtls',

            pipeline: [
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
          $match: {
            totalQty: { $gt: 0 },
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

        { $sort: { totalQty: 1 } },
      ];
      const product = await ProductModel.aggregate(
        productAggregationPipeline != undefined
          ? productAggregationPipeline
          : undefined
      );
      const total_record = await ProductModel.aggregate(
        productAggregationPipelineRecord != undefined
          ? productAggregationPipelineRecord
          : undefined
      );
      const totalAmountSum = product.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalQtySum = product.reduce((sum, item) => sum + item.totalQty, 0);

      const result = {
        Group: product,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
      };
      return result;
    } else if (input.salesContractgroup !== '') {
      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;

      //   {
      //     $lookup: {
      //       from: 'shipments',
      //       localField: '_id',
      //       foreignField: 'salesContract',
      //       as: 'salesContractData',
      //     },
      //   },
      //   {
      //     $project: {
      //       contract: 1,
      //       totalshipments: {
      //         $size: '$salesContractData',
      //       },
      //     },
      //   },
      //   { $skip: skipCount },
      //   { $limit: limit },
      //   { $sort: { totalQty: 1 } }
      // ]);

      const salecontractAggregationPipeline: any = [
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
        { $skip: skipCount },
        { $limit: limit },
        { $sort: { totalQty: 1 } },
      ];
      const salecontractAggregationPipelineRecord: any = [
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

        { $sort: { totalQty: 1 } },
      ];

      const salecontract = await SalesContractModel.aggregate(
        salecontractAggregationPipeline != undefined
          ? salecontractAggregationPipeline
          : undefined
      );
      const total_record = await SalesContractModel.aggregate(
        salecontractAggregationPipelineRecord != undefined
          ? salecontractAggregationPipelineRecord
          : undefined
      );
      const result = {
        Group: salecontract,
        total_records: total_record.length,
      };
      return result;
    } else if (input.customergroup !== '') {
      console.log('customerrrrrrrrrrrrrrrrrrrrrrr');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;

      const customerAggregationPipeline: any = [
        {
          $lookup: {
            from: 'shipmentdtls',
            localField: '_id',
            foreignField: 'customer',
            as: 'shipmentData',
            pipeline: [
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
                $project: {
                  qty: 1,
                  amount: 1,
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: '_id',
            foreignField: 'customer',
            as: 'salesContractData',
            pipeline: [
              {
                $project: {
                  contractDate: 1, // Include this to debug date filtering
                  isDeleted: 1,
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
                  input: '$shipmentData',
                  as: 'item',
                  in: '$$item.qty',
                },
              },
            },
            totalAmount: {
              $sum: {
                $map: {
                  input: '$shipmentData',
                  as: 'item',
                  in: '$$item.amount',
                },
              },
            },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 }, // Optional: Match only customers with a positive total amount
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
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
        { $sort: { totalQty: 1 } }, // You can also sort by totalAmount if needed
      ];

      // const customerAggregationPipeline1: any = [
      //   {
      //     $lookup: {
      //       from: 'salescontracts',
      //       localField: '_id',
      //       foreignField: 'customer',
      //       as: 'salesContractData',
      //       pipeline: [
      //         {
      //           $match: { isDeleted: false }
      //         },
      //       ],
      //     },
      //   },
      //   {
      //     $lookup: {
      //       from: 'shipmentdtls',
      //       localField: '_id',
      //       foreignField: 'customer',
      //       as: 'shipmentData',
      //       pipeline: [
      //         {
      //           $match: { isDeleted: false }
      //         },
      //         {
      //           $project: {
      //             qty: 1,
      //           },
      //         },
      //       ],
      //     },
      //   },
      //   {
      //     $addFields: {
      //       totalQty: {
      //         $sum: {
      //           $map: {
      //             input: '$shipmentData',
      //             as: 'item',
      //             in: '$$item.qty',
      //           },
      //         },
      //       },
      //     },
      //   },
      //   {
      //     $match: {
      //       totalQty: { $gt: 0 }
      //     },
      //   },
      //   {
      //     $project: {
      //       name: 1,
      //       totalcontracts: {
      //         $size: '$salesContractData',
      //       },
      //       totalshipments: {
      //         $size: '$shipmentData',
      //       },
      //       totalQty: 1,
      //     },
      //   },
      //   { $skip: skipCount },
      //   { $limit: limit },
      //   { $sort: { totalQty: 1 } }
      // ]
      const customerAggregationPipelineRecords: any = [
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
            pipeline: [
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
                  input: '$shipmentData',
                  as: 'item',
                  in: '$$item.qty',
                },
              },
            },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
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
            totalQty: 1,
          },
        },

        { $sort: { totalQty: 1 } },
      ];

      const customer = await CustomerModel.aggregate(
        customerAggregationPipeline != undefined
          ? customerAggregationPipeline
          : undefined
      );
      const total_record = await CustomerModel.aggregate(
        customerAggregationPipelineRecords != undefined
          ? customerAggregationPipelineRecords
          : undefined
      );
      const totalQtySum = customer.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = customer.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );

      const result = {
        Group: customer,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
      };
      return result;
    } else if (input.brandgroup !== '') {
      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      const brandAggregationPipeline: any = [
        {
          $lookup: {
            from: 'shipmentdtls',
            localField: '_id',
            foreignField: 'brand',
            as: 'shipmentdtls',
            pipeline: [
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
                $project: {
                  qty: 1,
                  amount: 1,
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
            totalAmount: {
              $sum: {
                $map: {
                  input: '$shipmentdtls',
                  as: 'item',
                  in: '$$item.amount',
                },
              },
            },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 }, // Only include brands with a positive quantity
            totalAmount: { $gt: 0 }, // Only include brands with a positive total amount
          },
        },
        {
          $project: {
            name: 1,
            createdAt: 1,
            totalQty: 1,
            totalAmount: 1, // Include totalAmount in the final output
            totalShipment: {
              $size: '$shipmentdtls',
            },
          },
        },
        {
          $project: {
            name: 1,
            createdAt: 1,
            totalQty: 1,
            totalAmount: 1,
            totalShipment: 1,
          },
        },
        { $limit: limit },
        { $skip: skipCount },
      ];

      // const brandAggregationPipeline1: any = [
      //   {
      //     $lookup: {
      //       from: 'shipmentdtls',
      //       localField: '_id',
      //       foreignField: 'brand',
      //       as: 'shipmentdtls',
      //       pipeline: [
      //         {
      //           $project: {
      //             qty: 1
      //           }
      //         }
      //       ]
      //     }
      //   }, {
      //     $addFields: {
      //       totalQty: {
      //         $sum: {
      //           $map: {
      //             input: '$shipmentdtls',
      //             as: 'item',
      //             in: '$$item.qty'
      //           }
      //         }
      //       }
      //     }
      //   },
      //   {
      //     $match: {
      //       totalQty: { $gt: 0 }
      //     },
      //   },

      //   {
      //     $project: {
      //       name: 1,
      //       createdAt: 1,
      //       totalQty: 1,

      //       totalShipment: {
      //         $size: '$shipmentdtls'
      //       }
      //     }
      //   },
      //   { $limit: limit },
      //   { $skip: skipCount },
      //   { $sort: { totalQty: 1 } },

      // ]
      const brandAggregationPipelineRecord: any = [
        {
          $lookup: {
            from: 'shipmentdtls',
            localField: '_id',
            foreignField: 'brand',
            as: 'shipmentdtls',
            pipeline: [
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
                $project: {
                  qty: 1,
                  amount: 1,
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
            totalAmount: {
              $sum: {
                $map: {
                  input: '$shipmentdtls',
                  as: 'item',
                  in: '$$item.amount',
                },
              },
            },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 }, // Only include brands with a positive quantity
            totalAmount: { $gt: 0 }, // Only include brands with a positive total amount
          },
        },
        {
          $project: {
            name: 1,
            createdAt: 1,
            totalQty: 1,
            totalAmount: 1, // Include totalAmount in the final output
            totalShipment: {
              $size: '$shipmentdtls',
            },
          },
        },
        {
          $project: {
            name: 1,
            createdAt: 1,
            totalQty: 1,
            totalAmount: 1,
            totalShipment: 1,
          },
        },
      ];
      const brand = await BrandModel.aggregate(
        brandAggregationPipeline ? brandAggregationPipeline : undefined
      );
      const total_record = await BrandModel.aggregate(
        brandAggregationPipelineRecord
          ? brandAggregationPipelineRecord
          : undefined
      );
      const totalQtySum = brand.reduce((sum, item) => sum + item.totalQty, 0);
      const totalAmountSum = brand.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const result = {
        Group: brand,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
      };

      return result;
    } else if (
      input.transactiongroup! == '' ||
      (Array.isArray(input.product_id) && input.product_id.length !== 0) ||
      (Array.isArray(input.salesContract) && input.salesContract.length == 0) ||
      (Array.isArray(input.customer) && input.customer.length == 0)
    ) {
      console.log('transaction   ==== group by');
      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      const productArr = input.product_id
        ? input.product_id.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const transaction_groupbyRecords = await ShipmentDtlModel.aggregate(
        // [
        // {
        //   '$match': {
        //     'product': { $in: productArr },
        //   }
        // }, {
        //   '$lookup': {
        //     'from': 'salescontracts',
        //     'localField': 'salesContract',
        //     'foreignField': '_id',
        //     'as': 'salesContractData'
        //   }
        // }, {
        //   '$lookup': {
        //     'from': 'products',
        //     'localField': 'product',
        //     'foreignField': '_id',
        //     'as': 'productData'
        //   }
        // }, {
        //   '$unwind': {
        //     'path': '$salesContractData',
        //     'preserveNullAndEmptyArrays': true
        //   }
        // }, {
        //   '$unwind': {
        //     'path': '$productData',
        //     'preserveNullAndEmptyArrays': true
        //   }
        // }, {
        //   '$project': {
        //     '_id': 0,
        //     'shipmentId': '$_id',
        //     'ShipmentNo': '$shipment_no',
        //     'gatePassDate': '$gpDate',
        //     'productName': '$productData.name',
        //     'product': '$product',
        //     'shipment': '$shipment',
        //     'shipmentQty': '$qty',
        //     'salesContractPO': '$salesContractData.po',
        //     'salesContractNo': '$salesContractData.contract'
        //   }
        // }, {
        //   '$unionWith': {
        //     'coll': 'productiondtls',
        //     'pipeline': [
        //       {
        //         '$match': {
        //           'product': { $in: productArr },
        //         }
        //       }, {
        //         '$lookup': {
        //           'from': 'productions',
        //           'localField': 'production',
        //           'foreignField': '_id',
        //           'as': 'productionMaster'
        //         }
        //       }, {
        //         '$lookup': {
        //           'from': 'products',
        //           'localField': 'product',
        //           'foreignField': '_id',
        //           'as': 'productData'
        //         }
        //       }, {
        //         '$unwind': {
        //           'path': '$productionMaster'
        //         }
        //       }, {
        //         '$unwind': {
        //           'path': '$productData'
        //         }
        //       }
        //     ]
        //   }
        // }, {
        //   '$project': {
        //     'shipmentId': 1,
        //     'ShipmentNo': 1,
        //     'date': {
        //       '$ifNull': [
        //         '$gatePassDate', '$date'
        //       ]
        //     },
        //     'productName': 1,
        //     'product': 1,
        //     'shipment': 1,
        //     'shipmentQty': 1,
        //     'salesContractPO': 1,
        //     'ProductionTransactionNo': '$productionMaster.tran',
        //     'productNameTransaction': '$productData.name',
        //     'productionQty': '$qty',
        //     'productionLot': '$lot'
        //   }
        // }, {
        //   '$sort': {
        //     'date': -1
        //   }
        // }
        // ]
        [
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
            $match: {
              product: { $in: productArr },
            },
          },
          {
            $lookup: {
              from: 'salescontracts',
              localField: 'salesContract',
              foreignField: '_id',
              as: 'salesContractData',
            },
          },
          {
            $lookup: {
              from: 'products',
              localField: 'product',
              foreignField: '_id',
              as: 'productData',
            },
          },
          {
            $lookup: {
              from: 'customers',
              localField: 'customer',
              foreignField: '_id',
              as: 'customerData',
            },
          },
          {
            $unwind: {
              path: '$customerData',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $unwind: {
              path: '$salesContractData',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $unwind: {
              path: '$productData',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: 0,
              shipmentId: '$_id',
              ShipmentNo: '$shipment_no',
              date: '$gpDate',
              productName: '$productData.name',
              customerName: '$customerData.name',
              product: '$product',
              shipmentQty: '$qty',
              productionQty: { $literal: 0 }, // Default to 0 for shipment records
              salesContractPO: '$salesContractData.po',
              ProductionTransactionNo: { $literal: null },
              type: 'shipment',
            },
          },
          {
            $unionWith: {
              coll: 'productiondtls',
              pipeline: [
                {
                  $match: {
                    product: { $in: productArr },
                  },
                },
                {
                  $lookup: {
                    from: 'productions',
                    localField: 'production',
                    foreignField: '_id',
                    as: 'productionMaster',
                  },
                },
                {
                  $lookup: {
                    from: 'products',
                    localField: 'product',
                    foreignField: '_id',
                    as: 'productData',
                  },
                },
                {
                  $unwind: {
                    path: '$productionMaster',
                  },
                },
                {
                  $unwind: {
                    path: '$productData',
                  },
                },
                {
                  $project: {
                    _id: 0,
                    shipmentId: '$_id',
                    ShipmentNo: '$lot',
                    date: '$date',
                    productName: '$productData.name',
                    // customerName:'$customerData.name',
                    product: '$product',
                    shipmentQty: { $literal: 0 }, // Default to 0 for production records
                    productionQty: '$qty',
                    salesContractPO: { $literal: null },
                    ProductionTransactionNo: '$productionMaster.tran',
                    type: 'production',
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              date: {
                $ifNull: ['$date', '$gpDate'],
              },
            },
          },
          {
            $sort: {
              date: -1, // Sort by date in ascending order for proper ledger calculation
            },
          },
          {
            $setWindowFields: {
              // 'partitionBy': '$product',
              sortBy: { date: 1 },
              output: {
                balance: {
                  $sum: {
                    $subtract: ['$productionQty', '$shipmentQty'],
                  },
                  window: {
                    documents: ['unbounded', 'current'],
                  },
                },
              },
            },
          },
          // {
          //   '$sort': {
          //     'date': -1
          //   }
          // },
          {
            $project: {
              shipmentId: 1,
              ShipmentNo: 1,
              date: 1,
              customerName: 1,
              productName: 1,
              product: 1,
              shipmentQty: 1,
              productionQty: 1,
              balance: 1,
              salesContractPO: 1,
              ProductionTransactionNo: 1,
            },
          },
        ]
      );
      const transaction_groupby = await ShipmentDtlModel.aggregate(
        // [
        // {
        //   '$match': {
        //     'product': { $in: productArr },
        //   }
        // }, {
        //   '$lookup': {
        //     'from': 'salescontracts',
        //     'localField': 'salesContract',
        //     'foreignField': '_id',
        //     'as': 'salesContractData'
        //   }
        // }, {
        //   '$lookup': {
        //     'from': 'products',
        //     'localField': 'product',
        //     'foreignField': '_id',
        //     'as': 'productData'
        //   }
        // }, {
        //   '$unwind': {
        //     'path': '$salesContractData',
        //     'preserveNullAndEmptyArrays': true
        //   }
        // }, {
        //   '$unwind': {
        //     'path': '$productData',
        //     'preserveNullAndEmptyArrays': true
        //   }
        // }, {
        //   '$project': {
        //     '_id': 0,
        //     'shipmentId': '$_id',
        //     'ShipmentNo': '$shipment_no',
        //     'gatePassDate': '$gpDate',
        //     'productName': '$productData.name',
        //     'product': '$product',
        //     'shipment': '$shipment',
        //     'shipmentQty': '$qty',
        //     'salesContractPO': '$salesContractData.po',
        //     'salesContractNo': '$salesContractData.contract'
        //   }
        // }, {
        //   '$unionWith': {
        //     'coll': 'productiondtls',
        //     'pipeline': [
        //       {
        //         '$match': {
        //           'product': { $in: productArr },
        //         }
        //       }, {
        //         '$lookup': {
        //           'from': 'productions',
        //           'localField': 'production',
        //           'foreignField': '_id',
        //           'as': 'productionMaster'
        //         }
        //       }, {
        //         '$lookup': {
        //           'from': 'products',
        //           'localField': 'product',
        //           'foreignField': '_id',
        //           'as': 'productData'
        //         }
        //       }, {
        //         '$unwind': {
        //           'path': '$productionMaster'
        //         }
        //       }, {
        //         '$unwind': {
        //           'path': '$productData'
        //         }
        //       }
        //     ]
        //   }
        // }, {
        //   '$project': {
        //     'shipmentId': 1,
        //     'ShipmentNo': 1,
        //     'date': {
        //       '$ifNull': [
        //         '$gatePassDate', '$date'
        //       ]
        //     },
        //     'productName': 1,
        //     'product': 1,
        //     'shipment': 1,
        //     'shipmentQty': 1,
        //     'salesContractPO': 1,
        //     'ProductionTransactionNo': '$productionMaster.tran',
        //     'productNameTransaction': '$productData.name',
        //     'productionQty': '$qty',
        //     'productionLot': '$lot'
        //   }
        // }, {
        //   '$sort': {
        //     'date': -1
        //   }
        // }
        // ]
        [
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
            $match: {
              product: { $in: productArr },
            },
          },
          {
            $lookup: {
              from: 'salescontracts',
              localField: 'salesContract',
              foreignField: '_id',
              as: 'salesContractData',
            },
          },
          {
            $lookup: {
              from: 'products',
              localField: 'product',
              foreignField: '_id',
              as: 'productData',
            },
          },
          {
            $lookup: {
              from: 'customers',
              localField: 'customer',
              foreignField: '_id',
              as: 'customerData',
            },
          },
          {
            $unwind: {
              path: '$customerData',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $unwind: {
              path: '$salesContractData',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $unwind: {
              path: '$productData',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: 0,
              shipmentId: '$_id',
              ShipmentNo: '$shipment_no',
              date: '$gpDate',
              productName: '$productData.name',
              customerName: '$customerData.name',
              product: '$product',
              shipmentQty: '$qty',
              productionQty: { $literal: 0 }, // Default to 0 for shipment records
              salesContractPO: '$salesContractData.po',
              ProductionTransactionNo: { $literal: null },
              type: 'shipment',
            },
          },
          {
            $unionWith: {
              coll: 'productiondtls',
              pipeline: [
                {
                  $match: {
                    product: { $in: productArr },
                  },
                },
                {
                  $lookup: {
                    from: 'productions',
                    localField: 'production',
                    foreignField: '_id',
                    as: 'productionMaster',
                  },
                },
                {
                  $lookup: {
                    from: 'products',
                    localField: 'product',
                    foreignField: '_id',
                    as: 'productData',
                  },
                },
                {
                  $unwind: {
                    path: '$productionMaster',
                  },
                },
                {
                  $unwind: {
                    path: '$productData',
                  },
                },
                {
                  $project: {
                    _id: 0,
                    shipmentId: '$_id',
                    ShipmentNo: '$lot',
                    date: '$date',
                    productName: '$productData.name',
                    // customerName:'$customerData.name',
                    product: '$product',
                    shipmentQty: { $literal: 0 }, // Default to 0 for production records
                    productionQty: '$qty',
                    salesContractPO: { $literal: null },
                    ProductionTransactionNo: '$productionMaster.tran',
                    type: 'production',
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              date: {
                $ifNull: ['$date', '$gpDate'],
              },
            },
          },
          {
            $sort: {
              date: -1, // Sort by date in ascending order for proper ledger calculation
            },
          },
          {
            $setWindowFields: {
              // 'partitionBy': '$product',
              sortBy: { date: 1 },
              output: {
                balance: {
                  $sum: {
                    $subtract: ['$productionQty', '$shipmentQty'],
                  },
                  window: {
                    documents: ['unbounded', 'current'],
                  },
                },
              },
            },
          },
          // {
          //   '$sort': {
          //     'date': -1
          //   }
          // },
          {
            $project: {
              shipmentId: 1,
              ShipmentNo: 1,
              date: 1,
              customerName: 1,
              productName: 1,
              product: 1,
              shipmentQty: 1,
              productionQty: 1,
              balance: 1,
              salesContractPO: 1,
              ProductionTransactionNo: 1,
            },
          },

          { $skip: skipCount },
          { $limit: limit },
        ]
      );
      const totalShipmentSum = transaction_groupbyRecords.reduce(
        (sum, item) => sum + item.shipmentQty,
        0
      );
      const totalProductionSum = transaction_groupbyRecords.reduce(
        (sum, item) => sum + item.productionQty,
        0
      );
      const totalBalanceSum = transaction_groupbyRecords.reduce(
        (sum, item) => sum + item.balance,
        0
      );

      const result = {
        transaction_groupby: transaction_groupby,
        totalShipmentSum: totalShipmentSum,
        totalProductionSum: totalProductionSum,
        totalBalanceSum: totalBalanceSum,
        total_records: transaction_groupbyRecords.length,
      };
      return result;
    }
  } else if (
    (Array.isArray(input.salesContract) && input.salesContract.length !== 0) ||
    (Array.isArray(input.customer) && input.customer.length !== 0) ||
    (Array.isArray(input.product_id) && input.product_id.length !== 0) ||
    input.gpNumber !== '' ||
    input.dcNumber !== '' ||
    input.royality_approval !== ''
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
    function stringToBoolean(str: string | undefined) {
      return str?.toLowerCase() === 'true';
    }
    if (input.royality_approval) {
      extrafilter.royality_approval = stringToBoolean(input.royality_approval);
    }
    console.log(extrafilter);
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
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractsDetails',
          pipeline: [
            {
              $project: {
                contract: 1,
                royality_approval: 1,
              },
            },
          ],
        },
      },

      {
        $project: {
          contract: { $first: '$salesContractsDetails.contract' },
          royality_approval: {
            $first: '$salesContractsDetails.royality_approval',
          },
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
      { $match: filter },
      {
        $lookup: {
          from: 'shipments',
          localField: 'shipment',
          foreignField: '_id',
          as: 'shipment',
        },
      },

      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractsDetails',
          pipeline: [
            {
              $project: {
                contract: 1,
                royality_approval: 1,
              },
            },
          ],
        },
      },

      {
        $project: {
          qty: 1,
          rate: 1,
          amount: 1,
          contract: { $first: '$salesContractsDetails.contract' },
          royality_approval: {
            $first: '$salesContractsDetails.royality_approval',
          },
          gpNumber: {
            $first: '$shipment.gpNumber',
          },
          dcNumber: {
            $first: '$shipment.dcNumber',
          },
          gpDate: 1,
        },
      },
      { $match: extrafilter },
      {
        $group: {
          _id: 'null',
          qty: {
            $sum: '$qty',
          },
          rate: {
            $sum: '$rate',
          },
          amount: {
            $sum: '$amount',
          },
        },
      },

      //       {
      //         $match: {
      //           gpDate: {
      //             $gte: new Date(input.fromDate),
      //             $lte: new Date(input.toDate),
      //           },
      //           isDeleted: false,
      //          // ...extrafilter,
      //           // ...filter,
      //         },
      //       },
      // {

      //         $group: {
      //           _id: 'null',
      //           totalQty: { $sum: '$qty' },      // Calculate total quantity
      //           totalRate: { $sum: '$rate' },    // Calculate total rate
      //           totalAmount: { $sum: '$amount' }, // Calculate total amount
      //         },
      //       },
      //        { $match: extrafilter },
    ]);

    // Extract totals from the result
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
          pipeline: [
            {
              $project: {
                contract: 1,
                royality_approval: 1,
              },
            },
          ],
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
          supplierCode: 1,
          shipment: 1,
          shipment_no: 1,
          product: 1,
          createdAt: 1,
          customerDetails: 1,
          shipmentDetails: 1,
          contract: { $first: '$salesContractsDetails.contract' },
          royality_approval: {
            $first: '$salesContractsDetails.royality_approval',
          },
          // salesContractsDetails: 1,
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
      paginated_record: ship.length,
      total_records: total_record.length,
      totalQty: totalQty,
      totalRate: totalRate,
      totalAmount: totalAmount,
    };
    return result;
  }
};

export const findShipmentDtlsByDate_old = async (input: ShipmentReportSchema) => {
  if (
    Array.isArray(input.product_id) &&
    input.product_id.length == 0 &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0 &&
    input.customergroup == '' &&
    input.productgroup == '' &&
    input.salesContractgroup == '' &&
    input.dcNumber == '' &&
    input.gpNumber == '' &&
    input.brandgroup == '' &&
    input.transactiongroup == '' &&
    input.royality_approval == '' &&
    input.Adm == '' &&
    input.nonAdm == ''
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
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
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
    input.productgroup !== '' &&
    input.royality_approval !== '' &&
    input.Adm == '' &&
    input.nonAdm == ''
  ) {
    console.log('product group  royality_approval');

    function stringToBoolean(str: string | undefined) {
      return str?.toLowerCase() === 'true';
    }

    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;

    const royality_approval = stringToBoolean(input.royality_approval);
    console.log(royality_approval);

    const productAggregationPipeline = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          royality_approval: royality_approval,
          shipment: true,
        },
      },
      {
        $lookup: {
          from: 'shipmentdtls',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'shipment',
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
        $group: {
          _id: '$product._id',
          totalShipment: {
            $sum: 1,
          },
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
          product: {
            $first: '$product',
          },
        },
      },
      {
        $project: {
          product_id: {
            $arrayElemAt: ['$product._id', 0],
          },
          product_name: {
            $arrayElemAt: ['$product.name', 0],
          },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
      { $skip: skipCount },
      { $limit: limit },
    ];

    const productAggregationPipelineRecord = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          shipment: true,
          royality_approval: royality_approval,
        },
      },
      {
        $lookup: {
          from: 'shipmentdtls',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'shipment',
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
        $group: {
          _id: '$product._id',
          totalShipment: {
            $sum: 1,
          },
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
          product: {
            $first: '$product',
          },
        },
      },
      {
        $project: {
          product_id: {
            $arrayElemAt: ['$product._id', 0],
          },
          product_name: {
            $arrayElemAt: ['$product.name', 0],
          },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
    ];

    const productAggregationPipelinet: any = [
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
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractData',
          pipeline: [
            {
              $match: {
                royality_approval: input.royality_approval, // Ensure this matches the input format
                isDeleted: false,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          salesContractData: {
            $filter: {
              input: '$salesContractData',
              as: 'contract',
              cond: {
                $eq: ['$$contract.royality_approval', input.royality_approval],
              },
            },
          },
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
        $group: {
          _id: '$product._id',
          totalShipment: {
            $sum: 1,
          },
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
          product: {
            $first: '$product',
          },
        },
      },
      {
        $project: {
          product_id: {
            $arrayElemAt: ['$product._id', 0],
          },
          product_name: {
            $arrayElemAt: ['$product.name', 0],
          },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
      { $skip: skipCount },
      { $limit: limit },
    ];

    const productAggregationPipelineRecords: any = [
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          // royality_approval: royality_approval,
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractData',
          pipeline: [
            {
              $match: {
                royality_approval: royality_approval,
                isDeleted: false,
              },
            },
          ],
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
        $group: {
          _id: '$product._id',
          // Group by customer
          totalShipment: {
            $sum: 1,
          },
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
          product: {
            $first: '$product',
          },
        },
      },
      {
        $project: {
          product_id: {
            $arrayElemAt: ['$product._id', 0],
          },
          product_name: {
            $arrayElemAt: ['$product.name', 0],
          },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
    ];

    const shipmentgroup = await SalesContractDtlModel.aggregate(
      productAggregationPipeline
    );

    const total_records = await SalesContractDtlModel.aggregate(
      productAggregationPipelineRecord
    );

    const totalShipmentSum = total_records.reduce(
      (sum, item) => sum + item.totalShipment,
      0
    );

    const totalQtySum = total_records.reduce((sum, item) => sum + item.qty, 0);
    const totalAmountSum = total_records.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const result = {
      Group: shipmentgroup,
      total_records: total_records.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalShipmentSum: totalShipmentSum,
    };
    return result;
  } else if (
    input.brandgroup !== '' &&
    input.royality_approval !== '' &&
    input.Adm == '' &&
    input.nonAdm == ''
  ) {
    console.log('brand group royality_approval');

    function stringToBoolean(str: string | undefined) {
      return str?.toLowerCase() === 'true';
    }
    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;

    const royality_approval = stringToBoolean(input.royality_approval);

    const brandAggregationPipeline: any = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          shipment: true,
          royality_approval: royality_approval,
        },
      },
      {
        $lookup: {
          from: 'shipmentdtls',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'shipment',
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
        },
      },
      {
        $group: {
          _id: '$brand._id',
          totalShipment: {
            $sum: 1,
          },
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
          brand: {
            $first: '$brand',
          },
        },
      },
      {
        $project: {
          product_id: {
            $arrayElemAt: ['$product._id', 0],
          },
          brand_name: {
            $arrayElemAt: ['$brand.name', 0],
          },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
      { $skip: skipCount },
      { $limit: limit },
    ];
    const brandAggregationPipelineRecord: any = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          shipment: true,
          royality_approval: royality_approval,
        },
      },
      {
        $lookup: {
          from: 'shipmentdtls',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'shipment',
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
        },
      },
      {
        $group: {
          _id: '$brand._id',
          totalShipment: {
            $sum: 1,
          },
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
          brand: {
            $first: '$brand',
          },
        },
      },
      {
        $project: {
          product_id: {
            $arrayElemAt: ['$product._id', 0],
          },
          brand_name: {
            $arrayElemAt: ['$brand.name', 0],
          },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
    ];

    const brandAggregationPipelined: any = [
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
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractData',
          pipeline: [
            {
              $match: {
                isDeleted: false,
                royality_approval: royality_approval,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
        },
      },
      {
        $group: {
          _id: '$brand._id',
          // Group by customer
          totalShipment: {
            $sum: 1,
          },
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
          brand: {
            $first: '$brand',
          },
        },
      },
      {
        $project: {
          brand_id: {
            $arrayElemAt: ['$brand._id', 0],
          },
          brand_name: {
            $arrayElemAt: ['$brand.name', 0],
          },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
      { $skip: skipCount },
      { $limit: limit },
    ];

    const brandAggregationPipelineRecordd: any = [
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
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractData',
          pipeline: [
            {
              $match: {
                isDeleted: false,
                royality_approval: royality_approval,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
        },
      },
      {
        $group: {
          _id: '$brand._id',
          // Group by customer
          totalShipment: {
            $sum: 1,
          },
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
          brand: {
            $first: '$brand',
          },
        },
      },
      {
        $project: {
          brand_id: {
            $arrayElemAt: ['$brand._id', 0],
          },
          brand_name: {
            $arrayElemAt: ['$brand.name', 0],
          },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
    ];

    const shipmentgroup = await SalesContractDtlModel.aggregate(
      brandAggregationPipeline
    );

    const total_records = await SalesContractDtlModel.aggregate(
      brandAggregationPipelineRecord
    );

    const totalShipmentSum = total_records.reduce(
      (sum, item) => sum + item.totalShipment,
      0
    );

    const totalQtySum = total_records.reduce((sum, item) => sum + item.qty, 0);
    const totalAmountSum = total_records.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const result = {
      Group: shipmentgroup,
      total_records: total_records.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalShipmentSum: totalShipmentSum,
    };
    return result;
  } else if (
    input.customergroup !== '' &&
    input.royality_approval !== '' &&
    input.Adm == '' &&
    input.nonAdm == ''
  ) {
    console.log('customer group royality_approval');

    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;

    function stringToBoolean(str: string | undefined) {
      return str?.toLowerCase() === 'true';
    }

    const royality_approval = stringToBoolean(input.royality_approval);

    const customerAggregationPipeline = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          shipment: true,
          royality_approval: royality_approval,
        },
      },
      {
        $lookup: {
          from: 'shipmentdtls',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'shipment',
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $group: {
          _id: '$customer._id',
          totalShipment: {
            $sum: 1,
          },
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
          customer: {
            $first: '$customer',
          },
        },
      },
      {
        $project: {
          customer_id: {
            $arrayElemAt: ['$customer._id', 0],
          },
          customer_name: {
            $arrayElemAt: ['$customer.name', 0],
          },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
      { $skip: skipCount },
      { $limit: limit },
    ];
    const customerAggregationPipelineRecords = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          shipment: true,
          royality_approval: royality_approval,
        },
      },
      {
        $lookup: {
          from: 'shipmentdtls',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'shipment',
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $group: {
          _id: '$customer._id',
          totalShipment: {
            $sum: 1,
          },
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
          customer: {
            $first: '$customer',
          },
        },
      },
      {
        $project: {
          customer_id: {
            $arrayElemAt: ['$customer._id', 0],
          },
          customer_name: {
            $arrayElemAt: ['$customer.name', 0],
          },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
    ];

    const customerAggregationPipelines = [
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
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractData',

          pipeline: [
            {
              $match: {
                royality_approval: royality_approval,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $group: {
          _id: '$customer._id',
          // Group by customer
          totalShipment: {
            $sum: 1,
          },
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
          customer: {
            $first: '$customer',
          },
        },
      },
      {
        $project: {
          customer_id: {
            $arrayElemAt: ['$customer._id', 0],
          },
          customer_name: {
            $arrayElemAt: ['$customer.name', 0],
          },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
      { $skip: skipCount },
      { $limit: limit },
    ];
    const customerAggregationPipelineRecord = [
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
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractData',

          pipeline: [
            {
              $match: {
                royality_approval: royality_approval,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $group: {
          _id: '$customer._id',
          // Group by customer
          totalShipment: {
            $sum: 1,
          },
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
          customer: {
            $first: '$customer',
          },
        },
      },
      {
        $project: {
          customer_id: {
            $arrayElemAt: ['$customer._id', 0],
          },
          customer_name: {
            $arrayElemAt: ['$customer.name', 0],
          },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
    ];
    const shipmentgroup = await SalesContractDtlModel.aggregate(
      customerAggregationPipeline
    );
    const total_records = await SalesContractDtlModel.aggregate(
      customerAggregationPipelineRecords
    );

    const totalShipmentSum = total_records.reduce(
      (sum, item) => sum + item.totalShipment,
      0
    );

    const totalQtySum = total_records.reduce((sum, item) => sum + item.qty, 0);
    const totalAmountSum = total_records.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const result = {
      Group: shipmentgroup,
      total_records: total_records.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalShipmentSum: totalShipmentSum,
    };
    return result;
  } else if (
    input.customergroup !== '' &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.product_id) &&
    input.product_id.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    input.dcNumber == '' &&
    input.gpNumber == '' &&
    input.royality_approval == '' &&
    input.Adm == '' &&
    input.nonAdm == ''
  ) {
    console.log('customer general group');
    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;

    const customerAggregationPipeline: any = [
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
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $unwind: {
          path: '$customer',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          name: '$customer.name',
          qty: 1,
          amount: 1,
          createdAt: 1,
          customer_id: '$customer._id',
        },
      },
      {
        $group: {
          _id: '$customer_id',
          name: {
            $first: '$name',
          },
          createdAt: {
            $first: '$createdAt',
          },
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalShipment: {
            $sum: 1,
          },
        },
      },
      {
        $match: {
          totalQty: {
            $gt: 0,
          },
          totalAmount: {
            $gt: 0,
          },
        },
      },
      {
        $project: {
          name: 1,
          createdAt: 1,
          totalQty: 1,
          totalAmount: 1,
          totalShipment: 1,
        },
      },
      { $skip: skipCount },
      { $limit: limit },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ];

    const customerAggregationPipelineRecords: any = [
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
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $unwind: {
          path: '$customer',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          name: '$customer.name',
          qty: 1,
          amount: 1,
          createdAt: 1,
          customer_id: '$customer._id',
        },
      },
      {
        $group: {
          _id: '$customer_id',
          name: {
            $first: '$name',
          },
          createdAt: {
            $first: '$createdAt',
          },
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalShipment: {
            $sum: 1,
          },
        },
      },
      {
        $match: {
          totalQty: {
            $gt: 0,
          },
          totalAmount: {
            $gt: 0,
          },
        },
      },
      {
        $project: {
          name: 1,
          createdAt: 1,
          totalQty: 1,
          totalAmount: 1,
          totalShipment: 1,
        },
      },

      { $sort: { totalQty: -1, totalAmount: -1 } },
    ];

    const customer = await ShipmentDtlModel.aggregate(
      customerAggregationPipeline != undefined
        ? customerAggregationPipeline
        : undefined
    );
    const total_record = await ShipmentDtlModel.aggregate(
      customerAggregationPipelineRecords != undefined
        ? customerAggregationPipelineRecords
        : undefined
    );
    const totalQtySum = total_record.reduce(
      (sum, item) => sum + item.totalQty,
      0
    );
    const totalAmountSum = total_record.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );

    const result = {
      Group: customer,
      total_records: total_record.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
    };
    return result;
  } else if (
    input.productgroup !== '' &&
    input.royality_approval == '' &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.product_id) &&
    input.product_id.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0 &&
    input.dcNumber == '' &&
    input.gpNumber == '' &&
    input.Adm == '' &&
    input.nonAdm == ''
  ) {
    console.log('product general group');

    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;

    // const productAggregationPipelines: any = [
    //   {
    //     $lookup: {
    //       from: 'shipmentdtls',
    //       localField: '_id',
    //       foreignField: 'product',
    //       as: 'shipmentdtls',
    //       pipeline: [
    //         {
    //           $match: {
    //             gpDate: {
    //               $gte: new Date(input.fromDate),
    //               $lte: new Date(input.toDate),
    //             },
    //             isDeleted: false,
    //           },
    //         },
    //         {
    //           $project: {
    //             qty: 1,
    //             amount: 1,
    //           },
    //         },
    //       ],
    //     },
    //   },
    //   {
    //     $addFields: {
    //       totalQty: {
    //         $sum: {
    //           $map: {
    //             input: '$shipmentdtls',
    //             as: 'item',
    //             in: '$$item.qty',
    //           },
    //         },
    //       },
    //       totalAmount: {
    //         $sum: {
    //           $map: {
    //             input: '$shipmentdtls',
    //             as: 'item',
    //             in: '$$item.amount',
    //           },
    //         },
    //       },
    //     },
    //   },
    //   {
    //     $match: {
    //       totalQty: { $gt: 0 },
    //       totalAmount: { $gt: 0 },
    //     },
    //   },
    //   {
    //     $project: {
    //       name: 1,
    //       createdAt: 1,
    //       totalQty: 1,
    //       totalAmount: 1,
    //       totalShipment: {
    //         $size: '$shipmentdtls',
    //       },
    //     },
    //   },
    //   { $limit: limit },
    //   { $skip: skipCount },
    //   { $sort: { totalQty: -1, totalAmount: -1 } }, // You can also sort by totalAmount if needed
    // ];
    const productAggregationPipeline: any = [
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
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product',
        },
      },
      {
        $unwind: {
          path: '$product',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          name: '$product.name',
          qty: 1,
          amount: 1,
          createdAt: 1,
          product_id: '$product._id',
        },
      },
      {
        $group: {
          _id: '$product_id',
          name: {
            $first: '$name',
          },
          createdAt: {
            $first: '$createdAt',
          },
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalShipment: {
            $sum: 1,
          },
        },
      },
      {
        $match: {
          totalQty: {
            $gt: 0,
          },
          totalAmount: {
            $gt: 0,
          },
        },
      },
      {
        $project: {
          name: 1,
          createdAt: 1,
          totalQty: 1,
          totalAmount: 1,
          totalShipment: 1,
        },
      },
      { $limit: limit },
      { $skip: skipCount },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ];

    const productAggregationPipelineRecord: any = [
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
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product',
        },
      },
      {
        $unwind: {
          path: '$product',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          name: '$product.name',
          qty: 1,
          amount: 1,
          createdAt: 1,
          product_id: '$product._id',
        },
      },
      {
        $group: {
          _id: '$product_id',
          name: {
            $first: '$name',
          },
          createdAt: {
            $first: '$createdAt',
          },
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalShipment: {
            $sum: 1,
          },
        },
      },
      {
        $match: {
          totalQty: {
            $gt: 0,
          },
          totalAmount: {
            $gt: 0,
          },
        },
      },
      {
        $project: {
          name: 1,
          createdAt: 1,
          totalQty: 1,
          totalAmount: 1,
          totalShipment: 1,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ];
    const product = await ShipmentDtlModel.aggregate(
      productAggregationPipeline != undefined
        ? productAggregationPipeline
        : undefined
    );
    const total_record = await ShipmentDtlModel.aggregate(
      productAggregationPipelineRecord != undefined
        ? productAggregationPipelineRecord
        : undefined
    );
    const totalAmountSum = product.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const totalQtySum = product.reduce((sum, item) => sum + item.totalQty, 0);

    const result = {
      Group: product,
      total_records: total_record.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
    };
    return result;
  } else if (
    input.transactiongroup !== '' &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.product_id) &&
    input.product_id.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0 &&
    input.dcNumber == '' &&
    input.gpNumber == '' &&
    input.royality_approval == '' &&
    input.Adm == '' &&
    input.nonAdm == ''
  ) {
    console.log('transaction   ==== group by');
    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;
    const productArr = input.product_id
      ? input.product_id.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const transaction_groupbyRecords = await ShipmentDtlModel.aggregate(
      // [
      // {
      //   '$match': {
      //     'product': { $in: productArr },
      //   }
      // }, {
      //   '$lookup': {
      //     'from': 'salescontracts',
      //     'localField': 'salesContract',
      //     'foreignField': '_id',
      //     'as': 'salesContractData'
      //   }
      // }, {
      //   '$lookup': {
      //     'from': 'products',
      //     'localField': 'product',
      //     'foreignField': '_id',
      //     'as': 'productData'
      //   }
      // }, {
      //   '$unwind': {
      //     'path': '$salesContractData',
      //     'preserveNullAndEmptyArrays': true
      //   }
      // }, {
      //   '$unwind': {
      //     'path': '$productData',
      //     'preserveNullAndEmptyArrays': true
      //   }
      // }, {
      //   '$project': {
      //     '_id': 0,
      //     'shipmentId': '$_id',
      //     'ShipmentNo': '$shipment_no',
      //     'gatePassDate': '$gpDate',
      //     'productName': '$productData.name',
      //     'product': '$product',
      //     'shipment': '$shipment',
      //     'shipmentQty': '$qty',
      //     'salesContractPO': '$salesContractData.po',
      //     'salesContractNo': '$salesContractData.contract'
      //   }
      // }, {
      //   '$unionWith': {
      //     'coll': 'productiondtls',
      //     'pipeline': [
      //       {
      //         '$match': {
      //           'product': { $in: productArr },
      //         }
      //       }, {
      //         '$lookup': {
      //           'from': 'productions',
      //           'localField': 'production',
      //           'foreignField': '_id',
      //           'as': 'productionMaster'
      //         }
      //       }, {
      //         '$lookup': {
      //           'from': 'products',
      //           'localField': 'product',
      //           'foreignField': '_id',
      //           'as': 'productData'
      //         }
      //       }, {
      //         '$unwind': {
      //           'path': '$productionMaster'
      //         }
      //       }, {
      //         '$unwind': {
      //           'path': '$productData'
      //         }
      //       }
      //     ]
      //   }
      // }, {
      //   '$project': {
      //     'shipmentId': 1,
      //     'ShipmentNo': 1,
      //     'date': {
      //       '$ifNull': [
      //         '$gatePassDate', '$date'
      //       ]
      //     },
      //     'productName': 1,
      //     'product': 1,
      //     'shipment': 1,
      //     'shipmentQty': 1,
      //     'salesContractPO': 1,
      //     'ProductionTransactionNo': '$productionMaster.tran',
      //     'productNameTransaction': '$productData.name',
      //     'productionQty': '$qty',
      //     'productionLot': '$lot'
      //   }
      // }, {
      //   '$sort': {
      //     'date': -1
      //   }
      // }
      // ]
      [
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
          $match: {
            product: { $in: productArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productData',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customerData',
          },
        },
        {
          $unwind: {
            path: '$customerData',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: '$salesContractData',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: '$productData',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 0,
            shipmentId: '$_id',
            ShipmentNo: '$shipment_no',
            date: '$gpDate',
            productName: '$productData.name',
            customerName: '$customerData.name',
            product: '$product',
            shipmentQty: '$qty',
            productionQty: { $literal: 0 }, // Default to 0 for shipment records
            salesContractPO: '$salesContractData.po',
            ProductionTransactionNo: { $literal: null },
            type: 'shipment',
          },
        },
        {
          $unionWith: {
            coll: 'productiondtls',
            pipeline: [
              {
                $match: {
                  product: { $in: productArr },
                },
              },
              {
                $lookup: {
                  from: 'productions',
                  localField: 'production',
                  foreignField: '_id',
                  as: 'productionMaster',
                },
              },
              {
                $lookup: {
                  from: 'products',
                  localField: 'product',
                  foreignField: '_id',
                  as: 'productData',
                },
              },
              {
                $unwind: {
                  path: '$productionMaster',
                },
              },
              {
                $unwind: {
                  path: '$productData',
                },
              },
              {
                $project: {
                  _id: 0,
                  shipmentId: '$_id',
                  ShipmentNo: '$lot',
                  date: '$date',
                  productName: '$productData.name',
                  // customerName:'$customerData.name',
                  product: '$product',
                  shipmentQty: { $literal: 0 }, // Default to 0 for production records
                  productionQty: '$qty',
                  salesContractPO: { $literal: null },
                  ProductionTransactionNo: '$productionMaster.tran',
                  type: 'production',
                },
              },
            ],
          },
        },
        {
          $addFields: {
            date: {
              $ifNull: ['$date', '$gpDate'],
            },
          },
        },
        {
          $sort: {
            date: -1, // Sort by date in ascending order for proper ledger calculation
          },
        },
        {
          $setWindowFields: {
            // 'partitionBy': '$product',
            sortBy: { date: 1 },
            output: {
              balance: {
                $sum: {
                  $subtract: ['$productionQty', '$shipmentQty'],
                },
                window: {
                  documents: ['unbounded', 'current'],
                },
              },
            },
          },
        },
        // {
        //   '$sort': {
        //     'date': -1
        //   }
        // },
        {
          $project: {
            shipmentId: 1,
            ShipmentNo: 1,
            date: 1,
            customerName: 1,
            productName: 1,
            product: 1,
            shipmentQty: 1,
            productionQty: 1,
            balance: 1,
            salesContractPO: 1,
            ProductionTransactionNo: 1,
          },
        },
      ]
    );
    const transaction_groupby = await ShipmentDtlModel.aggregate(
      // [
      // {
      //   '$match': {
      //     'product': { $in: productArr },
      //   }
      // }, {
      //   '$lookup': {
      //     'from': 'salescontracts',
      //     'localField': 'salesContract',
      //     'foreignField': '_id',
      //     'as': 'salesContractData'
      //   }
      // }, {
      //   '$lookup': {
      //     'from': 'products',
      //     'localField': 'product',
      //     'foreignField': '_id',
      //     'as': 'productData'
      //   }
      // }, {
      //   '$unwind': {
      //     'path': '$salesContractData',
      //     'preserveNullAndEmptyArrays': true
      //   }
      // }, {
      //   '$unwind': {
      //     'path': '$productData',
      //     'preserveNullAndEmptyArrays': true
      //   }
      // }, {
      //   '$project': {
      //     '_id': 0,
      //     'shipmentId': '$_id',
      //     'ShipmentNo': '$shipment_no',
      //     'gatePassDate': '$gpDate',
      //     'productName': '$productData.name',
      //     'product': '$product',
      //     'shipment': '$shipment',
      //     'shipmentQty': '$qty',
      //     'salesContractPO': '$salesContractData.po',
      //     'salesContractNo': '$salesContractData.contract'
      //   }
      // }, {
      //   '$unionWith': {
      //     'coll': 'productiondtls',
      //     'pipeline': [
      //       {
      //         '$match': {
      //           'product': { $in: productArr },
      //         }
      //       }, {
      //         '$lookup': {
      //           'from': 'productions',
      //           'localField': 'production',
      //           'foreignField': '_id',
      //           'as': 'productionMaster'
      //         }
      //       }, {
      //         '$lookup': {
      //           'from': 'products',
      //           'localField': 'product',
      //           'foreignField': '_id',
      //           'as': 'productData'
      //         }
      //       }, {
      //         '$unwind': {
      //           'path': '$productionMaster'
      //         }
      //       }, {
      //         '$unwind': {
      //           'path': '$productData'
      //         }
      //       }
      //     ]
      //   }
      // }, {
      //   '$project': {
      //     'shipmentId': 1,
      //     'ShipmentNo': 1,
      //     'date': {
      //       '$ifNull': [
      //         '$gatePassDate', '$date'
      //       ]
      //     },
      //     'productName': 1,
      //     'product': 1,
      //     'shipment': 1,
      //     'shipmentQty': 1,
      //     'salesContractPO': 1,
      //     'ProductionTransactionNo': '$productionMaster.tran',
      //     'productNameTransaction': '$productData.name',
      //     'productionQty': '$qty',
      //     'productionLot': '$lot'
      //   }
      // }, {
      //   '$sort': {
      //     'date': -1
      //   }
      // }
      // ]
      [
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
          $match: {
            product: { $in: productArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productData',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customerData',
          },
        },
        {
          $unwind: {
            path: '$customerData',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: '$salesContractData',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: '$productData',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 0,
            shipmentId: '$_id',
            ShipmentNo: '$shipment_no',
            date: '$gpDate',
            productName: '$productData.name',
            customerName: '$customerData.name',
            product: '$product',
            shipmentQty: '$qty',
            productionQty: { $literal: 0 }, // Default to 0 for shipment records
            salesContractPO: '$salesContractData.po',
            ProductionTransactionNo: { $literal: null },
            type: 'shipment',
          },
        },
        {
          $unionWith: {
            coll: 'productiondtls',
            pipeline: [
              {
                $match: {
                  product: { $in: productArr },
                },
              },
              {
                $lookup: {
                  from: 'productions',
                  localField: 'production',
                  foreignField: '_id',
                  as: 'productionMaster',
                },
              },
              {
                $lookup: {
                  from: 'products',
                  localField: 'product',
                  foreignField: '_id',
                  as: 'productData',
                },
              },
              {
                $unwind: {
                  path: '$productionMaster',
                },
              },
              {
                $unwind: {
                  path: '$productData',
                },
              },
              {
                $project: {
                  _id: 0,
                  shipmentId: '$_id',
                  ShipmentNo: '$lot',
                  date: '$date',
                  productName: '$productData.name',
                  // customerName:'$customerData.name',
                  product: '$product',
                  shipmentQty: { $literal: 0 }, // Default to 0 for production records
                  productionQty: '$qty',
                  salesContractPO: { $literal: null },
                  ProductionTransactionNo: '$productionMaster.tran',
                  type: 'production',
                },
              },
            ],
          },
        },
        {
          $addFields: {
            date: {
              $ifNull: ['$date', '$gpDate'],
            },
          },
        },
        {
          $sort: {
            date: -1, // Sort by date in ascending order for proper ledger calculation
          },
        },
        {
          $setWindowFields: {
            // 'partitionBy': '$product',
            sortBy: { date: 1 },
            output: {
              balance: {
                $sum: {
                  $subtract: ['$productionQty', '$shipmentQty'],
                },
                window: {
                  documents: ['unbounded', 'current'],
                },
              },
            },
          },
        },
        // {
        //   '$sort': {
        //     'date': -1
        //   }
        // },
        {
          $project: {
            shipmentId: 1,
            ShipmentNo: 1,
            date: 1,
            customerName: 1,
            productName: 1,
            product: 1,
            shipmentQty: 1,
            productionQty: 1,
            balance: 1,
            salesContractPO: 1,
            ProductionTransactionNo: 1,
          },
        },

        { $skip: skipCount },
        { $limit: limit },
      ]
    );
    const totalShipmentSum = transaction_groupbyRecords.reduce(
      (sum, item) => sum + item.shipmentQty,
      0
    );
    const totalProductionSum = transaction_groupbyRecords.reduce(
      (sum, item) => sum + item.productionQty,
      0
    );
    const totalBalanceSum = transaction_groupbyRecords.reduce(
      (sum, item) => sum + item.balance,
      0
    );

    const result = {
      transaction_groupby: transaction_groupby,
      totalShipmentSum: totalShipmentSum,
      totalProductionSum: totalProductionSum,
      totalBalanceSum: totalBalanceSum,
      total_records: transaction_groupbyRecords.length,
    };
    return result;
  } else if (
    input.brandgroup !== '' &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.product_id) &&
    input.product_id.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0 &&
    input.dcNumber == '' &&
    input.gpNumber == '' &&
    input.royality_approval == '' &&
    input.Adm == '' &&
    input.nonAdm == ''
  ) {
    console.log('brand general group');
    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;
    const brandAggregationPipeline: any = [
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
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
        },
      },
      {
        $unwind: {
          path: '$brand',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          name: '$brand.name',
          qty: 1,
          amount: 1,
          createdAt: 1,
          brand_id: '$brand._id',
        },
      },
      {
        $group: {
          _id: '$brand_id',
          name: {
            $first: '$name',
          },
          createdAt: {
            $first: '$createdAt',
          },
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalShipment: {
            $sum: 1,
          },
        },
      },
      {
        $match: {
          totalQty: {
            $gt: 0,
          },
          totalAmount: {
            $gt: 0,
          },
        },
      },
      {
        $project: {
          name: 1,
          createdAt: 1,
          totalQty: 1,
          totalAmount: 1,
          totalShipment: 1,
        },
      },

      { $limit: limit },
      { $skip: skipCount },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ];

    const brandAggregationPipelineRecord: any = [
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
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
        },
      },
      {
        $unwind: {
          path: '$brand',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          name: '$brand.name',
          qty: 1,
          amount: 1,
          createdAt: 1,
          brand_id: '$brand._id',
        },
      },
      {
        $group: {
          _id: '$brand_id',
          name: {
            $first: '$name',
          },
          createdAt: {
            $first: '$createdAt',
          },
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalShipment: {
            $sum: 1,
          },
        },
      },
      {
        $match: {
          totalQty: {
            $gt: 0,
          },
          totalAmount: {
            $gt: 0,
          },
        },
      },
      {
        $project: {
          name: 1,
          createdAt: 1,
          totalQty: 1,
          totalAmount: 1,
          totalShipment: 1,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ];
    const brand = await ShipmentDtlModel.aggregate(
      brandAggregationPipeline ? brandAggregationPipeline : undefined
    );
    const total_record = await ShipmentDtlModel.aggregate(
      brandAggregationPipelineRecord
        ? brandAggregationPipelineRecord
        : undefined
    );
    const totalQtySum = total_record.reduce(
      (sum, item) => sum + item.totalQty,
      0
    );
    const totalAmountSum = total_record.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const result = {
      Group: brand,
      total_records: total_record.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
    };

    return result;
  } else if (
    input.salesContractgroup !== '' &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.product_id) &&
    input.product_id.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0 &&
    input.dcNumber == '' &&
    input.gpNumber == '' &&
    input.royality_approval == '' &&
    input.Adm == '' &&
    input.nonAdm == ''
  ) {
    console.log('salescontract general group');
    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;

    //   {
    //     $lookup: {
    //       from: 'shipments',
    //       localField: '_id',
    //       foreignField: 'salesContract',
    //       as: 'salesContractData',
    //     },
    //   },
    //   {
    //     $project: {
    //       contract: 1,
    //       totalshipments: {
    //         $size: '$salesContractData',
    //       },
    //     },
    //   },
    //   { $skip: skipCount },
    //   { $limit: limit },
    //   { $sort: { totalQty: 1 } }
    // ]);

    const salecontractAggregationPipeline: any = [
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
      { $skip: skipCount },
      { $limit: limit },
      { $sort: { totalQty: 1 } },
    ];
    const salecontractAggregationPipelineRecord: any = [
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

      { $sort: { totalQty: 1 } },
    ];

    const salecontract = await SalesContractModel.aggregate(
      salecontractAggregationPipeline != undefined
        ? salecontractAggregationPipeline
        : undefined
    );
    const total_record = await SalesContractModel.aggregate(
      salecontractAggregationPipelineRecord != undefined
        ? salecontractAggregationPipelineRecord
        : undefined
    );
    const result = {
      Group: salecontract,
      total_records: total_record.length,
    };
    return result;
  } else if (
    input.royality_approval !== '' &&
    Array.isArray(input.product_id) &&
    input.product_id.length == 0 &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0 &&
    input.customergroup == '' &&
    input.productgroup == '' &&
    input.salesContractgroup == '' &&
    input.dcNumber == '' &&
    input.gpNumber == '' &&
    input.brandgroup == '' &&
    input.transactiongroup == '' &&
    input.Adm == '' &&
    input.nonAdm == ''
  ) {
    console.log('royality approval filter');

    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;

    function stringToBoolean(str: string | undefined) {
      return str?.toLowerCase() === 'true';
    }
    const royality_approval = stringToBoolean(input.royality_approval);

    const totalrecord = await SalesContractDtlModel.aggregate([
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          royality_approval: royality_approval,
          shipment: true,
        },
      },
      {
        $lookup: {
          from: 'shipmentdtls',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'shipmentDetail',
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salecontractDetail',
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
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $lookup: {
          from: 'shipments',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'shipment',
        },
      },
    ]);
    const salegroupby = await SalesContractDtlModel.aggregate([
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          royality_approval: royality_approval,
          shipment: true,
        },
      },
      {
        $lookup: {
          from: 'shipmentdtls',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'shipmentDetail',
        },
      },
      {
        $lookup: {
          from: 'shipments',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'shipment',
        },
      },
      {
        $group: {
          _id: 'null',
          qty: {
            $sum: '$qty',
          },
          rate: {
            $sum: '$rate',
          },
          amount: {
            $sum: '$amount',
          },
        },
      },
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
        $lookup: {
          from: 'shipments',
          localField: 'shipment',
          foreignField: '_id',
          as: 'shipment',
        },
      },

      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractsDetails',
          pipeline: [
            {
              $project: {
                contract: 1,
                royality_approval: 1,
              },
            },
          ],
        },
      },

      {
        $project: {
          qty: 1,
          rate: 1,
          amount: 1,
          contract: { $first: '$salesContractsDetails.contract' },
          royality_approval: {
            $first: '$salesContractsDetails.royality_approval',
          },
          gpNumber: {
            $first: '$shipment.gpNumber',
          },
          dcNumber: {
            $first: '$shipment.dcNumber',
          },
          gpDate: 1,
        },
      },

      {
        $match: {
          royality_approval: royality_approval,
        },
      },
      {
        $group: {
          _id: 'null',
          qty: {
            $sum: '$qty',
          },
          rate: {
            $sum: '$rate',
          },
          amount: {
            $sum: '$amount',
          },
        },
      },
    ]);

    const sale = await SalesContractDtlModel.aggregate([
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          royality_approval: royality_approval,
          shipment: true,
        },
      },
      {
        $lookup: {
          from: 'shipmentdtls',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'shipmentDetail',
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salecontractDetail',
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
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $lookup: {
          from: 'shipments',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'shipment',
        },
      },
      { $skip: skipCount },
      { $limit: limit },
    ]);
    const totalQty = salegroupby.map((item: any) => item.qty);
    const totalRate = salegroupby.map((item: any) => item.rate);
    const totalAmount = salegroupby.map((item: any) => item.amount);

    const ship = await ShipmentDtlModel.aggregate([
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
          pipeline: [
            {
              $project: {
                contract: 1,
                royality_approval: 1,
              },
            },
          ],
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
          supplierCode: 1,
          shipment: 1,
          shipment_no: 1,
          product: 1,
          createdAt: 1,
          customerDetails: 1,
          shipmentDetails: 1,
          contract: { $first: '$salesContractsDetails.contract' },
          royality_approval: {
            $first: '$salesContractsDetails.royality_approval',
          },
          // salesContractsDetails: 1,
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
          royality_approval: royality_approval,
        },
      },
      { $skip: skipCount },
      { $limit: limit },
      { $sort: { id: 1 } },
    ]);

    let result = {
      shipmentdtl: sale,
      paginated_record: totalrecord.length,
      total_records: sale.length,
      totalQty: totalQty,
      totalRate: totalRate,
      totalAmount: totalAmount,
    };
    return result;
  } else if (
    (input.customergroup == '' &&
      input.productgroup == '' &&
      input.brandgroup == '' &&
      input.transactiongroup == '' &&
      input.salesContractgroup == '' &&
      input.royality_approval == '' &&
      input.Adm == '' &&
      input.nonAdm == '') ||
    input.dcNumber !== '' ||
    (input.gpNumber !== '' &&
      ((Array.isArray(input.product_id) && input.product_id.length !== 0) ||
        (Array.isArray(input.customer) && input.customer.length !== 0) ||
        (Array.isArray(input.brand) && input.brand.length !== 0) ||
        (Array.isArray(input.salesContract) &&
          input.salesContract.length !== 0)))
  ) {
    console.log('main qury ');
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
    const brandArr = input.brand
      ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    let where: any = {};
    let extrafilter: any = {};
    let filter: any = {};
    let filter_records: any = {};

    if (
      customerArr.length > 0 &&
      salesContractArr.length > 0 &&
      productArr.length > 0 &&
      brandArr.length > 0
    ) {
      where.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          product: { $in: productArr },
          brand: { $in: brandArr },
        },
      ];
      filter = {
        product: { $in: productArr },
        customer: { $in: customerArr },
        salesContract: { $in: salesContractArr },
        brand: { $in: brandArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          product: { $in: productArr },
          brand: { $in: brandArr },
        },
      ];
    } else if (
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
    } else if (
      customerArr.length > 0 &&
      salesContractArr.length > 0 &&
      brandArr.length > 0
    ) {
      where.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },

          brand: { $in: brandArr },
        },
      ];
      filter = {
        customer: { $in: customerArr },
        salesContract: { $in: salesContractArr },
        brand: { $in: brandArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },

          brand: { $in: brandArr },
        },
      ];
    } else if (
      productArr.length > 0 &&
      salesContractArr.length > 0 &&
      brandArr.length > 0
    ) {
      where.$and = [
        {
          salesContract: { $in: salesContractArr },
          product: { $in: productArr },
          brand: { $in: brandArr },
        },
      ];
      filter = {
        product: { $in: productArr },

        salesContract: { $in: salesContractArr },
        brand: { $in: brandArr },
      };
      filter_records.$and = [
        {
          salesContract: { $in: salesContractArr },
          product: { $in: productArr },
          brand: { $in: brandArr },
        },
      ];
    } else if (
      productArr.length > 0 &&
      customerArr.length > 0 &&
      brandArr.length > 0
    ) {
      where.$and = [
        {
          customer: { $in: customerArr },

          product: { $in: productArr },
          brand: { $in: brandArr },
        },
      ];
      filter = {
        product: { $in: productArr },
        customer: { $in: customerArr },

        brand: { $in: brandArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },

          product: { $in: productArr },
          brand: { $in: brandArr },
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
    } else if (brandArr.length > 0) {
      where = {
        brand: { $in: brandArr },
      };
      filter = {
        brand: { $in: brandArr },
      };
      filter_records = {
        brand: { $in: brandArr },
      };
    } else if (brandArr.length > 0 && salesContractArr.length > 0) {
      where.$and = [
        {
          salesContract: { $in: salesContractArr },
          brandArr: { $in: brandArr },
        },
      ];
      filter = {
        salesContract: { $in: salesContractArr },
        brandArr: { $in: brandArr },
      };
      filter_records.$and = [
        {
          salesContract: { $in: salesContractArr },
          brandArr: { $in: brandArr },
        },
      ];
    } else if (brandArr.length > 0 && customerArr.length > 0) {
      where.$and = [
        {
          customer: { $in: customerArr },
          brand: { $in: brandArr },
        },
      ];
      filter = {
        customer: { $in: customerArr },
        brandArr: { $in: brandArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          brandArr: { $in: brandArr },
        },
      ];
    } else if (brandArr.length > 0 && productArr.length > 0) {
      where.$and = [
        {
          brand: { $in: brandArr },
          product: { $in: productArr },
        },
      ];
      filter = {
        brand: { $in: brandArr },
        product: { $in: productArr },
      };
      filter_records.$and = [
        {
          brand: { $in: brandArr },
          product: { $in: productArr },
        },
      ];
    }
    if (input.dcNumber) {
      extrafilter.dcNumber = input.dcNumber;
    }
    if (input.gpNumber) {
      extrafilter.gpNumber = input.gpNumber;
    }

    function stringToBoolean(str: string | undefined) {
      return str?.toLowerCase() === 'true';
    }
    if (input.royality_approval) {
      extrafilter.royality_approval = stringToBoolean(input.royality_approval);
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
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractsDetails',
          pipeline: [
            {
              $project: {
                contract: 1,
                royality_approval: 1,
              },
            },
          ],
        },
      },

      {
        $project: {
          contract: { $first: '$salesContractsDetails.contract' },
          royality_approval: {
            $first: '$salesContractsDetails.royality_approval',
          },
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
      { $match: filter },
      {
        $lookup: {
          from: 'shipments',
          localField: 'shipment',
          foreignField: '_id',
          as: 'shipment',
        },
      },

      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractsDetails',
          pipeline: [
            {
              $project: {
                contract: 1,
                royality_approval: 1,
              },
            },
          ],
        },
      },

      {
        $project: {
          qty: 1,
          rate: 1,
          amount: 1,
          contract: { $first: '$salesContractsDetails.contract' },
          royality_approval: {
            $first: '$salesContractsDetails.royality_approval',
          },
          gpNumber: {
            $first: '$shipment.gpNumber',
          },
          dcNumber: {
            $first: '$shipment.dcNumber',
          },
          gpDate: 1,
        },
      },
      { $match: extrafilter },
      {
        $group: {
          _id: 'null',
          qty: {
            $sum: '$qty',
          },
          rate: {
            $sum: '$rate',
          },
          amount: {
            $sum: '$amount',
          },
        },
      },
    ]);

    // Extract totals from the result
    const totalQty = shipmentgroupby.map((item: any) => item.qty);
    const totalRate = shipmentgroupby.map((item: any) => item.rate);
    const totalAmount = shipmentgroupby.map((item: any) => item.amount);

    const ship = await ShipmentDtlModel.aggregate([
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
          pipeline: [
            {
              $project: {
                contract: 1,
                royality_approval: 1,
              },
            },
          ],
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
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brandDetails',
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
          supplierCode: 1,
          shipment: 1,
          shipment_no: 1,
          product: 1,
          createdAt: 1,
          customerDetails: 1,
          brandDetails: 1,
          shipmentDetails: 1,
          contract: { $first: '$salesContractsDetails.contract' },
          royality_approval: {
            $first: '$salesContractsDetails.royality_approval',
          },
          // salesContractsDetails: 1,
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
        $match: extrafilter,
      },
      { $skip: skipCount },
      { $limit: limit },
      { $sort: { id: 1 } },
    ]);
    let result = {
      shipmentdtl: ship,
      paginated_record: ship.length,
      total_records: total_record.length,
      totalQty: totalQty,
      totalRate: totalRate,
      totalAmount: totalAmount,
    };
    return result;
  } else if (
    input.customergroup !== '' &&
    input.royality_approval == '' &&
    input.Adm == '' &&
    input.nonAdm == '' &&
    Array.isArray(input.customer) &&
    input.customer.length !== 0 &&
    Array.isArray(input.product_id) &&
    input.product_id.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0
  ) {
    console.log('customer group customer ');

    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;
    const customerArr = input.customer
      ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];

    const customergroup = await ShipmentDtlModel.aggregate([
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          customer: { $in: customerArr },
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractData',
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $group: {
          _id: '$customer._id',
          // Group by customer
          totalShipment: {
            $sum: 1,
          },
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
          customer: {
            $first: '$customer',
          },
        },
      },
      {
        $project: {
          customer_id: {
            $arrayElemAt: ['$customer._id', 0],
          },
          customer_name: {
            $arrayElemAt: ['$customer.name', 0],
          },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
      { $sort: { qty: -1, amount: -1 } },
      { $skip: skipCount },
      { $limit: limit },
    ]);
    const totalShipmentSum = customergroup.reduce(
      (sum, item) => sum + item.totalShipment,
      0
    );

    const totalQtySum = customergroup.reduce((sum, item) => sum + item.qty, 0);
    const totalAmountSum = customergroup.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const result = {
      Group: customergroup,
      total_records: customergroup.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalShipmentSum: totalShipmentSum,
    };
    return result;
  } else if (
    input.productgroup !== '' &&
    input.royality_approval == '' &&
    input.Adm == '' &&
    input.nonAdm == '' &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.product_id) &&
    input.product_id.length !== 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0
  ) {
    console.log('product group product ');

    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;
    const productArr = input.product_id
      ? input.product_id.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];

    const productgroup = await ShipmentDtlModel.aggregate([
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          product: { $in: productArr },
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractData',
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
        $group: {
          _id: '$product._id',
          // Group by customer
          totalShipment: {
            $sum: 1,
          },
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
          product: {
            $first: '$product',
          },
        },
      },
      {
        $project: {
          product_id: {
            $arrayElemAt: ['$product._id', 0],
          },
          product_name: {
            $arrayElemAt: ['$product.name', 0],
          },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
      { $skip: skipCount },
      { $limit: limit },
    ]);
    const totalShipmentSum = productgroup.reduce(
      (sum, item) => sum + item.totalShipment,
      0
    );

    const totalQtySum = productgroup.reduce((sum, item) => sum + item.qty, 0);
    const totalAmountSum = productgroup.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const result = {
      Group: productgroup,
      total_records: productgroup.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalShipmentSum: totalShipmentSum,
    };
    return result;
  } else if (
    input.brandgroup !== '' &&
    input.royality_approval == '' &&
    input.Adm == '' &&
    input.nonAdm == '' &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.product_id) &&
    input.product_id.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length !== 0
  ) {
    console.log('brand group brand ');

    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;
    const brandArr = input.brand
      ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];

    // const brandgroup = await ShipmentDtlModel.aggregate([
    //   {
    //     $match: {
    //       gpDate: {
    //         $gte: new Date(input.fromDate),
    //         $lte: new Date(input.toDate),
    //       },
    //       isDeleted: false,
    //       brand: { $in: brandArr },
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'salescontracts',
    //       localField: 'salesContract',
    //       foreignField: '_id',
    //       as: 'salesContractData',
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'brands',
    //       localField: 'brand',
    //       foreignField: '_id',
    //       as: 'brand',
    //     },
    //   },
    //   {
    //     $group: {
    //       _id: '$brand._id',
    //       // Group by customer
    //       totalShipment: {
    //         $sum: 1,
    //       },
    //       qty: {
    //         $sum: '$qty',
    //       },
    //       amount: {
    //         $sum: '$amount',
    //       },
    //       brand: {
    //         $first: '$brand',
    //       },
    //     },
    //   },
    //   {
    //     $project: {
    //       brand_id: {
    //         $arrayElemAt: ['$brand._id', 0],
    //       },
    //       brand_name: {
    //         $arrayElemAt: ['$brand.name', 0],
    //       },
    //       qty: 1,
    //       amount: 1,
    //       totalShipment: 1,
    //     },
    //   },
    //   { $skip: skipCount },
    //   { $limit: limit },
    // ]);

    const brandAggregationPipeline: any = [
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          brand: { $in: brandArr },
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractData',
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
        },
      },
      {
        $group: {
          _id: '$brand',
          totalShipment: { $sum: 1 },
          qty: { $sum: '$qty' },
          amount: { $sum: '$amount' },
          brand: { $first: '$brand' },
        },
      },
      {
        $project: {
          brand_id: '$brand._id',
          brand_name: '$brand.name',
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
      { $skip: skipCount },
      { $limit: limit },
    ];
    const brandAggregationPipelineRecord: any = [
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          brand: { $in: brandArr }, // Filter by brand IDs
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractData',
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand', // Lookup brand details
        },
      },
      {
        $group: {
          _id: '$brand._id', // Group by brand _id
          totalShipment: { $sum: 1 }, // Count the total shipments
          qty: { $sum: '$qty' }, // Sum of qty
          amount: { $sum: '$amount' }, // Sum of amounts
          brand: { $first: '$brand' }, // Get the first brand from the grouped data
        },
      },
      {
        $project: {
          brand_id: '$brand._id', // Directly access brand _id
          brand_name: '$brand.name', // Directly access brand name
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
      { $skip: skipCount }, // Apply skip for pagination
      { $limit: limit }, // Apply limit for pagination
    ];
    const brand_group = await ShipmentDtlModel.aggregate(
      brandAggregationPipeline ? brandAggregationPipeline : undefined
    );

    const total_record = await ShipmentDtlModel.aggregate(
      brandAggregationPipelineRecord
        ? brandAggregationPipelineRecord
        : undefined
    );
    const totalShipmentSum = total_record.reduce(
      (sum, item) => sum + item.totalShipment,
      0
    );

    const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
    const totalAmountSum = total_record.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const result = {
      Group: brand_group,
      total_records: total_record.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalShipmentSum: totalShipmentSum,
    };
    return result;
  } else if (
    input.customergroup !== '' &&
    input.royality_approval == '' &&
    input.Adm == '' &&
    input.nonAdm == '' &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.product_id) &&
    input.product_id.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length !== 0
  ) {
    console.log('customer group brand ');

    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;
    const brandArr = input.brand
      ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];

    const brandCustomerAggregationPipeline: any = [
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          brand: { $in: brandArr },
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractData',
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $group: {
          _id: { brandId: '$brand._id', customerId: '$customer._id' },
          totalShipment: { $sum: 1 },
          qty: { $sum: '$qty' },
          amount: { $sum: '$amount' },
          brand: { $first: '$brand' },
          customer: { $first: '$customer' },
        },
      },
      {
        $project: {
          brand_id: { $arrayElemAt: ['$brand._id', 0] },
          brand_name: { $arrayElemAt: ['$brand.name', 0] },
          customer_id: { $arrayElemAt: ['$customer._id', 0] },
          customer_name: { $arrayElemAt: ['$customer.name', 0] },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
      { $skip: skipCount },
      { $limit: limit },
    ];
    const brandCustomerAggregationPipelineRecord: any = [
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          brand: { $in: brandArr },
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractData',
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $group: {
          _id: { brandId: '$brand._id', customerId: '$customer._id' },
          totalShipment: { $sum: 1 },
          qty: { $sum: '$qty' },
          amount: { $sum: '$amount' },
          brand: { $first: '$brand' },
          customer: { $first: '$customer' },
        },
      },
      {
        $project: {
          brand_id: { $arrayElemAt: ['$brand._id', 0] },
          brand_name: { $arrayElemAt: ['$brand.name', 0] },
          customer_id: { $arrayElemAt: ['$customer._id', 0] },
          customer_name: { $arrayElemAt: ['$customer.name', 0] },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
    ];

    const customer_by = await ShipmentDtlModel.aggregate(
      brandCustomerAggregationPipeline
        ? brandCustomerAggregationPipeline
        : undefined
    );
    const total_record = await ShipmentDtlModel.aggregate(
      brandCustomerAggregationPipelineRecord
        ? brandCustomerAggregationPipelineRecord
        : undefined
    );

    const totalShipmentSum = total_record.reduce(
      (sum, item) => sum + item.totalShipment,
      0
    );

    const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
    const totalAmountSum = total_record.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const result = {
      Group: customer_by,
      total_records: total_record.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalShipmentSum: totalShipmentSum,
    };
    return result;
  } else if (
    input.customergroup !== '' &&
    input.royality_approval == '' &&
    input.Adm == '' &&
    input.nonAdm == '' &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.product_id) &&
    input.product_id.length !== 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0
  ) {
    console.log('customer group product ');

    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;
    const productArr = input.customer
      ? input.product_id.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];

    //   {
    //     $match: {
    //       gpDate: {
    //         $gte: new Date(input.fromDate),
    //         $lte: new Date(input.toDate),
    //       },
    //       isDeleted: false,
    //       product: { $in: productArr },
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'salescontracts',
    //       localField: 'salesContract',
    //       foreignField: '_id',
    //       as: 'salesContractData',
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'customers',
    //       localField: 'customer',
    //       foreignField: '_id',
    //       as: 'customer',
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'products',
    //       localField: 'product',
    //       foreignField: '_id',
    //       as: 'product',
    //     },
    //   },
    //   {
    //     $group: {
    //       _id: '$customer._id',
    //       // Group by customer
    //       totalShipment: {
    //         $sum: 1,
    //       },
    //       qty: {
    //         $sum: '$qty',
    //       },
    //       amount: {
    //         $sum: '$amount',
    //       },
    //       customer: {
    //         $first: '$customer',
    //       },
    //       product: {
    //         $first: '$product',
    //       },
    //     },
    //   },
    //   {
    //     $project: {
    //       customer_id: {
    //         $arrayElemAt: ['$customer._id', 0],
    //       },
    //       customer_name: {
    //         $arrayElemAt: ['$customer.name', 0],
    //       },
    //       product_name: {
    //         $arrayElemAt: ['$product.name', 0],
    //       },
    //       qty: 1,
    //       amount: 1,
    //       totalShipment: 1,
    //     },
    //   },
    //   { $skip: skipCount },
    //   { $limit: limit },
    // ]);

    const productCustomerAggregationPipeline: any = [
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          product: { $in: productArr },
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractData',
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
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
        $group: {
          _id: { customerId: '$customer._id', productId: '$product._id' },
          totalShipment: { $sum: 1 },
          qty: { $sum: '$qty' },
          amount: { $sum: '$amount' },
          customer: { $first: '$customer' },
          product: { $first: '$product' },
        },
      },
      {
        $project: {
          customer_id: { $arrayElemAt: ['$customer._id', 0] },
          customer_name: { $arrayElemAt: ['$customer.name', 0] },
          product_name: { $arrayElemAt: ['$product.name', 0] },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
      { $skip: skipCount },
      { $limit: limit },
    ];
    const productCustomerAggregationPipelineRecord: any = [
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          product: { $in: productArr },
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractData',
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
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
        $group: {
          _id: { customerId: '$customer._id', productId: '$product._id' },
          totalShipment: { $sum: 1 },
          qty: { $sum: '$qty' },
          amount: { $sum: '$amount' },
          customer: { $first: '$customer' },
          product: { $first: '$product' },
        },
      },
      {
        $project: {
          customer_id: { $arrayElemAt: ['$customer._id', 0] },
          customer_name: { $arrayElemAt: ['$customer.name', 0] },
          product_name: { $arrayElemAt: ['$product.name', 0] },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
    ];

    const customer_group = await ShipmentDtlModel.aggregate(
      productCustomerAggregationPipeline
        ? productCustomerAggregationPipeline
        : undefined
    );

    const total_record = await ShipmentDtlModel.aggregate(
      productCustomerAggregationPipelineRecord
        ? productCustomerAggregationPipelineRecord
        : undefined
    );

    const totalShipmentSum = total_record.reduce(
      (sum, item) => sum + item.totalShipment,
      0
    );

    const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
    const totalAmountSum = total_record.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const result = {
      Group: customer_group,
      total_records: total_record.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalShipmentSum: totalShipmentSum,
    };
    return result;
  } else if (
    input.productgroup !== '' &&
    input.royality_approval == '' &&
    input.Adm == '' &&
    input.nonAdm == '' &&
    Array.isArray(input.customer) &&
    input.customer.length !== 0 &&
    Array.isArray(input.product_id) &&
    input.product_id.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0
  ) {
    console.log('product group customer ');

    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;
    const customerArr = input.product_id
      ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];

    // const productgroup = await ShipmentDtlModel.aggregate([
    //   {
    //     $match: {
    //       gpDate: {
    //         $gte: new Date(input.fromDate),
    //         $lte: new Date(input.toDate),
    //       },
    //       isDeleted: false,
    //       customer: { $in: customerArr },
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'salescontracts',
    //       localField: 'salesContract',
    //       foreignField: '_id',
    //       as: 'salesContractData',
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'products',
    //       localField: 'product',
    //       foreignField: '_id',
    //       as: 'product',
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'customers',
    //       localField: 'customer',
    //       foreignField: '_id',
    //       as: 'customer',
    //     },
    //   },
    //   {
    //     $group: {
    //       _id: '$product._id',
    //       // Group by customer
    //       totalShipment: {
    //         $sum: 1,
    //       },
    //       qty: {
    //         $sum: '$qty',
    //       },
    //       amount: {
    //         $sum: '$amount',
    //       },
    //       product: {
    //         $first: '$product',
    //       },
    //       customer: {
    //         $first: '$customer',
    //       },
    //     },
    //   },
    //   {
    //     $project: {
    //       product_id: {
    //         $arrayElemAt: ['$product._id', 0],
    //       },
    //       product_name: {
    //         $arrayElemAt: ['$product.name', 0],
    //       },
    //       customer_name: {
    //         $arrayElemAt: ['$customer.name', 0],
    //       },
    //       qty: 1,
    //       amount: 1,
    //       totalShipment: 1,
    //     },
    //   },
    //   { $skip: skipCount },
    //   { $limit: limit },
    // ]);

    const productCustomerAggregationPipeline: any = [
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          customer: { $in: customerArr },
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractData',
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
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $group: {
          _id: { productId: '$product._id', customerId: '$customer._id' },
          totalShipment: { $sum: 1 },
          qty: { $sum: '$qty' },
          amount: { $sum: '$amount' },
          product: { $first: '$product' },
          customer: { $first: '$customer' },
        },
      },
      {
        $project: {
          product_id: { $arrayElemAt: ['$product._id', 0] },
          product_name: { $arrayElemAt: ['$product.name', 0] },
          customer_id: { $arrayElemAt: ['$customer._id', 0] },
          customer_name: { $arrayElemAt: ['$customer.name', 0] },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
      { $skip: skipCount },
      { $limit: limit },
    ];
    const productCustomerAggregationPipelineRecord: any = [
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          customer: { $in: customerArr },
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractData',
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
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $group: {
          _id: { productId: '$product._id', customerId: '$customer._id' },
          totalShipment: { $sum: 1 },
          qty: { $sum: '$qty' },
          amount: { $sum: '$amount' },
          product: { $first: '$product' },
          customer: { $first: '$customer' },
        },
      },
      {
        $project: {
          product_id: { $arrayElemAt: ['$product._id', 0] },
          product_name: { $arrayElemAt: ['$product.name', 0] },
          customer_id: { $arrayElemAt: ['$customer._id', 0] },
          customer_name: { $arrayElemAt: ['$customer.name', 0] },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
    ];
    const product_group = await ShipmentDtlModel.aggregate(
      productCustomerAggregationPipeline
        ? productCustomerAggregationPipeline
        : undefined
    );
    const total_record = await ShipmentDtlModel.aggregate(
      productCustomerAggregationPipelineRecord
        ? productCustomerAggregationPipelineRecord
        : undefined
    );

    const totalShipmentSum = total_record.reduce(
      (sum, item) => sum + item.totalShipment,
      0
    );

    const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
    const totalAmountSum = total_record.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const result = {
      Group: product_group,
      total_records: total_record.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalShipmentSum: totalShipmentSum,
    };
    return result;
  } else if (
    input.productgroup !== '' &&
    input.royality_approval == '' &&
    input.Adm == '' &&
    input.nonAdm == '' &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.product_id) &&
    input.product_id.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length !== 0
  ) {
    console.log('product group brand ');

    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;
    const brandArr = input.product_id
      ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];

    // const productgroup = await ShipmentDtlModel.aggregate([
    //   {
    //     $match: {
    //       gpDate: {
    //         $gte: new Date(input.fromDate),
    //         $lte: new Date(input.toDate),
    //       },
    //       isDeleted: false,
    //       brand: { $in: brandArr },
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'salescontracts',
    //       localField: 'salesContract',
    //       foreignField: '_id',
    //       as: 'salesContractData',
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'products',
    //       localField: 'product',
    //       foreignField: '_id',
    //       as: 'product',
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'brands',
    //       localField: 'brand',
    //       foreignField: '_id',
    //       as: 'brand',
    //     },
    //   },
    //   {
    //     $group: {
    //       _id: '$product._id',
    //       // Group by customer
    //       totalShipment: {
    //         $sum: 1,
    //       },
    //       qty: {
    //         $sum: '$qty',
    //       },
    //       amount: {
    //         $sum: '$amount',
    //       },
    //       product: {
    //         $first: '$product',
    //       },
    //       brand: {
    //         $first: '$brand',
    //       },
    //     },
    //   },
    //   {
    //     $project: {
    //       product_id: {
    //         $arrayElemAt: ['$product._id', 0],
    //       },
    //       product_name: {
    //         $arrayElemAt: ['$product.name', 0],
    //       },
    //       brand_name: {
    //         $arrayElemAt: ['$brand.name', 0],
    //       },
    //       qty: 1,
    //       amount: 1,
    //       totalShipment: 1,
    //     },
    //   },
    //   { $skip: skipCount },
    //   { $limit: limit },
    // ]);

    const productBrandAggregationPipeline: any = [
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          brand: { $in: brandArr },
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractData',
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
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
        },
      },
      {
        $group: {
          _id: { productId: '$product._id', brandId: '$brand._id' }, // Group by both product and brand
          totalShipment: { $sum: 1 },
          qty: { $sum: '$qty' },
          amount: { $sum: '$amount' },
          product: { $first: '$product' },
          brand: { $first: '$brand' },
        },
      },
      {
        $project: {
          product_id: { $arrayElemAt: ['$product._id', 0] },
          product_name: { $arrayElemAt: ['$product.name', 0] },
          brand_id: { $arrayElemAt: ['$brand._id', 0] },
          brand_name: { $arrayElemAt: ['$brand.name', 0] },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
      { $skip: skipCount },
      { $limit: limit },
    ];
    const productBrandAggregationPipelineRecord: any = [
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          brand: { $in: brandArr },
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractData',
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
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
        },
      },
      {
        $group: {
          _id: { productId: '$product._id', brandId: '$brand._id' }, // Group by both product and brand
          totalShipment: { $sum: 1 },
          qty: { $sum: '$qty' },
          amount: { $sum: '$amount' },
          product: { $first: '$product' },
          brand: { $first: '$brand' },
        },
      },
      {
        $project: {
          product_id: { $arrayElemAt: ['$product._id', 0] },
          product_name: { $arrayElemAt: ['$product.name', 0] },
          brand_id: { $arrayElemAt: ['$brand._id', 0] },
          brand_name: { $arrayElemAt: ['$brand.name', 0] },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
    ];
    const product_group = await ShipmentDtlModel.aggregate(
      productBrandAggregationPipeline
        ? productBrandAggregationPipeline
        : undefined
    );
    const total_record = await ShipmentDtlModel.aggregate(
      productBrandAggregationPipelineRecord
        ? productBrandAggregationPipelineRecord
        : undefined
    );

    const totalShipmentSum = total_record.reduce(
      (sum, item) => sum + item.totalShipment,
      0
    );

    const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
    const totalAmountSum = total_record.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const result = {
      Group: product_group,
      total_records: total_record.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalShipmentSum: totalShipmentSum,
    };
    return result;
  } else if (
    input.brandgroup !== '' &&
    input.royality_approval == '' &&
    input.Adm == '' &&
    input.nonAdm == '' &&
    Array.isArray(input.customer) &&
    input.customer.length !== 0 &&
    Array.isArray(input.product_id) &&
    input.product_id.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0
  ) {
    console.log('brand group customer ');

    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;
    const customerArr = input.customer
      ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    console.log(customerArr);
    const brandAggregationPipelineRecord: any = [
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          customer: { $in: customerArr },
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractData',
          pipeline: [
            {
              $match: {
                isDeleted: false,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $group: {
          _id: { brandId: '$brand._id', customerId: '$customer._id' },
          totalShipment: { $sum: 1 },
          qty: { $sum: '$qty' },
          amount: { $sum: '$amount' },
          brand: { $first: '$brand' },
          customer: { $first: '$customer' },
        },
      },
      {
        $project: {
          brand_id: { $arrayElemAt: ['$brand._id', 0] },
          brand_name: { $arrayElemAt: ['$brand.name', 0] },
          customer_id: { $arrayElemAt: ['$customer._id', 0] },
          customer_name: { $arrayElemAt: ['$customer.name', 0] },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
    ];
    const brandAggregationPipeline: any = [
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          customer: { $in: customerArr },
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractData',
          pipeline: [
            {
              $match: {
                isDeleted: false,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $group: {
          _id: { brandId: '$brand._id', customerId: '$customer._id' },
          totalShipment: { $sum: 1 },
          qty: { $sum: '$qty' },
          amount: { $sum: '$amount' },
          brand: { $first: '$brand' },
          customer: { $first: '$customer' },
        },
      },
      {
        $project: {
          brand_id: { $arrayElemAt: ['$brand._id', 0] },
          brand_name: { $arrayElemAt: ['$brand.name', 0] },
          customer_id: { $arrayElemAt: ['$customer._id', 0] },
          customer_name: { $arrayElemAt: ['$customer.name', 0] },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
      { $skip: skipCount },
      { $limit: limit },
    ];

    const brandgroup = await ShipmentDtlModel.aggregate(
      brandAggregationPipeline ? brandAggregationPipeline : undefined
    );
    const total_record = await ShipmentDtlModel.aggregate(
      brandAggregationPipelineRecord
        ? brandAggregationPipelineRecord
        : undefined
    );

    const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
    const totalAmountSum = total_record.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const totalShipmentSum = total_record.reduce(
      (sum, item) => sum + item.totalShipment,
      0
    );
    const result = {
      Group: brandgroup,
      total_records: total_record.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalShipmentSum: totalShipmentSum,
    };
    return result;
  } else if (
    input.brandgroup !== '' &&
    input.royality_approval == '' &&
    input.Adm == '' &&
    input.nonAdm == '' &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.product_id) &&
    input.product_id.length !== 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0
  ) {
    console.log('brand group product ');

    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;
    const productArr = input.brand
      ? input.product_id.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];

    // const brandgroup = await ShipmentDtlModel.aggregate([
    //   {
    //     $match: {
    //       gpDate: {
    //         $gte: new Date(input.fromDate),
    //         $lte: new Date(input.toDate),
    //       },
    //       isDeleted: false,
    //       product: { $in: productArr },
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'salescontracts',
    //       localField: 'salesContract',
    //       foreignField: '_id',
    //       as: 'salesContractData',
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'brands',
    //       localField: 'brand',
    //       foreignField: '_id',
    //       as: 'brand',
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'products',
    //       localField: 'product',
    //       foreignField: '_id',
    //       as: 'product',
    //     },
    //   },
    //   {
    //     $group: {
    //       _id: '$brand._id',
    //       // Group by customer
    //       totalShipment: {
    //         $sum: 1,
    //       },
    //       qty: {
    //         $sum: '$qty',
    //       },
    //       amount: {
    //         $sum: '$amount',
    //       },
    //       brand: {
    //         $first: '$brand',
    //       },
    //       product: {
    //         $first: '$product',
    //       },
    //     },
    //   },
    //   {
    //     $project: {
    //       brand_id: {
    //         $arrayElemAt: ['$brand._id', 0],
    //       },
    //       brand_name: {
    //         $arrayElemAt: ['$brand.name', 0],
    //       },
    //       product_name: {
    //         $arrayElemAt: ['$product.name', 0],
    //       },
    //       qty: 1,
    //       amount: 1,
    //       totalShipment: 1,
    //     },
    //   },
    //   { $skip: skipCount },
    //   { $limit: limit },
    // ]);

    const productBrandAggregationPipeline: any = [
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          product: { $in: productArr },
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractData',
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
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
        $group: {
          _id: { brandId: '$brand._id', productId: '$product._id' },
          totalShipment: { $sum: 1 },
          qty: { $sum: '$qty' },
          amount: { $sum: '$amount' },
          brand: { $first: '$brand' },
          product: { $first: '$product' },
        },
      },
      {
        $project: {
          brand_id: { $arrayElemAt: ['$brand._id', 0] },
          brand_name: { $arrayElemAt: ['$brand.name', 0] },
          product_id: { $arrayElemAt: ['$product._id', 0] },
          product_name: { $arrayElemAt: ['$product.name', 0] },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
      { $skip: skipCount },
      { $limit: limit },
    ];

    const productBrandAggregationPipelineRecord: any = [
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          product: { $in: productArr },
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractData',
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
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
        $group: {
          _id: { brandId: '$brand._id', productId: '$product._id' }, // Group by both brand and product
          totalShipment: { $sum: 1 },
          qty: { $sum: '$qty' },
          amount: { $sum: '$amount' },
          brand: { $first: '$brand' },
          product: { $first: '$product' },
        },
      },
      {
        $project: {
          brand_id: { $arrayElemAt: ['$brand._id', 0] },
          brand_name: { $arrayElemAt: ['$brand.name', 0] },
          product_id: { $arrayElemAt: ['$product._id', 0] },
          product_name: { $arrayElemAt: ['$product.name', 0] },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
    ];

    const brandgroup = await ShipmentDtlModel.aggregate(
      productBrandAggregationPipeline
        ? productBrandAggregationPipeline
        : undefined
    );
    const total_record = await ShipmentDtlModel.aggregate(
      productBrandAggregationPipelineRecord
        ? productBrandAggregationPipelineRecord
        : undefined
    );

    const totalShipmentSum = total_record.reduce(
      (sum, item) => sum + item.totalShipment,
      0
    );

    const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
    const totalAmountSum = total_record.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const result = {
      Group: brandgroup,
      total_records: total_record.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalShipmentSum: totalShipmentSum,
    };
    return result;
  } else if (
    (input.customergroup !== '' &&
      input.productgroup == '' &&
      input.brandgroup == '' &&
      input.salesContractgroup == '' &&
      input.Adm == '' &&
      input.nonAdm == '' &&
      input.royality_approval !== '') ||
    (Array.isArray(input.product_id) && input.product_id.length !== 0) ||
    (Array.isArray(input.customer) && input.customer.length !== 0) ||
    (Array.isArray(input.brand) && input.brand.length !== 0) ||
    (Array.isArray(input.salesContract) && input.salesContract.length !== 0)
  ) {
    console.log(
      '  customer group with general filters brand customer product salescontract work'
    );

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
    const brandArr = input.brand
      ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    let where: any = {};
    let extrafilter: any = {};
    let filter: any = {};
    let filter_records: any = {};

    if (
      customerArr.length > 0 &&
      salesContractArr.length > 0 &&
      productArr.length > 0 &&
      brandArr.length > 0
    ) {
      where.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          product: { $in: productArr },
          brand: { $in: brandArr },
        },
      ];
      filter = {
        product: { $in: productArr },
        customer: { $in: customerArr },
        salesContract: { $in: salesContractArr },
        brand: { $in: brandArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          product: { $in: productArr },
          brand: { $in: brandArr },
        },
      ];
    } else if (
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
    } else if (
      customerArr.length > 0 &&
      salesContractArr.length > 0 &&
      brandArr.length > 0
    ) {
      where.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },

          brand: { $in: brandArr },
        },
      ];
      filter = {
        customer: { $in: customerArr },
        salesContract: { $in: salesContractArr },
        brand: { $in: brandArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },

          brand: { $in: brandArr },
        },
      ];
    } else if (
      productArr.length > 0 &&
      salesContractArr.length > 0 &&
      brandArr.length > 0
    ) {
      where.$and = [
        {
          salesContract: { $in: salesContractArr },
          product: { $in: productArr },
          brand: { $in: brandArr },
        },
      ];
      filter = {
        product: { $in: productArr },

        salesContract: { $in: salesContractArr },
        brand: { $in: brandArr },
      };
      filter_records.$and = [
        {
          salesContract: { $in: salesContractArr },
          product: { $in: productArr },
          brand: { $in: brandArr },
        },
      ];
    } else if (
      productArr.length > 0 &&
      customerArr.length > 0 &&
      brandArr.length > 0
    ) {
      where.$and = [
        {
          customer: { $in: customerArr },

          product: { $in: productArr },
          brand: { $in: brandArr },
        },
      ];
      filter = {
        product: { $in: productArr },
        customer: { $in: customerArr },

        brand: { $in: brandArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },

          product: { $in: productArr },
          brand: { $in: brandArr },
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
    } else if (brandArr.length > 0) {
      where = {
        brand: { $in: brandArr },
      };
      filter = {
        brand: { $in: brandArr },
      };
      filter_records = {
        brand: { $in: brandArr },
      };
    } else if (brandArr.length > 0 && salesContractArr.length > 0) {
      where.$and = [
        {
          salesContract: { $in: salesContractArr },
          brandArr: { $in: brandArr },
        },
      ];
      filter = {
        salesContract: { $in: salesContractArr },
        brandArr: { $in: brandArr },
      };
      filter_records.$and = [
        {
          salesContract: { $in: salesContractArr },
          brandArr: { $in: brandArr },
        },
      ];
    } else if (brandArr.length > 0 && customerArr.length > 0) {
      where.$and = [
        {
          customer: { $in: customerArr },
          brand: { $in: brandArr },
        },
      ];
      filter = {
        customer: { $in: customerArr },
        brandArr: { $in: brandArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          brandArr: { $in: brandArr },
        },
      ];
    } else if (brandArr.length > 0 && productArr.length > 0) {
      where.$and = [
        {
          brand: { $in: brandArr },
          product: { $in: productArr },
        },
      ];
      filter = {
        brand: { $in: brandArr },
        product: { $in: productArr },
      };
      filter_records.$and = [
        {
          brand: { $in: brandArr },
          product: { $in: productArr },
        },
      ];
    }
    if (input.dcNumber) {
      extrafilter = input.dcNumber;
    }

    if (input.gpNumber) {
      extrafilter.gpNumber = input.gpNumber;
    }
    function stringToBoolean(str: string | undefined) {
      return str?.toLowerCase() === 'true';
    }
    if (input.royality_approval) {
      extrafilter.royality_approval = stringToBoolean(input.royality_approval);
    }

    const customerAggregationPipelineRecords: any = [
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
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractData',
          // pipeline:[
          //   {
          //     $project:{
          //       royality_approval:1
          //     }
          //   }
          // ]
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $group: {
          _id: '$customer._id',
          // Group by customer
          totalShipment: {
            $sum: 1,
          },
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
          customer: {
            $first: '$customer',
          },
        },
      },
      {
        $project: {
          customer_id: {
            $arrayElemAt: ['$customer._id', 0],
          },
          customer_name: {
            $arrayElemAt: ['$customer.name', 0],
          },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
    ];

    const customerAggregationPipeline: any = [
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
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractData',
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
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
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
        },
      },
      {
        $group: {
          _id: '$customer._id',
          // Group by customer
          totalShipment: {
            $sum: 1,
          },
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
          customer: {
            $first: '$customer',
          },
          product: {
            $first: '$product',
          },
          brand: {
            $first: '$brand',
          },
        },
      },
      {
        $project: {
          customer_id: {
            $arrayElemAt: ['$customer._id', 0],
          },
          customer_name: {
            $arrayElemAt: ['$customer.name', 0],
          },
          product_name: {
            $arrayElemAt: ['$product.name', 0],
          },
          brand_name: {
            $arrayElemAt: ['$brand.name', 0],
          },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
      { $skip: skipCount },
      { $limit: limit },
    ];
    const customergroup = await ShipmentDtlModel.aggregate(
      customerAggregationPipeline
    );

    const total_records = await ShipmentDtlModel.aggregate(
      customerAggregationPipelineRecords
    );

    const totalShipmentSum = total_records.reduce(
      (sum, item) => sum + item.totalShipment,
      0
    );

    const totalQtySum = total_records.reduce((sum, item) => sum + item.qty, 0);
    const totalAmountSum = total_records.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const result = {
      Group: customergroup,
      total_records: total_records.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalShipmentSum: totalShipmentSum,
    };
    return result;
  } else if (
    (input.productgroup !== '' &&
      input.customergroup == '' &&
      input.brandgroup == '' &&
      input.salesContractgroup == '' &&
      input.Adm == '' &&
      input.nonAdm == '' &&
      input.royality_approval !== '') ||
    (Array.isArray(input.product_id) && input.product_id.length !== 0) ||
    (Array.isArray(input.customer) && input.customer.length !== 0) ||
    (Array.isArray(input.brand) && input.brand.length !== 0) ||
    (Array.isArray(input.salesContract) && input.salesContract.length !== 0)
  ) {
    console.log(
      'product group with general filters brand customer product salescontract'
    );

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
    const brandArr = input.product_id
      ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    let where: any = {};
    let extrafilter: any = {};
    let filter: any = {};
    let filter_records: any = {};

    if (
      customerArr.length > 0 &&
      salesContractArr.length > 0 &&
      productArr.length > 0 &&
      brandArr.length > 0
    ) {
      where.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          product: { $in: productArr },
          brand: { $in: brandArr },
        },
      ];
      filter = {
        product: { $in: productArr },
        customer: { $in: customerArr },
        salesContract: { $in: salesContractArr },
        brand: { $in: brandArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          product: { $in: productArr },
          brand: { $in: brandArr },
        },
      ];
    } else if (
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
    } else if (
      customerArr.length > 0 &&
      salesContractArr.length > 0 &&
      brandArr.length > 0
    ) {
      where.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },

          brand: { $in: brandArr },
        },
      ];
      filter = {
        customer: { $in: customerArr },
        salesContract: { $in: salesContractArr },
        brand: { $in: brandArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },

          brand: { $in: brandArr },
        },
      ];
    } else if (
      productArr.length > 0 &&
      salesContractArr.length > 0 &&
      brandArr.length > 0
    ) {
      where.$and = [
        {
          salesContract: { $in: salesContractArr },
          product: { $in: productArr },
          brand: { $in: brandArr },
        },
      ];
      filter = {
        product: { $in: productArr },

        salesContract: { $in: salesContractArr },
        brand: { $in: brandArr },
      };
      filter_records.$and = [
        {
          salesContract: { $in: salesContractArr },
          product: { $in: productArr },
          brand: { $in: brandArr },
        },
      ];
    } else if (
      productArr.length > 0 &&
      customerArr.length > 0 &&
      brandArr.length > 0
    ) {
      where.$and = [
        {
          customer: { $in: customerArr },

          product: { $in: productArr },
          brand: { $in: brandArr },
        },
      ];
      filter = {
        product: { $in: productArr },
        customer: { $in: customerArr },

        brand: { $in: brandArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },

          product: { $in: productArr },
          brand: { $in: brandArr },
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
    } else if (brandArr.length > 0) {
      where = {
        brand: { $in: brandArr },
      };
      filter = {
        brand: { $in: brandArr },
      };
      filter_records = {
        brand: { $in: brandArr },
      };
    } else if (brandArr.length > 0 && salesContractArr.length > 0) {
      where.$and = [
        {
          salesContract: { $in: salesContractArr },
          brandArr: { $in: brandArr },
        },
      ];
      filter = {
        salesContract: { $in: salesContractArr },
        brandArr: { $in: brandArr },
      };
      filter_records.$and = [
        {
          salesContract: { $in: salesContractArr },
          brandArr: { $in: brandArr },
        },
      ];
    } else if (brandArr.length > 0 && customerArr.length > 0) {
      where.$and = [
        {
          customer: { $in: customerArr },
          brand: { $in: brandArr },
        },
      ];
      filter = {
        customer: { $in: customerArr },
        brandArr: { $in: brandArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          brandArr: { $in: brandArr },
        },
      ];
    } else if (brandArr.length > 0 && productArr.length > 0) {
      where.$and = [
        {
          brand: { $in: brandArr },
          product: { $in: productArr },
        },
      ];
      filter = {
        brand: { $in: brandArr },
        product: { $in: productArr },
      };
      filter_records.$and = [
        {
          brand: { $in: brandArr },
          product: { $in: productArr },
        },
      ];
    }
    if (input.dcNumber) {
      extrafilter = input.dcNumber;
    }

    if (input.gpNumber) {
      extrafilter.gpNumber = input.gpNumber;
    }
    function stringToBoolean(str: string | undefined) {
      return str?.toLowerCase() === 'true';
    }
    if (input.royality_approval) {
      extrafilter.royality_approval = stringToBoolean(input.royality_approval);
    }
    const productAggregationPipelineRecords: any = [
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
        },
      },
      { $match: where },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractData',
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
        $group: {
          _id: '$product._id',
          // Group by customer
          totalShipment: {
            $sum: 1,
          },
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
          product: {
            $first: '$product',
          },
        },
      },
      {
        $project: {
          product_id: {
            $arrayElemAt: ['$product._id', 0],
          },
          product_name: {
            $arrayElemAt: ['$product.name', 0],
          },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
    ];
    const productAggregationPipeline: any = [
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
        },
      },
      { $match: where },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractData',
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
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
        },
      },
      {
        $group: {
          _id: '$product._id',
          // Group by customer
          totalShipment: {
            $sum: 1,
          },
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
          product: {
            $first: '$product',
          },
          customer: {
            $first: '$customer',
          },
          brand: {
            $first: '$brand',
          },
        },
      },
      {
        $project: {
          product_id: {
            $arrayElemAt: ['$product._id', 0],
          },
          product_name: {
            $arrayElemAt: ['$product.name', 0],
          },
          customer_name: {
            $arrayElemAt: ['$customer.name', 0],
          },
          brand_name: {
            $arrayElemAt: ['$brand.name', 0],
          },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
      { $skip: skipCount },
      { $limit: limit },
    ];
    const productgroup = await ShipmentDtlModel.aggregate(
      productAggregationPipeline
    );
    const total_records = await ShipmentDtlModel.aggregate(
      productAggregationPipelineRecords
    );

    const totalShipmentSum = total_records.reduce(
      (sum, item) => sum + item.totalShipment,
      0
    );

    const totalQtySum = total_records.reduce((sum, item) => sum + item.qty, 0);
    const totalAmountSum = total_records.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const result = {
      Group: productgroup,
      total_records: total_records.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalShipmentSum: totalShipmentSum,
    };
    return result;
  } else if (
    (input.brandgroup !== '' &&
      input.customergroup == '' &&
      input.productgroup == '' &&
      input.salesContractgroup == '' &&
      input.Adm == '' &&
      input.nonAdm == '' &&
      input.royality_approval !== '') ||
    (Array.isArray(input.product_id) && input.product_id.length !== 0) ||
    (Array.isArray(input.customer) && input.customer.length !== 0) ||
    (Array.isArray(input.brand) && input.brand.length !== 0) ||
    (Array.isArray(input.salesContract) && input.salesContract.length !== 0)
  ) {
    console.log(
      'brand group with general filters brand customer product salescontract'
    );

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
    const brandArr = input.brand
      ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    console.log(brandArr);
    let where: any = {};
    let extrafilter: any = {};
    let filter: any = {};
    let filter_records: any = {};

    if (
      customerArr.length > 0 &&
      salesContractArr.length > 0 &&
      productArr.length > 0 &&
      brandArr.length > 0
    ) {
      where.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          product: { $in: productArr },
          brand: { $in: brandArr },
        },
      ];
      filter = {
        product: { $in: productArr },
        customer: { $in: customerArr },
        salesContract: { $in: salesContractArr },
        brand: { $in: brandArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          product: { $in: productArr },
          brand: { $in: brandArr },
        },
      ];
    } else if (
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
    } else if (
      customerArr.length > 0 &&
      salesContractArr.length > 0 &&
      brandArr.length > 0
    ) {
      where.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        },
      ];
      filter = {
        customer: { $in: customerArr },
        salesContract: { $in: salesContractArr },
        brand: { $in: brandArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },

          brand: { $in: brandArr },
        },
      ];
    } else if (
      productArr.length > 0 &&
      salesContractArr.length > 0 &&
      brandArr.length > 0
    ) {
      where.$and = [
        {
          salesContract: { $in: salesContractArr },
          product: { $in: productArr },
          brand: { $in: brandArr },
        },
      ];
      filter = {
        product: { $in: productArr },

        salesContract: { $in: salesContractArr },
        brand: { $in: brandArr },
      };
      filter_records.$and = [
        {
          salesContract: { $in: salesContractArr },
          product: { $in: productArr },
          brand: { $in: brandArr },
        },
      ];
    } else if (
      productArr.length > 0 &&
      customerArr.length > 0 &&
      brandArr.length > 0
    ) {
      where.$and = [
        {
          customer: { $in: customerArr },

          product: { $in: productArr },
          brand: { $in: brandArr },
        },
      ];
      filter = {
        product: { $in: productArr },
        customer: { $in: customerArr },
        brand: { $in: brandArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },

          product: { $in: productArr },
          brand: { $in: brandArr },
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
    } else if (brandArr.length > 0 && salesContractArr.length > 0) {
      where.$and = [
        {
          salesContract: { $in: salesContractArr },
          brandArr: { $in: brandArr },
        },
      ];
      filter = {
        salesContract: { $in: salesContractArr },
        brandArr: { $in: brandArr },
      };
      filter_records.$and = [
        {
          salesContract: { $in: salesContractArr },
          brandArr: { $in: brandArr },
        },
      ];
    } else if (brandArr.length > 0 && customerArr.length > 0) {
      console.log(brandArr, customerArr, 'nn');
      where.$and = [
        {
          customer: { $in: customerArr },
          brand: { $in: brandArr },
        },
      ];
      filter = {
        customer: { $in: customerArr },
        brandArr: { $in: brandArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          brandArr: { $in: brandArr },
        },
      ];
    } else if (brandArr.length > 0 && productArr.length > 0) {
      where.$and = [
        {
          brand: { $in: brandArr },
          product: { $in: productArr },
        },
      ];
      filter = {
        brand: { $in: brandArr },
        product: { $in: productArr },
      };
      filter_records.$and = [
        {
          brand: { $in: brandArr },
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
    } else if (brandArr.length > 0) {
      where = {
        brand: { $in: brandArr },
      };
      filter = {
        brand: { $in: brandArr },
      };
      filter_records = {
        brand: { $in: brandArr },
      };
    }

    if (input.dcNumber) {
      extrafilter = input.dcNumber;
    }

    if (input.gpNumber) {
      extrafilter.gpNumber = input.gpNumber;
    }
    function stringToBoolean(str: string | undefined) {
      return str?.toLowerCase() === 'true';
    }
    if (input.royality_approval) {
      extrafilter.royality_approval = stringToBoolean(input.royality_approval);
    }

    const brandAggregationPipelineRecords: any = [
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
        },
      },
      { $match: filter_records },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractData',
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
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
        $group: {
          _id: '$brand._id',
          // Group by customer
          totalShipment: {
            $sum: 1,
          },
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
          brand: {
            $first: '$brand',
          },
          product: {
            $first: '$product',
          },
          customer: {
            $first: '$customer',
          },
        },
      },
      {
        $project: {
          brand_id: {
            $arrayElemAt: ['$brand._id', 0],
          },
          brand_name: {
            $arrayElemAt: ['$brand.name', 0],
          },
          product_name: {
            $arrayElemAt: ['$product.name', 0],
          },
          customer_name: {
            $arrayElemAt: ['$customer.name', 0],
          },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
      { $skip: skipCount },
      { $limit: limit },
    ];
    const brandAggregationPipeline: any = [
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
        },
      },
      { $match: where },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractData',
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
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
        $group: {
          _id: '$brand._id',

          totalShipment: {
            $sum: 1,
          },
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
          brand: {
            $first: '$brand',
          },
          product: {
            $first: '$product',
          },
          customer: {
            $first: '$customer',
          },
        },
      },
      {
        $project: {
          brand_id: {
            $arrayElemAt: ['$brand._id', 0],
          },
          brand_name: {
            $arrayElemAt: ['$brand.name', 0],
          },
          product_name: {
            $arrayElemAt: ['$product.name', 0],
          },
          customer_name: {
            $arrayElemAt: ['$customer.name', 0],
          },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
      { $skip: skipCount },
      { $limit: limit },
    ];
    const brandgroup = await ShipmentDtlModel.aggregate(
      brandAggregationPipeline
    );
    const total_records = await ShipmentDtlModel.aggregate(
      brandAggregationPipelineRecords
    );

    const totalShipmentSum = total_records.reduce(
      (sum, item) => sum + item.totalShipment,
      0
    );

    const totalQtySum = total_records.reduce((sum, item) => sum + item.qty, 0);
    const totalAmountSum = total_records.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const result = {
      Group: brandgroup,
      total_records: total_records.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalShipmentSum: totalShipmentSum,
    };
    return result;
  } else if (input.Adm !== '') {
    console.log('ADM');
    if (
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0 &&
      input.customergroup == '' &&
      input.productgroup == '' &&
      input.salesContractgroup == '' &&
      input.dcNumber == '' &&
      input.gpNumber == '' &&
      input.brandgroup == '' &&
      input.transactiongroup == '' &&
      input.royality_approval == ''
    ) {
      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;

      console.log(' ADM  no filter condition execute');

      const total_record = await ShipmentDtlModel.aggregate([
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },

            isDeleted: false,
            adm_ship: true,
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
            adm_ship: true,
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

      const totalQty = allrecordgroupby.map((item: any) => item.qty);
      const totalRate = allrecordgroupby.map((item: any) => item.rate);
      const totalAmount = allrecordgroupby.map((item: any) => item.amount);
      console.log(totalAmount, 'shipment');

      let where: any = {
        gpDate: {
          $gte: new Date(input.fromDate),
          $lte: new Date(input.toDate),
        },
        adm_ship: true,
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
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
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
    } else if (input.productgroup !== '' && input.royality_approval !== '') {
      console.log('product group  royality_approval');

      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;

      const royality_approval = stringToBoolean(input.royality_approval);
      console.log(royality_approval);

      const productAggregationPipeline = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            InHouse: true,
            shipment: true,
            royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'shipmentdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'shipment',
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
          $group: {
            _id: '$product._id',
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            product: {
              $first: '$product',
            },
          },
        },
        {
          $project: {
            product_id: {
              $arrayElemAt: ['$product._id', 0],
            },
            product_name: {
              $arrayElemAt: ['$product.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ];

      const productAggregationPipelineRecord = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            InHouse: true,
            shipment: true,
            royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'shipmentdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'shipment',
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
          $group: {
            _id: '$product._id',
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            product: {
              $first: '$product',
            },
          },
        },
        {
          $project: {
            product_id: {
              $arrayElemAt: ['$product._id', 0],
            },
            product_name: {
              $arrayElemAt: ['$product.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];

      const productAggregationPipelinet: any = [
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
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
            pipeline: [
              {
                $match: {
                  royality_approval: input.royality_approval, // Ensure this matches the input format
                  isDeleted: false,
                },
              },
            ],
          },
        },
        {
          $addFields: {
            salesContractData: {
              $filter: {
                input: '$salesContractData',
                as: 'contract',
                cond: {
                  $eq: [
                    '$$contract.royality_approval',
                    input.royality_approval,
                  ],
                },
              },
            },
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
          $group: {
            _id: '$product._id',
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            product: {
              $first: '$product',
            },
          },
        },
        {
          $project: {
            product_id: {
              $arrayElemAt: ['$product._id', 0],
            },
            product_name: {
              $arrayElemAt: ['$product.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ];

      const productAggregationPipelineRecords: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            // royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
            pipeline: [
              {
                $match: {
                  royality_approval: royality_approval,
                  isDeleted: false,
                },
              },
            ],
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
          $group: {
            _id: '$product._id',
            // Group by customer
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            product: {
              $first: '$product',
            },
          },
        },
        {
          $project: {
            product_id: {
              $arrayElemAt: ['$product._id', 0],
            },
            product_name: {
              $arrayElemAt: ['$product.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];

      const shipmentgroup = await SalesContractDtlModel.aggregate(
        productAggregationPipeline
      );

      const total_records = await SalesContractDtlModel.aggregate(
        productAggregationPipelineRecord
      );

      const totalShipmentSum = total_records.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_records.reduce(
        (sum, item) => sum + item.qty,
        0
      );
      const totalAmountSum = total_records.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: shipmentgroup,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (input.brandgroup !== '' && input.royality_approval !== '') {
      console.log('brand group royality_approval');

      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }
      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;

      const royality_approval = stringToBoolean(input.royality_approval);

      const brandAggregationPipeline: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            InHouse: true,
            shipment: true,
            royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'shipmentdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'shipment',
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $group: {
            _id: '$brand._id',
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            brand: {
              $first: '$brand',
            },
          },
        },
        {
          $project: {
            product_id: {
              $arrayElemAt: ['$product._id', 0],
            },
            brand_name: {
              $arrayElemAt: ['$brand.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const brandAggregationPipelineRecord: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            InHouse: true,
            shipment: true,
            royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'shipmentdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'shipment',
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $group: {
            _id: '$brand._id',
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            brand: {
              $first: '$brand',
            },
          },
        },
        {
          $project: {
            product_id: {
              $arrayElemAt: ['$product._id', 0],
            },
            brand_name: {
              $arrayElemAt: ['$brand.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];

      const brandAggregationPipelined: any = [
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
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
            pipeline: [
              {
                $match: {
                  isDeleted: false,
                  royality_approval: royality_approval,
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $group: {
            _id: '$brand._id',
            // Group by customer
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            brand: {
              $first: '$brand',
            },
          },
        },
        {
          $project: {
            brand_id: {
              $arrayElemAt: ['$brand._id', 0],
            },
            brand_name: {
              $arrayElemAt: ['$brand.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ];

      const brandAggregationPipelineRecordd: any = [
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
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
            pipeline: [
              {
                $match: {
                  isDeleted: false,
                  royality_approval: royality_approval,
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $group: {
            _id: '$brand._id',
            // Group by customer
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            brand: {
              $first: '$brand',
            },
          },
        },
        {
          $project: {
            brand_id: {
              $arrayElemAt: ['$brand._id', 0],
            },
            brand_name: {
              $arrayElemAt: ['$brand.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];

      const shipmentgroup = await SalesContractDtlModel.aggregate(
        brandAggregationPipeline
      );

      const total_records = await SalesContractDtlModel.aggregate(
        brandAggregationPipelineRecord
      );

      const totalShipmentSum = total_records.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_records.reduce(
        (sum, item) => sum + item.qty,
        0
      );
      const totalAmountSum = total_records.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: shipmentgroup,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (input.customergroup !== '' && input.royality_approval !== '') {
      console.log('customer group royality_approval');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;

      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }

      const royality_approval = stringToBoolean(input.royality_approval);

      const customerAggregationPipeline = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            InHouse: true,
            shipment: true,
            royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'shipmentdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'shipment',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $group: {
            _id: '$customer._id',
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            customer: {
              $first: '$customer',
            },
          },
        },
        {
          $project: {
            customer_id: {
              $arrayElemAt: ['$customer._id', 0],
            },
            customer_name: {
              $arrayElemAt: ['$customer.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const customerAggregationPipelineRecords = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            InHouse: true,
            shipment: true,
            royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'shipmentdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'shipment',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $group: {
            _id: '$customer._id',
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            customer: {
              $first: '$customer',
            },
          },
        },
        {
          $project: {
            customer_id: {
              $arrayElemAt: ['$customer._id', 0],
            },
            customer_name: {
              $arrayElemAt: ['$customer.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];

      const customerAggregationPipelines = [
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
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',

            pipeline: [
              {
                $match: {
                  royality_approval: royality_approval,
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $group: {
            _id: '$customer._id',
            // Group by customer
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            customer: {
              $first: '$customer',
            },
          },
        },
        {
          $project: {
            customer_id: {
              $arrayElemAt: ['$customer._id', 0],
            },
            customer_name: {
              $arrayElemAt: ['$customer.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const customerAggregationPipelineRecord = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            InHouse: true,
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',

            pipeline: [
              {
                $match: {
                  royality_approval: royality_approval,
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $group: {
            _id: '$customer._id',
            // Group by customer
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            customer: {
              $first: '$customer',
            },
          },
        },
        {
          $project: {
            customer_id: {
              $arrayElemAt: ['$customer._id', 0],
            },
            customer_name: {
              $arrayElemAt: ['$customer.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];
      const shipmentgroup = await SalesContractDtlModel.aggregate(
        customerAggregationPipeline
      );
      const total_records = await SalesContractDtlModel.aggregate(
        customerAggregationPipelineRecords
      );

      const totalShipmentSum = total_records.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_records.reduce(
        (sum, item) => sum + item.qty,
        0
      );
      const totalAmountSum = total_records.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: shipmentgroup,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.brandgroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0 &&
      input.dcNumber == '' &&
      input.gpNumber == '' &&
      input.royality_approval == ''
    ) {
      console.log('Adm brand general group');
      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      const brandAggregationPipeline: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: true,
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $group: {
            _id: '$brand._id',
            brand: {
              $first: '$brand',
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            totalshipments: {
              $sum: 1,
            },
          },
        },
        {
          $unwind: {
            path: '$brand',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            name: '$brand.name',
            qty: 1,
            amount: 1,
            totalshipments: 1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ];

      const brandAggregationPipelineRecord: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: true,
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $group: {
            _id: '$brand._id',
            brand: {
              $first: '$brand',
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            totalshipments: {
              $sum: 1,
            },
          },
        },
        {
          $unwind: {
            path: '$brand',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            name: '$brand.name',
            qty: 1,
            amount: 1,
            totalshipments: 1,
          },
        },
      ];
      const brand = await ShipmentDtlModel.aggregate(
        brandAggregationPipeline ? brandAggregationPipeline : undefined
      );
      const total_record = await ShipmentDtlModel.aggregate(
        brandAggregationPipelineRecord
          ? brandAggregationPipelineRecord
          : undefined
      );
      const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
      const totalAmountSum = total_record.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: brand,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
      };

      return result;
    } else if (
      input.productgroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0 &&
      input.dcNumber == '' &&
      input.gpNumber == '' &&
      input.royality_approval == ''
    ) {
      console.log('adm product general group');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;

      const productAggregationPipeline: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: true,
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
          $unwind: {
            path: '$product',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            name: '$product.name',
            qty: 1,
            amount: 1,
            createdAt: 1,
            product_id: '$product._id',
          },
        },
        {
          $group: {
            _id: '$product_id',
            name: {
              $first: '$name',
            },
            createdAt: {
              $first: '$createdAt',
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalShipment: {
              $sum: 1,
            },
          },
        },
        {
          $match: {
            totalQty: {
              $gt: 0,
            },
            totalAmount: {
              $gt: 0,
            },
          },
        },
        {
          $project: {
            name: 1,
            createdAt: 1,
            totalQty: 1,
            totalAmount: 1,
            totalShipment: 1,
          },
        },
        { $limit: limit },
        { $skip: skipCount },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];

      const productAggregationPipelineRecord: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: true,
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
          $unwind: {
            path: '$product',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            name: '$product.name',
            qty: 1,
            amount: 1,
            createdAt: 1,
            product_id: '$product._id',
          },
        },
        {
          $group: {
            _id: '$product_id',
            name: {
              $first: '$name',
            },
            createdAt: {
              $first: '$createdAt',
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalShipment: {
              $sum: 1,
            },
          },
        },
        {
          $match: {
            totalQty: {
              $gt: 0,
            },
            totalAmount: {
              $gt: 0,
            },
          },
        },
        {
          $project: {
            name: 1,
            createdAt: 1,
            totalQty: 1,
            totalAmount: 1,
            totalShipment: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];
      const product = await ShipmentDtlModel.aggregate(
        productAggregationPipeline != undefined
          ? productAggregationPipeline
          : undefined
      );
      const total_record = await ShipmentDtlModel.aggregate(
        productAggregationPipelineRecord != undefined
          ? productAggregationPipelineRecord
          : undefined
      );
      const totalAmountSum = total_record.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalQtySum = total_record.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );

      const result = {
        Group: product,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
      };
      return result;
    } else if (
      input.customergroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      input.dcNumber == '' &&
      input.gpNumber == '' &&
      input.royality_approval == ''
    ) {
      console.log('Adm customer general group');
      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;

      const customerAggregationPipeline: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: true,
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $unwind: {
            path: '$customer',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            name: '$customer.name',
            qty: 1,
            amount: 1,
            createdAt: 1,
            customer_id: '$customer._id',
          },
        },
        {
          $group: {
            _id: '$customer_id',
            name: {
              $first: '$name',
            },
            createdAt: {
              $first: '$createdAt',
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalShipment: {
              $sum: 1,
            },
          },
        },
        {
          $match: {
            totalQty: {
              $gt: 0,
            },
            totalAmount: {
              $gt: 0,
            },
          },
        },
        {
          $project: {
            name: 1,
            createdAt: 1,
            totalQty: 1,
            totalAmount: 1,
            totalShipment: 1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];

      const customerAggregationPipelineRecords: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: true,
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $unwind: {
            path: '$customer',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            name: '$customer.name',
            qty: 1,
            amount: 1,
            createdAt: 1,
            customer_id: '$customer._id',
          },
        },
        {
          $group: {
            _id: '$customer_id',
            name: {
              $first: '$name',
            },
            createdAt: {
              $first: '$createdAt',
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalShipment: {
              $sum: 1,
            },
          },
        },
        {
          $match: {
            totalQty: {
              $gt: 0,
            },
            totalAmount: {
              $gt: 0,
            },
          },
        },
        {
          $project: {
            name: 1,
            createdAt: 1,
            totalQty: 1,
            totalAmount: 1,
            totalShipment: 1,
          },
        },

        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];

      const customer = await ShipmentDtlModel.aggregate(
        customerAggregationPipeline != undefined
          ? customerAggregationPipeline
          : undefined
      );
      const total_record = await ShipmentDtlModel.aggregate(
        customerAggregationPipelineRecords != undefined
          ? customerAggregationPipelineRecords
          : undefined
      );
      const totalQtySum = total_record.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = total_record.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );

      const result = {
        Group: customer,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
      };
      return result;
    } else if (
      input.royality_approval !== '' &&
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0 &&
      input.customergroup == '' &&
      input.productgroup == '' &&
      input.salesContractgroup == '' &&
      input.dcNumber == '' &&
      input.gpNumber == '' &&
      input.brandgroup == '' &&
      input.transactiongroup == ''
    ) {
      console.log('royality approval filter');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;

      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }
      const royality_approval = stringToBoolean(input.royality_approval);

      const totalrecord = await SalesContractDtlModel.aggregate([
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            InHouse: true,
            shipment: true,
            royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'shipmentdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'shipmentDetail',
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salecontractDetail',
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
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $lookup: {
            from: 'shipments',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'shipment',
          },
        },
      ]);

      const salegroupby = await SalesContractDtlModel.aggregate([
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            InHouse: true,
            shipment: true,
            royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'shipmentdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'shipmentDetail',
          },
        },
        {
          $lookup: {
            from: 'shipments',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'shipment',
          },
        },
        {
          $group: {
            _id: 'null',
            qty: {
              $sum: '$qty',
            },
            rate: {
              $sum: '$rate',
            },
            amount: {
              $sum: '$amount',
            },
          },
        },
      ]);
      // Extract totals from the result
      const totalQty = salegroupby.map((item: any) => item.qty);
      const totalRate = salegroupby.map((item: any) => item.rate);
      const totalAmount = salegroupby.map((item: any) => item.amount);

      const sale = await SalesContractDtlModel.aggregate([
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            InHouse: true,
            shipment: true,
            royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'shipmentdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'shipmentDetail',
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salecontractDetail',
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
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $lookup: {
            from: 'shipments',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'shipment',
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ]);

      let result = {
        shipmentdtl: sale,
        paginated_record: sale.length,
        total_records: totalrecord.length,
        totalQty: totalQty,
        totalRate: totalRate,
        totalAmount: totalAmount,
      };
      return result;
    } else if (
      (input.customergroup == '' &&
        input.productgroup == '' &&
        input.brandgroup == '' &&
        input.transactiongroup == '' &&
        input.salesContractgroup == '' &&
        input.royality_approval == '') ||
      input.dcNumber !== '' ||
      (input.gpNumber !== '' &&
        ((Array.isArray(input.product_id) && input.product_id.length !== 0) ||
          (Array.isArray(input.customer) && input.customer.length !== 0) ||
          (Array.isArray(input.brand) && input.brand.length !== 0) ||
          (Array.isArray(input.salesContract) &&
            input.salesContract.length !== 0)))
    ) {
      console.log(' Adm main qury ');
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
      const brandArr = input.product_id
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      let where: any = {};
      let extrafilter: any = {};
      let filter: any = {};
      let filter_records: any = {};

      if (
        customerArr.length > 0 &&
        salesContractArr.length > 0 &&
        productArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
      } else if (
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
      } else if (
        customerArr.length > 0 &&
        salesContractArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },

            brand: { $in: brandArr },
          },
        ];
        filter = {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },

            brand: { $in: brandArr },
          },
        ];
      } else if (
        productArr.length > 0 &&
        salesContractArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },

          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
      } else if (
        productArr.length > 0 &&
        customerArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },

            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },
          customer: { $in: customerArr },

          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },

            product: { $in: productArr },
            brand: { $in: brandArr },
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
      } else if (brandArr.length > 0) {
        where = {
          brand: { $in: brandArr },
        };
        filter = {
          brand: { $in: brandArr },
        };
        filter_records = {
          brand: { $in: brandArr },
        };
      } else if (brandArr.length > 0 && salesContractArr.length > 0) {
        where.$and = [
          {
            salesContract: { $in: salesContractArr },
            brandArr: { $in: brandArr },
          },
        ];
        filter = {
          salesContract: { $in: salesContractArr },
          brandArr: { $in: brandArr },
        };
        filter_records.$and = [
          {
            salesContract: { $in: salesContractArr },
            brandArr: { $in: brandArr },
          },
        ];
      } else if (brandArr.length > 0 && customerArr.length > 0) {
        where.$and = [
          {
            customer: { $in: customerArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          customer: { $in: customerArr },
          brandArr: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            brandArr: { $in: brandArr },
          },
        ];
      } else if (brandArr.length > 0 && productArr.length > 0) {
        where.$and = [
          {
            brand: { $in: brandArr },
            product: { $in: productArr },
          },
        ];
        filter = {
          brand: { $in: brandArr },
          product: { $in: productArr },
        };
        filter_records.$and = [
          {
            brand: { $in: brandArr },
            product: { $in: productArr },
          },
        ];
      }
      if (input.dcNumber) {
        extrafilter.dcNumber = input.dcNumber;
      }

      if (input.gpNumber) {
        extrafilter.gpNumber = input.gpNumber;
      }
      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }
      if (input.royality_approval) {
        extrafilter.royality_approval = stringToBoolean(
          input.royality_approval
        );
      }

      const total_record = await ShipmentDtlModel.aggregate([
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },

            isDeleted: false,
            adm_ship: true,
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
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractsDetails',
            pipeline: [
              {
                $project: {
                  contract: 1,
                  royality_approval: 1,
                },
              },
            ],
          },
        },

        {
          $project: {
            contract: { $first: '$salesContractsDetails.contract' },
            royality_approval: {
              $first: '$salesContractsDetails.royality_approval',
            },
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
            adm_ship: true,
          },
        },
        { $match: filter },
        {
          $lookup: {
            from: 'shipments',
            localField: 'shipment',
            foreignField: '_id',
            as: 'shipment',
          },
        },

        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractsDetails',
            pipeline: [
              {
                $project: {
                  contract: 1,
                  royality_approval: 1,
                },
              },
            ],
          },
        },

        {
          $project: {
            qty: 1,
            rate: 1,
            amount: 1,
            contract: { $first: '$salesContractsDetails.contract' },
            royality_approval: {
              $first: '$salesContractsDetails.royality_approval',
            },
            gpNumber: {
              $first: '$shipment.gpNumber',
            },
            dcNumber: {
              $first: '$shipment.dcNumber',
            },
            gpDate: 1,
          },
        },
        { $match: extrafilter },
        {
          $group: {
            _id: 'null',
            qty: {
              $sum: '$qty',
            },
            rate: {
              $sum: '$rate',
            },
            amount: {
              $sum: '$amount',
            },
          },
        },
      ]);

      // Extract totals from the result
      const totalQty = shipmentgroupby.map((item: any) => item.qty);
      const totalRate = shipmentgroupby.map((item: any) => item.rate);
      const totalAmount = shipmentgroupby.map((item: any) => item.amount);

      const ship = await ShipmentDtlModel.aggregate([
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: true,
          },
        },

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
            pipeline: [
              {
                $project: {
                  contract: 1,
                  royality_approval: 1,
                },
              },
            ],
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
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brandDetails',
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
            supplierCode: 1,
            shipment: 1,
            shipment_no: 1,
            product: 1,
            createdAt: 1,
            customerDetails: 1,
            brandDetails: 1,
            shipmentDetails: 1,
            contract: { $first: '$salesContractsDetails.contract' },
            royality_approval: {
              $first: '$salesContractsDetails.royality_approval',
            },
            // salesContractsDetails: 1,
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
        paginated_record: ship.length,
        total_records: total_record.length,
        totalQty: totalQty,
        totalRate: totalRate,
        totalAmount: totalAmount,
      };
      return result;
    } else if (
      input.customergroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length !== 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      input.royality_approval == ''
    ) {
      console.log('customer group customer ');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const customergroup = await ShipmentDtlModel.aggregate([
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: true,
            customer: { $in: customerArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $group: {
            _id: '$customer._id',
            // Group by customer
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            customer: {
              $first: '$customer',
            },
          },
        },
        {
          $project: {
            customer_id: {
              $arrayElemAt: ['$customer._id', 0],
            },
            customer_name: {
              $arrayElemAt: ['$customer.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ]);
      const totalShipmentSum = customergroup.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = customergroup.reduce(
        (sum, item) => sum + item.qty,
        0
      );
      const totalAmountSum = customergroup.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: customergroup,
        total_records: customergroup.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.productgroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length !== 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      input.royality_approval == ''
    ) {
      console.log('product group product ');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      const productArr = input.product_id
        ? input.product_id.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const productgroup = await ShipmentDtlModel.aggregate([
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: true,
            product: { $in: productArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
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
          $group: {
            _id: '$product._id',
            // Group by customer
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            product: {
              $first: '$product',
            },
          },
        },
        {
          $project: {
            product_id: {
              $arrayElemAt: ['$product._id', 0],
            },
            product_name: {
              $arrayElemAt: ['$product.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ]);
      const totalShipmentSum = productgroup.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = productgroup.reduce((sum, item) => sum + item.qty, 0);
      const totalAmountSum = productgroup.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: productgroup,
        total_records: productgroup.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.brandgroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length !== 0 &&
      input.royality_approval == ''
    ) {
      console.log('brand group brand ');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      const brandArr = input.brand
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      // const brandgroup = await ShipmentDtlModel.aggregate([
      //   {
      //     $match: {
      //       gpDate: {
      //         $gte: new Date(input.fromDate),
      //         $lte: new Date(input.toDate),
      //       },
      //       isDeleted: false,
      //       brand: { $in: brandArr },
      //     },
      //   },
      //   {
      //     $lookup: {
      //       from: 'salescontracts',
      //       localField: 'salesContract',
      //       foreignField: '_id',
      //       as: 'salesContractData',
      //     },
      //   },
      //   {
      //     $lookup: {
      //       from: 'brands',
      //       localField: 'brand',
      //       foreignField: '_id',
      //       as: 'brand',
      //     },
      //   },
      //   {
      //     $group: {
      //       _id: '$brand._id',
      //       // Group by customer
      //       totalShipment: {
      //         $sum: 1,
      //       },
      //       qty: {
      //         $sum: '$qty',
      //       },
      //       amount: {
      //         $sum: '$amount',
      //       },
      //       brand: {
      //         $first: '$brand',
      //       },
      //     },
      //   },
      //   {
      //     $project: {
      //       brand_id: {
      //         $arrayElemAt: ['$brand._id', 0],
      //       },
      //       brand_name: {
      //         $arrayElemAt: ['$brand.name', 0],
      //       },
      //       qty: 1,
      //       amount: 1,
      //       totalShipment: 1,
      //     },
      //   },
      //   { $skip: skipCount },
      //   { $limit: limit },
      // ]);

      const brandAggregationPipeline: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: true,
            brand: { $in: brandArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $group: {
            _id: '$brand',
            totalShipment: { $sum: 1 },
            qty: { $sum: '$qty' },
            amount: { $sum: '$amount' },
            brand: { $first: '$brand' },
          },
        },
        {
          $project: {
            brand_id: '$brand._id',
            brand_name: '$brand.name',
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const brandAggregationPipelineRecord: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: true,
            brand: { $in: brandArr }, // Filter by brand IDs
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand', // Lookup brand details
          },
        },
        {
          $group: {
            _id: '$brand._id', // Group by brand _id
            totalShipment: { $sum: 1 }, // Count the total shipments
            qty: { $sum: '$qty' }, // Sum of qty
            amount: { $sum: '$amount' }, // Sum of amounts
            brand: { $first: '$brand' }, // Get the first brand from the grouped data
          },
        },
        {
          $project: {
            brand_id: '$brand._id', // Directly access brand _id
            brand_name: '$brand.name', // Directly access brand name
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $skip: skipCount }, // Apply skip for pagination
        { $limit: limit }, // Apply limit for pagination
      ];
      const brand_group = await ShipmentDtlModel.aggregate(
        brandAggregationPipeline ? brandAggregationPipeline : undefined
      );

      const total_record = await ShipmentDtlModel.aggregate(
        brandAggregationPipelineRecord
          ? brandAggregationPipelineRecord
          : undefined
      );
      const totalShipmentSum = total_record.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
      const totalAmountSum = total_record.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: brand_group,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.customergroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length !== 0 &&
      input.royality_approval == ''
    ) {
      console.log('customer group brand ');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      const brandArr = input.customer
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const customergroup = await ShipmentDtlModel.aggregate([
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: true,
            brand: { $in: brandArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $group: {
            _id: '$customer._id',
            // Group by customer
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            customer: {
              $first: '$customer',
            },
            brand: {
              $first: '$brand',
            },
          },
        },
        {
          $project: {
            customer_id: {
              $arrayElemAt: ['$customer._id', 0],
            },
            customer_name: {
              $arrayElemAt: ['$customer.name', 0],
            },
            brand_name: {
              $arrayElemAt: ['$brand.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ]);

      const brandCustomerAggregationPipeline: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: true,
            brand: { $in: brandArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $group: {
            _id: { brandId: '$brand._id', customerId: '$customer._id' },
            totalShipment: { $sum: 1 },
            qty: { $sum: '$qty' },
            amount: { $sum: '$amount' },
            brand: { $first: '$brand' },
            customer: { $first: '$customer' },
          },
        },
        {
          $project: {
            brand_id: { $arrayElemAt: ['$brand._id', 0] },
            brand_name: { $arrayElemAt: ['$brand.name', 0] },
            customer_id: { $arrayElemAt: ['$customer._id', 0] },
            customer_name: { $arrayElemAt: ['$customer.name', 0] },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const brandCustomerAggregationPipelineRecord: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: true,
            brand: { $in: brandArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $group: {
            _id: { brandId: '$brand._id', customerId: '$customer._id' },
            totalShipment: { $sum: 1 },
            qty: { $sum: '$qty' },
            amount: { $sum: '$amount' },
            brand: { $first: '$brand' },
            customer: { $first: '$customer' },
          },
        },
        {
          $project: {
            brand_id: { $arrayElemAt: ['$brand._id', 0] },
            brand_name: { $arrayElemAt: ['$brand.name', 0] },
            customer_id: { $arrayElemAt: ['$customer._id', 0] },
            customer_name: { $arrayElemAt: ['$customer.name', 0] },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];

      const customer_by = await ShipmentDtlModel.aggregate(
        brandCustomerAggregationPipeline
          ? brandCustomerAggregationPipeline
          : undefined
      );
      const total_record = await ShipmentDtlModel.aggregate(
        brandCustomerAggregationPipelineRecord
          ? brandCustomerAggregationPipelineRecord
          : undefined
      );

      const totalShipmentSum = total_record.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
      const totalAmountSum = total_record.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: customer_by,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.customergroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length !== 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      input.royality_approval == ''
    ) {
      console.log('customer group product ');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      const productArr = input.customer
        ? input.product_id.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const productCustomerAggregationPipeline: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: true,
            product: { $in: productArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
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
          $group: {
            _id: { customerId: '$customer._id', productId: '$product._id' },
            totalShipment: { $sum: 1 },
            qty: { $sum: '$qty' },
            amount: { $sum: '$amount' },
            customer: { $first: '$customer' },
            product: { $first: '$product' },
          },
        },
        {
          $project: {
            customer_id: { $arrayElemAt: ['$customer._id', 0] },
            customer_name: { $arrayElemAt: ['$customer.name', 0] },
            product_name: { $arrayElemAt: ['$product.name', 0] },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const productCustomerAggregationPipelineRecord: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: true,
            product: { $in: productArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
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
          $group: {
            _id: { customerId: '$customer._id', productId: '$product._id' },
            totalShipment: { $sum: 1 },
            qty: { $sum: '$qty' },
            amount: { $sum: '$amount' },
            customer: { $first: '$customer' },
            product: { $first: '$product' },
          },
        },
        {
          $project: {
            customer_id: { $arrayElemAt: ['$customer._id', 0] },
            customer_name: { $arrayElemAt: ['$customer.name', 0] },
            product_name: { $arrayElemAt: ['$product.name', 0] },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];

      const customer_group = await ShipmentDtlModel.aggregate(
        productCustomerAggregationPipeline
          ? productCustomerAggregationPipeline
          : undefined
      );

      const total_record = await ShipmentDtlModel.aggregate(
        productCustomerAggregationPipelineRecord
          ? productCustomerAggregationPipelineRecord
          : undefined
      );

      const totalShipmentSum = total_record.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
      const totalAmountSum = total_record.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: customer_group,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.productgroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length !== 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      input.royality_approval == ''
    ) {
      console.log('product group customer ');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      const customerArr = input.product_id
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const productCustomerAggregationPipeline: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: true,
            customer: { $in: customerArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
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
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $group: {
            _id: { productId: '$product._id', customerId: '$customer._id' },
            totalShipment: { $sum: 1 },
            qty: { $sum: '$qty' },
            amount: { $sum: '$amount' },
            product: { $first: '$product' },
            customer: { $first: '$customer' },
          },
        },
        {
          $project: {
            product_id: { $arrayElemAt: ['$product._id', 0] },
            product_name: { $arrayElemAt: ['$product.name', 0] },
            customer_id: { $arrayElemAt: ['$customer._id', 0] },
            customer_name: { $arrayElemAt: ['$customer.name', 0] },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const productCustomerAggregationPipelineRecord: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: true,
            customer: { $in: customerArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
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
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $group: {
            _id: { productId: '$product._id', customerId: '$customer._id' },
            totalShipment: { $sum: 1 },
            qty: { $sum: '$qty' },
            amount: { $sum: '$amount' },
            product: { $first: '$product' },
            customer: { $first: '$customer' },
          },
        },
        {
          $project: {
            product_id: { $arrayElemAt: ['$product._id', 0] },
            product_name: { $arrayElemAt: ['$product.name', 0] },
            customer_id: { $arrayElemAt: ['$customer._id', 0] },
            customer_name: { $arrayElemAt: ['$customer.name', 0] },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];
      const product_group = await ShipmentDtlModel.aggregate(
        productCustomerAggregationPipeline
          ? productCustomerAggregationPipeline
          : undefined
      );
      const total_record = await ShipmentDtlModel.aggregate(
        productCustomerAggregationPipelineRecord
          ? productCustomerAggregationPipelineRecord
          : undefined
      );

      const totalShipmentSum = total_record.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
      const totalAmountSum = total_record.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: product_group,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.productgroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length !== 0 &&
      input.royality_approval == ''
    ) {
      console.log('product group brand ');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      const brandArr = input.product_id
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const productBrandAggregationPipeline: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: true,
            brand: { $in: brandArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
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
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $group: {
            _id: { productId: '$product._id', brandId: '$brand._id' }, // Group by both product and brand
            totalShipment: { $sum: 1 },
            qty: { $sum: '$qty' },
            amount: { $sum: '$amount' },
            product: { $first: '$product' },
            brand: { $first: '$brand' },
          },
        },
        {
          $project: {
            product_id: { $arrayElemAt: ['$product._id', 0] },
            product_name: { $arrayElemAt: ['$product.name', 0] },
            brand_id: { $arrayElemAt: ['$brand._id', 0] },
            brand_name: { $arrayElemAt: ['$brand.name', 0] },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const productBrandAggregationPipelineRecord: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: true,
            brand: { $in: brandArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
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
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $group: {
            _id: { productId: '$product._id', brandId: '$brand._id' }, // Group by both product and brand
            totalShipment: { $sum: 1 },
            qty: { $sum: '$qty' },
            amount: { $sum: '$amount' },
            product: { $first: '$product' },
            brand: { $first: '$brand' },
          },
        },
        {
          $project: {
            product_id: { $arrayElemAt: ['$product._id', 0] },
            product_name: { $arrayElemAt: ['$product.name', 0] },
            brand_id: { $arrayElemAt: ['$brand._id', 0] },
            brand_name: { $arrayElemAt: ['$brand.name', 0] },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];
      const product_group = await ShipmentDtlModel.aggregate(
        productBrandAggregationPipeline
          ? productBrandAggregationPipeline
          : undefined
      );
      const total_record = await ShipmentDtlModel.aggregate(
        productBrandAggregationPipelineRecord
          ? productBrandAggregationPipelineRecord
          : undefined
      );

      const totalShipmentSum = total_record.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
      const totalAmountSum = total_record.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: product_group,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.brandgroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length !== 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      input.royality_approval == ''
    ) {
      console.log('brand group customer ');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      console.log(customerArr);
      const brandAggregationPipelineRecord: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: true,
            customer: { $in: customerArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
            pipeline: [
              {
                $match: {
                  isDeleted: false,
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $group: {
            _id: { brandId: '$brand._id', customerId: '$customer._id' },
            totalShipment: { $sum: 1 },
            qty: { $sum: '$qty' },
            amount: { $sum: '$amount' },
            brand: { $first: '$brand' },
            customer: { $first: '$customer' },
          },
        },
        {
          $project: {
            brand_id: { $arrayElemAt: ['$brand._id', 0] },
            brand_name: { $arrayElemAt: ['$brand.name', 0] },
            customer_id: { $arrayElemAt: ['$customer._id', 0] },
            customer_name: { $arrayElemAt: ['$customer.name', 0] },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];
      const brandAggregationPipeline: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: true,
            customer: { $in: customerArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
            pipeline: [
              {
                $match: {
                  isDeleted: false,
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $group: {
            _id: { brandId: '$brand._id', customerId: '$customer._id' },
            totalShipment: { $sum: 1 },
            qty: { $sum: '$qty' },
            amount: { $sum: '$amount' },
            brand: { $first: '$brand' },
            customer: { $first: '$customer' },
          },
        },
        {
          $project: {
            brand_id: { $arrayElemAt: ['$brand._id', 0] },
            brand_name: { $arrayElemAt: ['$brand.name', 0] },
            customer_id: { $arrayElemAt: ['$customer._id', 0] },
            customer_name: { $arrayElemAt: ['$customer.name', 0] },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ];

      const brandgroup = await ShipmentDtlModel.aggregate(
        brandAggregationPipeline ? brandAggregationPipeline : undefined
      );
      const total_record = await ShipmentDtlModel.aggregate(
        brandAggregationPipelineRecord
          ? brandAggregationPipelineRecord
          : undefined
      );

      const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
      const totalAmountSum = total_record.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const totalShipmentSum = total_record.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );
      const result = {
        Group: brandgroup,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.brandgroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length !== 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      input.royality_approval == ''
    ) {
      console.log('brand group product ');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      const productArr = input.brand
        ? input.product_id.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const productBrandAggregationPipeline: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: true,
            product: { $in: productArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
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
          $group: {
            _id: { brandId: '$brand._id', productId: '$product._id' },
            totalShipment: { $sum: 1 },
            qty: { $sum: '$qty' },
            amount: { $sum: '$amount' },
            brand: { $first: '$brand' },
            product: { $first: '$product' },
          },
        },
        {
          $project: {
            brand_id: { $arrayElemAt: ['$brand._id', 0] },
            brand_name: { $arrayElemAt: ['$brand.name', 0] },
            product_id: { $arrayElemAt: ['$product._id', 0] },
            product_name: { $arrayElemAt: ['$product.name', 0] },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ];

      const productBrandAggregationPipelineRecord: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: true,
            product: { $in: productArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
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
          $group: {
            _id: { brandId: '$brand._id', productId: '$product._id' }, // Group by both brand and product
            totalShipment: { $sum: 1 },
            qty: { $sum: '$qty' },
            amount: { $sum: '$amount' },
            brand: { $first: '$brand' },
            product: { $first: '$product' },
          },
        },
        {
          $project: {
            brand_id: { $arrayElemAt: ['$brand._id', 0] },
            brand_name: { $arrayElemAt: ['$brand.name', 0] },
            product_id: { $arrayElemAt: ['$product._id', 0] },
            product_name: { $arrayElemAt: ['$product.name', 0] },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];

      const brandgroup = await ShipmentDtlModel.aggregate(
        productBrandAggregationPipeline
          ? productBrandAggregationPipeline
          : undefined
      );
      const total_record = await ShipmentDtlModel.aggregate(
        productBrandAggregationPipelineRecord
          ? productBrandAggregationPipelineRecord
          : undefined
      );

      const totalShipmentSum = total_record.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
      const totalAmountSum = total_record.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: brandgroup,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.customergroup !== '' &&
      input.productgroup == '' &&
      input.brandgroup == '' &&
      input.salesContractgroup == '' &&
      ((Array.isArray(input.product_id) && input.product_id.length !== 0) ||
        (Array.isArray(input.customer) && input.customer.length !== 0) ||
        (Array.isArray(input.brand) && input.brand.length !== 0) ||
        (Array.isArray(input.salesContract) &&
          input.salesContract.length !== 0))
    ) {
      console.log(
        'group with general filters brand customer product salescontract ddddddd'
      );

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
      const brandArr = input.product_id
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      let where: any = {};
      let extrafilter: any = {};
      let filter: any = {};
      let filter_records: any = {};

      if (
        customerArr.length > 0 &&
        salesContractArr.length > 0 &&
        productArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
      } else if (
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
      } else if (
        customerArr.length > 0 &&
        salesContractArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },

            brand: { $in: brandArr },
          },
        ];
        filter = {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },

            brand: { $in: brandArr },
          },
        ];
      } else if (
        productArr.length > 0 &&
        salesContractArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },

          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
      } else if (
        productArr.length > 0 &&
        customerArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },

            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },
          customer: { $in: customerArr },

          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },

            product: { $in: productArr },
            brand: { $in: brandArr },
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
      } else if (brandArr.length > 0) {
        where = {
          brand: { $in: brandArr },
        };
        filter = {
          brand: { $in: brandArr },
        };
        filter_records = {
          brand: { $in: brandArr },
        };
      } else if (brandArr.length > 0 && salesContractArr.length > 0) {
        where.$and = [
          {
            salesContract: { $in: salesContractArr },
            brandArr: { $in: brandArr },
          },
        ];
        filter = {
          salesContract: { $in: salesContractArr },
          brandArr: { $in: brandArr },
        };
        filter_records.$and = [
          {
            salesContract: { $in: salesContractArr },
            brandArr: { $in: brandArr },
          },
        ];
      } else if (brandArr.length > 0 && customerArr.length > 0) {
        where.$and = [
          {
            customer: { $in: customerArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          customer: { $in: customerArr },
          brandArr: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            brandArr: { $in: brandArr },
          },
        ];
      } else if (brandArr.length > 0 && productArr.length > 0) {
        where.$and = [
          {
            brand: { $in: brandArr },
            product: { $in: productArr },
          },
        ];
        filter = {
          brand: { $in: brandArr },
          product: { $in: productArr },
        };
        filter_records.$and = [
          {
            brand: { $in: brandArr },
            product: { $in: productArr },
          },
        ];
      }
      if (input.dcNumber) {
        extrafilter = input.dcNumber;
      }

      if (input.gpNumber) {
        extrafilter.gpNumber = input.gpNumber;
      }
      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }
      if (input.royality_approval) {
        extrafilter.royality_approval = stringToBoolean(
          input.royality_approval
        );
      }

      const customerAggregationPipelineRecords: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            adm_ship: true,
            isDeleted: false,
          },
        },
        {
          $match: filter_records,
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $group: {
            _id: '$customer._id',
            // Group by customer
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            customer: {
              $first: '$customer',
            },
          },
        },
        {
          $project: {
            customer_id: {
              $arrayElemAt: ['$customer._id', 0],
            },
            customer_name: {
              $arrayElemAt: ['$customer.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];
      console.log(where, 'dsds');
      const customerAggregationPipeline: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            adm_ship: true,
            isDeleted: false,
          },
        },
        {
          $match: where,
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $group: {
            _id: '$customer._id',
            // Group by customer
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            customer: {
              $first: '$customer',
            },
          },
        },
        {
          $project: {
            customer_id: {
              $arrayElemAt: ['$customer._id', 0],
            },
            customer_name: {
              $arrayElemAt: ['$customer.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];
      const customergroup = await ShipmentDtlModel.aggregate(
        customerAggregationPipeline
      );
      console.log(customergroup);
      const total_records = await ShipmentDtlModel.aggregate(
        customerAggregationPipelineRecords
      );

      const totalShipmentSum = total_records.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_records.reduce(
        (sum, item) => sum + item.qty,
        0
      );
      const totalAmountSum = total_records.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        customer_groupby: customergroup,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.productgroup !== '' &&
      input.customergroup == '' &&
      input.brandgroup == '' &&
      input.salesContractgroup == '' &&
      ((Array.isArray(input.product_id) && input.product_id.length !== 0) ||
        (Array.isArray(input.customer) && input.customer.length !== 0) ||
        (Array.isArray(input.brand) && input.brand.length !== 0) ||
        (Array.isArray(input.salesContract) &&
          input.salesContract.length !== 0))
    ) {
      console.log(
        'group with general filters brand customer product salescontract'
      );

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
      const brandArr = input.product_id
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      let where: any = {};
      let extrafilter: any = {};
      let filter: any = {};
      let filter_records: any = {};

      if (
        customerArr.length > 0 &&
        salesContractArr.length > 0 &&
        productArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
      } else if (
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
      } else if (
        customerArr.length > 0 &&
        salesContractArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },

            brand: { $in: brandArr },
          },
        ];
        filter = {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },

            brand: { $in: brandArr },
          },
        ];
      } else if (
        productArr.length > 0 &&
        salesContractArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },

          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
      } else if (
        productArr.length > 0 &&
        customerArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },

            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },
          customer: { $in: customerArr },

          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },

            product: { $in: productArr },
            brand: { $in: brandArr },
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
      } else if (brandArr.length > 0) {
        where = {
          brand: { $in: brandArr },
        };
        filter = {
          brand: { $in: brandArr },
        };
        filter_records = {
          brand: { $in: brandArr },
        };
      } else if (brandArr.length > 0 && salesContractArr.length > 0) {
        where.$and = [
          {
            salesContract: { $in: salesContractArr },
            brandArr: { $in: brandArr },
          },
        ];
        filter = {
          salesContract: { $in: salesContractArr },
          brandArr: { $in: brandArr },
        };
        filter_records.$and = [
          {
            salesContract: { $in: salesContractArr },
            brandArr: { $in: brandArr },
          },
        ];
      } else if (brandArr.length > 0 && customerArr.length > 0) {
        where.$and = [
          {
            customer: { $in: customerArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          customer: { $in: customerArr },
          brandArr: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            brandArr: { $in: brandArr },
          },
        ];
      } else if (brandArr.length > 0 && productArr.length > 0) {
        where.$and = [
          {
            brand: { $in: brandArr },
            product: { $in: productArr },
          },
        ];
        filter = {
          brand: { $in: brandArr },
          product: { $in: productArr },
        };
        filter_records.$and = [
          {
            brand: { $in: brandArr },
            product: { $in: productArr },
          },
        ];
      }
      if (input.dcNumber) {
        extrafilter = input.dcNumber;
      }

      if (input.gpNumber) {
        extrafilter.gpNumber = input.gpNumber;
      }
      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }
      if (input.royality_approval) {
        extrafilter.royality_approval = stringToBoolean(
          input.royality_approval
        );
      }
      const productAggregationPipelineRecords: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            adm_ship: true,
            isDeleted: false,
          },
        },
        { $match: where },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
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
          $group: {
            _id: '$product._id',
            // Group by customer
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            product: {
              $first: '$product',
            },
          },
        },
        {
          $project: {
            product_id: {
              $arrayElemAt: ['$product._id', 0],
            },
            product_name: {
              $arrayElemAt: ['$product.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];
      const productAggregationPipeline: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            adm_ship: true,
            isDeleted: false,
          },
        },
        { $match: where },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
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
          $group: {
            _id: '$product._id',
            // Group by customer
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            product: {
              $first: '$product',
            },
          },
        },
        {
          $project: {
            product_id: {
              $arrayElemAt: ['$product._id', 0],
            },
            product_name: {
              $arrayElemAt: ['$product.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const productgroup = await ShipmentDtlModel.aggregate(
        productAggregationPipeline
      );
      const total_records = await ShipmentDtlModel.aggregate(
        productAggregationPipelineRecords
      );

      const totalShipmentSum = total_records.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_records.reduce(
        (sum, item) => sum + item.qty,
        0
      );
      const totalAmountSum = total_records.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        product_groupby: productgroup,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.brandgroup !== '' &&
      input.customergroup == '' &&
      input.productgroup == '' &&
      input.salesContractgroup == '' &&
      ((Array.isArray(input.product_id) && input.product_id.length !== 0) ||
        (Array.isArray(input.customer) && input.customer.length !== 0) ||
        (Array.isArray(input.brand) && input.brand.length !== 0) ||
        (Array.isArray(input.salesContract) &&
          input.salesContract.length !== 0))
    ) {
      console.log(
        'group with general filters brand customer product salescontract'
      );

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
      const brandArr = input.brand
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      console.log(brandArr);
      let where: any = {};
      let extrafilter: any = {};
      let filter: any = {};
      let filter_records: any = {};

      if (
        customerArr.length > 0 &&
        salesContractArr.length > 0 &&
        productArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
      } else if (
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
      } else if (
        customerArr.length > 0 &&
        salesContractArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },

            brand: { $in: brandArr },
          },
        ];
      } else if (
        productArr.length > 0 &&
        salesContractArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },

          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
      } else if (
        productArr.length > 0 &&
        customerArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },

            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },
          customer: { $in: customerArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },

            product: { $in: productArr },
            brand: { $in: brandArr },
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
      } else if (brandArr.length > 0 && salesContractArr.length > 0) {
        where.$and = [
          {
            salesContract: { $in: salesContractArr },
            brandArr: { $in: brandArr },
          },
        ];
        filter = {
          salesContract: { $in: salesContractArr },
          brandArr: { $in: brandArr },
        };
        filter_records.$and = [
          {
            salesContract: { $in: salesContractArr },
            brandArr: { $in: brandArr },
          },
        ];
      } else if (brandArr.length > 0 && customerArr.length > 0) {
        console.log(brandArr, customerArr, 'nn');
        where.$and = [
          {
            customer: { $in: customerArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          customer: { $in: customerArr },
          brandArr: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            brandArr: { $in: brandArr },
          },
        ];
      } else if (brandArr.length > 0 && productArr.length > 0) {
        where.$and = [
          {
            brand: { $in: brandArr },
            product: { $in: productArr },
          },
        ];
        filter = {
          brand: { $in: brandArr },
          product: { $in: productArr },
        };
        filter_records.$and = [
          {
            brand: { $in: brandArr },
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
      } else if (brandArr.length > 0) {
        where = {
          brand: { $in: brandArr },
        };
        filter = {
          brand: { $in: brandArr },
        };
        filter_records = {
          brand: { $in: brandArr },
        };
      }

      if (input.dcNumber) {
        extrafilter = input.dcNumber;
      }

      if (input.gpNumber) {
        extrafilter.gpNumber = input.gpNumber;
      }
      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }
      if (input.royality_approval) {
        extrafilter.royality_approval = stringToBoolean(
          input.royality_approval
        );
      }
      console.log(where);
      const brandAggregationPipelineRecords: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            adm_ship: true,
            isDeleted: false,
          },
        },
        { $match: filter_records },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $group: {
            _id: '$brand._id',
            // Group by customer
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            brand: {
              $first: '$brand',
            },
          },
        },
        {
          $project: {
            brand_id: {
              $arrayElemAt: ['$brand._id', 0],
            },
            brand_name: {
              $arrayElemAt: ['$brand.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const brandAggregationPipeline: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            adm_ship: true,
            isDeleted: false,
          },
        },
        { $match: where },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $group: {
            _id: '$brand._id',

            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            brand: {
              $first: '$brand',
            },
          },
        },
        {
          $project: {
            brand_id: {
              $arrayElemAt: ['$brand._id', 0],
            },
            brand_name: {
              $arrayElemAt: ['$brand.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const brandgroup = await ShipmentDtlModel.aggregate(
        brandAggregationPipeline
      );
      const total_records = await ShipmentDtlModel.aggregate(
        brandAggregationPipelineRecords
      );

      const totalShipmentSum = total_records.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_records.reduce(
        (sum, item) => sum + item.qty,
        0
      );
      const totalAmountSum = total_records.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        brand_groupby: brandgroup,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    }
  } else if (input.nonAdm !== '') {
    console.log('NON ADM ');

    if (
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0 &&
      input.customergroup == '' &&
      input.productgroup == '' &&
      input.salesContractgroup == '' &&
      input.dcNumber == '' &&
      input.gpNumber == '' &&
      input.brandgroup == '' &&
      input.transactiongroup == '' &&
      input.royality_approval == ''
    ) {
      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;

      console.log(' nonADM  no filter condition execute');

      const total_record = await ShipmentDtlModel.aggregate([
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },

            isDeleted: false,
            adm_ship: false,
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
            adm_ship: false,
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

      const totalQty = allrecordgroupby.map((item: any) => item.qty);
      const totalRate = allrecordgroupby.map((item: any) => item.rate);
      const totalAmount = allrecordgroupby.map((item: any) => item.amount);

      let where: any = {
        gpDate: {
          $gte: new Date(input.fromDate),
          $lte: new Date(input.toDate),
        },
        adm_ship: false,
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
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
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
    } else if (input.productgroup !== '' && input.royality_approval !== '') {
      console.log('product group  royality_approval  dfsd');

      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;

      const royality_approval = stringToBoolean(input.royality_approval);
      console.log(royality_approval);

      const productAggregationPipeline = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            InHouse: false,
            shipment: true,
            royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'shipmentdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'shipment',
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
          $group: {
            _id: '$product._id',
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            product: {
              $first: '$product',
            },
          },
        },
        {
          $project: {
            product_id: {
              $arrayElemAt: ['$product._id', 0],
            },
            product_name: {
              $arrayElemAt: ['$product.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ];

      const productAggregationPipelineRecord = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            InHouse: false,
            royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'shipmentdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'shipment',
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
          $group: {
            _id: '$product._id',
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            product: {
              $first: '$product',
            },
          },
        },
        {
          $project: {
            product_id: {
              $arrayElemAt: ['$product._id', 0],
            },
            product_name: {
              $arrayElemAt: ['$product.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];

      const productAggregationPipelinet: any = [
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
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
            pipeline: [
              {
                $match: {
                  royality_approval: input.royality_approval, // Ensure this matches the input format
                  isDeleted: false,
                },
              },
            ],
          },
        },
        {
          $addFields: {
            salesContractData: {
              $filter: {
                input: '$salesContractData',
                as: 'contract',
                cond: {
                  $eq: [
                    '$$contract.royality_approval',
                    input.royality_approval,
                  ],
                },
              },
            },
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
          $group: {
            _id: '$product._id',
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            product: {
              $first: '$product',
            },
          },
        },
        {
          $project: {
            product_id: {
              $arrayElemAt: ['$product._id', 0],
            },
            product_name: {
              $arrayElemAt: ['$product.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ];

      const productAggregationPipelineRecords: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            // royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
            pipeline: [
              {
                $match: {
                  royality_approval: royality_approval,
                  isDeleted: false,
                },
              },
            ],
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
          $group: {
            _id: '$product._id',
            // Group by customer
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            product: {
              $first: '$product',
            },
          },
        },
        {
          $project: {
            product_id: {
              $arrayElemAt: ['$product._id', 0],
            },
            product_name: {
              $arrayElemAt: ['$product.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];

      const shipmentgroup = await SalesContractDtlModel.aggregate(
        productAggregationPipeline
      );

      const total_records = await SalesContractDtlModel.aggregate(
        productAggregationPipelineRecord
      );

      const totalShipmentSum = total_records.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_records.reduce(
        (sum, item) => sum + item.qty,
        0
      );
      const totalAmountSum = total_records.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: shipmentgroup,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (input.brandgroup !== '' && input.royality_approval !== '') {
      console.log('brand group royality_approval');

      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }
      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;

      const royality_approval = stringToBoolean(input.royality_approval);

      const brandAggregationPipeline: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            InHouse: false,
            shipment: true,
            royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'shipmentdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'shipment',
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $group: {
            _id: '$brand._id',
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            brand: {
              $first: '$brand',
            },
          },
        },
        {
          $project: {
            product_id: {
              $arrayElemAt: ['$product._id', 0],
            },
            brand_name: {
              $arrayElemAt: ['$brand.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const brandAggregationPipelineRecord: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            InHouse: false,
            shipment: true,
            royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'shipmentdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'shipment',
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $group: {
            _id: '$brand._id',
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            brand: {
              $first: '$brand',
            },
          },
        },
        {
          $project: {
            product_id: {
              $arrayElemAt: ['$product._id', 0],
            },
            brand_name: {
              $arrayElemAt: ['$brand.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];

      const brandAggregationPipelined: any = [
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
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
            pipeline: [
              {
                $match: {
                  isDeleted: false,
                  royality_approval: royality_approval,
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $group: {
            _id: '$brand._id',
            // Group by customer
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            brand: {
              $first: '$brand',
            },
          },
        },
        {
          $project: {
            brand_id: {
              $arrayElemAt: ['$brand._id', 0],
            },
            brand_name: {
              $arrayElemAt: ['$brand.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ];

      const brandAggregationPipelineRecordd: any = [
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
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
            pipeline: [
              {
                $match: {
                  isDeleted: false,
                  royality_approval: royality_approval,
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $group: {
            _id: '$brand._id',
            // Group by customer
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            brand: {
              $first: '$brand',
            },
          },
        },
        {
          $project: {
            brand_id: {
              $arrayElemAt: ['$brand._id', 0],
            },
            brand_name: {
              $arrayElemAt: ['$brand.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];

      const shipmentgroup = await SalesContractDtlModel.aggregate(
        brandAggregationPipeline
      );

      const total_records = await SalesContractDtlModel.aggregate(
        brandAggregationPipelineRecord
      );

      const totalShipmentSum = total_records.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_records.reduce(
        (sum, item) => sum + item.qty,
        0
      );
      const totalAmountSum = total_records.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: shipmentgroup,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (input.customergroup !== '' && input.royality_approval !== '') {
      console.log('customer group royality_approval');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;

      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }

      const royality_approval = stringToBoolean(input.royality_approval);

      const customerAggregationPipeline = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            InHouse: false,
            shipment: true,
            royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'shipmentdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'shipment',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $group: {
            _id: '$customer._id',
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            customer: {
              $first: '$customer',
            },
          },
        },
        {
          $project: {
            customer_id: {
              $arrayElemAt: ['$customer._id', 0],
            },
            customer_name: {
              $arrayElemAt: ['$customer.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const customerAggregationPipelineRecords = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            InHouse: false,
            shipment: true,
            royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'shipmentdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'shipment',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $group: {
            _id: '$customer._id',
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            customer: {
              $first: '$customer',
            },
          },
        },
        {
          $project: {
            customer_id: {
              $arrayElemAt: ['$customer._id', 0],
            },
            customer_name: {
              $arrayElemAt: ['$customer.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];

      const customerAggregationPipelines = [
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
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',

            pipeline: [
              {
                $match: {
                  royality_approval: royality_approval,
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $group: {
            _id: '$customer._id',
            // Group by customer
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            customer: {
              $first: '$customer',
            },
          },
        },
        {
          $project: {
            customer_id: {
              $arrayElemAt: ['$customer._id', 0],
            },
            customer_name: {
              $arrayElemAt: ['$customer.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const customerAggregationPipelineRecord = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            InHouse: true,
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',

            pipeline: [
              {
                $match: {
                  royality_approval: royality_approval,
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $group: {
            _id: '$customer._id',
            // Group by customer
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            customer: {
              $first: '$customer',
            },
          },
        },
        {
          $project: {
            customer_id: {
              $arrayElemAt: ['$customer._id', 0],
            },
            customer_name: {
              $arrayElemAt: ['$customer.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];
      const shipmentgroup = await SalesContractDtlModel.aggregate(
        customerAggregationPipeline
      );
      const total_records = await SalesContractDtlModel.aggregate(
        customerAggregationPipelineRecords
      );

      const totalShipmentSum = total_records.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_records.reduce(
        (sum, item) => sum + item.qty,
        0
      );
      const totalAmountSum = total_records.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: shipmentgroup,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.productgroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0 &&
      input.dcNumber == '' &&
      input.gpNumber == '' &&
      input.royality_approval == ''
    ) {
      console.log('nonadm product general group');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;

      const productAggregationPipeline: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: false,
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
          $unwind: {
            path: '$product',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            name: '$product.name',
            qty: 1,
            amount: 1,
            createdAt: 1,
            product_id: '$product._id',
          },
        },
        {
          $group: {
            _id: '$product_id',
            name: {
              $first: '$name',
            },
            createdAt: {
              $first: '$createdAt',
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalShipment: {
              $sum: 1,
            },
          },
        },
        {
          $match: {
            totalQty: {
              $gt: 0,
            },
            totalAmount: {
              $gt: 0,
            },
          },
        },
        {
          $project: {
            name: 1,
            createdAt: 1,
            totalQty: 1,
            totalAmount: 1,
            totalShipment: 1,
          },
        },
        { $limit: limit },
        { $skip: skipCount },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];

      const productAggregationPipelineRecord: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: false,
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
          $unwind: {
            path: '$product',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            name: '$product.name',
            qty: 1,
            amount: 1,
            createdAt: 1,
            product_id: '$product._id',
          },
        },
        {
          $group: {
            _id: '$product_id',
            name: {
              $first: '$name',
            },
            createdAt: {
              $first: '$createdAt',
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalShipment: {
              $sum: 1,
            },
          },
        },
        {
          $match: {
            totalQty: {
              $gt: 0,
            },
            totalAmount: {
              $gt: 0,
            },
          },
        },
        {
          $project: {
            name: 1,
            createdAt: 1,
            totalQty: 1,
            totalAmount: 1,
            totalShipment: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];
      const product = await ShipmentDtlModel.aggregate(
        productAggregationPipeline != undefined
          ? productAggregationPipeline
          : undefined
      );
      const total_record = await ShipmentDtlModel.aggregate(
        productAggregationPipelineRecord != undefined
          ? productAggregationPipelineRecord
          : undefined
      );
      const totalAmountSum = total_record.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalQtySum = total_record.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );

      const result = {
        Group: product,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
      };
      return result;
    } else if (
      input.brandgroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0 &&
      input.dcNumber == '' &&
      input.gpNumber == '' &&
      input.royality_approval == ''
    ) {
      console.log('nonAdm brand general group');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      const brandAggregationPipeline: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: false,
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $group: {
            _id: '$brand._id',
            brand: {
              $first: '$brand',
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            totalshipments: {
              $sum: 1,
            },
          },
        },
        {
          $unwind: {
            path: '$brand',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            name: '$brand.name',
            qty: 1,
            amount: 1,
            totalshipments: 1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ];

      const brandAggregationPipelineRecord: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: false,
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $group: {
            _id: '$brand._id',
            brand: {
              $first: '$brand',
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            totalshipments: {
              $sum: 1,
            },
          },
        },
        {
          $unwind: {
            path: '$brand',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            name: '$brand.name',
            qty: 1,
            amount: 1,
            totalshipments: 1,
          },
        },
      ];
      const brand = await ShipmentDtlModel.aggregate(
        brandAggregationPipeline ? brandAggregationPipeline : undefined
      );
      const total_record = await ShipmentDtlModel.aggregate(
        brandAggregationPipelineRecord
          ? brandAggregationPipelineRecord
          : undefined
      );
      const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
      const totalAmountSum = total_record.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: brand,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
      };

      return result;
    } else if (
      input.customergroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      input.dcNumber == '' &&
      input.gpNumber == '' &&
      input.royality_approval == ''
    ) {
      console.log('nonAdm customer general group');
      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;

      const customerAggregationPipeline: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: false,
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $unwind: {
            path: '$customer',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            name: '$customer.name',
            qty: 1,
            amount: 1,
            createdAt: 1,
            customer_id: '$customer._id',
          },
        },
        {
          $group: {
            _id: '$customer_id',
            name: {
              $first: '$name',
            },
            createdAt: {
              $first: '$createdAt',
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalShipment: {
              $sum: 1,
            },
          },
        },
        {
          $match: {
            totalQty: {
              $gt: 0,
            },
            totalAmount: {
              $gt: 0,
            },
          },
        },
        {
          $project: {
            name: 1,
            createdAt: 1,
            totalQty: 1,
            totalAmount: 1,
            totalShipment: 1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];

      const customerAggregationPipelineRecords: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: false,
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $unwind: {
            path: '$customer',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            name: '$customer.name',
            qty: 1,
            amount: 1,
            createdAt: 1,
            customer_id: '$customer._id',
          },
        },
        {
          $group: {
            _id: '$customer_id',
            name: {
              $first: '$name',
            },
            createdAt: {
              $first: '$createdAt',
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalShipment: {
              $sum: 1,
            },
          },
        },
        {
          $match: {
            totalQty: {
              $gt: 0,
            },
            totalAmount: {
              $gt: 0,
            },
          },
        },
        {
          $project: {
            name: 1,
            createdAt: 1,
            totalQty: 1,
            totalAmount: 1,
            totalShipment: 1,
          },
        },

        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];

      const customer = await ShipmentDtlModel.aggregate(
        customerAggregationPipeline != undefined
          ? customerAggregationPipeline
          : undefined
      );
      const total_record = await ShipmentDtlModel.aggregate(
        customerAggregationPipelineRecords != undefined
          ? customerAggregationPipelineRecords
          : undefined
      );
      const totalQtySum = total_record.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = total_record.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );

      const result = {
        Group: customer,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
      };
      return result;
    } else if (
      input.royality_approval !== '' &&
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0 &&
      input.customergroup == '' &&
      input.productgroup == '' &&
      input.salesContractgroup == '' &&
      input.dcNumber == '' &&
      input.gpNumber == '' &&
      input.brandgroup == '' &&
      input.transactiongroup == ''
    ) {
      console.log('royality approval filter');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;

      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }
      const royality_approval = stringToBoolean(input.royality_approval);

      const totalrecord = await SalesContractDtlModel.aggregate([
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            InHouse: false,
            shipment: true,
            royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'shipmentdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'shipmentDetail',
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salecontractDetail',
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
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $lookup: {
            from: 'shipments',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'shipment',
          },
        },
      ]);

      const salegroupby = await SalesContractDtlModel.aggregate([
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            InHouse: false,
            shipment: true,
            royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'shipmentdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'shipmentDetail',
          },
        },
        {
          $lookup: {
            from: 'shipments',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'shipment',
          },
        },
        {
          $group: {
            _id: 'null',
            qty: {
              $sum: '$qty',
            },
            rate: {
              $sum: '$rate',
            },
            amount: {
              $sum: '$amount',
            },
          },
        },
      ]);
      // Extract totals from the result
      const totalQty = salegroupby.map((item: any) => item.qty);
      const totalRate = salegroupby.map((item: any) => item.rate);
      const totalAmount = salegroupby.map((item: any) => item.amount);

      const sale = await SalesContractDtlModel.aggregate([
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            InHouse: false,
            shipment: true,
            royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'shipmentdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'shipmentDetail',
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salecontractDetail',
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
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $lookup: {
            from: 'shipments',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'shipment',
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ]);

      let result = {
        shipmentdtl: sale,
        paginated_record: sale.length,
        total_records: totalrecord.length,
        totalQty: totalQty,
        totalRate: totalRate,
        totalAmount: totalAmount,
      };
      return result;
    } else if (
      (input.customergroup == '' &&
        input.productgroup == '' &&
        input.brandgroup == '' &&
        input.transactiongroup == '' &&
        input.salesContractgroup == '' &&
        input.royality_approval == '') ||
      input.dcNumber !== '' ||
      (input.gpNumber !== '' &&
        ((Array.isArray(input.product_id) && input.product_id.length !== 0) ||
          (Array.isArray(input.customer) && input.customer.length !== 0) ||
          (Array.isArray(input.brand) && input.brand.length !== 0) ||
          (Array.isArray(input.salesContract) &&
            input.salesContract.length !== 0)))
    ) {
      console.log(' nonAdm main qury ');
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
      const brandArr = input.product_id
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      let where: any = {};
      let extrafilter: any = {};
      let filter: any = {};
      let filter_records: any = {};

      if (
        customerArr.length > 0 &&
        salesContractArr.length > 0 &&
        productArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
      } else if (
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
      } else if (
        customerArr.length > 0 &&
        salesContractArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },

            brand: { $in: brandArr },
          },
        ];
        filter = {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },

            brand: { $in: brandArr },
          },
        ];
      } else if (
        productArr.length > 0 &&
        salesContractArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },

          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
      } else if (
        productArr.length > 0 &&
        customerArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },

            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },
          customer: { $in: customerArr },

          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },

            product: { $in: productArr },
            brand: { $in: brandArr },
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
      } else if (brandArr.length > 0) {
        where = {
          brand: { $in: brandArr },
        };
        filter = {
          brand: { $in: brandArr },
        };
        filter_records = {
          brand: { $in: brandArr },
        };
      } else if (brandArr.length > 0 && salesContractArr.length > 0) {
        where.$and = [
          {
            salesContract: { $in: salesContractArr },
            brandArr: { $in: brandArr },
          },
        ];
        filter = {
          salesContract: { $in: salesContractArr },
          brandArr: { $in: brandArr },
        };
        filter_records.$and = [
          {
            salesContract: { $in: salesContractArr },
            brandArr: { $in: brandArr },
          },
        ];
      } else if (brandArr.length > 0 && customerArr.length > 0) {
        where.$and = [
          {
            customer: { $in: customerArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          customer: { $in: customerArr },
          brandArr: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            brandArr: { $in: brandArr },
          },
        ];
      } else if (brandArr.length > 0 && productArr.length > 0) {
        where.$and = [
          {
            brand: { $in: brandArr },
            product: { $in: productArr },
          },
        ];
        filter = {
          brand: { $in: brandArr },
          product: { $in: productArr },
        };
        filter_records.$and = [
          {
            brand: { $in: brandArr },
            product: { $in: productArr },
          },
        ];
      }
      if (input.dcNumber) {
        extrafilter.dcNumber = input.dcNumber;
      }

      if (input.gpNumber) {
        extrafilter.gpNumber = input.gpNumber;
      }
      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }
      if (input.royality_approval) {
        extrafilter.royality_approval = stringToBoolean(
          input.royality_approval
        );
      }

      const total_record = await ShipmentDtlModel.aggregate([
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },

            isDeleted: false,
            adm_ship: false,
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
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractsDetails',
            pipeline: [
              {
                $project: {
                  contract: 1,
                  royality_approval: 1,
                },
              },
            ],
          },
        },

        {
          $project: {
            contract: { $first: '$salesContractsDetails.contract' },
            royality_approval: {
              $first: '$salesContractsDetails.royality_approval',
            },
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
            adm_ship: false,
          },
        },
        { $match: filter },
        {
          $lookup: {
            from: 'shipments',
            localField: 'shipment',
            foreignField: '_id',
            as: 'shipment',
          },
        },

        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractsDetails',
            pipeline: [
              {
                $project: {
                  contract: 1,
                  royality_approval: 1,
                },
              },
            ],
          },
        },

        {
          $project: {
            qty: 1,
            rate: 1,
            amount: 1,
            contract: { $first: '$salesContractsDetails.contract' },
            royality_approval: {
              $first: '$salesContractsDetails.royality_approval',
            },
            gpNumber: {
              $first: '$shipment.gpNumber',
            },
            dcNumber: {
              $first: '$shipment.dcNumber',
            },
            gpDate: 1,
          },
        },
        { $match: extrafilter },
        {
          $group: {
            _id: 'null',
            qty: {
              $sum: '$qty',
            },
            rate: {
              $sum: '$rate',
            },
            amount: {
              $sum: '$amount',
            },
          },
        },
      ]);

      // Extract totals from the result
      const totalQty = shipmentgroupby.map((item: any) => item.qty);
      const totalRate = shipmentgroupby.map((item: any) => item.rate);
      const totalAmount = shipmentgroupby.map((item: any) => item.amount);

      const ship = await ShipmentDtlModel.aggregate([
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: false,
          },
        },

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
            pipeline: [
              {
                $project: {
                  contract: 1,
                  royality_approval: 1,
                },
              },
            ],
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
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brandDetails',
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
            supplierCode: 1,
            shipment: 1,
            shipment_no: 1,
            product: 1,
            createdAt: 1,
            customerDetails: 1,
            brandDetails: 1,
            shipmentDetails: 1,
            contract: { $first: '$salesContractsDetails.contract' },
            royality_approval: {
              $first: '$salesContractsDetails.royality_approval',
            },
            // salesContractsDetails: 1,
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
        paginated_record: ship.length,
        total_records: total_record.length,
        totalQty: totalQty,
        totalRate: totalRate,
        totalAmount: totalAmount,
      };
      return result;
    } else if (
      input.customergroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length !== 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0
    ) {
      console.log(' nonadm customer group customer ');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const customergroup = await ShipmentDtlModel.aggregate([
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: false,
            customer: { $in: customerArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $group: {
            _id: '$customer._id',
            // Group by customer
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            customer: {
              $first: '$customer',
            },
          },
        },
        {
          $project: {
            customer_id: {
              $arrayElemAt: ['$customer._id', 0],
            },
            customer_name: {
              $arrayElemAt: ['$customer.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ]);
      const totalShipmentSum = customergroup.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = customergroup.reduce(
        (sum, item) => sum + item.qty,
        0
      );
      const totalAmountSum = customergroup.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: customergroup,
        total_records: customergroup.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.productgroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length !== 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0
    ) {
      console.log('nonAdm product group product ');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      const productArr = input.product_id
        ? input.product_id.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const productgroup = await ShipmentDtlModel.aggregate([
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: false,
            product: { $in: productArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
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
          $group: {
            _id: '$product._id',
            // Group by customer
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            product: {
              $first: '$product',
            },
          },
        },
        {
          $project: {
            product_id: {
              $arrayElemAt: ['$product._id', 0],
            },
            product_name: {
              $arrayElemAt: ['$product.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ]);
      const totalShipmentSum = productgroup.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = productgroup.reduce((sum, item) => sum + item.qty, 0);
      const totalAmountSum = productgroup.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: productgroup,
        total_records: productgroup.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.brandgroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length !== 0
    ) {
      console.log(' nonAdm brand group brand ');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      const brandArr = input.brand
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      // const brandgroup = await ShipmentDtlModel.aggregate([
      //   {
      //     $match: {
      //       gpDate: {
      //         $gte: new Date(input.fromDate),
      //         $lte: new Date(input.toDate),
      //       },
      //       isDeleted: false,
      //       brand: { $in: brandArr },
      //     },
      //   },
      //   {
      //     $lookup: {
      //       from: 'salescontracts',
      //       localField: 'salesContract',
      //       foreignField: '_id',
      //       as: 'salesContractData',
      //     },
      //   },
      //   {
      //     $lookup: {
      //       from: 'brands',
      //       localField: 'brand',
      //       foreignField: '_id',
      //       as: 'brand',
      //     },
      //   },
      //   {
      //     $group: {
      //       _id: '$brand._id',
      //       // Group by customer
      //       totalShipment: {
      //         $sum: 1,
      //       },
      //       qty: {
      //         $sum: '$qty',
      //       },
      //       amount: {
      //         $sum: '$amount',
      //       },
      //       brand: {
      //         $first: '$brand',
      //       },
      //     },
      //   },
      //   {
      //     $project: {
      //       brand_id: {
      //         $arrayElemAt: ['$brand._id', 0],
      //       },
      //       brand_name: {
      //         $arrayElemAt: ['$brand.name', 0],
      //       },
      //       qty: 1,
      //       amount: 1,
      //       totalShipment: 1,
      //     },
      //   },
      //   { $skip: skipCount },
      //   { $limit: limit },
      // ]);

      const brandAggregationPipeline: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: true,
            brand: { $in: brandArr }, // Filter by brand IDs
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand', // Lookup brand details
          },
        },
        {
          $group: {
            _id: '$brand._id', // Group by brand _id
            totalShipment: { $sum: 1 }, // Count the total shipments
            qty: { $sum: '$qty' }, // Sum of qty
            amount: { $sum: '$amount' }, // Sum of amounts
            brand: { $first: '$brand' }, // Get the first brand from the grouped data
          },
        },
        {
          $project: {
            brand_id: '$brand._id', // Directly access brand _id
            brand_name: '$brand.name', // Directly access brand name
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $skip: skipCount }, // Apply skip for pagination
        { $limit: limit }, // Apply limit for pagination
      ];
      const brandAggregationPipelineRecord: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: true,
            brand: { $in: brandArr }, // Filter by brand IDs
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand', // Lookup brand details
          },
        },
        {
          $group: {
            _id: '$brand._id', // Group by brand _id
            totalShipment: { $sum: 1 }, // Count the total shipments
            qty: { $sum: '$qty' }, // Sum of qty
            amount: { $sum: '$amount' }, // Sum of amounts
            brand: { $first: '$brand' }, // Get the first brand from the grouped data
          },
        },
        {
          $project: {
            brand_id: '$brand._id', // Directly access brand _id
            brand_name: '$brand.name', // Directly access brand name
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];
      const brand_group = await ShipmentDtlModel.aggregate(
        brandAggregationPipeline ? brandAggregationPipeline : undefined
      );

      const total_record = await ShipmentDtlModel.aggregate(
        brandAggregationPipelineRecord
          ? brandAggregationPipelineRecord
          : undefined
      );
      const totalShipmentSum = total_record.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
      const totalAmountSum = total_record.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: brand_group,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.customergroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length !== 0
    ) {
      console.log('nonAdm customer group brand ');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      const brandArr = input.customer
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const brandCustomerAggregationPipeline: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: false,
            brand: { $in: brandArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $group: {
            _id: { brandId: '$brand._id', customerId: '$customer._id' },
            totalShipment: { $sum: 1 },
            qty: { $sum: '$qty' },
            amount: { $sum: '$amount' },
            brand: { $first: '$brand' },
            customer: { $first: '$customer' },
          },
        },
        {
          $project: {
            brand_id: { $arrayElemAt: ['$brand._id', 0] },
            brand_name: { $arrayElemAt: ['$brand.name', 0] },
            customer_id: { $arrayElemAt: ['$customer._id', 0] },
            customer_name: { $arrayElemAt: ['$customer.name', 0] },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const brandCustomerAggregationPipelineRecord: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: false,
            brand: { $in: brandArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $group: {
            _id: { brandId: '$brand._id', customerId: '$customer._id' },
            totalShipment: { $sum: 1 },
            qty: { $sum: '$qty' },
            amount: { $sum: '$amount' },
            brand: { $first: '$brand' },
            customer: { $first: '$customer' },
          },
        },
        {
          $project: {
            brand_id: { $arrayElemAt: ['$brand._id', 0] },
            brand_name: { $arrayElemAt: ['$brand.name', 0] },
            customer_id: { $arrayElemAt: ['$customer._id', 0] },
            customer_name: { $arrayElemAt: ['$customer.name', 0] },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];

      const customer_by = await ShipmentDtlModel.aggregate(
        brandCustomerAggregationPipeline
          ? brandCustomerAggregationPipeline
          : undefined
      );
      const total_record = await ShipmentDtlModel.aggregate(
        brandCustomerAggregationPipelineRecord
          ? brandCustomerAggregationPipelineRecord
          : undefined
      );

      const totalShipmentSum = total_record.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
      const totalAmountSum = total_record.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: customer_by,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.customergroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length !== 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0
    ) {
      console.log('nonAdm customer group product ');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      const productArr = input.customer
        ? input.product_id.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const productCustomerAggregationPipeline: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: false,
            product: { $in: productArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
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
          $group: {
            _id: { customerId: '$customer._id', productId: '$product._id' },
            totalShipment: { $sum: 1 },
            qty: { $sum: '$qty' },
            amount: { $sum: '$amount' },
            customer: { $first: '$customer' },
            product: { $first: '$product' },
          },
        },
        {
          $project: {
            customer_id: { $arrayElemAt: ['$customer._id', 0] },
            customer_name: { $arrayElemAt: ['$customer.name', 0] },
            product_name: { $arrayElemAt: ['$product.name', 0] },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const productCustomerAggregationPipelineRecord: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: false,
            product: { $in: productArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
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
          $group: {
            _id: { customerId: '$customer._id', productId: '$product._id' },
            totalShipment: { $sum: 1 },
            qty: { $sum: '$qty' },
            amount: { $sum: '$amount' },
            customer: { $first: '$customer' },
            product: { $first: '$product' },
          },
        },
        {
          $project: {
            customer_id: { $arrayElemAt: ['$customer._id', 0] },
            customer_name: { $arrayElemAt: ['$customer.name', 0] },
            product_name: { $arrayElemAt: ['$product.name', 0] },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];

      const customer_group = await ShipmentDtlModel.aggregate(
        productCustomerAggregationPipeline
          ? productCustomerAggregationPipeline
          : undefined
      );

      const total_record = await ShipmentDtlModel.aggregate(
        productCustomerAggregationPipelineRecord
          ? productCustomerAggregationPipelineRecord
          : undefined
      );

      const totalShipmentSum = total_record.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
      const totalAmountSum = total_record.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: customer_group,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.productgroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length !== 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0
    ) {
      console.log('nonAdm product group customer ');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      const customerArr = input.product_id
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const productCustomerAggregationPipeline: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: false,
            customer: { $in: customerArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
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
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $group: {
            _id: { productId: '$product._id', customerId: '$customer._id' },
            totalShipment: { $sum: 1 },
            qty: { $sum: '$qty' },
            amount: { $sum: '$amount' },
            product: { $first: '$product' },
            customer: { $first: '$customer' },
          },
        },
        {
          $project: {
            product_id: { $arrayElemAt: ['$product._id', 0] },
            product_name: { $arrayElemAt: ['$product.name', 0] },
            customer_id: { $arrayElemAt: ['$customer._id', 0] },
            customer_name: { $arrayElemAt: ['$customer.name', 0] },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const productCustomerAggregationPipelineRecord: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: false,
            customer: { $in: customerArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
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
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $group: {
            _id: { productId: '$product._id', customerId: '$customer._id' },
            totalShipment: { $sum: 1 },
            qty: { $sum: '$qty' },
            amount: { $sum: '$amount' },
            product: { $first: '$product' },
            customer: { $first: '$customer' },
          },
        },
        {
          $project: {
            product_id: { $arrayElemAt: ['$product._id', 0] },
            product_name: { $arrayElemAt: ['$product.name', 0] },
            customer_id: { $arrayElemAt: ['$customer._id', 0] },
            customer_name: { $arrayElemAt: ['$customer.name', 0] },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];
      const product_group = await ShipmentDtlModel.aggregate(
        productCustomerAggregationPipeline
          ? productCustomerAggregationPipeline
          : undefined
      );
      const total_record = await ShipmentDtlModel.aggregate(
        productCustomerAggregationPipelineRecord
          ? productCustomerAggregationPipelineRecord
          : undefined
      );

      const totalShipmentSum = total_record.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
      const totalAmountSum = total_record.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: product_group,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.productgroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length !== 0
    ) {
      console.log(' non ADm product group brand ');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      const brandArr = input.product_id
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const productBrandAggregationPipeline: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: false,
            brand: { $in: brandArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
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
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $group: {
            _id: { productId: '$product._id', brandId: '$brand._id' }, // Group by both product and brand
            totalShipment: { $sum: 1 },
            qty: { $sum: '$qty' },
            amount: { $sum: '$amount' },
            product: { $first: '$product' },
            brand: { $first: '$brand' },
          },
        },
        {
          $project: {
            product_id: { $arrayElemAt: ['$product._id', 0] },
            product_name: { $arrayElemAt: ['$product.name', 0] },
            brand_id: { $arrayElemAt: ['$brand._id', 0] },
            brand_name: { $arrayElemAt: ['$brand.name', 0] },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const productBrandAggregationPipelineRecord: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: false,
            brand: { $in: brandArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
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
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $group: {
            _id: { productId: '$product._id', brandId: '$brand._id' }, // Group by both product and brand
            totalShipment: { $sum: 1 },
            qty: { $sum: '$qty' },
            amount: { $sum: '$amount' },
            product: { $first: '$product' },
            brand: { $first: '$brand' },
          },
        },
        {
          $project: {
            product_id: { $arrayElemAt: ['$product._id', 0] },
            product_name: { $arrayElemAt: ['$product.name', 0] },
            brand_id: { $arrayElemAt: ['$brand._id', 0] },
            brand_name: { $arrayElemAt: ['$brand.name', 0] },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];
      const product_group = await ShipmentDtlModel.aggregate(
        productBrandAggregationPipeline
          ? productBrandAggregationPipeline
          : undefined
      );
      const total_record = await ShipmentDtlModel.aggregate(
        productBrandAggregationPipelineRecord
          ? productBrandAggregationPipelineRecord
          : undefined
      );

      const totalShipmentSum = total_record.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
      const totalAmountSum = total_record.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: product_group,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.brandgroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length !== 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0
    ) {
      console.log(' non Adm brand group customer ');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      console.log(customerArr);
      const brandAggregationPipelineRecord: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: false,
            customer: { $in: customerArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
            pipeline: [
              {
                $match: {
                  isDeleted: false,
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $group: {
            _id: { brandId: '$brand._id', customerId: '$customer._id' },
            totalShipment: { $sum: 1 },
            qty: { $sum: '$qty' },
            amount: { $sum: '$amount' },
            brand: { $first: '$brand' },
            customer: { $first: '$customer' },
          },
        },
        {
          $project: {
            brand_id: { $arrayElemAt: ['$brand._id', 0] },
            brand_name: { $arrayElemAt: ['$brand.name', 0] },
            customer_id: { $arrayElemAt: ['$customer._id', 0] },
            customer_name: { $arrayElemAt: ['$customer.name', 0] },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];
      const brandAggregationPipeline: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: false,
            customer: { $in: customerArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
            pipeline: [
              {
                $match: {
                  isDeleted: false,
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $group: {
            _id: { brandId: '$brand._id', customerId: '$customer._id' },
            totalShipment: { $sum: 1 },
            qty: { $sum: '$qty' },
            amount: { $sum: '$amount' },
            brand: { $first: '$brand' },
            customer: { $first: '$customer' },
          },
        },
        {
          $project: {
            brand_id: { $arrayElemAt: ['$brand._id', 0] },
            brand_name: { $arrayElemAt: ['$brand.name', 0] },
            customer_id: { $arrayElemAt: ['$customer._id', 0] },
            customer_name: { $arrayElemAt: ['$customer.name', 0] },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ];

      const brandgroup = await ShipmentDtlModel.aggregate(
        brandAggregationPipeline ? brandAggregationPipeline : undefined
      );
      const total_record = await ShipmentDtlModel.aggregate(
        brandAggregationPipelineRecord
          ? brandAggregationPipelineRecord
          : undefined
      );

      const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
      const totalAmountSum = total_record.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const totalShipmentSum = total_record.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );
      const result = {
        Group: brandgroup,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.brandgroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length !== 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0
    ) {
      console.log(' non Adm brand group product ');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      const productArr = input.brand
        ? input.product_id.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const productBrandAggregationPipeline: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: false,
            product: { $in: productArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
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
          $group: {
            _id: { brandId: '$brand._id', productId: '$product._id' },
            totalShipment: { $sum: 1 },
            qty: { $sum: '$qty' },
            amount: { $sum: '$amount' },
            brand: { $first: '$brand' },
            product: { $first: '$product' },
          },
        },
        {
          $project: {
            brand_id: { $arrayElemAt: ['$brand._id', 0] },
            brand_name: { $arrayElemAt: ['$brand.name', 0] },
            product_id: { $arrayElemAt: ['$product._id', 0] },
            product_name: { $arrayElemAt: ['$product.name', 0] },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ];

      const productBrandAggregationPipelineRecord: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: false,
            product: { $in: productArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
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
          $group: {
            _id: { brandId: '$brand._id', productId: '$product._id' }, // Group by both brand and product
            totalShipment: { $sum: 1 },
            qty: { $sum: '$qty' },
            amount: { $sum: '$amount' },
            brand: { $first: '$brand' },
            product: { $first: '$product' },
          },
        },
        {
          $project: {
            brand_id: { $arrayElemAt: ['$brand._id', 0] },
            brand_name: { $arrayElemAt: ['$brand.name', 0] },
            product_id: { $arrayElemAt: ['$product._id', 0] },
            product_name: { $arrayElemAt: ['$product.name', 0] },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];

      const brandgroup = await ShipmentDtlModel.aggregate(
        productBrandAggregationPipeline
          ? productBrandAggregationPipeline
          : undefined
      );
      const total_record = await ShipmentDtlModel.aggregate(
        productBrandAggregationPipelineRecord
          ? productBrandAggregationPipelineRecord
          : undefined
      );

      const totalShipmentSum = total_record.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
      const totalAmountSum = total_record.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: brandgroup,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.customergroup !== '' &&
      input.productgroup == '' &&
      input.brandgroup == '' &&
      input.salesContractgroup == '' &&
      ((Array.isArray(input.product_id) && input.product_id.length !== 0) ||
        (Array.isArray(input.customer) && input.customer.length !== 0) ||
        (Array.isArray(input.brand) && input.brand.length !== 0) ||
        (Array.isArray(input.salesContract) &&
          input.salesContract.length !== 0))
    ) {
      console.log(
        ' non  Adm group with general filters brand customer product salescontract '
      );

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
      const brandArr = input.product_id
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      let where: any = {};
      let extrafilter: any = {};
      let filter: any = {};
      let filter_records: any = {};

      if (
        customerArr.length > 0 &&
        salesContractArr.length > 0 &&
        productArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
      } else if (
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
      } else if (
        customerArr.length > 0 &&
        salesContractArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },

            brand: { $in: brandArr },
          },
        ];
        filter = {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },

            brand: { $in: brandArr },
          },
        ];
      } else if (
        productArr.length > 0 &&
        salesContractArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },

          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
      } else if (
        productArr.length > 0 &&
        customerArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },

            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },
          customer: { $in: customerArr },

          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },

            product: { $in: productArr },
            brand: { $in: brandArr },
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
      } else if (brandArr.length > 0) {
        where = {
          brand: { $in: brandArr },
        };
        filter = {
          brand: { $in: brandArr },
        };
        filter_records = {
          brand: { $in: brandArr },
        };
      } else if (brandArr.length > 0 && salesContractArr.length > 0) {
        where.$and = [
          {
            salesContract: { $in: salesContractArr },
            brandArr: { $in: brandArr },
          },
        ];
        filter = {
          salesContract: { $in: salesContractArr },
          brandArr: { $in: brandArr },
        };
        filter_records.$and = [
          {
            salesContract: { $in: salesContractArr },
            brandArr: { $in: brandArr },
          },
        ];
      } else if (brandArr.length > 0 && customerArr.length > 0) {
        where.$and = [
          {
            customer: { $in: customerArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          customer: { $in: customerArr },
          brandArr: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            brandArr: { $in: brandArr },
          },
        ];
      } else if (brandArr.length > 0 && productArr.length > 0) {
        where.$and = [
          {
            brand: { $in: brandArr },
            product: { $in: productArr },
          },
        ];
        filter = {
          brand: { $in: brandArr },
          product: { $in: productArr },
        };
        filter_records.$and = [
          {
            brand: { $in: brandArr },
            product: { $in: productArr },
          },
        ];
      }
      if (input.dcNumber) {
        extrafilter = input.dcNumber;
      }

      if (input.gpNumber) {
        extrafilter.gpNumber = input.gpNumber;
      }
      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }
      if (input.royality_approval) {
        extrafilter.royality_approval = stringToBoolean(
          input.royality_approval
        );
      }

      const customerAggregationPipelineRecords: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            adm_ship: false,
            isDeleted: false,
          },
        },
        {
          $match: filter_records,
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $group: {
            _id: '$customer._id',
            // Group by customer
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            customer: {
              $first: '$customer',
            },
          },
        },
        {
          $project: {
            customer_id: {
              $arrayElemAt: ['$customer._id', 0],
            },
            customer_name: {
              $arrayElemAt: ['$customer.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];

      const customerAggregationPipeline: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            adm_ship: false,
            isDeleted: false,
          },
        },
        {
          $match: where,
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $group: {
            _id: '$customer._id',
            // Group by customer
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            customer: {
              $first: '$customer',
            },
          },
        },
        {
          $project: {
            customer_id: {
              $arrayElemAt: ['$customer._id', 0],
            },
            customer_name: {
              $arrayElemAt: ['$customer.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];
      const customergroup = await ShipmentDtlModel.aggregate(
        customerAggregationPipeline
      );

      const total_records = await ShipmentDtlModel.aggregate(
        customerAggregationPipelineRecords
      );

      const totalShipmentSum = total_records.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_records.reduce(
        (sum, item) => sum + item.qty,
        0
      );
      const totalAmountSum = total_records.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        customer_groupby: customergroup,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.productgroup !== '' &&
      input.customergroup == '' &&
      input.brandgroup == '' &&
      input.salesContractgroup == '' &&
      ((Array.isArray(input.product_id) && input.product_id.length !== 0) ||
        (Array.isArray(input.customer) && input.customer.length !== 0) ||
        (Array.isArray(input.brand) && input.brand.length !== 0) ||
        (Array.isArray(input.salesContract) &&
          input.salesContract.length !== 0))
    ) {
      console.log(
        ' non Adm  group with general filters brand customer product salescontract'
      );

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
      const brandArr = input.product_id
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      let where: any = {};
      let extrafilter: any = {};
      let filter: any = {};
      let filter_records: any = {};

      if (
        customerArr.length > 0 &&
        salesContractArr.length > 0 &&
        productArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
      } else if (
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
      } else if (
        customerArr.length > 0 &&
        salesContractArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },

            brand: { $in: brandArr },
          },
        ];
        filter = {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },

            brand: { $in: brandArr },
          },
        ];
      } else if (
        productArr.length > 0 &&
        salesContractArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },

          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
      } else if (
        productArr.length > 0 &&
        customerArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },

            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },
          customer: { $in: customerArr },

          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },

            product: { $in: productArr },
            brand: { $in: brandArr },
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
      } else if (brandArr.length > 0) {
        where = {
          brand: { $in: brandArr },
        };
        filter = {
          brand: { $in: brandArr },
        };
        filter_records = {
          brand: { $in: brandArr },
        };
      } else if (brandArr.length > 0 && salesContractArr.length > 0) {
        where.$and = [
          {
            salesContract: { $in: salesContractArr },
            brandArr: { $in: brandArr },
          },
        ];
        filter = {
          salesContract: { $in: salesContractArr },
          brandArr: { $in: brandArr },
        };
        filter_records.$and = [
          {
            salesContract: { $in: salesContractArr },
            brandArr: { $in: brandArr },
          },
        ];
      } else if (brandArr.length > 0 && customerArr.length > 0) {
        where.$and = [
          {
            customer: { $in: customerArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          customer: { $in: customerArr },
          brandArr: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            brandArr: { $in: brandArr },
          },
        ];
      } else if (brandArr.length > 0 && productArr.length > 0) {
        where.$and = [
          {
            brand: { $in: brandArr },
            product: { $in: productArr },
          },
        ];
        filter = {
          brand: { $in: brandArr },
          product: { $in: productArr },
        };
        filter_records.$and = [
          {
            brand: { $in: brandArr },
            product: { $in: productArr },
          },
        ];
      }
      if (input.dcNumber) {
        extrafilter = input.dcNumber;
      }

      if (input.gpNumber) {
        extrafilter.gpNumber = input.gpNumber;
      }
      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }
      if (input.royality_approval) {
        extrafilter.royality_approval = stringToBoolean(
          input.royality_approval
        );
      }
      const productAggregationPipelineRecords: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            adm_ship: false,
            isDeleted: false,
          },
        },
        { $match: where },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
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
          $group: {
            _id: '$product._id',
            // Group by customer
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            product: {
              $first: '$product',
            },
          },
        },
        {
          $project: {
            product_id: {
              $arrayElemAt: ['$product._id', 0],
            },
            product_name: {
              $arrayElemAt: ['$product.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];
      const productAggregationPipeline: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            adm_ship: false,
            isDeleted: false,
          },
        },
        { $match: where },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
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
          $group: {
            _id: '$product._id',
            // Group by customer
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            product: {
              $first: '$product',
            },
          },
        },
        {
          $project: {
            product_id: {
              $arrayElemAt: ['$product._id', 0],
            },
            product_name: {
              $arrayElemAt: ['$product.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const productgroup = await ShipmentDtlModel.aggregate(
        productAggregationPipeline
      );
      const total_records = await ShipmentDtlModel.aggregate(
        productAggregationPipelineRecords
      );

      const totalShipmentSum = total_records.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_records.reduce(
        (sum, item) => sum + item.qty,
        0
      );
      const totalAmountSum = total_records.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        product_groupby: productgroup,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.brandgroup !== '' &&
      input.customergroup == '' &&
      input.productgroup == '' &&
      input.salesContractgroup == '' &&
      ((Array.isArray(input.product_id) && input.product_id.length !== 0) ||
        (Array.isArray(input.customer) && input.customer.length !== 0) ||
        (Array.isArray(input.brand) && input.brand.length !== 0) ||
        (Array.isArray(input.salesContract) &&
          input.salesContract.length !== 0))
    ) {
      console.log(
        ' non  Adm group with general filters brand customer product salescontract'
      );

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
      const brandArr = input.brand
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      console.log(brandArr);
      let where: any = {};
      let extrafilter: any = {};
      let filter: any = {};
      let filter_records: any = {};

      if (
        customerArr.length > 0 &&
        salesContractArr.length > 0 &&
        productArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
      } else if (
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
      } else if (
        customerArr.length > 0 &&
        salesContractArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },

            brand: { $in: brandArr },
          },
        ];
      } else if (
        productArr.length > 0 &&
        salesContractArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },

          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
      } else if (
        productArr.length > 0 &&
        customerArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },

            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },
          customer: { $in: customerArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },

            product: { $in: productArr },
            brand: { $in: brandArr },
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
      } else if (brandArr.length > 0 && salesContractArr.length > 0) {
        where.$and = [
          {
            salesContract: { $in: salesContractArr },
            brandArr: { $in: brandArr },
          },
        ];
        filter = {
          salesContract: { $in: salesContractArr },
          brandArr: { $in: brandArr },
        };
        filter_records.$and = [
          {
            salesContract: { $in: salesContractArr },
            brandArr: { $in: brandArr },
          },
        ];
      } else if (brandArr.length > 0 && customerArr.length > 0) {
        console.log(brandArr, customerArr, 'nn');
        where.$and = [
          {
            customer: { $in: customerArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          customer: { $in: customerArr },
          brandArr: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            brandArr: { $in: brandArr },
          },
        ];
      } else if (brandArr.length > 0 && productArr.length > 0) {
        where.$and = [
          {
            brand: { $in: brandArr },
            product: { $in: productArr },
          },
        ];
        filter = {
          brand: { $in: brandArr },
          product: { $in: productArr },
        };
        filter_records.$and = [
          {
            brand: { $in: brandArr },
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
      } else if (brandArr.length > 0) {
        where = {
          brand: { $in: brandArr },
        };
        filter = {
          brand: { $in: brandArr },
        };
        filter_records = {
          brand: { $in: brandArr },
        };
      }

      if (input.dcNumber) {
        extrafilter = input.dcNumber;
      }

      if (input.gpNumber) {
        extrafilter.gpNumber = input.gpNumber;
      }
      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }
      if (input.royality_approval) {
        extrafilter.royality_approval = stringToBoolean(
          input.royality_approval
        );
      }
      console.log(where);
      const brandAggregationPipelineRecords: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            adm_ship: false,
            isDeleted: false,
          },
        },
        { $match: filter_records },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $group: {
            _id: '$brand._id',
            // Group by customer
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            brand: {
              $first: '$brand',
            },
          },
        },
        {
          $project: {
            brand_id: {
              $arrayElemAt: ['$brand._id', 0],
            },
            brand_name: {
              $arrayElemAt: ['$brand.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];
      const brandAggregationPipeline: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            adm_ship: false,
            isDeleted: false,
          },
        },
        { $match: where },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $group: {
            _id: '$brand._id',

            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            brand: {
              $first: '$brand',
            },
          },
        },
        {
          $project: {
            brand_id: {
              $arrayElemAt: ['$brand._id', 0],
            },
            brand_name: {
              $arrayElemAt: ['$brand.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const brandgroup = await ShipmentDtlModel.aggregate(
        brandAggregationPipeline
      );
      const total_records = await ShipmentDtlModel.aggregate(
        brandAggregationPipelineRecords
      );

      const totalShipmentSum = total_records.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_records.reduce(
        (sum, item) => sum + item.qty,
        0
      );
      const totalAmountSum = total_records.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        brand_groupby: brandgroup,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    }
  }
};


export const findShipmentDtlsByDate = async (input: ShipmentReportSchema )=> {
const {
      brand,
      customer,
      product_id,
      fromDate,
      toDate,
      pageno = 1,
      perPage = 10,
      order_status,
      royality_approval,
      Adm,
      nonAdm,
      gpNumber,
      dcNumber,
      transactiongroup,
      brandgroup,
      customergroup,
      productgroup,
    } = input;

    // pagination contants

    const limit = perPage;
    const skipCount = (pageno - 1) * limit;

 //  Group condition setter
    const groupId: any = {};
    const shouldGroup = productgroup || brandgroup || customergroup;

     if (productgroup) groupId.product = '$products';
    if (brandgroup) groupId.brand = '$brands';
    if (customergroup) groupId.customer = '$customers';

const matchStage: any = { isDeleted: false };
 const scMatchStage: any = { isDeleted: false };
 const shmatchStage: any = { isDeleted: false };

    if (fromDate && toDate) {
      matchStage.gpDate = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    }


  if (Array.isArray(product_id) && product_id.length > 0) {
    matchStage.product = {
    $in: product_id.map(id => new mongoose.Types.ObjectId(id))
  };
}

if (Array.isArray(brand) && brand.length > 0) {
    matchStage.brand = {
        $in: brand.map(id => new mongoose.Types.ObjectId(id))
      };
}

if (Array.isArray(customer) && customer.length > 0) {
    matchStage.customer = {
        $in: customer.map(id => new mongoose.Types.ObjectId(id))
      };
}

if (Adm) matchStage['adm_ship'] = true;
if (nonAdm) matchStage['adm_ship'] = false;
if (gpNumber) shmatchStage['shipments.gpNumber'] = gpNumber;
if (dcNumber) shmatchStage['shipments.dcNumber'] = dcNumber;
     
 
   if (royality_approval == 'true')
        scMatchStage['salesContract.royality_approval'] = true;
      if (royality_approval == 'false')
        scMatchStage['salesContract.royality_approval'] = false;

      // const scMatchStage2: any = { isDeleted: false };
      if (order_status == 'confirmed')
        scMatchStage['salesContract.order_status'] = 'confirmed';
      if (order_status == 'forecast')
        scMatchStage['salesContract.order_status'] = 'forecast';
     


  const basePipeline:any[] =[
  {
    $match: matchStage
  },
  {
    $lookup: {
      from: "shipments",
      localField: "shipment",
      foreignField: "_id",
      as: "shipments"
    }
  },
  {
    $unwind: {
      path: "$shipments",
      preserveNullAndEmptyArrays: false
    }
  },
  {
    $match: shmatchStage
  },
  {
    $lookup: {
      from: "salescontracts",
      localField: "salesContract",
      foreignField: "_id",
      as: "salesContract"
    }
  },
  {
    $unwind: {
      path: "$salesContract",
      preserveNullAndEmptyArrays: true
    }
  },
  {
    $match: scMatchStage
  },
  {
    $lookup: {
      from: "customers",
      localField: "customer",
      foreignField: "_id",
      as: "customers"
    }
  },
  {
    $unwind: {
      path: "$customers",
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
      from: "brands",
      localField: "brand",
      foreignField: "_id",
      as: "brands"
    }
  },
  {
    $unwind: {
      path: "$brands",
      preserveNullAndEmptyArrays: false
    }
  },
  {
    $project: {
      tran: "$salesContract.tran",
      contract: "$salesContract.contract",
      gpNumber: "$shipments.gpNumber",
      gpDate: "$shipments.gpDate",
      dcNumber: "$shipments.dcNumber",
      dcDate: "$shipments.dcDate",
      customers: "$customers.name",
      products: "$products.name",
      brands: "$brands.name",
      supplierCode: "$supplierCode",
      qty: "$qty",
      amount: "$amount",
      uom: "$uom"
    }
  },
  {
    $sort: { gpDate: -1 } // Sort by gpDate in descending order
  }
]

  const basePipelineSummary:any[] =  [
  {
    $match:matchStage
  },
  {
    $lookup: {
      from: "shipments",
      localField: "shipment",
      foreignField: "_id",
      as: "shipments"
    }
  },
  {
    $unwind: {
      path: "$shipments",
      preserveNullAndEmptyArrays: false
    }
  },
  {
    $match: shmatchStage
  },
  {
    $lookup: {
      from: "salescontracts",
      localField: "salesContract",
      foreignField: "_id",
      as: "salesContract"
    }
  },
  {
    $unwind: {
      path: "$salesContract",
      preserveNullAndEmptyArrays: true
    }
  },
  {
    $match: scMatchStage
  },
  {
    $lookup: {
      from: "customers",
      localField: "customer",
      foreignField: "_id",
      as: "customers"
    }
  },
  {
    $unwind: {
      path: "$customers",
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
      from: "brands",
      localField: "brand",
      foreignField: "_id",
      as: "brands"
    }
  },
  {
    $unwind: {
      path: "$brands",
      preserveNullAndEmptyArrays: false
    }
  },
  {
    $project: {
      tran: "$salesContract.tran",
      contract: "$salesContract.contract",
      gpNumber: "$shipments.gpNumber",
      gpDate: "$shipments.gpDate",
      dcNumber: "$shipments.dcNumber",
      dcDate: "$shipments.dcDate",
      customers: "$customers.name",
      products: "$products.name",
      brands: "$brands.name",
      supplierCode: "$supplierCode",
      qty: "$qty",
      amount: "$amount",
      uom: "$uom"
    }
  },
  {
    $sort: { gpDate: -1 } // Sort by gpDate in descending order
  }
]
const sortStage = { $sort: { totalShipmentQty: -1 } };

const groupStage = {
  $group: {
  _id: groupId,
  products:{$first:"$products"},
  brands:{$first:"$brands"},
  customers:{$first:"$customers"},
  totalShipments:{$sum:1},
  totalShipmentQty:{$sum:"$qty"},
  totalShipmentAmount:{$sum:"$amount"},
 
}
}
const groupStageSummary = {
   $group:{
  _id: '',
  // products:{$first:"$products"},
  // brands:{$first:"$brands"},
  // customers:{$first:"$customers"},
totalShipments:{$sum:1},
totalShipmentQty:{$sum:"$qty"},
totalShipmentAmount:{$sum:"$amount"},
 
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
              totalShipments:{$sum:1},
              totalShipmentQty:{$sum:"$qty"},
              totalShipmentAmount:{$sum:"$amount"},
 
            },
          },
        ];
  // Executing the pipelines in parallel
      const [shipmentdtl, totalResult, summaryResult] = await Promise.all([
        ShipmentDtlModel.aggregate(dataPipeline, { allowDiskUse: true }),
        ShipmentDtlModel.aggregate(countPipeline, { allowDiskUse: true }),
        ShipmentDtlModel.aggregate(summaryPipeline, { allowDiskUse: true }),
      ]);

 const totalRecords = totalResult?.[0]?.totalRecords || 0;
      const summary = summaryResult?.[0] || {
      
        totalShipments: 0,
        totalShipmentQty: 0,
        totalShipmentAmount: 0,
      };
      return {
        shipmentdtl,
        summary,
        pagination: {
          page: pageno,
          perPage,
          totalRecords,
          totalPages: Math.ceil(totalRecords / perPage),
        },
      };

  }



export const ShipmrntdtlsforPrint = async (input: ShipmentPrintSchema) => {
  if (
    Array.isArray(input.product_id) &&
    input.product_id.length == 0 &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0 &&
    input.customergroup == '' &&
    input.productgroup == '' &&
    input.salesContractgroup == '' &&
    input.dcNumber == '' &&
    input.gpNumber == '' &&
    input.brandgroup == '' &&
    input.transactiongroup == '' &&
    input.royality_approval == '' &&
    input.Adm == '' &&
    input.nonAdm == ''
  ) {
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
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
        },
      },

      { $sort: { qty: -1 } },
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
    input.productgroup !== '' &&
    input.royality_approval !== '' &&
    input.Adm == '' &&
    input.nonAdm == ''
  ) {
    console.log('product group  royality_approval');
    function stringToBoolean(str: string | undefined) {
      return str?.toLowerCase() === 'true';
    }

    const royality_approval = stringToBoolean(input.royality_approval);

    const productAggregationPipelineRecord = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          shipment: true,
          royality_approval: royality_approval,
        },
      },
      {
        $lookup: {
          from: 'shipmentdtls',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'shipment',
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
        $group: {
          _id: '$product._id',
          totalShipment: {
            $sum: 1,
          },
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
          product: {
            $first: '$product',
          },
        },
      },
      {
        $project: {
          product_id: {
            $arrayElemAt: ['$product._id', 0],
          },
          product_name: {
            $arrayElemAt: ['$product.name', 0],
          },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
    ];

    const total_records = await SalesContractDtlModel.aggregate(
      productAggregationPipelineRecord
    );

    const totalShipmentSum = total_records.reduce(
      (sum, item) => sum + item.totalShipment,
      0
    );

    const totalQtySum = total_records.reduce((sum, item) => sum + item.qty, 0);
    const totalAmountSum = total_records.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const result = {
      Group: total_records,
      total_records: total_records.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalShipmentSum: totalShipmentSum,
    };
    return result;
  } else if (
    input.brandgroup !== '' &&
    input.royality_approval !== '' &&
    input.Adm == '' &&
    input.nonAdm == ''
  ) {
    console.log('brand group royality_approval');

    function stringToBoolean(str: string | undefined) {
      return str?.toLowerCase() === 'true';
    }

    const royality_approval = stringToBoolean(input.royality_approval);

    const brandAggregationPipelineRecord: any = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          shipment: true,
          royality_approval: royality_approval,
        },
      },
      {
        $lookup: {
          from: 'shipmentdtls',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'shipment',
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
        },
      },
      {
        $group: {
          _id: '$brand._id',
          totalShipment: {
            $sum: 1,
          },
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
          brand: {
            $first: '$brand',
          },
        },
      },
      {
        $project: {
          product_id: {
            $arrayElemAt: ['$product._id', 0],
          },
          brand_name: {
            $arrayElemAt: ['$brand.name', 0],
          },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
    ];

    const total_records = await SalesContractDtlModel.aggregate(
      brandAggregationPipelineRecord
    );

    const totalShipmentSum = total_records.reduce(
      (sum, item) => sum + item.totalShipment,
      0
    );

    const totalQtySum = total_records.reduce((sum, item) => sum + item.qty, 0);
    const totalAmountSum = total_records.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const result = {
      Group: total_records,
      total_records: total_records.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalShipmentSum: totalShipmentSum,
    };
    return result;
  } else if (
    input.customergroup !== '' &&
    input.royality_approval !== '' &&
    input.Adm == '' &&
    input.nonAdm == ''
  ) {
    console.log('customer group royality_approval');

    function stringToBoolean(str: string | undefined) {
      return str?.toLowerCase() === 'true';
    }

    const royality_approval = stringToBoolean(input.royality_approval);
    const customerAggregationPipelineRecords = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          shipment: true,
          royality_approval: royality_approval,
        },
      },
      {
        $lookup: {
          from: 'shipmentdtls',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'shipment',
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $group: {
          _id: '$customer._id',
          totalShipment: {
            $sum: 1,
          },
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
          customer: {
            $first: '$customer',
          },
        },
      },
      {
        $project: {
          customer_id: {
            $arrayElemAt: ['$customer._id', 0],
          },
          customer_name: {
            $arrayElemAt: ['$customer.name', 0],
          },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
    ];

    const total_records = await SalesContractDtlModel.aggregate(
      customerAggregationPipelineRecords
    );

    const totalShipmentSum = total_records.reduce(
      (sum, item) => sum + item.totalShipment,
      0
    );

    const totalQtySum = total_records.reduce((sum, item) => sum + item.qty, 0);
    const totalAmountSum = total_records.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const result = {
      Group: total_records,
      total_records: total_records.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalShipmentSum: totalShipmentSum,
    };
    return result;
  } else if (
    input.customergroup !== '' &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.product_id) &&
    input.product_id.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    input.dcNumber == '' &&
    input.gpNumber == '' &&
    input.royality_approval == '' &&
    input.Adm == '' &&
    input.nonAdm == ''
  ) {
    console.log('customer general group');

    const customerAggregationPipelineRecords: any = [
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
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $unwind: {
          path: '$customer',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          name: '$customer.name',
          qty: 1,
          amount: 1,
          createdAt: 1,
          customer_id: '$customer._id',
        },
      },
      {
        $group: {
          _id: '$customer_id',
          name: {
            $first: '$name',
          },
          createdAt: {
            $first: '$createdAt',
          },
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalShipment: {
            $sum: 1,
          },
        },
      },
      {
        $match: {
          totalQty: {
            $gt: 0,
          },
          totalAmount: {
            $gt: 0,
          },
        },
      },
      {
        $project: {
          name: 1,
          createdAt: 1,
          totalQty: 1,
          totalAmount: 1,
          totalShipment: 1,
        },
      },

      { $sort: { totalQty: -1, totalAmount: -1 } },
    ];

    const total_record = await ShipmentDtlModel.aggregate(
      customerAggregationPipelineRecords != undefined
        ? customerAggregationPipelineRecords
        : undefined
    );
    const totalQtySum = total_record.reduce(
      (sum, item) => sum + item.totalQty,
      0
    );
    const totalAmountSum = total_record.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const totalShipmentSum = total_record.reduce(
      (sum, item) => sum + item.totalshipments,
      0
    );

    const result = {
      Group: total_record,
      total_records: total_record.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalShipmentSum: totalShipmentSum,
    };
    return result;
  } else if (
    input.productgroup !== '' &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.product_id) &&
    input.product_id.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0 &&
    input.dcNumber == '' &&
    input.gpNumber == '' &&
    input.royality_approval == '' &&
    input.Adm == '' &&
    input.nonAdm == ''
  ) {
    console.log('product general group ');

    const productAggregationPipelineRecord: any = [
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
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product',
        },
      },
      {
        $unwind: {
          path: '$product',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          name: '$product.name',
          qty: 1,
          amount: 1,
          createdAt: 1,
          product_id: '$product._id',
        },
      },
      {
        $group: {
          _id: '$product_id',
          name: {
            $first: '$name',
          },
          createdAt: {
            $first: '$createdAt',
          },
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalShipment: {
            $sum: 1,
          },
        },
      },
      {
        $match: {
          totalQty: {
            $gt: 0,
          },
          totalAmount: {
            $gt: 0,
          },
        },
      },
      {
        $project: {
          name: 1,
          createdAt: 1,
          totalQty: 1,
          totalAmount: 1,
          totalShipment: 1,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ];

    const total_record = await ShipmentDtlModel.aggregate(
      productAggregationPipelineRecord != undefined
        ? productAggregationPipelineRecord
        : undefined
    );
    const totalShipmentSum = total_record.reduce(
      (sum, item) => sum + item.totalShipment,
      0
    );
    const totalQtySum = total_record.reduce(
      (sum, item) => sum + item.totalQty,
      0
    );
    const totalAmountSum = total_record.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );

    const result = {
      Group: total_record,
      total_records: total_record.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalShipmentSum: totalShipmentSum,
    };
    return result;
  } else if (
    input.transactiongroup !== '' &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.product_id) &&
    input.product_id.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0 &&
    input.dcNumber == '' &&
    input.gpNumber == '' &&
    input.royality_approval == '' &&
    input.Adm == '' &&
    input.nonAdm == ''
  ) {
    console.log('transaction   ==== group by');

    const productArr = input.product_id
      ? input.product_id.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const transaction_groupbyRecords = await ShipmentDtlModel.aggregate(
      // [
      // {
      //   '$match': {
      //     'product': { $in: productArr },
      //   }
      // }, {
      //   '$lookup': {
      //     'from': 'salescontracts',
      //     'localField': 'salesContract',
      //     'foreignField': '_id',
      //     'as': 'salesContractData'
      //   }
      // }, {
      //   '$lookup': {
      //     'from': 'products',
      //     'localField': 'product',
      //     'foreignField': '_id',
      //     'as': 'productData'
      //   }
      // }, {
      //   '$unwind': {
      //     'path': '$salesContractData',
      //     'preserveNullAndEmptyArrays': true
      //   }
      // }, {
      //   '$unwind': {
      //     'path': '$productData',
      //     'preserveNullAndEmptyArrays': true
      //   }
      // }, {
      //   '$project': {
      //     '_id': 0,
      //     'shipmentId': '$_id',
      //     'ShipmentNo': '$shipment_no',
      //     'gatePassDate': '$gpDate',
      //     'productName': '$productData.name',
      //     'product': '$product',
      //     'shipment': '$shipment',
      //     'shipmentQty': '$qty',
      //     'salesContractPO': '$salesContractData.po',
      //     'salesContractNo': '$salesContractData.contract'
      //   }
      // }, {
      //   '$unionWith': {
      //     'coll': 'productiondtls',
      //     'pipeline': [
      //       {
      //         '$match': {
      //           'product': { $in: productArr },
      //         }
      //       }, {
      //         '$lookup': {
      //           'from': 'productions',
      //           'localField': 'production',
      //           'foreignField': '_id',
      //           'as': 'productionMaster'
      //         }
      //       }, {
      //         '$lookup': {
      //           'from': 'products',
      //           'localField': 'product',
      //           'foreignField': '_id',
      //           'as': 'productData'
      //         }
      //       }, {
      //         '$unwind': {
      //           'path': '$productionMaster'
      //         }
      //       }, {
      //         '$unwind': {
      //           'path': '$productData'
      //         }
      //       }
      //     ]
      //   }
      // }, {
      //   '$project': {
      //     'shipmentId': 1,
      //     'ShipmentNo': 1,
      //     'date': {
      //       '$ifNull': [
      //         '$gatePassDate', '$date'
      //       ]
      //     },
      //     'productName': 1,
      //     'product': 1,
      //     'shipment': 1,
      //     'shipmentQty': 1,
      //     'salesContractPO': 1,
      //     'ProductionTransactionNo': '$productionMaster.tran',
      //     'productNameTransaction': '$productData.name',
      //     'productionQty': '$qty',
      //     'productionLot': '$lot'
      //   }
      // }, {
      //   '$sort': {
      //     'date': -1
      //   }
      // }
      // ]
      [
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
          $match: {
            product: { $in: productArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productData',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customerData',
          },
        },
        {
          $unwind: {
            path: '$customerData',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: '$salesContractData',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: '$productData',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 0,
            shipmentId: '$_id',
            ShipmentNo: '$shipment_no',
            date: '$gpDate',
            productName: '$productData.name',
            customerName: '$customerData.name',
            product: '$product',
            shipmentQty: '$qty',
            productionQty: { $literal: 0 }, // Default to 0 for shipment records
            salesContractPO: '$salesContractData.po',
            ProductionTransactionNo: { $literal: null },
            type: 'shipment',
          },
        },
        {
          $unionWith: {
            coll: 'productiondtls',
            pipeline: [
              {
                $match: {
                  product: { $in: productArr },
                },
              },
              {
                $lookup: {
                  from: 'productions',
                  localField: 'production',
                  foreignField: '_id',
                  as: 'productionMaster',
                },
              },
              {
                $lookup: {
                  from: 'products',
                  localField: 'product',
                  foreignField: '_id',
                  as: 'productData',
                },
              },
              {
                $unwind: {
                  path: '$productionMaster',
                },
              },
              {
                $unwind: {
                  path: '$productData',
                },
              },
              {
                $project: {
                  _id: 0,
                  shipmentId: '$_id',
                  ShipmentNo: '$lot',
                  date: '$date',
                  productName: '$productData.name',
                  // customerName:'$customerData.name',
                  product: '$product',
                  shipmentQty: { $literal: 0 }, // Default to 0 for production records
                  productionQty: '$qty',
                  salesContractPO: { $literal: null },
                  ProductionTransactionNo: '$productionMaster.tran',
                  type: 'production',
                },
              },
            ],
          },
        },
        {
          $addFields: {
            date: {
              $ifNull: ['$date', '$gpDate'],
            },
          },
        },
        {
          $sort: {
            date: -1, // Sort by date in ascending order for proper ledger calculation
          },
        },
        {
          $setWindowFields: {
            // 'partitionBy': '$product',
            sortBy: { date: 1 },
            output: {
              balance: {
                $sum: {
                  $subtract: ['$productionQty', '$shipmentQty'],
                },
                window: {
                  documents: ['unbounded', 'current'],
                },
              },
            },
          },
        },
        // {
        //   '$sort': {
        //     'date': -1
        //   }
        // },
        {
          $project: {
            shipmentId: 1,
            ShipmentNo: 1,
            date: 1,
            customerName: 1,
            productName: 1,
            product: 1,
            shipmentQty: 1,
            productionQty: 1,
            balance: 1,
            salesContractPO: 1,
            ProductionTransactionNo: 1,
          },
        },
      ]
    );
    const transaction_groupby = await ShipmentDtlModel.aggregate(
      // [
      // {
      //   '$match': {
      //     'product': { $in: productArr },
      //   }
      // }, {
      //   '$lookup': {
      //     'from': 'salescontracts',
      //     'localField': 'salesContract',
      //     'foreignField': '_id',
      //     'as': 'salesContractData'
      //   }
      // }, {
      //   '$lookup': {
      //     'from': 'products',
      //     'localField': 'product',
      //     'foreignField': '_id',
      //     'as': 'productData'
      //   }
      // }, {
      //   '$unwind': {
      //     'path': '$salesContractData',
      //     'preserveNullAndEmptyArrays': true
      //   }
      // }, {
      //   '$unwind': {
      //     'path': '$productData',
      //     'preserveNullAndEmptyArrays': true
      //   }
      // }, {
      //   '$project': {
      //     '_id': 0,
      //     'shipmentId': '$_id',
      //     'ShipmentNo': '$shipment_no',
      //     'gatePassDate': '$gpDate',
      //     'productName': '$productData.name',
      //     'product': '$product',
      //     'shipment': '$shipment',
      //     'shipmentQty': '$qty',
      //     'salesContractPO': '$salesContractData.po',
      //     'salesContractNo': '$salesContractData.contract'
      //   }
      // }, {
      //   '$unionWith': {
      //     'coll': 'productiondtls',
      //     'pipeline': [
      //       {
      //         '$match': {
      //           'product': { $in: productArr },
      //         }
      //       }, {
      //         '$lookup': {
      //           'from': 'productions',
      //           'localField': 'production',
      //           'foreignField': '_id',
      //           'as': 'productionMaster'
      //         }
      //       }, {
      //         '$lookup': {
      //           'from': 'products',
      //           'localField': 'product',
      //           'foreignField': '_id',
      //           'as': 'productData'
      //         }
      //       }, {
      //         '$unwind': {
      //           'path': '$productionMaster'
      //         }
      //       }, {
      //         '$unwind': {
      //           'path': '$productData'
      //         }
      //       }
      //     ]
      //   }
      // }, {
      //   '$project': {
      //     'shipmentId': 1,
      //     'ShipmentNo': 1,
      //     'date': {
      //       '$ifNull': [
      //         '$gatePassDate', '$date'
      //       ]
      //     },
      //     'productName': 1,
      //     'product': 1,
      //     'shipment': 1,
      //     'shipmentQty': 1,
      //     'salesContractPO': 1,
      //     'ProductionTransactionNo': '$productionMaster.tran',
      //     'productNameTransaction': '$productData.name',
      //     'productionQty': '$qty',
      //     'productionLot': '$lot'
      //   }
      // }, {
      //   '$sort': {
      //     'date': -1
      //   }
      // }
      // ]
      [
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
          $match: {
            product: { $in: productArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productData',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customerData',
          },
        },
        {
          $unwind: {
            path: '$customerData',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: '$salesContractData',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: '$productData',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 0,
            shipmentId: '$_id',
            ShipmentNo: '$shipment_no',
            date: '$gpDate',
            productName: '$productData.name',
            customerName: '$customerData.name',
            product: '$product',
            shipmentQty: '$qty',
            productionQty: { $literal: 0 }, // Default to 0 for shipment records
            salesContractPO: '$salesContractData.po',
            ProductionTransactionNo: { $literal: null },
            type: 'shipment',
          },
        },
        {
          $unionWith: {
            coll: 'productiondtls',
            pipeline: [
              {
                $match: {
                  product: { $in: productArr },
                },
              },
              {
                $lookup: {
                  from: 'productions',
                  localField: 'production',
                  foreignField: '_id',
                  as: 'productionMaster',
                },
              },
              {
                $lookup: {
                  from: 'products',
                  localField: 'product',
                  foreignField: '_id',
                  as: 'productData',
                },
              },
              {
                $unwind: {
                  path: '$productionMaster',
                },
              },
              {
                $unwind: {
                  path: '$productData',
                },
              },
              {
                $project: {
                  _id: 0,
                  shipmentId: '$_id',
                  ShipmentNo: '$lot',
                  date: '$date',
                  productName: '$productData.name',
                  // customerName:'$customerData.name',
                  product: '$product',
                  shipmentQty: { $literal: 0 }, // Default to 0 for production records
                  productionQty: '$qty',
                  salesContractPO: { $literal: null },
                  ProductionTransactionNo: '$productionMaster.tran',
                  type: 'production',
                },
              },
            ],
          },
        },
        {
          $addFields: {
            date: {
              $ifNull: ['$date', '$gpDate'],
            },
          },
        },
        {
          $sort: {
            date: -1, // Sort by date in ascending order for proper ledger calculation
          },
        },
        {
          $setWindowFields: {
            // 'partitionBy': '$product',
            sortBy: { date: 1 },
            output: {
              balance: {
                $sum: {
                  $subtract: ['$productionQty', '$shipmentQty'],
                },
                window: {
                  documents: ['unbounded', 'current'],
                },
              },
            },
          },
        },
        // {
        //   '$sort': {
        //     'date': -1
        //   }
        // },
        {
          $project: {
            shipmentId: 1,
            ShipmentNo: 1,
            date: 1,
            customerName: 1,
            productName: 1,
            product: 1,
            shipmentQty: 1,
            productionQty: 1,
            balance: 1,
            salesContractPO: 1,
            ProductionTransactionNo: 1,
          },
        },
      ]
    );
    const totalShipmentSum = transaction_groupbyRecords.reduce(
      (sum, item) => sum + item.shipmentQty,
      0
    );
    const totalProductionSum = transaction_groupbyRecords.reduce(
      (sum, item) => sum + item.productionQty,
      0
    );
    const totalBalanceSum = transaction_groupbyRecords.reduce(
      (sum, item) => sum + item.balance,
      0
    );

    const result = {
      transaction_groupby: transaction_groupby,
      totalShipmentSum: totalShipmentSum,
      totalProductionSum: totalProductionSum,
      totalBalanceSum: totalBalanceSum,
      total_records: transaction_groupbyRecords.length,
    };
    return result;
  } else if (
    input.brandgroup !== '' &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.product_id) &&
    input.product_id.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0 &&
    input.dcNumber == '' &&
    input.gpNumber == '' &&
    input.royality_approval == '' &&
    input.Adm == '' &&
    input.nonAdm == ''
  ) {
    console.log('brand general group');

    const brandAggregationPipelineRecord: any = [
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
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
        },
      },
      {
        $unwind: {
          path: '$brand',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          name: '$brand.name',
          qty: 1,
          amount: 1,
          createdAt: 1,
          brand_id: '$brand._id',
        },
      },
      {
        $group: {
          _id: '$brand_id',
          name: {
            $first: '$name',
          },
          createdAt: {
            $first: '$createdAt',
          },
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalShipment: {
            $sum: 1,
          },
        },
      },
      {
        $match: {
          totalQty: {
            $gt: 0,
          },
          totalAmount: {
            $gt: 0,
          },
        },
      },
      {
        $project: {
          name: 1,
          createdAt: 1,
          totalQty: 1,
          totalAmount: 1,
          totalShipment: 1,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ];

    const total_record = await ShipmentDtlModel.aggregate(
      brandAggregationPipelineRecord
        ? brandAggregationPipelineRecord
        : undefined
    );
    const totalQtySum = total_record.reduce(
      (sum, item) => sum + item.totalQty,
      0
    );
    const totalAmountSum = total_record.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const totalShipmentSum = total_record.reduce(
      (sum, item) => sum + item.totalShipment,
      0
    );
    const result = {
      Group: total_record,
      total_records: total_record.length,
      totalQtySum: totalQtySum,
      totalShipmentSum: totalShipmentSum,
      totalAmountSum: totalAmountSum,
    };

    return result;
  } else if (
    input.salesContractgroup !== '' &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.product_id) &&
    input.product_id.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0 &&
    input.dcNumber == '' &&
    input.gpNumber == '' &&
    input.royality_approval == '' &&
    input.Adm == '' &&
    input.nonAdm == ''
  ) {
    console.log('salescontract general group');

    const salecontractAggregationPipelineRecord: any = [
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

      { $sort: { totalQty: -1 } },
    ];

    const total_record = await SalesContractModel.aggregate(
      salecontractAggregationPipelineRecord != undefined
        ? salecontractAggregationPipelineRecord
        : undefined
    );
    const result = {
      Group: total_record,
      total_records: total_record.length,
    };
    return result;
  } else if (
    input.royality_approval !== '' &&
    Array.isArray(input.product_id) &&
    input.product_id.length == 0 &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0 &&
    input.customergroup == '' &&
    input.productgroup == '' &&
    input.salesContractgroup == '' &&
    input.dcNumber == '' &&
    input.gpNumber == '' &&
    input.brandgroup == '' &&
    input.transactiongroup == '' &&
    input.Adm == '' &&
    input.nonAdm == ''
  ) {
    console.log('royality approval filter ');

    function stringToBoolean(str: string | undefined) {
      return str?.toLowerCase() === 'true';
    }
    const royality_approval = stringToBoolean(input.royality_approval);

    const salegroupby = await SalesContractDtlModel.aggregate([
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          royality_approval: royality_approval,
          shipment: true,
        },
      },
      {
        $lookup: {
          from: 'shipmentdtls',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'shipmentDetail',
        },
      },
      {
        $lookup: {
          from: 'shipments',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'shipment',
        },
      },
      {
        $group: {
          _id: 'null',
          qty: {
            $sum: '$qty',
          },
          rate: {
            $sum: '$rate',
          },
          amount: {
            $sum: '$amount',
          },
        },
      },
    ]);

    const sale = await SalesContractDtlModel.aggregate([
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          royality_approval: royality_approval,
          shipment: true,
        },
      },
      {
        $lookup: {
          from: 'shipmentdtls',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'shipmentDetail',
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salecontractDetail',
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
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $lookup: {
          from: 'shipments',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'shipment',
        },
      },
      { $sort: { id: -1 } },
    ]);

    // Extract totals from the result
    const totalQty = salegroupby.map((item: any) => item.qty);
    const totalRate = salegroupby.map((item: any) => item.rate);
    const totalAmount = salegroupby.map((item: any) => item.amount);

    let result = {
      shipmentdtl: sale,
      paginated_record: sale.length,
      total_records: sale.length,
      totalQty: totalQty,
      totalRate: totalRate,
      totalAmount: totalAmount,
    };
    return result;
  } else if (
    (input.customergroup == '' &&
      input.productgroup == '' &&
      input.brandgroup == '' &&
      input.transactiongroup == '' &&
      input.salesContractgroup == '' &&
      input.royality_approval == '' &&
      input.Adm == '' &&
      input.nonAdm == '') ||
    input.dcNumber !== '' ||
    (input.gpNumber !== '' &&
      ((Array.isArray(input.product_id) && input.product_id.length !== 0) ||
        (Array.isArray(input.customer) && input.customer.length !== 0) ||
        (Array.isArray(input.brand) && input.brand.length !== 0) ||
        (Array.isArray(input.salesContract) &&
          input.salesContract.length !== 0)))
  ) {
    console.log('main qury ');

    const salesContractArr = input.salesContract
      ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const customerArr = input.customer
      ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const productArr = input.product_id
      ? input.product_id.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const brandArr = input.brand
      ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    let where: any = {};
    let extrafilter: any = {};
    let filter: any = {};
    let filter_records: any = {};

    if (
      customerArr.length > 0 &&
      salesContractArr.length > 0 &&
      productArr.length > 0 &&
      brandArr.length > 0
    ) {
      where.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          product: { $in: productArr },
          brand: { $in: brandArr },
        },
      ];
      filter = {
        product: { $in: productArr },
        customer: { $in: customerArr },
        salesContract: { $in: salesContractArr },
        brand: { $in: brandArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          product: { $in: productArr },
          brand: { $in: brandArr },
        },
      ];
    } else if (
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
    } else if (
      customerArr.length > 0 &&
      salesContractArr.length > 0 &&
      brandArr.length > 0
    ) {
      where.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },

          brand: { $in: brandArr },
        },
      ];
      filter = {
        customer: { $in: customerArr },
        salesContract: { $in: salesContractArr },
        brand: { $in: brandArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },

          brand: { $in: brandArr },
        },
      ];
    } else if (
      productArr.length > 0 &&
      salesContractArr.length > 0 &&
      brandArr.length > 0
    ) {
      where.$and = [
        {
          salesContract: { $in: salesContractArr },
          product: { $in: productArr },
          brand: { $in: brandArr },
        },
      ];
      filter = {
        product: { $in: productArr },

        salesContract: { $in: salesContractArr },
        brand: { $in: brandArr },
      };
      filter_records.$and = [
        {
          salesContract: { $in: salesContractArr },
          product: { $in: productArr },
          brand: { $in: brandArr },
        },
      ];
    } else if (
      productArr.length > 0 &&
      customerArr.length > 0 &&
      brandArr.length > 0
    ) {
      where.$and = [
        {
          customer: { $in: customerArr },

          product: { $in: productArr },
          brand: { $in: brandArr },
        },
      ];
      filter = {
        product: { $in: productArr },
        customer: { $in: customerArr },

        brand: { $in: brandArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },

          product: { $in: productArr },
          brand: { $in: brandArr },
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
    } else if (brandArr.length > 0) {
      where = {
        brand: { $in: brandArr },
      };
      filter = {
        brand: { $in: brandArr },
      };
      filter_records = {
        brand: { $in: brandArr },
      };
    } else if (brandArr.length > 0 && salesContractArr.length > 0) {
      where.$and = [
        {
          salesContract: { $in: salesContractArr },
          brandArr: { $in: brandArr },
        },
      ];
      filter = {
        salesContract: { $in: salesContractArr },
        brandArr: { $in: brandArr },
      };
      filter_records.$and = [
        {
          salesContract: { $in: salesContractArr },
          brandArr: { $in: brandArr },
        },
      ];
    } else if (brandArr.length > 0 && customerArr.length > 0) {
      where.$and = [
        {
          customer: { $in: customerArr },
          brand: { $in: brandArr },
        },
      ];
      filter = {
        customer: { $in: customerArr },
        brandArr: { $in: brandArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          brandArr: { $in: brandArr },
        },
      ];
    } else if (brandArr.length > 0 && productArr.length > 0) {
      where.$and = [
        {
          brand: { $in: brandArr },
          product: { $in: productArr },
        },
      ];
      filter = {
        brand: { $in: brandArr },
        product: { $in: productArr },
      };
      filter_records.$and = [
        {
          brand: { $in: brandArr },
          product: { $in: productArr },
        },
      ];
    }
    if (input.dcNumber) {
      extrafilter.dcNumber = input.dcNumber;
    }

    if (input.gpNumber) {
      extrafilter.gpNumber = input.gpNumber;
    }
    function stringToBoolean(str: string | undefined) {
      return str?.toLowerCase() === 'true';
    }
    if (input.royality_approval) {
      extrafilter.royality_approval = stringToBoolean(input.royality_approval);
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
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractsDetails',
          pipeline: [
            {
              $project: {
                contract: 1,
                royality_approval: 1,
              },
            },
          ],
        },
      },

      {
        $project: {
          contract: { $first: '$salesContractsDetails.contract' },
          royality_approval: {
            $first: '$salesContractsDetails.royality_approval',
          },
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
      { $match: filter },
      {
        $lookup: {
          from: 'shipments',
          localField: 'shipment',
          foreignField: '_id',
          as: 'shipment',
        },
      },

      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractsDetails',
          pipeline: [
            {
              $project: {
                contract: 1,
                royality_approval: 1,
              },
            },
          ],
        },
      },

      {
        $project: {
          qty: 1,
          rate: 1,
          amount: 1,
          contract: { $first: '$salesContractsDetails.contract' },
          royality_approval: {
            $first: '$salesContractsDetails.royality_approval',
          },
          gpNumber: {
            $first: '$shipment.gpNumber',
          },
          dcNumber: {
            $first: '$shipment.dcNumber',
          },
          gpDate: 1,
        },
      },
      { $match: extrafilter },
      {
        $group: {
          _id: 'null',
          qty: {
            $sum: '$qty',
          },
          rate: {
            $sum: '$rate',
          },
          amount: {
            $sum: '$amount',
          },
        },
      },
      { $sort: { qty: -1 } },
    ]);

    // Extract totals from the result
    const totalQty = shipmentgroupby.map((item: any) => item.qty);
    const totalRate = shipmentgroupby.map((item: any) => item.rate);
    const totalAmount = shipmentgroupby.map((item: any) => item.amount);

    const ship = await ShipmentDtlModel.aggregate([
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
          pipeline: [
            {
              $project: {
                contract: 1,
                royality_approval: 1,
              },
            },
          ],
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
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brandDetails',
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
          supplierCode: 1,
          shipment: 1,
          shipment_no: 1,
          product: 1,
          createdAt: 1,
          customerDetails: 1,
          brandDetails: 1,
          shipmentDetails: 1,
          contract: { $first: '$salesContractsDetails.contract' },
          royality_approval: {
            $first: '$salesContractsDetails.royality_approval',
          },
          // salesContractsDetails: 1,
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

      { $sort: { id: 1 } },
    ]);
    let result = {
      shipmentdtl: ship,
      paginated_record: ship.length,
      total_records: total_record.length,
      totalQty: totalQty,
      totalRate: totalRate,
      totalAmount: totalAmount,
    };
    return result;
  } else if (
    input.customergroup !== '' &&
    input.royality_approval == '' &&
    Array.isArray(input.customer) &&
    input.customer.length !== 0 &&
    Array.isArray(input.product_id) &&
    input.product_id.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    input.Adm == '' &&
    input.nonAdm == ''
  ) {
    console.log('customer group customer ');

    const customerArr = input.customer
      ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];

    const customergroup = await ShipmentDtlModel.aggregate([
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          customer: { $in: customerArr },
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractData',
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $group: {
          _id: '$customer._id',
          // Group by customer
          totalShipment: {
            $sum: 1,
          },
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
          customer: {
            $first: '$customer',
          },
        },
      },
      {
        $project: {
          customer_id: {
            $arrayElemAt: ['$customer._id', 0],
          },
          customer_name: {
            $arrayElemAt: ['$customer.name', 0],
          },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
      { $sort: { qty: -1 } },
    ]);
    const totalShipmentSum = customergroup.reduce(
      (sum, item) => sum + item.totalShipment,
      0
    );

    const totalQtySum = customergroup.reduce((sum, item) => sum + item.qty, 0);
    const totalAmountSum = customergroup.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const result = {
      Group: customergroup,
      total_records: customergroup.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalShipmentSum: totalShipmentSum,
    };
    return result;
  } else if (
    input.productgroup !== '' &&
    input.royality_approval == '' &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.product_id) &&
    input.product_id.length !== 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    input.Adm == '' &&
    input.nonAdm == ''
  ) {
    console.log('product group product ');

    const productArr = input.product_id
      ? input.product_id.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];

    const productgroup = await ShipmentDtlModel.aggregate([
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          product: { $in: productArr },
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractData',
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
        $group: {
          _id: '$product._id',
          // Group by customer
          totalShipment: {
            $sum: 1,
          },
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
          product: {
            $first: '$product',
          },
        },
      },
      {
        $project: {
          product_id: {
            $arrayElemAt: ['$product._id', 0],
          },
          product_name: {
            $arrayElemAt: ['$product.name', 0],
          },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
      { $sort: { qty: -1 } },
    ]);
    const totalShipmentSum = productgroup.reduce(
      (sum, item) => sum + item.totalShipment,
      0
    );

    const totalQtySum = productgroup.reduce((sum, item) => sum + item.qty, 0);
    const totalAmountSum = productgroup.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const result = {
      Group: productgroup,
      total_records: productgroup.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalShipmentSum: totalShipmentSum,
    };
    return result;
  } else if (
    input.brandgroup !== '' &&
    input.royality_approval == '' &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.product_id) &&
    input.product_id.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length !== 0 &&
    input.Adm == '' &&
    input.nonAdm == ''
  ) {
    console.log('brand group brand ');

    const brandArr = input.brand
      ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];

    // const brandgroup = await ShipmentDtlModel.aggregate([
    //   {
    //     $match: {
    //       gpDate: {
    //         $gte: new Date(input.fromDate),
    //         $lte: new Date(input.toDate),
    //       },
    //       isDeleted: false,
    //       brand: { $in: brandArr },
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'salescontracts',
    //       localField: 'salesContract',
    //       foreignField: '_id',
    //       as: 'salesContractData',
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'brands',
    //       localField: 'brand',
    //       foreignField: '_id',
    //       as: 'brand',
    //     },
    //   },
    //   {
    //     $group: {
    //       _id: '$brand._id',
    //       // Group by customer
    //       totalShipment: {
    //         $sum: 1,
    //       },
    //       qty: {
    //         $sum: '$qty',
    //       },
    //       amount: {
    //         $sum: '$amount',
    //       },
    //       brand: {
    //         $first: '$brand',
    //       },
    //     },
    //   },
    //   {
    //     $project: {
    //       brand_id: {
    //         $arrayElemAt: ['$brand._id', 0],
    //       },
    //       brand_name: {
    //         $arrayElemAt: ['$brand.name', 0],
    //       },
    //       qty: 1,
    //       amount: 1,
    //       totalShipment: 1,
    //     },
    //   },
    //   { $sort: { qty: -1 } },
    // ]);

    const brandAggregationPipelineRecord: any = [
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          brand: { $in: brandArr },
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractData',
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
        },
      },
      {
        $group: {
          _id: '$brand._id',
          totalShipment: { $sum: 1 },
          qty: { $sum: '$qty' },
          amount: { $sum: '$amount' },
          brand: { $first: '$brand' },
        },
      },
      {
        $project: {
          brand_id: '$brand._id',
          brand_name: '$brand.name',
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
      { $sort: { qty: -1 } },
    ];
    const total_record = await ShipmentDtlModel.aggregate(
      brandAggregationPipelineRecord
        ? brandAggregationPipelineRecord
        : undefined
    );
    const totalShipmentSum = total_record.reduce(
      (sum, item) => sum + item.totalShipment,
      0
    );

    const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
    const totalAmountSum = total_record.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const result = {
      Group: total_record,
      total_records: total_record.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalShipmentSum: totalShipmentSum,
    };
    return result;
  } else if (
    input.customergroup !== '' &&
    input.royality_approval == '' &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.product_id) &&
    input.product_id.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length !== 0 &&
    input.Adm == '' &&
    input.nonAdm == ''
  ) {
    console.log('customer group brand ');

    const brandArr = input.brand
      ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];

    const brandCustomerAggregationPipelineRecord: any = [
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          brand: { $in: brandArr },
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractData',
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $group: {
          _id: { brandId: '$brand._id', customerId: '$customer._id' },
          totalShipment: { $sum: 1 },
          qty: { $sum: '$qty' },
          amount: { $sum: '$amount' },
          brand: { $first: '$brand' },
          customer: { $first: '$customer' },
        },
      },
      {
        $project: {
          brand_id: { $arrayElemAt: ['$brand._id', 0] },
          brand_name: { $arrayElemAt: ['$brand.name', 0] },
          customer_id: { $arrayElemAt: ['$customer._id', 0] },
          customer_name: { $arrayElemAt: ['$customer.name', 0] },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
      { $sort: { qty: -1 } },
    ];
    const total_record = await ShipmentDtlModel.aggregate(
      brandCustomerAggregationPipelineRecord
        ? brandCustomerAggregationPipelineRecord
        : undefined
    );

    const totalShipmentSum = total_record.reduce(
      (sum, item) => sum + item.totalShipment,
      0
    );

    const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
    const totalAmountSum = total_record.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const result = {
      Group: total_record,
      total_records: total_record.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalShipmentSum: totalShipmentSum,
    };
    return result;
  } else if (
    input.customergroup !== '' &&
    input.royality_approval == '' &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.product_id) &&
    input.product_id.length !== 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    input.Adm == '' &&
    input.nonAdm == ''
  ) {
    console.log('customer group product ');

    const productArr = input.customer
      ? input.product_id.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];

    const productCustomerAggregationPipelineRecord: any = [
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          product: { $in: productArr },
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractData',
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
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
        $group: {
          _id: { customerId: '$customer._id', productId: '$product._id' },
          totalShipment: { $sum: 1 },
          qty: { $sum: '$qty' },
          amount: { $sum: '$amount' },
          customer: { $first: '$customer' },
          product: { $first: '$product' },
        },
      },
      {
        $project: {
          customer_id: { $arrayElemAt: ['$customer._id', 0] },
          customer_name: { $arrayElemAt: ['$customer.name', 0] },
          product_name: { $arrayElemAt: ['$product.name', 0] },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
      { $sort: { qty: -1 } },
    ];
    const total_record = await ShipmentDtlModel.aggregate(
      productCustomerAggregationPipelineRecord
        ? productCustomerAggregationPipelineRecord
        : undefined
    );

    const totalShipmentSum = total_record.reduce(
      (sum, item) => sum + item.totalShipment,
      0
    );

    const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
    const totalAmountSum = total_record.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const result = {
      Group: total_record,
      total_records: total_record.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalShipmentSum: totalShipmentSum,
    };
    return result;
  } else if (
    input.productgroup !== '' &&
    input.royality_approval == '' &&
    Array.isArray(input.customer) &&
    input.customer.length !== 0 &&
    Array.isArray(input.product_id) &&
    input.product_id.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    input.Adm == '' &&
    input.nonAdm == ''
  ) {
    console.log('product group customer ');

    const customerArr = input.product_id
      ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];

    const productCustomerAggregationPipelineRecord: any = [
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          customer: { $in: customerArr },
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractData',
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
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $group: {
          _id: { productId: '$product._id', customerId: '$customer._id' },
          totalShipment: { $sum: 1 },
          qty: { $sum: '$qty' },
          amount: { $sum: '$amount' },
          product: { $first: '$product' },
          customer: { $first: '$customer' },
        },
      },
      {
        $project: {
          product_id: { $arrayElemAt: ['$product._id', 0] },
          product_name: { $arrayElemAt: ['$product.name', 0] },
          customer_id: { $arrayElemAt: ['$customer._id', 0] },
          customer_name: { $arrayElemAt: ['$customer.name', 0] },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
      { $sort: { qty: -1 } },
    ];
    const total_record = await ShipmentDtlModel.aggregate(
      productCustomerAggregationPipelineRecord
        ? productCustomerAggregationPipelineRecord
        : undefined
    );
    const totalShipmentSum = total_record.reduce(
      (sum, item) => sum + item.totalShipment,
      0
    );

    const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
    const totalAmountSum = total_record.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const result = {
      Group: total_record,
      total_records: total_record.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalShipmentSum: totalShipmentSum,
    };
    return result;
  } else if (
    input.productgroup !== '' &&
    input.royality_approval == '' &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.product_id) &&
    input.product_id.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length !== 0 &&
    input.Adm == '' &&
    input.nonAdm == ''
  ) {
    console.log('product group brand ');

    const brandArr = input.product_id
      ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];

    //   {
    //     $match: {
    //       gpDate: {
    //         $gte: new Date(input.fromDate),
    //         $lte: new Date(input.toDate),
    //       },
    //       isDeleted: false,
    //       brand: { $in: brandArr },
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'salescontracts',
    //       localField: 'salesContract',
    //       foreignField: '_id',
    //       as: 'salesContractData',
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'products',
    //       localField: 'product',
    //       foreignField: '_id',
    //       as: 'product',
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'brands',
    //       localField: 'brand',
    //       foreignField: '_id',
    //       as: 'brand',
    //     },
    //   },
    //   {
    //     $group: {
    //       _id: '$product._id',
    //       // Group by customer
    //       totalShipment: {
    //         $sum: 1,
    //       },
    //       qty: {
    //         $sum: '$qty',
    //       },
    //       amount: {
    //         $sum: '$amount',
    //       },
    //       product: {
    //         $first: '$product',
    //       },
    //       brand: {
    //         $first: '$brand',
    //       },
    //     },
    //   },
    //   {
    //     $project: {
    //       product_id: {
    //         $arrayElemAt: ['$product._id', 0],
    //       },
    //       product_name: {
    //         $arrayElemAt: ['$product.name', 0],
    //       },
    //       brand_name: {
    //         $arrayElemAt: ['$brand.name', 0],
    //       },
    //       qty: 1,
    //       amount: 1,
    //       totalShipment: 1,
    //     },
    //   },
    //   { $sort: { qty: -1 } },
    // ]);

    const productBrandAggregationPipelineRecord: any = [
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          brand: { $in: brandArr },
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractData',
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
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
        },
      },
      {
        $group: {
          _id: { productId: '$product._id', brandId: '$brand._id' }, // Group by both product and brand
          totalShipment: { $sum: 1 },
          qty: { $sum: '$qty' },
          amount: { $sum: '$amount' },
          product: { $first: '$product' },
          brand: { $first: '$brand' },
        },
      },
      {
        $project: {
          product_id: { $arrayElemAt: ['$product._id', 0] },
          product_name: { $arrayElemAt: ['$product.name', 0] },
          brand_id: { $arrayElemAt: ['$brand._id', 0] },
          brand_name: { $arrayElemAt: ['$brand.name', 0] },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
      { $sort: { qty: -1 } },
    ];
    const total_record = await ShipmentDtlModel.aggregate(
      productBrandAggregationPipelineRecord
        ? productBrandAggregationPipelineRecord
        : undefined
    );
    const totalShipmentSum = total_record.reduce(
      (sum, item) => sum + item.totalShipment,
      0
    );

    const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
    const totalAmountSum = total_record.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const result = {
      Group: total_record,
      total_records: total_record.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalShipmentSum: totalShipmentSum,
    };
    return result;
  } else if (
    input.brandgroup !== '' &&
    input.royality_approval == '' &&
    Array.isArray(input.customer) &&
    input.customer.length !== 0 &&
    Array.isArray(input.product_id) &&
    input.product_id.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    input.Adm == '' &&
    input.nonAdm == ''
  ) {
    console.log('brand group customer ');

    const customerArr = input.customer
      ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];

    //   {
    //     $match: {
    //       gpDate: {
    //         $gte: new Date(input.fromDate),
    //         $lte: new Date(input.toDate),
    //       },
    //       isDeleted: false,
    //       customer: { $in: customerArr },
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'salescontracts',
    //       localField: 'salesContract',
    //       foreignField: '_id',
    //       as: 'salesContractData',
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'brands',
    //       localField: 'brand',
    //       foreignField: '_id',
    //       as: 'brand',
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'customers',
    //       localField: 'customer',
    //       foreignField: '_id',
    //       as: 'customer',
    //     },
    //   },
    //   {
    //     $group: {
    //       _id: '$brand._id',
    //       // Group by customer
    //       totalShipment: {
    //         $sum: 1,
    //       },
    //       qty: {
    //         $sum: '$qty',
    //       },
    //       amount: {
    //         $sum: '$amount',
    //       },
    //       brand: {
    //         $first: '$brand',
    //       },
    //       customer: {
    //         $first: '$customer',
    //       },
    //     },
    //   },
    //   {
    //     $project: {
    //       brand_id: {
    //         $arrayElemAt: ['$brand._id', 0],
    //       },
    //       brand_name: {
    //         $arrayElemAt: ['$brand.name', 0],
    //       },
    //       customer_name: {
    //         $arrayElemAt: ['$customer.name', 0],
    //       },
    //       qty: 1,
    //       amount: 1,
    //       totalShipment: 1,
    //     },
    //   },
    //   { $sort: { qty: -1 } },
    // ]);
    const brandgroup = await ShipmentDtlModel.aggregate([
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          customer: { $in: customerArr },
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractData',
          pipeline: [
            {
              $match: {
                isDeleted: false,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $group: {
          _id: { brandId: '$brand._id', customerId: '$customer._id' },
          totalShipment: { $sum: 1 },
          qty: { $sum: '$qty' },
          amount: { $sum: '$amount' },
          brand: { $first: '$brand' },
          customer: { $first: '$customer' },
        },
      },
      {
        $project: {
          brand_id: { $arrayElemAt: ['$brand._id', 0] },
          brand_name: { $arrayElemAt: ['$brand.name', 0] },
          customer_id: { $arrayElemAt: ['$customer._id', 0] },
          customer_name: { $arrayElemAt: ['$customer.name', 0] },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
      { $sort: { qty: -1 } },
    ]);

    const totalShipmentSum = brandgroup.reduce(
      (sum, item) => sum + item.totalShipment,
      0
    );

    const totalQtySum = brandgroup.reduce((sum, item) => sum + item.qty, 0);
    const totalAmountSum = brandgroup.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const result = {
      Group: brandgroup,
      total_records: brandgroup.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalShipmentSum: totalShipmentSum,
    };
    return result;
  } else if (
    input.brandgroup !== '' &&
    input.royality_approval == '' &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.product_id) &&
    input.product_id.length !== 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    input.Adm == '' &&
    input.nonAdm == ''
  ) {
    console.log('brand group product ');

    const productArr = input.brand
      ? input.product_id.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];

    const productBrandAggregationPipelineRecord: any = [
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          product: { $in: productArr },
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractData',
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
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
        $group: {
          _id: { brandId: '$brand._id', productId: '$product._id' }, // Group by both brand and product
          totalShipment: { $sum: 1 },
          qty: { $sum: '$qty' },
          amount: { $sum: '$amount' },
          brand: { $first: '$brand' },
          product: { $first: '$product' },
        },
      },
      {
        $project: {
          brand_id: { $arrayElemAt: ['$brand._id', 0] },
          brand_name: { $arrayElemAt: ['$brand.name', 0] },
          product_id: { $arrayElemAt: ['$product._id', 0] },
          product_name: { $arrayElemAt: ['$product.name', 0] },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
      { $sort: { qty: -1 } },
    ];

    const total_record = await ShipmentDtlModel.aggregate(
      productBrandAggregationPipelineRecord
        ? productBrandAggregationPipelineRecord
        : undefined
    );

    const totalShipmentSum = total_record.reduce(
      (sum, item) => sum + item.totalShipment,
      0
    );

    const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
    const totalAmountSum = total_record.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const result = {
      Group: total_record,
      total_records: total_record.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalShipmentSum: totalShipmentSum,
    };
    return result;
  } else if (
    (input.customergroup !== '' &&
      input.productgroup == '' &&
      input.brandgroup == '' &&
      input.salesContractgroup == '' &&
      input.Adm == '' &&
      input.nonAdm == '' &&
      input.royality_approval !== '') ||
    (Array.isArray(input.product_id) && input.product_id.length !== 0) ||
    (Array.isArray(input.customer) && input.customer.length !== 0) ||
    (Array.isArray(input.brand) && input.brand.length !== 0) ||
    (Array.isArray(input.salesContract) && input.salesContract.length !== 0)
  ) {
    console.log(
      'group with general filters brand customer product salescontract'
    );

    const salesContractArr = input.salesContract
      ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const customerArr = input.customer
      ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const productArr = input.product_id
      ? input.product_id.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const brandArr = input.product_id
      ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    let where: any = {};
    let extrafilter: any = {};
    let filter: any = {};
    let filter_records: any = {};

    if (
      customerArr.length > 0 &&
      salesContractArr.length > 0 &&
      productArr.length > 0 &&
      brandArr.length > 0
    ) {
      where.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          product: { $in: productArr },
          brand: { $in: brandArr },
        },
      ];
      filter = {
        product: { $in: productArr },
        customer: { $in: customerArr },
        salesContract: { $in: salesContractArr },
        brand: { $in: brandArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          product: { $in: productArr },
          brand: { $in: brandArr },
        },
      ];
    } else if (
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
    } else if (
      customerArr.length > 0 &&
      salesContractArr.length > 0 &&
      brandArr.length > 0
    ) {
      where.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },

          brand: { $in: brandArr },
        },
      ];
      filter = {
        customer: { $in: customerArr },
        salesContract: { $in: salesContractArr },
        brand: { $in: brandArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },

          brand: { $in: brandArr },
        },
      ];
    } else if (
      productArr.length > 0 &&
      salesContractArr.length > 0 &&
      brandArr.length > 0
    ) {
      where.$and = [
        {
          salesContract: { $in: salesContractArr },
          product: { $in: productArr },
          brand: { $in: brandArr },
        },
      ];
      filter = {
        product: { $in: productArr },

        salesContract: { $in: salesContractArr },
        brand: { $in: brandArr },
      };
      filter_records.$and = [
        {
          salesContract: { $in: salesContractArr },
          product: { $in: productArr },
          brand: { $in: brandArr },
        },
      ];
    } else if (
      productArr.length > 0 &&
      customerArr.length > 0 &&
      brandArr.length > 0
    ) {
      where.$and = [
        {
          customer: { $in: customerArr },

          product: { $in: productArr },
          brand: { $in: brandArr },
        },
      ];
      filter = {
        product: { $in: productArr },
        customer: { $in: customerArr },

        brand: { $in: brandArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },

          product: { $in: productArr },
          brand: { $in: brandArr },
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
    } else if (brandArr.length > 0) {
      where = {
        brand: { $in: brandArr },
      };
      filter = {
        brand: { $in: brandArr },
      };
      filter_records = {
        brand: { $in: brandArr },
      };
    } else if (brandArr.length > 0 && salesContractArr.length > 0) {
      where.$and = [
        {
          salesContract: { $in: salesContractArr },
          brandArr: { $in: brandArr },
        },
      ];
      filter = {
        salesContract: { $in: salesContractArr },
        brandArr: { $in: brandArr },
      };
      filter_records.$and = [
        {
          salesContract: { $in: salesContractArr },
          brandArr: { $in: brandArr },
        },
      ];
    } else if (brandArr.length > 0 && customerArr.length > 0) {
      where.$and = [
        {
          customer: { $in: customerArr },
          brand: { $in: brandArr },
        },
      ];
      filter = {
        customer: { $in: customerArr },
        brandArr: { $in: brandArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          brandArr: { $in: brandArr },
        },
      ];
    } else if (brandArr.length > 0 && productArr.length > 0) {
      where.$and = [
        {
          brand: { $in: brandArr },
          product: { $in: productArr },
        },
      ];
      filter = {
        brand: { $in: brandArr },
        product: { $in: productArr },
      };
      filter_records.$and = [
        {
          brand: { $in: brandArr },
          product: { $in: productArr },
        },
      ];
    }
    if (input.dcNumber) {
      extrafilter = input.dcNumber;
    }

    if (input.gpNumber) {
      extrafilter.gpNumber = input.gpNumber;
    }
    function stringToBoolean(str: string | undefined) {
      return str?.toLowerCase() === 'true';
    }
    if (input.royality_approval) {
      extrafilter.royality_approval = stringToBoolean(input.royality_approval);
    }

    const customerAggregationPipelineRecords: any = [
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
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractData',
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
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
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
        },
      },
      {
        $group: {
          _id: '$customer._id',
          // Group by customer
          totalShipment: {
            $sum: 1,
          },
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
          customer: {
            $first: '$customer',
          },
          product: {
            $first: '$product',
          },
          brand: {
            $first: '$brand',
          },
        },
      },
      {
        $project: {
          customer_id: {
            $arrayElemAt: ['$customer._id', 0],
          },
          customer_name: {
            $arrayElemAt: ['$customer.name', 0],
          },
          product_name: {
            $arrayElemAt: ['$product.name', 0],
          },
          brand_name: {
            $arrayElemAt: ['$brand.name', 0],
          },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
    ];

    const total_records = await ShipmentDtlModel.aggregate(
      customerAggregationPipelineRecords
    );

    const totalShipmentSum = total_records.reduce(
      (sum, item) => sum + item.totalShipment,
      0
    );

    const totalQtySum = total_records.reduce((sum, item) => sum + item.qty, 0);
    const totalAmountSum = total_records.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const result = {
      Group: total_records,
      total_records: total_records.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalShipmentSum: totalShipmentSum,
    };
    return result;
  } else if (
    (input.productgroup !== '' &&
      input.customergroup == '' &&
      input.brandgroup == '' &&
      input.salesContractgroup == '' &&
      input.Adm == '' &&
      input.nonAdm == '' &&
      input.royality_approval !== '') ||
    (Array.isArray(input.product_id) && input.product_id.length !== 0) ||
    (Array.isArray(input.customer) && input.customer.length !== 0) ||
    (Array.isArray(input.brand) && input.brand.length !== 0) ||
    (Array.isArray(input.salesContract) && input.salesContract.length !== 0)
  ) {
    console.log(
      'group with general filters brand customer product salescontract'
    );

    const salesContractArr = input.salesContract
      ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const customerArr = input.customer
      ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const productArr = input.product_id
      ? input.product_id.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const brandArr = input.product_id
      ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    let where: any = {};
    let extrafilter: any = {};
    let filter: any = {};
    let filter_records: any = {};

    if (
      customerArr.length > 0 &&
      salesContractArr.length > 0 &&
      productArr.length > 0 &&
      brandArr.length > 0
    ) {
      where.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          product: { $in: productArr },
          brand: { $in: brandArr },
        },
      ];
      filter = {
        product: { $in: productArr },
        customer: { $in: customerArr },
        salesContract: { $in: salesContractArr },
        brand: { $in: brandArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          product: { $in: productArr },
          brand: { $in: brandArr },
        },
      ];
    } else if (
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
    } else if (
      customerArr.length > 0 &&
      salesContractArr.length > 0 &&
      brandArr.length > 0
    ) {
      where.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },

          brand: { $in: brandArr },
        },
      ];
      filter = {
        customer: { $in: customerArr },
        salesContract: { $in: salesContractArr },
        brand: { $in: brandArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },

          brand: { $in: brandArr },
        },
      ];
    } else if (
      productArr.length > 0 &&
      salesContractArr.length > 0 &&
      brandArr.length > 0
    ) {
      where.$and = [
        {
          salesContract: { $in: salesContractArr },
          product: { $in: productArr },
          brand: { $in: brandArr },
        },
      ];
      filter = {
        product: { $in: productArr },

        salesContract: { $in: salesContractArr },
        brand: { $in: brandArr },
      };
      filter_records.$and = [
        {
          salesContract: { $in: salesContractArr },
          product: { $in: productArr },
          brand: { $in: brandArr },
        },
      ];
    } else if (
      productArr.length > 0 &&
      customerArr.length > 0 &&
      brandArr.length > 0
    ) {
      where.$and = [
        {
          customer: { $in: customerArr },

          product: { $in: productArr },
          brand: { $in: brandArr },
        },
      ];
      filter = {
        product: { $in: productArr },
        customer: { $in: customerArr },

        brand: { $in: brandArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },

          product: { $in: productArr },
          brand: { $in: brandArr },
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
    } else if (brandArr.length > 0) {
      where = {
        brand: { $in: brandArr },
      };
      filter = {
        brand: { $in: brandArr },
      };
      filter_records = {
        brand: { $in: brandArr },
      };
    } else if (brandArr.length > 0 && salesContractArr.length > 0) {
      where.$and = [
        {
          salesContract: { $in: salesContractArr },
          brandArr: { $in: brandArr },
        },
      ];
      filter = {
        salesContract: { $in: salesContractArr },
        brandArr: { $in: brandArr },
      };
      filter_records.$and = [
        {
          salesContract: { $in: salesContractArr },
          brandArr: { $in: brandArr },
        },
      ];
    } else if (brandArr.length > 0 && customerArr.length > 0) {
      where.$and = [
        {
          customer: { $in: customerArr },
          brand: { $in: brandArr },
        },
      ];
      filter = {
        customer: { $in: customerArr },
        brandArr: { $in: brandArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          brandArr: { $in: brandArr },
        },
      ];
    } else if (brandArr.length > 0 && productArr.length > 0) {
      where.$and = [
        {
          brand: { $in: brandArr },
          product: { $in: productArr },
        },
      ];
      filter = {
        brand: { $in: brandArr },
        product: { $in: productArr },
      };
      filter_records.$and = [
        {
          brand: { $in: brandArr },
          product: { $in: productArr },
        },
      ];
    }
    if (input.dcNumber) {
      extrafilter = input.dcNumber;
    }

    if (input.gpNumber) {
      extrafilter.gpNumber = input.gpNumber;
    }
    function stringToBoolean(str: string | undefined) {
      return str?.toLowerCase() === 'true';
    }
    if (input.royality_approval) {
      extrafilter.royality_approval = stringToBoolean(input.royality_approval);
    }
    const productAggregationPipelineRecords: any = [
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
        },
      },
      { $match: where },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractData',
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
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
        },
      },
      {
        $group: {
          _id: '$product._id',
          // Group by customer
          totalShipment: {
            $sum: 1,
          },
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
          product: {
            $first: '$product',
          },
          customer: {
            $first: '$customer',
          },
          brand: {
            $first: '$brand',
          },
        },
      },
      {
        $project: {
          product_id: {
            $arrayElemAt: ['$product._id', 0],
          },
          product_name: {
            $arrayElemAt: ['$product.name', 0],
          },
          customer_name: {
            $arrayElemAt: ['$customer.name', 0],
          },
          brand_name: {
            $arrayElemAt: ['$brand.name', 0],
          },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
    ];

    const total_records = await ShipmentDtlModel.aggregate(
      productAggregationPipelineRecords
    );

    const totalShipmentSum = total_records.reduce(
      (sum, item) => sum + item.totalShipment,
      0
    );

    const totalQtySum = total_records.reduce((sum, item) => sum + item.qty, 0);
    const totalAmountSum = total_records.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const result = {
      Group: total_records,
      total_records: total_records.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalShipmentSum: totalShipmentSum,
    };
    return result;
  } else if (
    (input.brandgroup !== '' &&
      input.customergroup == '' &&
      input.productgroup == '' &&
      input.salesContractgroup == '' &&
      input.Adm == '' &&
      input.nonAdm == '' &&
      input.royality_approval !== '') ||
    (Array.isArray(input.product_id) && input.product_id.length !== 0) ||
    (Array.isArray(input.customer) && input.customer.length !== 0) ||
    (Array.isArray(input.brand) && input.brand.length !== 0) ||
    (Array.isArray(input.salesContract) && input.salesContract.length !== 0)
  ) {
    console.log(
      'group with general filters brand customer product salescontract'
    );

    const salesContractArr = input.salesContract
      ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const customerArr = input.customer
      ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const productArr = input.product_id
      ? input.product_id.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const brandArr = input.product_id
      ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    let where: any = {};
    let extrafilter: any = {};
    let filter: any = {};
    let filter_records: any = {};

    if (
      customerArr.length > 0 &&
      salesContractArr.length > 0 &&
      productArr.length > 0 &&
      brandArr.length > 0
    ) {
      where.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          product: { $in: productArr },
          brand: { $in: brandArr },
        },
      ];
      filter = {
        product: { $in: productArr },
        customer: { $in: customerArr },
        salesContract: { $in: salesContractArr },
        brand: { $in: brandArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          product: { $in: productArr },
          brand: { $in: brandArr },
        },
      ];
    } else if (
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
    } else if (
      customerArr.length > 0 &&
      salesContractArr.length > 0 &&
      brandArr.length > 0
    ) {
      where.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },

          brand: { $in: brandArr },
        },
      ];
      filter = {
        customer: { $in: customerArr },
        salesContract: { $in: salesContractArr },
        brand: { $in: brandArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },

          brand: { $in: brandArr },
        },
      ];
    } else if (
      productArr.length > 0 &&
      salesContractArr.length > 0 &&
      brandArr.length > 0
    ) {
      where.$and = [
        {
          salesContract: { $in: salesContractArr },
          product: { $in: productArr },
          brand: { $in: brandArr },
        },
      ];
      filter = {
        product: { $in: productArr },

        salesContract: { $in: salesContractArr },
        brand: { $in: brandArr },
      };
      filter_records.$and = [
        {
          salesContract: { $in: salesContractArr },
          product: { $in: productArr },
          brand: { $in: brandArr },
        },
      ];
    } else if (
      productArr.length > 0 &&
      customerArr.length > 0 &&
      brandArr.length > 0
    ) {
      where.$and = [
        {
          customer: { $in: customerArr },

          product: { $in: productArr },
          brand: { $in: brandArr },
        },
      ];
      filter = {
        product: { $in: productArr },
        customer: { $in: customerArr },

        brand: { $in: brandArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },

          product: { $in: productArr },
          brand: { $in: brandArr },
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
    } else if (brandArr.length > 0) {
      where = {
        brand: { $in: brandArr },
      };
      filter = {
        brand: { $in: brandArr },
      };
      filter_records = {
        brand: { $in: brandArr },
      };
    } else if (brandArr.length > 0 && salesContractArr.length > 0) {
      where.$and = [
        {
          salesContract: { $in: salesContractArr },
          brandArr: { $in: brandArr },
        },
      ];
      filter = {
        salesContract: { $in: salesContractArr },
        brandArr: { $in: brandArr },
      };
      filter_records.$and = [
        {
          salesContract: { $in: salesContractArr },
          brandArr: { $in: brandArr },
        },
      ];
    } else if (brandArr.length > 0 && customerArr.length > 0) {
      where.$and = [
        {
          customer: { $in: customerArr },
          brand: { $in: brandArr },
        },
      ];
      filter = {
        customer: { $in: customerArr },
        brandArr: { $in: brandArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          brandArr: { $in: brandArr },
        },
      ];
    } else if (brandArr.length > 0 && productArr.length > 0) {
      where.$and = [
        {
          brand: { $in: brandArr },
          product: { $in: productArr },
        },
      ];
      filter = {
        brand: { $in: brandArr },
        product: { $in: productArr },
      };
      filter_records.$and = [
        {
          brand: { $in: brandArr },
          product: { $in: productArr },
        },
      ];
    }
    if (input.dcNumber) {
      extrafilter = input.dcNumber;
    }

    if (input.gpNumber) {
      extrafilter.gpNumber = input.gpNumber;
    }
    function stringToBoolean(str: string | undefined) {
      return str?.toLowerCase() === 'true';
    }
    if (input.royality_approval) {
      extrafilter.royality_approval = stringToBoolean(input.royality_approval);
    }
    const brandAggregationPipelineRecords: any = [
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
        },
      },
      { $match: where },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContractData',
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
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
        $group: {
          _id: '$brand._id',

          totalShipment: {
            $sum: 1,
          },
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
          brand: {
            $first: '$brand',
          },
          product: {
            $first: '$product',
          },
          customer: {
            $first: '$customer',
          },
        },
      },
      {
        $project: {
          brand_id: {
            $arrayElemAt: ['$brand._id', 0],
          },
          brand_name: {
            $arrayElemAt: ['$brand.name', 0],
          },
          product_name: {
            $arrayElemAt: ['$product.name', 0],
          },
          customer_name: {
            $arrayElemAt: ['$customer.name', 0],
          },
          qty: 1,
          amount: 1,
          totalShipment: 1,
        },
      },
    ];

    const total_records = await ShipmentDtlModel.aggregate(
      brandAggregationPipelineRecords
    );

    const totalShipmentSum = total_records.reduce(
      (sum, item) => sum + item.totalShipment,
      0
    );

    const totalQtySum = total_records.reduce((sum, item) => sum + item.qty, 0);
    const totalAmountSum = total_records.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const result = {
      Group: total_records,
      total_records: total_records.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalShipmentSum: totalShipmentSum,
    };
    return result;
  } else if (input.Adm !== '') {
    console.log('ADM');
    if (
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0 &&
      input.customergroup == '' &&
      input.productgroup == '' &&
      input.salesContractgroup == '' &&
      input.dcNumber == '' &&
      input.gpNumber == '' &&
      input.brandgroup == '' &&
      input.transactiongroup == '' &&
      input.royality_approval == ''
    ) {
      console.log(' ADM  no filter condition execute');

      const total_record = await ShipmentDtlModel.aggregate([
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },

            isDeleted: false,
            adm_ship: true,
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
            adm_ship: true,
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

      const totalQty = allrecordgroupby.map((item: any) => item.qty);
      const totalRate = allrecordgroupby.map((item: any) => item.rate);
      const totalAmount = allrecordgroupby.map((item: any) => item.amount);

      let where: any = {
        gpDate: {
          $gte: new Date(input.fromDate),
          $lte: new Date(input.toDate),
        },
        adm_ship: true,
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
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },

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
    } else if (input.productgroup !== '' && input.royality_approval !== '') {
      console.log('product group  royality_approval');
      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }

      const royality_approval = stringToBoolean(input.royality_approval);

      const productAggregationPipelineRecord = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            InHouse: true,
            shipment: true,
            royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'shipmentdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'shipment',
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
          $group: {
            _id: '$product._id',
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            product: {
              $first: '$product',
            },
          },
        },
        {
          $project: {
            product_id: {
              $arrayElemAt: ['$product._id', 0],
            },
            product_name: {
              $arrayElemAt: ['$product.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];

      const total_records = await SalesContractDtlModel.aggregate(
        productAggregationPipelineRecord
      );

      const totalShipmentSum = total_records.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_records.reduce(
        (sum, item) => sum + item.qty,
        0
      );
      const totalAmountSum = total_records.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: total_records,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (input.brandgroup !== '' && input.royality_approval !== '') {
      console.log('brand group royality_approval');

      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }

      const royality_approval = stringToBoolean(input.royality_approval);

      const brandAggregationPipelineRecord: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            InHouse: true,
            shipment: true,
            royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'shipmentdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'shipment',
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $group: {
            _id: '$brand._id',
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            brand: {
              $first: '$brand',
            },
          },
        },
        {
          $project: {
            product_id: {
              $arrayElemAt: ['$product._id', 0],
            },
            brand_name: {
              $arrayElemAt: ['$brand.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];

      const total_records = await SalesContractDtlModel.aggregate(
        brandAggregationPipelineRecord
      );

      const totalShipmentSum = total_records.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_records.reduce(
        (sum, item) => sum + item.qty,
        0
      );
      const totalAmountSum = total_records.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: total_records,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (input.customergroup !== '' && input.royality_approval !== '') {
      console.log('customer group royality_approval');

      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }

      const royality_approval = stringToBoolean(input.royality_approval);
      const customerAggregationPipelineRecords = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            InHouse: true,
            shipment: true,
            royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'shipmentdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'shipment',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $group: {
            _id: '$customer._id',
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            customer: {
              $first: '$customer',
            },
          },
        },
        {
          $project: {
            customer_id: {
              $arrayElemAt: ['$customer._id', 0],
            },
            customer_name: {
              $arrayElemAt: ['$customer.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];

      const total_records = await SalesContractDtlModel.aggregate(
        customerAggregationPipelineRecords
      );

      const totalShipmentSum = total_records.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_records.reduce(
        (sum, item) => sum + item.qty,
        0
      );
      const totalAmountSum = total_records.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: total_records,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.brandgroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0 &&
      input.dcNumber == '' &&
      input.gpNumber == '' &&
      input.royality_approval == ''
    ) {
      console.log('Adm brand general group');

      const brandAggregationPipelineRecord: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: true,
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $group: {
            _id: '$brand._id',
            brand: {
              $first: '$brand',
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            totalshipments: {
              $sum: 1,
            },
          },
        },
        {
          $unwind: {
            path: '$brand',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            name: '$brand.name',
            qty: 1,
            amount: 1,
            totalshipments: 1,
          },
        },
      ];

      const total_record = await ShipmentDtlModel.aggregate(
        brandAggregationPipelineRecord
          ? brandAggregationPipelineRecord
          : undefined
      );
      const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
      const totalAmountSum = total_record.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: total_record,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
      };

      return result;
    } else if (
      input.productgroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0 &&
      input.dcNumber == '' &&
      input.gpNumber == '' &&
      input.royality_approval == ''
    ) {
      console.log('adm product general group');

      const productAggregationPipelineRecord: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: true,
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
          $unwind: {
            path: '$product',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            name: '$product.name',
            qty: 1,
            amount: 1,
            createdAt: 1,
            product_id: '$product._id',
          },
        },
        {
          $group: {
            _id: '$product_id',
            name: {
              $first: '$name',
            },
            createdAt: {
              $first: '$createdAt',
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalShipment: {
              $sum: 1,
            },
          },
        },
        {
          $match: {
            totalQty: {
              $gt: 0,
            },
            totalAmount: {
              $gt: 0,
            },
          },
        },
        {
          $project: {
            name: 1,
            createdAt: 1,
            totalQty: 1,
            totalAmount: 1,
            totalShipment: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];

      const total_record = await ShipmentDtlModel.aggregate(
        productAggregationPipelineRecord != undefined
          ? productAggregationPipelineRecord
          : undefined
      );
      const totalAmountSum = total_record.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalQtySum = total_record.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );

      const result = {
        Group: total_record,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
      };
      return result;
    } else if (
      input.royality_approval !== '' &&
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0 &&
      input.customergroup == '' &&
      input.productgroup == '' &&
      input.salesContractgroup == '' &&
      input.dcNumber == '' &&
      input.gpNumber == '' &&
      input.brandgroup == '' &&
      input.transactiongroup == '' &&
      input.Adm == '' &&
      input.nonAdm == ''
    ) {
      console.log('royality approval filter');

      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }
      const royality_approval = stringToBoolean(input.royality_approval);

      const salegroupby = await SalesContractDtlModel.aggregate([
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            royality_approval: royality_approval,
            adm_ship: true,
            shipment: true,
          },
        },
        {
          $lookup: {
            from: 'shipmentdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'shipmentDetail',
          },
        },
        {
          $lookup: {
            from: 'shipments',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'shipment',
          },
        },
        {
          $group: {
            _id: 'null',
            qty: {
              $sum: '$qty',
            },
            rate: {
              $sum: '$rate',
            },
            amount: {
              $sum: '$amount',
            },
          },
        },
      ]);

      const sale = await SalesContractDtlModel.aggregate([
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            royality_approval: royality_approval,
            adm_ship: true,
            shipment: true,
          },
        },
        {
          $lookup: {
            from: 'shipmentdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'shipmentDetail',
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salecontractDetail',
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
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $lookup: {
            from: 'shipments',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'shipment',
          },
        },
        { $sort: { id: -1 } },
      ]);

      // Extract totals from the result
      const totalQty = salegroupby.map((item: any) => item.qty);
      const totalRate = salegroupby.map((item: any) => item.rate);
      const totalAmount = salegroupby.map((item: any) => item.amount);

      let result = {
        shipmentdtl: sale,
        paginated_record: sale.length,
        total_records: sale.length,
        totalQty: totalQty,
        totalRate: totalRate,
        totalAmount: totalAmount,
      };
      return result;
    } else if (
      input.customergroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      input.dcNumber == '' &&
      input.gpNumber == '' &&
      input.royality_approval == ''
    ) {
      console.log('Adm customer general group');

      const customerAggregationPipelineRecords: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: true,
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $unwind: {
            path: '$customer',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            name: '$customer.name',
            qty: 1,
            amount: 1,
            createdAt: 1,
            customer_id: '$customer._id',
          },
        },
        {
          $group: {
            _id: '$customer_id',
            name: {
              $first: '$name',
            },
            createdAt: {
              $first: '$createdAt',
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalShipment: {
              $sum: 1,
            },
          },
        },
        {
          $match: {
            totalQty: {
              $gt: 0,
            },
            totalAmount: {
              $gt: 0,
            },
          },
        },
        {
          $project: {
            name: 1,
            createdAt: 1,
            totalQty: 1,
            totalAmount: 1,
            totalShipment: 1,
          },
        },

        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];

      const total_record = await ShipmentDtlModel.aggregate(
        customerAggregationPipelineRecords != undefined
          ? customerAggregationPipelineRecords
          : undefined
      );
      const totalQtySum = total_record.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = total_record.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );

      const result = {
        Group: total_record,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
      };
      return result;
    } else if (
      (input.customergroup == '' &&
        input.productgroup == '' &&
        input.brandgroup == '' &&
        input.transactiongroup == '' &&
        input.salesContractgroup == '' &&
        input.royality_approval == '') ||
      input.dcNumber !== '' ||
      (input.gpNumber !== '' &&
        ((Array.isArray(input.product_id) && input.product_id.length !== 0) ||
          (Array.isArray(input.customer) && input.customer.length !== 0) ||
          (Array.isArray(input.brand) && input.brand.length !== 0) ||
          (Array.isArray(input.salesContract) &&
            input.salesContract.length !== 0)))
    ) {
      console.log(' Adm main qury ');

      const salesContractArr = input.salesContract
        ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const productArr = input.product_id
        ? input.product_id.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const brandArr = input.product_id
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      let where: any = {};
      let extrafilter: any = {};
      let filter: any = {};
      let filter_records: any = {};

      if (
        customerArr.length > 0 &&
        salesContractArr.length > 0 &&
        productArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
      } else if (
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
      } else if (
        customerArr.length > 0 &&
        salesContractArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },

            brand: { $in: brandArr },
          },
        ];
        filter = {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },

            brand: { $in: brandArr },
          },
        ];
      } else if (
        productArr.length > 0 &&
        salesContractArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },

          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
      } else if (
        productArr.length > 0 &&
        customerArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },

            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },
          customer: { $in: customerArr },

          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },

            product: { $in: productArr },
            brand: { $in: brandArr },
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
      } else if (brandArr.length > 0) {
        where = {
          brand: { $in: brandArr },
        };
        filter = {
          brand: { $in: brandArr },
        };
        filter_records = {
          brand: { $in: brandArr },
        };
      } else if (brandArr.length > 0 && salesContractArr.length > 0) {
        where.$and = [
          {
            salesContract: { $in: salesContractArr },
            brandArr: { $in: brandArr },
          },
        ];
        filter = {
          salesContract: { $in: salesContractArr },
          brandArr: { $in: brandArr },
        };
        filter_records.$and = [
          {
            salesContract: { $in: salesContractArr },
            brandArr: { $in: brandArr },
          },
        ];
      } else if (brandArr.length > 0 && customerArr.length > 0) {
        where.$and = [
          {
            customer: { $in: customerArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          customer: { $in: customerArr },
          brandArr: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            brandArr: { $in: brandArr },
          },
        ];
      } else if (brandArr.length > 0 && productArr.length > 0) {
        where.$and = [
          {
            brand: { $in: brandArr },
            product: { $in: productArr },
          },
        ];
        filter = {
          brand: { $in: brandArr },
          product: { $in: productArr },
        };
        filter_records.$and = [
          {
            brand: { $in: brandArr },
            product: { $in: productArr },
          },
        ];
      }
      if (input.dcNumber) {
        extrafilter.dcNumber = input.dcNumber;
      }

      if (input.gpNumber) {
        extrafilter.gpNumber = input.gpNumber;
      }
      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }
      if (input.royality_approval) {
        extrafilter.royality_approval = stringToBoolean(
          input.royality_approval
        );
      }

      const total_record = await ShipmentDtlModel.aggregate([
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },

            isDeleted: false,
            adm_ship: true,
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
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractsDetails',
            pipeline: [
              {
                $project: {
                  contract: 1,
                  royality_approval: 1,
                },
              },
            ],
          },
        },

        {
          $project: {
            contract: { $first: '$salesContractsDetails.contract' },
            royality_approval: {
              $first: '$salesContractsDetails.royality_approval',
            },
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
            adm_ship: true,
          },
        },
        { $match: filter },
        {
          $lookup: {
            from: 'shipments',
            localField: 'shipment',
            foreignField: '_id',
            as: 'shipment',
          },
        },

        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractsDetails',
            pipeline: [
              {
                $project: {
                  contract: 1,
                  royality_approval: 1,
                },
              },
            ],
          },
        },

        {
          $project: {
            qty: 1,
            rate: 1,
            amount: 1,
            contract: { $first: '$salesContractsDetails.contract' },
            royality_approval: {
              $first: '$salesContractsDetails.royality_approval',
            },
            gpNumber: {
              $first: '$shipment.gpNumber',
            },
            dcNumber: {
              $first: '$shipment.dcNumber',
            },
            gpDate: 1,
          },
        },
        { $match: extrafilter },
        {
          $group: {
            _id: 'null',
            qty: {
              $sum: '$qty',
            },
            rate: {
              $sum: '$rate',
            },
            amount: {
              $sum: '$amount',
            },
          },
        },
      ]);

      // Extract totals from the result
      const totalQty = shipmentgroupby.map((item: any) => item.qty);
      const totalRate = shipmentgroupby.map((item: any) => item.rate);
      const totalAmount = shipmentgroupby.map((item: any) => item.amount);

      const ship = await ShipmentDtlModel.aggregate([
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: true,
          },
        },

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
            pipeline: [
              {
                $project: {
                  contract: 1,
                  royality_approval: 1,
                },
              },
            ],
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
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brandDetails',
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
            supplierCode: 1,
            shipment: 1,
            shipment_no: 1,
            product: 1,
            createdAt: 1,
            customerDetails: 1,
            brandDetails: 1,
            shipmentDetails: 1,
            contract: { $first: '$salesContractsDetails.contract' },
            royality_approval: {
              $first: '$salesContractsDetails.royality_approval',
            },
            // salesContractsDetails: 1,
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

        { $sort: { id: 1 } },
      ]);
      let result = {
        shipmentdtl: ship,
        paginated_record: ship.length,
        total_records: total_record.length,
        totalQty: totalQty,
        totalRate: totalRate,
        totalAmount: totalAmount,
      };
      return result;
    } else if (
      input.customergroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length !== 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      input.royality_approval == ''
    ) {
      console.log('customer group customer ');

      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const customergroup = await ShipmentDtlModel.aggregate([
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: true,
            customer: { $in: customerArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $group: {
            _id: '$customer._id',
            // Group by customer
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            customer: {
              $first: '$customer',
            },
          },
        },
        {
          $project: {
            customer_id: {
              $arrayElemAt: ['$customer._id', 0],
            },
            customer_name: {
              $arrayElemAt: ['$customer.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $sort: { qty: -1 } },
      ]);
      const totalShipmentSum = customergroup.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = customergroup.reduce(
        (sum, item) => sum + item.qty,
        0
      );
      const totalAmountSum = customergroup.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: customergroup,
        total_records: customergroup.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.productgroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length !== 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      input.royality_approval == ''
    ) {
      console.log('product group product ');

      const productArr = input.product_id
        ? input.product_id.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const productgroup = await ShipmentDtlModel.aggregate([
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: true,
            product: { $in: productArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
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
          $group: {
            _id: '$product._id',
            // Group by customer
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            product: {
              $first: '$product',
            },
          },
        },
        {
          $project: {
            product_id: {
              $arrayElemAt: ['$product._id', 0],
            },
            product_name: {
              $arrayElemAt: ['$product.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $sort: { qty: -1 } },
      ]);
      const totalShipmentSum = productgroup.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = productgroup.reduce((sum, item) => sum + item.qty, 0);
      const totalAmountSum = productgroup.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: productgroup,
        total_records: productgroup.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.brandgroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length !== 0 &&
      input.royality_approval == ''
    ) {
      console.log('brand group brand ');

      const brandArr = input.brand
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const brandAggregationPipelineRecord: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: true,
            brand: { $in: brandArr }, // Filter by brand IDs
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand', // Lookup brand details
          },
        },
        {
          $group: {
            _id: '$brand._id', // Group by brand _id
            totalShipment: { $sum: 1 }, // Count the total shipments
            qty: { $sum: '$qty' }, // Sum of qty
            amount: { $sum: '$amount' }, // Sum of amounts
            brand: { $first: '$brand' }, // Get the first brand from the grouped data
          },
        },
        {
          $project: {
            brand_id: '$brand._id', // Directly access brand _id
            brand_name: '$brand.name', // Directly access brand name
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $sort: { qty: -1 } },
      ];

      const total_record = await ShipmentDtlModel.aggregate(
        brandAggregationPipelineRecord
          ? brandAggregationPipelineRecord
          : undefined
      );
      const totalShipmentSum = total_record.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
      const totalAmountSum = total_record.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: total_record,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.customergroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length !== 0
    ) {
      console.log('customer group brand ');

      const brandArr = input.customer
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const brandCustomerAggregationPipelineRecord: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: true,
            brand: { $in: brandArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $group: {
            _id: { brandId: '$brand._id', customerId: '$customer._id' },
            totalShipment: { $sum: 1 },
            qty: { $sum: '$qty' },
            amount: { $sum: '$amount' },
            brand: { $first: '$brand' },
            customer: { $first: '$customer' },
          },
        },
        {
          $project: {
            brand_id: { $arrayElemAt: ['$brand._id', 0] },
            brand_name: { $arrayElemAt: ['$brand.name', 0] },
            customer_id: { $arrayElemAt: ['$customer._id', 0] },
            customer_name: { $arrayElemAt: ['$customer.name', 0] },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $sort: { qty: -1 } },
      ];

      const total_record = await ShipmentDtlModel.aggregate(
        brandCustomerAggregationPipelineRecord
          ? brandCustomerAggregationPipelineRecord
          : undefined
      );

      const totalShipmentSum = total_record.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
      const totalAmountSum = total_record.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: total_record,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.customergroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length !== 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      input.royality_approval == ''
    ) {
      console.log('customer group product ');

      const productArr = input.customer
        ? input.product_id.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const productCustomerAggregationPipelineRecord: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: true,
            product: { $in: productArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
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
          $group: {
            _id: { customerId: '$customer._id', productId: '$product._id' },
            totalShipment: { $sum: 1 },
            qty: { $sum: '$qty' },
            amount: { $sum: '$amount' },
            customer: { $first: '$customer' },
            product: { $first: '$product' },
          },
        },
        {
          $project: {
            customer_id: { $arrayElemAt: ['$customer._id', 0] },
            customer_name: { $arrayElemAt: ['$customer.name', 0] },
            product_name: { $arrayElemAt: ['$product.name', 0] },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $sort: { qty: -1 } },
      ];

      const total_record = await ShipmentDtlModel.aggregate(
        productCustomerAggregationPipelineRecord
          ? productCustomerAggregationPipelineRecord
          : undefined
      );

      const totalShipmentSum = total_record.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
      const totalAmountSum = total_record.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: total_record,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.productgroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length !== 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      input.royality_approval == ''
    ) {
      console.log('product group customer ');

      const customerArr = input.product_id
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const productCustomerAggregationPipelineRecord: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: true,
            customer: { $in: customerArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
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
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $group: {
            _id: { productId: '$product._id', customerId: '$customer._id' },
            totalShipment: { $sum: 1 },
            qty: { $sum: '$qty' },
            amount: { $sum: '$amount' },
            product: { $first: '$product' },
            customer: { $first: '$customer' },
          },
        },
        {
          $project: {
            product_id: { $arrayElemAt: ['$product._id', 0] },
            product_name: { $arrayElemAt: ['$product.name', 0] },
            customer_id: { $arrayElemAt: ['$customer._id', 0] },
            customer_name: { $arrayElemAt: ['$customer.name', 0] },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $sort: { qty: -1 } },
      ];

      const total_record = await ShipmentDtlModel.aggregate(
        productCustomerAggregationPipelineRecord
          ? productCustomerAggregationPipelineRecord
          : undefined
      );

      const totalShipmentSum = total_record.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
      const totalAmountSum = total_record.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: total_record,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.productgroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length !== 0 &&
      input.royality_approval == ''
    ) {
      console.log('product group brand ');

      const brandArr = input.product_id
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const productBrandAggregationPipelineRecord: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: true,
            brand: { $in: brandArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
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
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $group: {
            _id: { productId: '$product._id', brandId: '$brand._id' }, // Group by both product and brand
            totalShipment: { $sum: 1 },
            qty: { $sum: '$qty' },
            amount: { $sum: '$amount' },
            product: { $first: '$product' },
            brand: { $first: '$brand' },
          },
        },
        {
          $project: {
            product_id: { $arrayElemAt: ['$product._id', 0] },
            product_name: { $arrayElemAt: ['$product.name', 0] },
            brand_id: { $arrayElemAt: ['$brand._id', 0] },
            brand_name: { $arrayElemAt: ['$brand.name', 0] },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $sort: { qty: -1 } },
      ];

      const total_record = await ShipmentDtlModel.aggregate(
        productBrandAggregationPipelineRecord
          ? productBrandAggregationPipelineRecord
          : undefined
      );

      const totalShipmentSum = total_record.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
      const totalAmountSum = total_record.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: total_record,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.brandgroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length !== 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      input.royality_approval == ''
    ) {
      console.log('brand group customer ');

      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      console.log(customerArr);
      const brandAggregationPipelineRecord: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: true,
            customer: { $in: customerArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
            pipeline: [
              {
                $match: {
                  isDeleted: false,
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $group: {
            _id: { brandId: '$brand._id', customerId: '$customer._id' },
            totalShipment: { $sum: 1 },
            qty: { $sum: '$qty' },
            amount: { $sum: '$amount' },
            brand: { $first: '$brand' },
            customer: { $first: '$customer' },
          },
        },
        {
          $project: {
            brand_id: { $arrayElemAt: ['$brand._id', 0] },
            brand_name: { $arrayElemAt: ['$brand.name', 0] },
            customer_id: { $arrayElemAt: ['$customer._id', 0] },
            customer_name: { $arrayElemAt: ['$customer.name', 0] },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $sort: { qty: -1 } },
      ];

      const total_record = await ShipmentDtlModel.aggregate(
        brandAggregationPipelineRecord
          ? brandAggregationPipelineRecord
          : undefined
      );

      const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
      const totalAmountSum = total_record.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const totalShipmentSum = total_record.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );
      const result = {
        Group: total_record,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.brandgroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length !== 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      input.royality_approval == ''
    ) {
      console.log('brand group product ');

      const productArr = input.brand
        ? input.product_id.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const productBrandAggregationPipelineRecord: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: true,
            product: { $in: productArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
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
          $group: {
            _id: { brandId: '$brand._id', productId: '$product._id' }, // Group by both brand and product
            totalShipment: { $sum: 1 },
            qty: { $sum: '$qty' },
            amount: { $sum: '$amount' },
            brand: { $first: '$brand' },
            product: { $first: '$product' },
          },
        },
        {
          $project: {
            brand_id: { $arrayElemAt: ['$brand._id', 0] },
            brand_name: { $arrayElemAt: ['$brand.name', 0] },
            product_id: { $arrayElemAt: ['$product._id', 0] },
            product_name: { $arrayElemAt: ['$product.name', 0] },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $sort: { qty: -1 } },
      ];

      const total_record = await ShipmentDtlModel.aggregate(
        productBrandAggregationPipelineRecord
          ? productBrandAggregationPipelineRecord
          : undefined
      );

      const totalShipmentSum = total_record.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
      const totalAmountSum = total_record.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: total_record,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.customergroup !== '' &&
      input.productgroup == '' &&
      input.brandgroup == '' &&
      input.salesContractgroup == '' &&
      ((Array.isArray(input.product_id) && input.product_id.length !== 0) ||
        (Array.isArray(input.customer) && input.customer.length !== 0) ||
        (Array.isArray(input.brand) && input.brand.length !== 0) ||
        (Array.isArray(input.salesContract) &&
          input.salesContract.length !== 0))
    ) {
      console.log(
        'group with general filters brand customer product salescontract ddddddd'
      );

      const salesContractArr = input.salesContract
        ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const productArr = input.product_id
        ? input.product_id.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const brandArr = input.product_id
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      let where: any = {};
      let extrafilter: any = {};
      let filter: any = {};
      let filter_records: any = {};

      if (
        customerArr.length > 0 &&
        salesContractArr.length > 0 &&
        productArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
      } else if (
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
      } else if (
        customerArr.length > 0 &&
        salesContractArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },

            brand: { $in: brandArr },
          },
        ];
        filter = {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },

            brand: { $in: brandArr },
          },
        ];
      } else if (
        productArr.length > 0 &&
        salesContractArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },

          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
      } else if (
        productArr.length > 0 &&
        customerArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },

            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },
          customer: { $in: customerArr },

          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },

            product: { $in: productArr },
            brand: { $in: brandArr },
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
      } else if (brandArr.length > 0) {
        where = {
          brand: { $in: brandArr },
        };
        filter = {
          brand: { $in: brandArr },
        };
        filter_records = {
          brand: { $in: brandArr },
        };
      } else if (brandArr.length > 0 && salesContractArr.length > 0) {
        where.$and = [
          {
            salesContract: { $in: salesContractArr },
            brandArr: { $in: brandArr },
          },
        ];
        filter = {
          salesContract: { $in: salesContractArr },
          brandArr: { $in: brandArr },
        };
        filter_records.$and = [
          {
            salesContract: { $in: salesContractArr },
            brandArr: { $in: brandArr },
          },
        ];
      } else if (brandArr.length > 0 && customerArr.length > 0) {
        where.$and = [
          {
            customer: { $in: customerArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          customer: { $in: customerArr },
          brandArr: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            brandArr: { $in: brandArr },
          },
        ];
      } else if (brandArr.length > 0 && productArr.length > 0) {
        where.$and = [
          {
            brand: { $in: brandArr },
            product: { $in: productArr },
          },
        ];
        filter = {
          brand: { $in: brandArr },
          product: { $in: productArr },
        };
        filter_records.$and = [
          {
            brand: { $in: brandArr },
            product: { $in: productArr },
          },
        ];
      }
      if (input.dcNumber) {
        extrafilter = input.dcNumber;
      }

      if (input.gpNumber) {
        extrafilter.gpNumber = input.gpNumber;
      }
      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }
      if (input.royality_approval) {
        extrafilter.royality_approval = stringToBoolean(
          input.royality_approval
        );
      }

      const customerAggregationPipelineRecords: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            adm_ship: true,
            isDeleted: false,
          },
        },
        {
          $match: filter_records,
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $group: {
            _id: '$customer._id',
            // Group by customer
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            customer: {
              $first: '$customer',
            },
          },
        },
        {
          $project: {
            customer_id: {
              $arrayElemAt: ['$customer._id', 0],
            },
            customer_name: {
              $arrayElemAt: ['$customer.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $sort: { qty: -1 } },
      ];

      const total_records = await ShipmentDtlModel.aggregate(
        customerAggregationPipelineRecords
      );

      const totalShipmentSum = total_records.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_records.reduce(
        (sum, item) => sum + item.qty,
        0
      );
      const totalAmountSum = total_records.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        customer_groupby: total_records,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.productgroup !== '' &&
      input.customergroup == '' &&
      input.brandgroup == '' &&
      input.salesContractgroup == '' &&
      ((Array.isArray(input.product_id) && input.product_id.length !== 0) ||
        (Array.isArray(input.customer) && input.customer.length !== 0) ||
        (Array.isArray(input.brand) && input.brand.length !== 0) ||
        (Array.isArray(input.salesContract) &&
          input.salesContract.length !== 0))
    ) {
      console.log(
        'group with general filters brand customer product salescontract'
      );

      const salesContractArr = input.salesContract
        ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const productArr = input.product_id
        ? input.product_id.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const brandArr = input.product_id
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      let where: any = {};
      let extrafilter: any = {};
      let filter: any = {};
      let filter_records: any = {};

      if (
        customerArr.length > 0 &&
        salesContractArr.length > 0 &&
        productArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
      } else if (
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
      } else if (
        customerArr.length > 0 &&
        salesContractArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },

            brand: { $in: brandArr },
          },
        ];
        filter = {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },

            brand: { $in: brandArr },
          },
        ];
      } else if (
        productArr.length > 0 &&
        salesContractArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },

          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
      } else if (
        productArr.length > 0 &&
        customerArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },

            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },
          customer: { $in: customerArr },

          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },

            product: { $in: productArr },
            brand: { $in: brandArr },
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
      } else if (brandArr.length > 0) {
        where = {
          brand: { $in: brandArr },
        };
        filter = {
          brand: { $in: brandArr },
        };
        filter_records = {
          brand: { $in: brandArr },
        };
      } else if (brandArr.length > 0 && salesContractArr.length > 0) {
        where.$and = [
          {
            salesContract: { $in: salesContractArr },
            brandArr: { $in: brandArr },
          },
        ];
        filter = {
          salesContract: { $in: salesContractArr },
          brandArr: { $in: brandArr },
        };
        filter_records.$and = [
          {
            salesContract: { $in: salesContractArr },
            brandArr: { $in: brandArr },
          },
        ];
      } else if (brandArr.length > 0 && customerArr.length > 0) {
        where.$and = [
          {
            customer: { $in: customerArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          customer: { $in: customerArr },
          brandArr: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            brandArr: { $in: brandArr },
          },
        ];
      } else if (brandArr.length > 0 && productArr.length > 0) {
        where.$and = [
          {
            brand: { $in: brandArr },
            product: { $in: productArr },
          },
        ];
        filter = {
          brand: { $in: brandArr },
          product: { $in: productArr },
        };
        filter_records.$and = [
          {
            brand: { $in: brandArr },
            product: { $in: productArr },
          },
        ];
      }
      if (input.dcNumber) {
        extrafilter = input.dcNumber;
      }

      if (input.gpNumber) {
        extrafilter.gpNumber = input.gpNumber;
      }
      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }
      if (input.royality_approval) {
        extrafilter.royality_approval = stringToBoolean(
          input.royality_approval
        );
      }
      const productAggregationPipelineRecords: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            adm_ship: true,
            isDeleted: false,
          },
        },
        { $match: where },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
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
          $group: {
            _id: '$product._id',
            // Group by customer
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            product: {
              $first: '$product',
            },
          },
        },
        {
          $project: {
            product_id: {
              $arrayElemAt: ['$product._id', 0],
            },
            product_name: {
              $arrayElemAt: ['$product.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
        { $sort: { qty: -1 } },
      ];

      const total_records = await ShipmentDtlModel.aggregate(
        productAggregationPipelineRecords
      );

      const totalShipmentSum = total_records.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_records.reduce(
        (sum, item) => sum + item.qty,
        0
      );
      const totalAmountSum = total_records.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        product_groupby: total_records,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.brandgroup !== '' &&
      input.customergroup == '' &&
      input.productgroup == '' &&
      input.salesContractgroup == '' &&
      ((Array.isArray(input.product_id) && input.product_id.length !== 0) ||
        (Array.isArray(input.customer) && input.customer.length !== 0) ||
        (Array.isArray(input.brand) && input.brand.length !== 0) ||
        (Array.isArray(input.salesContract) &&
          input.salesContract.length !== 0))
    ) {
      console.log(
        'group with general filters brand customer product salescontract'
      );

      const salesContractArr = input.salesContract
        ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const productArr = input.product_id
        ? input.product_id.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const brandArr = input.brand
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      console.log(brandArr);
      let where: any = {};
      let extrafilter: any = {};
      let filter: any = {};
      let filter_records: any = {};

      if (
        customerArr.length > 0 &&
        salesContractArr.length > 0 &&
        productArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
      } else if (
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
      } else if (
        customerArr.length > 0 &&
        salesContractArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },

            brand: { $in: brandArr },
          },
        ];
      } else if (
        productArr.length > 0 &&
        salesContractArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },

          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
      } else if (
        productArr.length > 0 &&
        customerArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },

            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },
          customer: { $in: customerArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },

            product: { $in: productArr },
            brand: { $in: brandArr },
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
      } else if (brandArr.length > 0 && salesContractArr.length > 0) {
        where.$and = [
          {
            salesContract: { $in: salesContractArr },
            brandArr: { $in: brandArr },
          },
        ];
        filter = {
          salesContract: { $in: salesContractArr },
          brandArr: { $in: brandArr },
        };
        filter_records.$and = [
          {
            salesContract: { $in: salesContractArr },
            brandArr: { $in: brandArr },
          },
        ];
      } else if (brandArr.length > 0 && customerArr.length > 0) {
        console.log(brandArr, customerArr, 'nn');
        where.$and = [
          {
            customer: { $in: customerArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          customer: { $in: customerArr },
          brandArr: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            brandArr: { $in: brandArr },
          },
        ];
      } else if (brandArr.length > 0 && productArr.length > 0) {
        where.$and = [
          {
            brand: { $in: brandArr },
            product: { $in: productArr },
          },
        ];
        filter = {
          brand: { $in: brandArr },
          product: { $in: productArr },
        };
        filter_records.$and = [
          {
            brand: { $in: brandArr },
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
      } else if (brandArr.length > 0) {
        where = {
          brand: { $in: brandArr },
        };
        filter = {
          brand: { $in: brandArr },
        };
        filter_records = {
          brand: { $in: brandArr },
        };
      }

      if (input.dcNumber) {
        extrafilter = input.dcNumber;
      }

      if (input.gpNumber) {
        extrafilter.gpNumber = input.gpNumber;
      }
      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }
      if (input.royality_approval) {
        extrafilter.royality_approval = stringToBoolean(
          input.royality_approval
        );
      }
      console.log(where);
      const brandAggregationPipelineRecords: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            adm_ship: true,
            isDeleted: false,
          },
        },
        { $match: filter_records },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $group: {
            _id: '$brand._id',
            // Group by customer
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            brand: {
              $first: '$brand',
            },
          },
        },
        {
          $project: {
            brand_id: {
              $arrayElemAt: ['$brand._id', 0],
            },
            brand_name: {
              $arrayElemAt: ['$brand.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];

      const total_records = await ShipmentDtlModel.aggregate(
        brandAggregationPipelineRecords
      );

      const totalShipmentSum = total_records.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_records.reduce(
        (sum, item) => sum + item.qty,
        0
      );
      const totalAmountSum = total_records.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        brand_groupby: total_records,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    }
  } else if (input.nonAdm !== '') {
    console.log('NON ADM ');

    if (
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0 &&
      input.customergroup == '' &&
      input.productgroup == '' &&
      input.salesContractgroup == '' &&
      input.dcNumber == '' &&
      input.gpNumber == '' &&
      input.brandgroup == '' &&
      input.transactiongroup == '' &&
      input.royality_approval == ''
    ) {
      console.log(' nonADM  no filter condition execute');

      const total_record = await ShipmentDtlModel.aggregate([
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },

            isDeleted: false,
            adm_ship: false,
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
            adm_ship: false,
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

      const totalQty = allrecordgroupby.map((item: any) => item.qty);
      const totalRate = allrecordgroupby.map((item: any) => item.rate);
      const totalAmount = allrecordgroupby.map((item: any) => item.amount);

      let where: any = {
        gpDate: {
          $gte: new Date(input.fromDate),
          $lte: new Date(input.toDate),
        },
        adm_ship: false,
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
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },

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
    } else if (input.productgroup !== '' && input.royality_approval !== '') {
      console.log('product group  royality_approval');
      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }

      const royality_approval = stringToBoolean(input.royality_approval);

      const productAggregationPipelineRecord = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            InHouse: false,
            shipment: true,
            royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'shipmentdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'shipment',
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
          $group: {
            _id: '$product._id',
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            product: {
              $first: '$product',
            },
          },
        },
        {
          $project: {
            product_id: {
              $arrayElemAt: ['$product._id', 0],
            },
            product_name: {
              $arrayElemAt: ['$product.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];

      const total_records = await SalesContractDtlModel.aggregate(
        productAggregationPipelineRecord
      );

      const totalShipmentSum = total_records.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_records.reduce(
        (sum, item) => sum + item.qty,
        0
      );
      const totalAmountSum = total_records.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: total_records,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (input.brandgroup !== '' && input.royality_approval !== '') {
      console.log('brand group royality_approval');

      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }

      const royality_approval = stringToBoolean(input.royality_approval);

      const brandAggregationPipelineRecord: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            InHouse: false,
            shipment: true,
            royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'shipmentdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'shipment',
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $group: {
            _id: '$brand._id',
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            brand: {
              $first: '$brand',
            },
          },
        },
        {
          $project: {
            product_id: {
              $arrayElemAt: ['$product._id', 0],
            },
            brand_name: {
              $arrayElemAt: ['$brand.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];

      const total_records = await SalesContractDtlModel.aggregate(
        brandAggregationPipelineRecord
      );

      const totalShipmentSum = total_records.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_records.reduce(
        (sum, item) => sum + item.qty,
        0
      );
      const totalAmountSum = total_records.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: total_records,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (input.customergroup !== '' && input.royality_approval !== '') {
      console.log('customer group royality_approval');

      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }

      const royality_approval = stringToBoolean(input.royality_approval);
      const customerAggregationPipelineRecords = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            InHouse: false,
            shipment: true,
            royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'shipmentdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'shipment',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $group: {
            _id: '$customer._id',
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            customer: {
              $first: '$customer',
            },
          },
        },
        {
          $project: {
            customer_id: {
              $arrayElemAt: ['$customer._id', 0],
            },
            customer_name: {
              $arrayElemAt: ['$customer.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];

      const total_records = await SalesContractDtlModel.aggregate(
        customerAggregationPipelineRecords
      );

      const totalShipmentSum = total_records.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_records.reduce(
        (sum, item) => sum + item.qty,
        0
      );
      const totalAmountSum = total_records.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: total_records,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.productgroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0 &&
      input.dcNumber == '' &&
      input.gpNumber == '' &&
      input.royality_approval == ''
    ) {
      console.log('nonadm product general group');

      const productAggregationPipelineRecord: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: false,
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
          $unwind: {
            path: '$product',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            name: '$product.name',
            qty: 1,
            amount: 1,
            createdAt: 1,
            product_id: '$product._id',
          },
        },
        {
          $group: {
            _id: '$product_id',
            name: {
              $first: '$name',
            },
            createdAt: {
              $first: '$createdAt',
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalShipment: {
              $sum: 1,
            },
          },
        },
        {
          $match: {
            totalQty: {
              $gt: 0,
            },
            totalAmount: {
              $gt: 0,
            },
          },
        },
        {
          $project: {
            name: 1,
            createdAt: 1,
            totalQty: 1,
            totalAmount: 1,
            totalShipment: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];
      const total_record = await ShipmentDtlModel.aggregate(
        productAggregationPipelineRecord != undefined
          ? productAggregationPipelineRecord
          : undefined
      );
      const totalAmountSum = total_record.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalQtySum = total_record.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );

      const result = {
        Group: total_record,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
      };
      return result;
    } else if (
      input.brandgroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0 &&
      input.dcNumber == '' &&
      input.gpNumber == '' &&
      input.royality_approval == ''
    ) {
      console.log('nonAdm brand general group');

      const brandAggregationPipelineRecord: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: false,
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $group: {
            _id: '$brand._id',
            brand: {
              $first: '$brand',
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            totalshipments: {
              $sum: 1,
            },
          },
        },
        {
          $unwind: {
            path: '$brand',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            name: '$brand.name',
            qty: 1,
            amount: 1,
            totalshipments: 1,
          },
        },
      ];

      const total_record = await ShipmentDtlModel.aggregate(
        brandAggregationPipelineRecord
          ? brandAggregationPipelineRecord
          : undefined
      );
      const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
      const totalAmountSum = total_record.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: total_record,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
      };

      return result;
    } else if (
      input.customergroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      input.dcNumber == '' &&
      input.gpNumber == '' &&
      input.royality_approval == ''
    ) {
      console.log('nonAdm customer general group');

      const customerAggregationPipelineRecord: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: false,
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $unwind: {
            path: '$customer',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            name: '$customer.name',
            qty: 1,
            amount: 1,
            createdAt: 1,
            customer_id: '$customer._id',
          },
        },
        {
          $group: {
            _id: '$customer_id',
            name: {
              $first: '$name',
            },
            createdAt: {
              $first: '$createdAt',
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalShipment: {
              $sum: 1,
            },
          },
        },
        {
          $match: {
            totalQty: {
              $gt: 0,
            },
            totalAmount: {
              $gt: 0,
            },
          },
        },
        {
          $project: {
            name: 1,
            createdAt: 1,
            totalQty: 1,
            totalAmount: 1,
            totalShipment: 1,
          },
        },

        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];

      const total_record = await ShipmentDtlModel.aggregate(
        customerAggregationPipelineRecord != undefined
          ? customerAggregationPipelineRecord
          : undefined
      );
      const totalQtySum = total_record.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = total_record.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );

      const result = {
        Group: total_record,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
      };
      return result;
    } else if (
      input.royality_approval !== '' &&
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0 &&
      input.customergroup == '' &&
      input.productgroup == '' &&
      input.salesContractgroup == '' &&
      input.dcNumber == '' &&
      input.gpNumber == '' &&
      input.brandgroup == '' &&
      input.transactiongroup == '' &&
      input.Adm == '' &&
      input.nonAdm == ''
    ) {
      console.log('royality approval filter');

      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }
      const royality_approval = stringToBoolean(input.royality_approval);

      const salegroupby = await SalesContractDtlModel.aggregate([
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            royality_approval: royality_approval,
            adm_ship: false,
            shipment: true,
          },
        },
        {
          $lookup: {
            from: 'shipmentdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'shipmentDetail',
          },
        },
        {
          $lookup: {
            from: 'shipments',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'shipment',
          },
        },
        {
          $group: {
            _id: 'null',
            qty: {
              $sum: '$qty',
            },
            rate: {
              $sum: '$rate',
            },
            amount: {
              $sum: '$amount',
            },
          },
        },
      ]);

      const sale = await SalesContractDtlModel.aggregate([
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            royality_approval: royality_approval,
            adm_ship: false,
            shipment: true,
          },
        },
        {
          $lookup: {
            from: 'shipmentdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'shipmentDetail',
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salecontractDetail',
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
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $lookup: {
            from: 'shipments',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'shipment',
          },
        },
        { $sort: { id: -1 } },
      ]);

      // Extract totals from the result
      const totalQty = salegroupby.map((item: any) => item.qty);
      const totalRate = salegroupby.map((item: any) => item.rate);
      const totalAmount = salegroupby.map((item: any) => item.amount);

      let result = {
        shipmentdtl: sale,
        paginated_record: sale.length,
        total_records: sale.length,
        totalQty: totalQty,
        totalRate: totalRate,
        totalAmount: totalAmount,
      };
      return result;
    } else if (
      (input.customergroup == '' &&
        input.productgroup == '' &&
        input.brandgroup == '' &&
        input.transactiongroup == '' &&
        input.salesContractgroup == '' &&
        input.royality_approval == '') ||
      input.dcNumber !== '' ||
      (input.gpNumber !== '' &&
        ((Array.isArray(input.product_id) && input.product_id.length !== 0) ||
          (Array.isArray(input.customer) && input.customer.length !== 0) ||
          (Array.isArray(input.brand) && input.brand.length !== 0) ||
          (Array.isArray(input.salesContract) &&
            input.salesContract.length !== 0)))
    ) {
      console.log(' nonAdm main qury ');

      const salesContractArr = input.salesContract
        ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const productArr = input.product_id
        ? input.product_id.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const brandArr = input.product_id
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      let where: any = {};
      let extrafilter: any = {};
      let filter: any = {};
      let filter_records: any = {};

      if (
        customerArr.length > 0 &&
        salesContractArr.length > 0 &&
        productArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
      } else if (
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
      } else if (
        customerArr.length > 0 &&
        salesContractArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },

            brand: { $in: brandArr },
          },
        ];
        filter = {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },

            brand: { $in: brandArr },
          },
        ];
      } else if (
        productArr.length > 0 &&
        salesContractArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },

          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
      } else if (
        productArr.length > 0 &&
        customerArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },

            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },
          customer: { $in: customerArr },

          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },

            product: { $in: productArr },
            brand: { $in: brandArr },
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
      } else if (brandArr.length > 0) {
        where = {
          brand: { $in: brandArr },
        };
        filter = {
          brand: { $in: brandArr },
        };
        filter_records = {
          brand: { $in: brandArr },
        };
      } else if (brandArr.length > 0 && salesContractArr.length > 0) {
        where.$and = [
          {
            salesContract: { $in: salesContractArr },
            brandArr: { $in: brandArr },
          },
        ];
        filter = {
          salesContract: { $in: salesContractArr },
          brandArr: { $in: brandArr },
        };
        filter_records.$and = [
          {
            salesContract: { $in: salesContractArr },
            brandArr: { $in: brandArr },
          },
        ];
      } else if (brandArr.length > 0 && customerArr.length > 0) {
        where.$and = [
          {
            customer: { $in: customerArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          customer: { $in: customerArr },
          brandArr: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            brandArr: { $in: brandArr },
          },
        ];
      } else if (brandArr.length > 0 && productArr.length > 0) {
        where.$and = [
          {
            brand: { $in: brandArr },
            product: { $in: productArr },
          },
        ];
        filter = {
          brand: { $in: brandArr },
          product: { $in: productArr },
        };
        filter_records.$and = [
          {
            brand: { $in: brandArr },
            product: { $in: productArr },
          },
        ];
      }
      if (input.dcNumber) {
        extrafilter.dcNumber = input.dcNumber;
      }

      if (input.gpNumber) {
        extrafilter.gpNumber = input.gpNumber;
      }
      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }
      if (input.royality_approval) {
        extrafilter.royality_approval = stringToBoolean(
          input.royality_approval
        );
      }

      const total_record = await ShipmentDtlModel.aggregate([
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },

            isDeleted: false,
            adm_ship: false,
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
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractsDetails',
            pipeline: [
              {
                $project: {
                  contract: 1,
                  royality_approval: 1,
                },
              },
            ],
          },
        },

        {
          $project: {
            contract: { $first: '$salesContractsDetails.contract' },
            royality_approval: {
              $first: '$salesContractsDetails.royality_approval',
            },
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
            adm_ship: false,
          },
        },
        { $match: filter },
        {
          $lookup: {
            from: 'shipments',
            localField: 'shipment',
            foreignField: '_id',
            as: 'shipment',
          },
        },

        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractsDetails',
            pipeline: [
              {
                $project: {
                  contract: 1,
                  royality_approval: 1,
                },
              },
            ],
          },
        },

        {
          $project: {
            qty: 1,
            rate: 1,
            amount: 1,
            contract: { $first: '$salesContractsDetails.contract' },
            royality_approval: {
              $first: '$salesContractsDetails.royality_approval',
            },
            gpNumber: {
              $first: '$shipment.gpNumber',
            },
            dcNumber: {
              $first: '$shipment.dcNumber',
            },
            gpDate: 1,
          },
        },
        { $match: extrafilter },
        {
          $group: {
            _id: 'null',
            qty: {
              $sum: '$qty',
            },
            rate: {
              $sum: '$rate',
            },
            amount: {
              $sum: '$amount',
            },
          },
        },
      ]);

      // Extract totals from the result
      const totalQty = shipmentgroupby.map((item: any) => item.qty);
      const totalRate = shipmentgroupby.map((item: any) => item.rate);
      const totalAmount = shipmentgroupby.map((item: any) => item.amount);

      const ship = await ShipmentDtlModel.aggregate([
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: false,
          },
        },

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
            pipeline: [
              {
                $project: {
                  contract: 1,
                  royality_approval: 1,
                },
              },
            ],
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
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brandDetails',
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
            supplierCode: 1,
            shipment: 1,
            shipment_no: 1,
            product: 1,
            createdAt: 1,
            customerDetails: 1,
            brandDetails: 1,
            shipmentDetails: 1,
            contract: { $first: '$salesContractsDetails.contract' },
            royality_approval: {
              $first: '$salesContractsDetails.royality_approval',
            },
            // salesContractsDetails: 1,
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

        { $sort: { id: 1 } },
      ]);
      let result = {
        shipmentdtl: ship,
        paginated_record: ship.length,
        total_records: total_record.length,
        totalQty: totalQty,
        totalRate: totalRate,
        totalAmount: totalAmount,
      };
      return result;
    } else if (
      input.customergroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length !== 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      input.royality_approval == ''
    ) {
      console.log(' nonadm customer group customer ');

      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const customergroup = await ShipmentDtlModel.aggregate([
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: false,
            customer: { $in: customerArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $group: {
            _id: '$customer._id',
            // Group by customer
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            customer: {
              $first: '$customer',
            },
          },
        },
        {
          $project: {
            customer_id: {
              $arrayElemAt: ['$customer._id', 0],
            },
            customer_name: {
              $arrayElemAt: ['$customer.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ]);
      const totalShipmentSum = customergroup.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = customergroup.reduce(
        (sum, item) => sum + item.qty,
        0
      );
      const totalAmountSum = customergroup.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: customergroup,
        total_records: customergroup.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.productgroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length !== 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      input.royality_approval == ''
    ) {
      console.log('nonAdm product group product ');

      const productArr = input.product_id
        ? input.product_id.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const productgroup = await ShipmentDtlModel.aggregate([
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: false,
            product: { $in: productArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
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
          $group: {
            _id: '$product._id',
            // Group by customer
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            product: {
              $first: '$product',
            },
          },
        },
        {
          $project: {
            product_id: {
              $arrayElemAt: ['$product._id', 0],
            },
            product_name: {
              $arrayElemAt: ['$product.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ]);
      const totalShipmentSum = productgroup.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = productgroup.reduce((sum, item) => sum + item.qty, 0);
      const totalAmountSum = productgroup.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: productgroup,
        total_records: productgroup.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.brandgroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length !== 0 &&
      input.royality_approval == ''
    ) {
      console.log(' nonAdm brand group brand ');

      const brandArr = input.brand
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const brandAggregationPipelineRecord: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: true,
            brand: { $in: brandArr }, // Filter by brand IDs
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand', // Lookup brand details
          },
        },
        {
          $group: {
            _id: '$brand._id', // Group by brand _id
            totalShipment: { $sum: 1 }, // Count the total shipments
            qty: { $sum: '$qty' }, // Sum of qty
            amount: { $sum: '$amount' }, // Sum of amounts
            brand: { $first: '$brand' }, // Get the first brand from the grouped data
          },
        },
        {
          $project: {
            brand_id: '$brand._id', // Directly access brand _id
            brand_name: '$brand.name', // Directly access brand name
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];

      const total_record = await ShipmentDtlModel.aggregate(
        brandAggregationPipelineRecord
          ? brandAggregationPipelineRecord
          : undefined
      );
      const totalShipmentSum = total_record.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
      const totalAmountSum = total_record.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: total_record,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.customergroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length !== 0 &&
      input.royality_approval == ''
    ) {
      console.log('nonAdm customer group brand ');

      const brandArr = input.customer
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const brandCustomerAggregationPipelineRecord: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: false,
            brand: { $in: brandArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $group: {
            _id: { brandId: '$brand._id', customerId: '$customer._id' },
            totalShipment: { $sum: 1 },
            qty: { $sum: '$qty' },
            amount: { $sum: '$amount' },
            brand: { $first: '$brand' },
            customer: { $first: '$customer' },
          },
        },
        {
          $project: {
            brand_id: { $arrayElemAt: ['$brand._id', 0] },
            brand_name: { $arrayElemAt: ['$brand.name', 0] },
            customer_id: { $arrayElemAt: ['$customer._id', 0] },
            customer_name: { $arrayElemAt: ['$customer.name', 0] },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];

      const total_record = await ShipmentDtlModel.aggregate(
        brandCustomerAggregationPipelineRecord
          ? brandCustomerAggregationPipelineRecord
          : undefined
      );

      const totalShipmentSum = total_record.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
      const totalAmountSum = total_record.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: total_record,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.customergroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length !== 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      input.royality_approval == ''
    ) {
      console.log('nonAdm customer group product ');

      const productArr = input.customer
        ? input.product_id.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const productCustomerAggregationPipelineRecord: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: false,
            product: { $in: productArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
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
          $group: {
            _id: { customerId: '$customer._id', productId: '$product._id' },
            totalShipment: { $sum: 1 },
            qty: { $sum: '$qty' },
            amount: { $sum: '$amount' },
            customer: { $first: '$customer' },
            product: { $first: '$product' },
          },
        },
        {
          $project: {
            customer_id: { $arrayElemAt: ['$customer._id', 0] },
            customer_name: { $arrayElemAt: ['$customer.name', 0] },
            product_name: { $arrayElemAt: ['$product.name', 0] },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];

      const total_record = await ShipmentDtlModel.aggregate(
        productCustomerAggregationPipelineRecord
          ? productCustomerAggregationPipelineRecord
          : undefined
      );

      const totalShipmentSum = total_record.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
      const totalAmountSum = total_record.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: total_record,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.productgroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length !== 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      input.royality_approval == ''
    ) {
      console.log('nonAdm product group customer ');

      const customerArr = input.product_id
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const productCustomerAggregationPipelineRecord: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: false,
            customer: { $in: customerArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
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
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $group: {
            _id: { productId: '$product._id', customerId: '$customer._id' },
            totalShipment: { $sum: 1 },
            qty: { $sum: '$qty' },
            amount: { $sum: '$amount' },
            product: { $first: '$product' },
            customer: { $first: '$customer' },
          },
        },
        {
          $project: {
            product_id: { $arrayElemAt: ['$product._id', 0] },
            product_name: { $arrayElemAt: ['$product.name', 0] },
            customer_id: { $arrayElemAt: ['$customer._id', 0] },
            customer_name: { $arrayElemAt: ['$customer.name', 0] },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];

      const total_record = await ShipmentDtlModel.aggregate(
        productCustomerAggregationPipelineRecord
          ? productCustomerAggregationPipelineRecord
          : undefined
      );

      const totalShipmentSum = total_record.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
      const totalAmountSum = total_record.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: total_record,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.productgroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length !== 0 &&
      input.royality_approval == ''
    ) {
      console.log(' non ADm product group brand ');

      const brandArr = input.product_id
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const productBrandAggregationPipelineRecord: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: false,
            brand: { $in: brandArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
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
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $group: {
            _id: { productId: '$product._id', brandId: '$brand._id' }, // Group by both product and brand
            totalShipment: { $sum: 1 },
            qty: { $sum: '$qty' },
            amount: { $sum: '$amount' },
            product: { $first: '$product' },
            brand: { $first: '$brand' },
          },
        },
        {
          $project: {
            product_id: { $arrayElemAt: ['$product._id', 0] },
            product_name: { $arrayElemAt: ['$product.name', 0] },
            brand_id: { $arrayElemAt: ['$brand._id', 0] },
            brand_name: { $arrayElemAt: ['$brand.name', 0] },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];

      const total_record = await ShipmentDtlModel.aggregate(
        productBrandAggregationPipelineRecord
          ? productBrandAggregationPipelineRecord
          : undefined
      );

      const totalShipmentSum = total_record.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
      const totalAmountSum = total_record.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: total_record,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.brandgroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length !== 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      input.royality_approval == ''
    ) {
      console.log(' non Adm brand group customer ');

      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      console.log(customerArr);
      const brandAggregationPipelineRecord: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: false,
            customer: { $in: customerArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
            pipeline: [
              {
                $match: {
                  isDeleted: false,
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $group: {
            _id: { brandId: '$brand._id', customerId: '$customer._id' },
            totalShipment: { $sum: 1 },
            qty: { $sum: '$qty' },
            amount: { $sum: '$amount' },
            brand: { $first: '$brand' },
            customer: { $first: '$customer' },
          },
        },
        {
          $project: {
            brand_id: { $arrayElemAt: ['$brand._id', 0] },
            brand_name: { $arrayElemAt: ['$brand.name', 0] },
            customer_id: { $arrayElemAt: ['$customer._id', 0] },
            customer_name: { $arrayElemAt: ['$customer.name', 0] },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];

      const total_record = await ShipmentDtlModel.aggregate(
        brandAggregationPipelineRecord
          ? brandAggregationPipelineRecord
          : undefined
      );

      const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
      const totalAmountSum = total_record.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const totalShipmentSum = total_record.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );
      const result = {
        Group: total_record,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.brandgroup !== '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product_id) &&
      input.product_id.length !== 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      input.royality_approval == ''
    ) {
      console.log(' non Adm brand group product ');

      const productArr = input.brand
        ? input.product_id.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const productBrandAggregationPipelineRecord: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_ship: false,
            product: { $in: productArr },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
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
          $group: {
            _id: { brandId: '$brand._id', productId: '$product._id' }, // Group by both brand and product
            totalShipment: { $sum: 1 },
            qty: { $sum: '$qty' },
            amount: { $sum: '$amount' },
            brand: { $first: '$brand' },
            product: { $first: '$product' },
          },
        },
        {
          $project: {
            brand_id: { $arrayElemAt: ['$brand._id', 0] },
            brand_name: { $arrayElemAt: ['$brand.name', 0] },
            product_id: { $arrayElemAt: ['$product._id', 0] },
            product_name: { $arrayElemAt: ['$product.name', 0] },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];

      const total_record = await ShipmentDtlModel.aggregate(
        productBrandAggregationPipelineRecord
          ? productBrandAggregationPipelineRecord
          : undefined
      );

      const totalShipmentSum = total_record.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_record.reduce((sum, item) => sum + item.qty, 0);
      const totalAmountSum = total_record.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        Group: total_record,
        total_records: total_record.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.customergroup !== '' &&
      input.productgroup == '' &&
      input.brandgroup == '' &&
      input.salesContractgroup == '' &&
      ((Array.isArray(input.product_id) && input.product_id.length !== 0) ||
        (Array.isArray(input.customer) && input.customer.length !== 0) ||
        (Array.isArray(input.brand) && input.brand.length !== 0) ||
        (Array.isArray(input.salesContract) &&
          input.salesContract.length !== 0))
    ) {
      console.log(
        ' non  Adm group with general filters brand customer product salescontract '
      );

      const salesContractArr = input.salesContract
        ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const productArr = input.product_id
        ? input.product_id.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const brandArr = input.product_id
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      let where: any = {};
      let extrafilter: any = {};
      let filter: any = {};
      let filter_records: any = {};

      if (
        customerArr.length > 0 &&
        salesContractArr.length > 0 &&
        productArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
      } else if (
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
      } else if (
        customerArr.length > 0 &&
        salesContractArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },

            brand: { $in: brandArr },
          },
        ];
        filter = {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },

            brand: { $in: brandArr },
          },
        ];
      } else if (
        productArr.length > 0 &&
        salesContractArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },

          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
      } else if (
        productArr.length > 0 &&
        customerArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },

            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },
          customer: { $in: customerArr },

          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },

            product: { $in: productArr },
            brand: { $in: brandArr },
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
      } else if (brandArr.length > 0) {
        where = {
          brand: { $in: brandArr },
        };
        filter = {
          brand: { $in: brandArr },
        };
        filter_records = {
          brand: { $in: brandArr },
        };
      } else if (brandArr.length > 0 && salesContractArr.length > 0) {
        where.$and = [
          {
            salesContract: { $in: salesContractArr },
            brandArr: { $in: brandArr },
          },
        ];
        filter = {
          salesContract: { $in: salesContractArr },
          brandArr: { $in: brandArr },
        };
        filter_records.$and = [
          {
            salesContract: { $in: salesContractArr },
            brandArr: { $in: brandArr },
          },
        ];
      } else if (brandArr.length > 0 && customerArr.length > 0) {
        where.$and = [
          {
            customer: { $in: customerArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          customer: { $in: customerArr },
          brandArr: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            brandArr: { $in: brandArr },
          },
        ];
      } else if (brandArr.length > 0 && productArr.length > 0) {
        where.$and = [
          {
            brand: { $in: brandArr },
            product: { $in: productArr },
          },
        ];
        filter = {
          brand: { $in: brandArr },
          product: { $in: productArr },
        };
        filter_records.$and = [
          {
            brand: { $in: brandArr },
            product: { $in: productArr },
          },
        ];
      }
      if (input.dcNumber) {
        extrafilter = input.dcNumber;
      }

      if (input.gpNumber) {
        extrafilter.gpNumber = input.gpNumber;
      }
      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }
      if (input.royality_approval) {
        extrafilter.royality_approval = stringToBoolean(
          input.royality_approval
        );
      }

      const customerAggregationPipelineRecords: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            adm_ship: false,
            isDeleted: false,
          },
        },
        {
          $match: filter_records,
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $group: {
            _id: '$customer._id',
            // Group by customer
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            customer: {
              $first: '$customer',
            },
          },
        },
        {
          $project: {
            customer_id: {
              $arrayElemAt: ['$customer._id', 0],
            },
            customer_name: {
              $arrayElemAt: ['$customer.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];

      const total_records = await ShipmentDtlModel.aggregate(
        customerAggregationPipelineRecords
      );

      const totalShipmentSum = total_records.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_records.reduce(
        (sum, item) => sum + item.qty,
        0
      );
      const totalAmountSum = total_records.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        customer_groupby: total_records,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.productgroup !== '' &&
      input.customergroup == '' &&
      input.brandgroup == '' &&
      input.salesContractgroup == '' &&
      ((Array.isArray(input.product_id) && input.product_id.length !== 0) ||
        (Array.isArray(input.customer) && input.customer.length !== 0) ||
        (Array.isArray(input.brand) && input.brand.length !== 0) ||
        (Array.isArray(input.salesContract) &&
          input.salesContract.length !== 0))
    ) {
      console.log(
        ' non Adm  group with general filters brand customer product salescontract'
      );

      const salesContractArr = input.salesContract
        ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const productArr = input.product_id
        ? input.product_id.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const brandArr = input.product_id
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      let where: any = {};
      let extrafilter: any = {};
      let filter: any = {};
      let filter_records: any = {};

      if (
        customerArr.length > 0 &&
        salesContractArr.length > 0 &&
        productArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
      } else if (
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
      } else if (
        customerArr.length > 0 &&
        salesContractArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },

            brand: { $in: brandArr },
          },
        ];
        filter = {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },

            brand: { $in: brandArr },
          },
        ];
      } else if (
        productArr.length > 0 &&
        salesContractArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },

          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
      } else if (
        productArr.length > 0 &&
        customerArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },

            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },
          customer: { $in: customerArr },

          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },

            product: { $in: productArr },
            brand: { $in: brandArr },
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
      } else if (brandArr.length > 0) {
        where = {
          brand: { $in: brandArr },
        };
        filter = {
          brand: { $in: brandArr },
        };
        filter_records = {
          brand: { $in: brandArr },
        };
      } else if (brandArr.length > 0 && salesContractArr.length > 0) {
        where.$and = [
          {
            salesContract: { $in: salesContractArr },
            brandArr: { $in: brandArr },
          },
        ];
        filter = {
          salesContract: { $in: salesContractArr },
          brandArr: { $in: brandArr },
        };
        filter_records.$and = [
          {
            salesContract: { $in: salesContractArr },
            brandArr: { $in: brandArr },
          },
        ];
      } else if (brandArr.length > 0 && customerArr.length > 0) {
        where.$and = [
          {
            customer: { $in: customerArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          customer: { $in: customerArr },
          brandArr: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            brandArr: { $in: brandArr },
          },
        ];
      } else if (brandArr.length > 0 && productArr.length > 0) {
        where.$and = [
          {
            brand: { $in: brandArr },
            product: { $in: productArr },
          },
        ];
        filter = {
          brand: { $in: brandArr },
          product: { $in: productArr },
        };
        filter_records.$and = [
          {
            brand: { $in: brandArr },
            product: { $in: productArr },
          },
        ];
      }
      if (input.dcNumber) {
        extrafilter = input.dcNumber;
      }

      if (input.gpNumber) {
        extrafilter.gpNumber = input.gpNumber;
      }
      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }
      if (input.royality_approval) {
        extrafilter.royality_approval = stringToBoolean(
          input.royality_approval
        );
      }
      const productAggregationPipelineRecords: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            adm_ship: false,
            isDeleted: false,
          },
        },
        { $match: where },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
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
          $group: {
            _id: '$product._id',
            // Group by customer
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            product: {
              $first: '$product',
            },
          },
        },
        {
          $project: {
            product_id: {
              $arrayElemAt: ['$product._id', 0],
            },
            product_name: {
              $arrayElemAt: ['$product.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];

      const total_records = await ShipmentDtlModel.aggregate(
        productAggregationPipelineRecords
      );

      const totalShipmentSum = total_records.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_records.reduce(
        (sum, item) => sum + item.qty,
        0
      );
      const totalAmountSum = total_records.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        product_groupby: total_records,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    } else if (
      input.brandgroup !== '' &&
      input.customergroup == '' &&
      input.productgroup == '' &&
      input.salesContractgroup == '' &&
      ((Array.isArray(input.product_id) && input.product_id.length !== 0) ||
        (Array.isArray(input.customer) && input.customer.length !== 0) ||
        (Array.isArray(input.brand) && input.brand.length !== 0) ||
        (Array.isArray(input.salesContract) &&
          input.salesContract.length !== 0))
    ) {
      console.log(
        ' non  Adm group with general filters brand customer product salescontract'
      );

      const salesContractArr = input.salesContract
        ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const productArr = input.product_id
        ? input.product_id.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const brandArr = input.brand
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      console.log(brandArr);
      let where: any = {};
      let extrafilter: any = {};
      let filter: any = {};
      let filter_records: any = {};

      if (
        customerArr.length > 0 &&
        salesContractArr.length > 0 &&
        productArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
      } else if (
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
      } else if (
        customerArr.length > 0 &&
        salesContractArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          customer: { $in: customerArr },
          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            salesContract: { $in: salesContractArr },

            brand: { $in: brandArr },
          },
        ];
      } else if (
        productArr.length > 0 &&
        salesContractArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },

          salesContract: { $in: salesContractArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            salesContract: { $in: salesContractArr },
            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
      } else if (
        productArr.length > 0 &&
        customerArr.length > 0 &&
        brandArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },

            product: { $in: productArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          product: { $in: productArr },
          customer: { $in: customerArr },
          brand: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },

            product: { $in: productArr },
            brand: { $in: brandArr },
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
      } else if (brandArr.length > 0 && salesContractArr.length > 0) {
        where.$and = [
          {
            salesContract: { $in: salesContractArr },
            brandArr: { $in: brandArr },
          },
        ];
        filter = {
          salesContract: { $in: salesContractArr },
          brandArr: { $in: brandArr },
        };
        filter_records.$and = [
          {
            salesContract: { $in: salesContractArr },
            brandArr: { $in: brandArr },
          },
        ];
      } else if (brandArr.length > 0 && customerArr.length > 0) {
        console.log(brandArr, customerArr, 'nn');
        where.$and = [
          {
            customer: { $in: customerArr },
            brand: { $in: brandArr },
          },
        ];
        filter = {
          customer: { $in: customerArr },
          brandArr: { $in: brandArr },
        };
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            brandArr: { $in: brandArr },
          },
        ];
      } else if (brandArr.length > 0 && productArr.length > 0) {
        where.$and = [
          {
            brand: { $in: brandArr },
            product: { $in: productArr },
          },
        ];
        filter = {
          brand: { $in: brandArr },
          product: { $in: productArr },
        };
        filter_records.$and = [
          {
            brand: { $in: brandArr },
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
      } else if (brandArr.length > 0) {
        where = {
          brand: { $in: brandArr },
        };
        filter = {
          brand: { $in: brandArr },
        };
        filter_records = {
          brand: { $in: brandArr },
        };
      }

      if (input.dcNumber) {
        extrafilter = input.dcNumber;
      }

      if (input.gpNumber) {
        extrafilter.gpNumber = input.gpNumber;
      }
      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }
      if (input.royality_approval) {
        extrafilter.royality_approval = stringToBoolean(
          input.royality_approval
        );
      }
      console.log(where);
      const brandAggregationPipelineRecords: any = [
        {
          $match: {
            gpDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            adm_ship: false,
            isDeleted: false,
          },
        },
        { $match: filter_records },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContractData',
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $group: {
            _id: '$brand._id',
            // Group by customer
            totalShipment: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            brand: {
              $first: '$brand',
            },
          },
        },
        {
          $project: {
            brand_id: {
              $arrayElemAt: ['$brand._id', 0],
            },
            brand_name: {
              $arrayElemAt: ['$brand.name', 0],
            },
            qty: 1,
            amount: 1,
            totalShipment: 1,
          },
        },
      ];

      const total_records = await ShipmentDtlModel.aggregate(
        brandAggregationPipelineRecords
      );

      const totalShipmentSum = total_records.reduce(
        (sum, item) => sum + item.totalShipment,
        0
      );

      const totalQtySum = total_records.reduce(
        (sum, item) => sum + item.qty,
        0
      );
      const totalAmountSum = total_records.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const result = {
        brand_groupby: total_records,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalShipmentSum: totalShipmentSum,
      };
      return result;
    }
  }
};








export const findNetShipmentDtlsByDate = async (
  input: ShipmentReportSchema
) => {
  try {
    // Destruncturing the input object to extract the required fields
    const {
      brand,
      customer,
      product_id,
      fromDate,
      toDate,
      pageno = 1,
      perPage = 10,
      gpNumber,
      dcNumber,
      royality_approval,
      Adm,
      nonAdm,
      brandgroup,
      customergroup,
      productgroup,
    } = input;

    // pagination contants
    const limit = perPage;
    const skipCount = (pageno - 1) * limit;

    //  Group condition setter
    const groupId: any = {};
    const shouldGroup = productgroup || brandgroup || customergroup;

    if (productgroup) groupId.product = '$product';
    if (brandgroup) groupId.brand = '$brand';
    if (customergroup) groupId.customer = '$customer';

    // shipment match stage
    const matchStage: any = { isDeleted: false };

    if (fromDate && toDate) {
      matchStage.gpDate = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    }

    if (product_id?.length > 0) {
      matchStage.product = new mongoose.Types.ObjectId(product_id[0]);
    }

    if (brand?.length > 0) {
      matchStage.brand = new mongoose.Types.ObjectId(brand[0]);
    }

    if (customer?.length > 0) {
      matchStage.customer = new mongoose.Types.ObjectId(customer[0]);
    }

    if (Adm) matchStage['adm_ship'] = true;
    if (nonAdm) matchStage['adm_ship'] = false;
    //
    const shipMasterMatchStage: any = { isDeleted: false };
    if (gpNumber) shipMasterMatchStage['shipments.gpNumber'] = gpNumber;
    if (dcNumber) shipMasterMatchStage['shipments.dcNumber'] = dcNumber;

    console.log(shipMasterMatchStage, 'shipMasterMatchStage');

    //  Sales Contract match stage
    const scMatchStage: any = { isDeleted: false };
    if (royality_approval == 'true')
      scMatchStage['salesContracts.royality_approval'] = true;
    if (royality_approval == 'false')
      scMatchStage['salesContracts.royality_approval'] = false;

    // Main Pipeline
    const basePipeline: any[] = [
      { $match: matchStage },

      {
        $lookup: {
          from: 'shipments',
          localField: 'shipment',
          foreignField: '_id',
          as: 'shipments',
        },
      },
      {
        $unwind: {
          path: '$shipments',
          preserveNullAndEmptyArrays: true,
        },
      },
      { $match: shipMasterMatchStage },
      {
        $lookup: {
          from: 'salescontractdtls',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'salesContracts',
        },
      },
      {
        $unwind: {
          path: '$salesContracts',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: scMatchStage,
      },
      {
        $lookup: {
          from: 'returns',
          localField: 'shipment',
          foreignField: 'shipment',
          as: 'return',
        },
      },
      {
        $unwind: {
          path: '$return',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customers',
        },
      },
      {
        $unwind: {
          path: '$customers',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'products',
        },
      },
      {
        $unwind: {
          path: '$products',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brands',
        },
      },
      {
        $unwind: {
          path: '$brands',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project: {
          shipNo: '$shipment_no',
          gpDate: '$gpDate',
          contract: '$shipments.contract',
          customer: '$customers.name',
          product: '$products.name',
          brand: '$brands.name',
          supplierCode: '$supplierCode',
          uom: '$uom',
          shipQty: '$qty',
          shipAmount: '$amount',
          returnQty: {
            $cond: {
              if: { $gt: ['$return.actualQty', null] },
              then: '$return.actualQty',
              else: 0,
            },
          },
          returnAmount: {
            $cond: {
              if: { $gt: ['$return.actualAmount', null] },
              then: '$return.actualAmount',
              else: 0,
            },
          },
          netQty: {
            $subtract: [
              { $ifNull: ['$qty', 0] },
              { $ifNull: ['$return.actualQty', 0] },
            ],
          },
          netAmount: {
            $subtract: [
              { $ifNull: ['$amount', 0] },
              { $ifNull: ['$return.actualAmount', 0] },
            ],
          },
        },
      },
      {
        $sort: {
          gpDate: -1,
        },
      },
    ];

    const basePipelineSummary: any[] = [
      { $match: matchStage },

      {
        $lookup: {
          from: 'shipments',
          localField: 'shipment',
          foreignField: '_id',
          as: 'shipments',
        },
      },
      {
        $unwind: {
          path: '$shipments',
          preserveNullAndEmptyArrays: true,
        },
      },
      { $match: shipMasterMatchStage },
      {
        $lookup: {
          from: 'salescontractdtls',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'salesContracts',
        },
      },
      {
        $unwind: {
          path: '$salesContracts',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: scMatchStage,
      },
      {
        $lookup: {
          from: 'returns',
          localField: 'shipment',
          foreignField: 'shipment',
          as: 'return',
        },
      },
      {
        $unwind: {
          path: '$return',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customers',
        },
      },
      {
        $unwind: {
          path: '$customers',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'products',
        },
      },
      {
        $unwind: {
          path: '$products',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brands',
        },
      },
      {
        $unwind: {
          path: '$brands',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project: {
          shipNo: '$shipment_no',
          gpDate: '$gpDate',
          contract: '$shipments.contract',
          customer: '$customers.name',
          product: '$products.name',
          brand: '$brands.name',
          supplierCode: '$supplierCode',
          uom: '$uom',
          shipQty: '$qty',
          shipAmount: '$amount',
          returnQty: {
            $cond: {
              if: { $gt: ['$return.actualQty', null] },
              then: '$return.actualQty',
              else: 0,
            },
          },
          returnAmount: {
            $cond: {
              if: { $gt: ['$return.actualAmount', null] },
              then: '$return.actualAmount',
              else: 0,
            },
          },
          netQty: {
            $subtract: [
              { $ifNull: ['$qty', 0] },
              { $ifNull: ['$return.actualQty', 0] },
            ],
          },
          netAmount: {
            $subtract: [
              { $ifNull: ['$amount', 0] },
              { $ifNull: ['$return.actualAmount', 0] },
            ],
          },
        },
      },
    ];

    // Group stage for aggregation
    const groupStage = {
      $group: {
        _id: groupId,
        // _id: { customer: '$customer' },
        product: { $first: '$product' }, // safe even if not grouping by product
        brand: { $first: '$brand' }, // same
        customer: { $first: '$customer' },
        totalShipQty: { $sum: '$shipQty' },
        totalReturnQty: { $sum: '$returnQty' },
        totalNetQty: { $sum: '$netQty' },
        totalShipAmount: { $sum: '$shipAmount' },
        totalReturnAmount: { $sum: '$returnAmount' },
        totalNetAmount: { $sum: '$netAmount' },
        totalShipments: { $sum: 1 },
      },
    };
    const groupStageSummary = {
      $group: {
        _id: '',
        // _id: { customer: '$customer' },
        product: { $first: '$product' },
        brand: { $first: '$brand' },
        customer: { $first: '$customer' },
        totalShipQty: { $sum: '$shipQty' },
        totalReturnQty: { $sum: '$returnQty' },
        totalNetQty: { $sum: '$netQty' },
        totalShipAmount: { $sum: '$shipAmount' },
        totalReturnAmount: { $sum: '$returnAmount' },
        totalNetAmount: { $sum: '$netAmount' },
        totalShipments: { $sum: 1 },
      },
    };

    // If grouping is not required, we can skip the group stage
    const dataPipeline = shouldGroup
      ? [...basePipeline, groupStage, { $skip: skipCount }, { $limit: limit }]
      : [...basePipeline, { $skip: skipCount }, { $limit: limit }];

    // Count pipeline for total records
    const countPipeline = shouldGroup
      ? [...basePipeline, groupStage, { $count: 'totalRecords' }]
      : [...basePipeline, { $count: 'totalRecords' }];

    // Summary pipeline for total records
    const summaryPipeline = shouldGroup
      ? [...basePipelineSummary, groupStageSummary]
      : [
        ...basePipelineSummary,
        {
          $group: {
            _id: null,
            totalShipQty: { $sum: '$shipQty' },
            totalReturnQty: { $sum: '$returnQty' },
            totalNetQty: { $sum: '$netQty' },
            totalShipAmount: { $sum: '$shipAmount' },
            totalReturnAmount: { $sum: '$returnAmount' },
            totalNetAmount: { $sum: '$netAmount' },
          },
        },
      ];

    // Executing the pipelines in parallel
    const [netshipmentdtl, totalResult, summaryResult] = await Promise.all([
      ShipmentDtlModel.aggregate(dataPipeline, { allowDiskUse: true }),
      ShipmentDtlModel.aggregate(countPipeline, { allowDiskUse: true }),
      ShipmentDtlModel.aggregate(summaryPipeline, { allowDiskUse: true }),
    ]);

    // Extracting total records and summary from the results
    const totalRecords = totalResult?.[0]?.totalRecords || 0;
    const summary = summaryResult?.[0] || {
      totalShipQty: 0,
      totalReturnQty: 0,
      totalNetQty: 0,
      totalShipAmount: 0,
      totalReturnAmount: 0,
      totalNetAmount: 0,
    };

    // Returning the final result
    return {
      netshipmentdtl,
      summary,
      pagination: {
        page: pageno,
        perPage,
        totalRecords,
        totalPages: Math.ceil(totalRecords / perPage),
      },
    };
  } catch (e) {
    console.error('Error in findNetShipmentDtlsByDate:', e);
    throw e;
  }
};
export const findNetShipmentDtlsByDatePrint = async (
  input: ShipmentReportSchema
) => {
  try {
    // Destruncturing the input object to extract the required fields
    const {
      brand,
      customer,
      product_id,
      fromDate,
      toDate,
      pageno = 1,
      perPage = 10,
      gpNumber,
      dcNumber,
      royality_approval,
      Adm,
      nonAdm,
      brandgroup,
      customergroup,
      productgroup,
    } = input;

    // pagination contants

    //  Group condition setter
    const groupId: any = {};
    const shouldGroup = productgroup || brandgroup || customergroup;

    if (productgroup) groupId.product = '$product';
    if (brandgroup) groupId.brand = '$brand';
    if (customergroup) groupId.customer = '$customer';

    // shipment match stage
    const matchStage: any = { isDeleted: false };

    if (fromDate && toDate) {
      matchStage.gpDate = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    }

    if (product_id?.length > 0) {
      matchStage.product = new mongoose.Types.ObjectId(product_id[0]);
    }

    if (brand?.length > 0) {
      matchStage.brand = new mongoose.Types.ObjectId(brand[0]);
    }

    if (customer?.length > 0) {
      matchStage.customer = new mongoose.Types.ObjectId(customer[0]);
    }

    if (Adm) matchStage['adm_ship'] = true;
    if (nonAdm) matchStage['adm_ship'] = false;

    //
    const shipMasterMatchStage: any = { isDeleted: false };
    if (gpNumber) shipMasterMatchStage['shipments.gpNumber'] = gpNumber;
    if (dcNumber) shipMasterMatchStage['shipments.dcNumber'] = dcNumber;

    //  Sales Contract match stage
    const scMatchStage: any = { isDeleted: false };
    if (royality_approval == 'true')
      scMatchStage['salesContracts.royality_approval'] = true;
    if (royality_approval == 'false')
      scMatchStage['salesContracts.royality_approval'] = false;



    // Main Pipeline
    const basePipeline: any[] = [
      { $match: matchStage },

      {
        $lookup: {
          from: 'shipments',
          localField: 'shipment',
          foreignField: '_id',
          as: 'shipments',
        },
      },
      {
        $unwind: {
          path: '$shipments',
          preserveNullAndEmptyArrays: true,
        },
      },
      { $match: shipMasterMatchStage },
      {
        $lookup: {
          from: 'salescontractdtls',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'salesContracts',
        },
      },
      {
        $unwind: {
          path: '$salesContracts',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: scMatchStage,
      },
      {
        $lookup: {
          from: 'returns',
          localField: 'shipment',
          foreignField: 'shipment',
          as: 'return',
        },
      },
      {
        $unwind: {
          path: '$return',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customers',
        },
      },
      {
        $unwind: {
          path: '$customers',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'products',
        },
      },
      {
        $unwind: {
          path: '$products',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brands',
        },
      },
      {
        $unwind: {
          path: '$brands',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project: {
          shipNo: '$shipment_no',
          gpDate: '$gpDate',
          contract: '$shipments.contract',
          customer: '$customers.name',
          product: '$products.name',
          brand: '$brands.name',
          supplierCode: '$supplierCode',
          uom: '$uom',
          shipQty: '$qty',
          shipAmount: '$amount',
          returnQty: {
            $cond: {
              if: { $gt: ['$return.actualQty', null] },
              then: '$return.actualQty',
              else: 0,
            },
          },
          returnAmount: {
            $cond: {
              if: { $gt: ['$return.actualAmount', null] },
              then: '$return.actualAmount',
              else: 0,
            },
          },
          netQty: {
            $subtract: [
              { $ifNull: ['$qty', 0] },
              { $ifNull: ['$return.actualQty', 0] },
            ],
          },
          netAmount: {
            $subtract: [
              { $ifNull: ['$amount', 0] },
              { $ifNull: ['$return.actualAmount', 0] },
            ],
          },
        },
      },
      {
        $sort: {
          gpDate: -1,
          // shipQty: -1
        }
      }
    ];

    const sortStage = { $sort: { totalNetQty: -1 } };

    // Group stage for aggregation
    const groupStage = {
      $group: {
        _id: groupId,
        product: { $first: '$product' },
        brand: { $first: '$brand' },
        customer: { $first: '$customer' },
        totalShipQty: { $sum: '$shipQty' },
        totalReturnQty: { $sum: '$returnQty' },
        totalNetQty: { $sum: '$netQty' },
        totalShipAmount: { $sum: '$shipAmount' },
        totalReturnAmount: { $sum: '$returnAmount' },
        totalNetAmount: { $sum: '$netAmount' },
        totalShipments: { $sum: 1 }
      }
    };



    const groupStageSummary = {
      $group: {
        _id: '',
        // _id: { customer: '$customer' },
        product: { $first: '$product' }, // safe even if not grouping by product
        brand: { $first: '$brand' }, // same
        customer: { $first: '$customer' },
        totalShipQty: { $sum: '$shipQty' },
        totalReturnQty: { $sum: '$returnQty' },
        totalNetQty: { $sum: '$netQty' },
        totalShipAmount: { $sum: '$shipAmount' },
        totalReturnAmount: { $sum: '$returnAmount' },
        totalNetAmount: { $sum: '$netAmount' },
        totalShipments: { $sum: 1 },
      },



    };

    // If grouping is not required, we can skip the group stage
    const dataPipeline = shouldGroup
      ? [...basePipeline, groupStage, sortStage]
      : [...basePipeline];

    // Count pipeline for total records
    // const countPipeline = shouldGroup
    //   ? [...basePipeline, groupStage, { $count: 'totalRecords' }]
    //   : [...basePipeline, { $count: 'totalRecords' }];

    // Summary pipeline for total records
    const summaryPipeline = shouldGroup
      ? [...basePipeline, groupStageSummary]
      : [
        ...basePipeline,
        {
          $group: {
            _id: null,
            totalShipQty: { $sum: '$shipQty' },
            totalReturnQty: { $sum: '$returnQty' },
            totalNetQty: { $sum: '$netQty' },
            totalShipAmount: { $sum: '$shipAmount' },
            totalReturnAmount: { $sum: '$returnAmount' },
            totalNetAmount: { $sum: '$netAmount' },
          },
        },
      ];

    // Executing the pipelines in parallel
    const [netshipmentdtl, summaryResult] = await Promise.all([
      ShipmentDtlModel.aggregate(dataPipeline, { allowDiskUse: true }),
      // ShipmentDtlModel.aggregate(countPipeline, { allowDiskUse: true }),
      ShipmentDtlModel.aggregate(summaryPipeline, { allowDiskUse: true }),
    ]);

    // Extracting total records and summary from the results
    // const totalRecords = totalResult?.[0]?.totalRecords || 0;
    const summary = summaryResult?.[0] || {
      totalShipQty: 0,
      totalReturnQty: 0,
      totalNetQty: 0,
      totalShipAmount: 0,
      totalReturnAmount: 0,
      totalNetAmount: 0,
    };

    // Returning the final result
    return {
      netshipmentdtl,
      summary,
      // pagination: {
      //   page: pageno,
      //   perPage,
      //   totalRecords,
      //   totalPages: Math.ceil(totalRecords / perPage),
      // }
    };
  } catch (e) {
    console.error('Error in findNetShipmentDtlsByDate:', e);
    throw e;
  }
};

