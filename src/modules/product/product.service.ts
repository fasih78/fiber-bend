import mongoose from 'mongoose';
import { CurrencyModel } from '../currency/currency.model';
import { findCurrencyById } from '../currency/currency.service';
import { ProductModel } from './product.model';
import dayjs from 'dayjs';
const utc = require('dayjs/plugin/utc');
import {
  CreateProductSchema,
  ProductPaginationSchema,
  ProductPrintSchema,
  ProductSummaryPrintSchema,
  ProductSummarySchema,
  Productdrop_downSchema,
  StockTransactionReportSchema,
} from './product.schema';
dayjs.extend(utc);
import { findSalesContractsWithInvoice } from '../sales_contract/sales_contract.service';
import { date, number } from 'zod';
import { ShipmentDtlModel } from '../shipment/shipment_dtls.model';
import { SalesContractDtlModel } from '../sales_contract/sales_contract_dtl.model';
import { pipeline } from 'stream';
import { ProductDtlModel } from './product_dtl.model';
import salesContractRoutes from '../sales_contract/sales_contract.routes';
import { CustomerModel } from '../customer/customer.model';

export const createProduct = async (input: CreateProductSchema) => {
  const { id, name, price, royaltyRate, productDtl } = input;

  const product = await ProductModel.create({
    id,
    name,
    price,
    date: dayjs(Date.now()).format('YYYY-MM-DD'),
    royaltyRate,
  });
  for (const prod of productDtl) {
    const productdtl = await ProductDtlModel.create({
      product_id: id,
      suppliercode: prod.productCode,
      date: dayjs(Date.now()).format('YYYY-MM-DD'),
      royaltyRate: royaltyRate,
      producttype: prod.type,
      product: new mongoose.Types.ObjectId(product._id),
      // currency: new mongoose.Types.ObjectId(prod.currency),
    });
  }

  return product;
};

export const getNewProductId = async () => {
  const product = await ProductModel.findOne()
    .sort({ field: 'asc', _id: -1 })
    .limit(1);

  let newId: number = 1;
  if (product != null) {
    newId = product.id + 1;
  }

  return newId;
};

export const findProductsPagination = async (
  input: ProductPaginationSchema
) => {
  const limit = input.perPage;
  const skipCount = (input.pageno - 1) * limit;
  const productrecord = await ProductModel.countDocuments({ isDeleted: false });
  const searchQuery = new RegExp(`^${input?.name}`, 'i');
  const productrecords = await ProductModel.find({
    isDeleted: false,
    name: { $regex: searchQuery },
  });
  if (input.name == '') {
    const product = await ProductModel.aggregate([
      {
        $match: {
          isDeleted: false,
        },
      },
      { $skip: skipCount },
      { $limit: limit },
      { $sort: { id: 1 } },
    ]);
    const result = {
      product: product,
      total_record: productrecord,
    };
    return result;
  } else {
    const product = await ProductModel.aggregate([
      {
        $match: {
          isDeleted: false,
          name: { $regex: searchQuery },
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
      { $skip: skipCount },
      { $limit: limit },
      { $sort: { id: 1 } },
    ]);
    const result = {
      product: product,
      total_record: productrecords.length,
    };
    return result;
  }
};
export const findProducts = async () => {
  const product = await ProductModel.aggregate([
    {
      $match: {
        isDeleted: false,
      },
    },
    {
      $lookup: {
        from: 'productdtls',
        localField: '_id',
        foreignField: 'product',
        as: 'productdtlData',
      },
    },
    // {
    //   $lookup:{
    //     from:'currencies',
    //     localField:'currency',
    //     foreignField:'_id',
    //     as:'currencyData'
    //   }
    // }
  ]);
  const records = product.length;
  const result = {
    product,
    records,
  };
  return result;
};

export const deleteProducts = async () => {
  return ProductModel.deleteMany({});
};

export const deleteProductById = async (id: string) => {
  const product = await ProductModel.findByIdAndUpdate(
    { _id: id },
    {
      $set: {
        isDeleted: true,
      },
    }
  );

  const productdetail = await ProductDtlModel.updateMany(
    { product: new mongoose.Types.ObjectId(id) },
    {
      $set: {
        isDeleted: true,
      },
    }
  );

  console.log(productdetail);
  return { success: true };
};

export const updateProductById = async (
  id: string,
  input: CreateProductSchema
) => {
  const { name, price, royaltyRate, productDtl } = input;

  const product = await ProductModel.findByIdAndUpdate(id, {
    name,
    price,
    date: dayjs(Date.now()).format('YYYY-MM-DD'),
    royaltyRate,
  });
  await ProductDtlModel.deleteMany({ product: id });
  for (const prod of productDtl) {
    const productdtl = await ProductDtlModel.create({
      product_id: prod.product_id,
      suppliercode: prod.productCode,
      date: dayjs(Date.now()).format('YYYY-MM-DD'),
      royaltyRate: royaltyRate,
      producttype: prod.type,
      product: new mongoose.Types.ObjectId(product._id),
      currency: new mongoose.Types.ObjectId(prod.currency),
    });
  }
  return { success: true };
};

export const Productdrop_down = async (input: Productdrop_downSchema) => {
  const limit = input?.limit;
  const searchQuery = new RegExp(`^${input?.name}`, 'i');

  if (input.record == true) {
    const product = await ProductModel.aggregate([
      {
        $project: {
          name: 1,
        },
      },
      { $sort: { name: 1 } },
    ]).exec();

    return product;
  } else if (input.name !== '') {
    const product = await ProductModel.aggregate([
      {
        $match: {
          name: { $regex: searchQuery },
        },
      },
      { $sort: { name: 1 } },
      { $limit: limit },
    ]).exec();

    return product;
  } else {
    const product = await ProductModel.aggregate([{ $limit: limit }]).exec();

    return product;
  }
};

export const stockReport = async (input: StockTransactionReportSchema) => {
  const sortDirection: 1 | -1 = input?.sort === 1 ? 1 : -1;

  if (
    input.name == '' &&
    input.transactiongroup == '' &&
    Array.isArray(input.product_id) &&
    input.product_id.length == 0
  ) {
    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;

    console.log('stock report');

    const stockAggregationPipelineRecord: any = [
      {
        $match: {
          _id: { $exists: true },
          isDeleted:false
        },
      },
      {
        $lookup: {
          from: 'salescontractdtls',
          let: { productId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$product', '$$productId'] },
                    { $eq: ['$isDeleted', false] },
                    {
                      $gte: ['$contractDate', new Date('2020-01-01T00:00:00Z')],
                    },
                    { $lte: ['$contractDate', new Date()] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: '$product',
                totalqty_saleadm: {
                  $sum: {
                    $cond: [{ $eq: ['$InHouse', true] }, '$qty', 0],
                  },
                },
              },
            },
          ],
          as: 'salecontract_qty',
        },
      },
      {
        $lookup: {
          from: 'productiondtls',
          localField: '_id',
          foreignField: 'product',
          as: 'production_qty',
        },
      },
      {
        $lookup: {
          from: "returns",
          localField: "_id",
          foreignField: "product",
          as: "returns"
        },
      },
      {
        $lookup: {
          from: 'shipmentdtls',
          let: { productId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$product', '$$productId'] },
                    { $eq: ['$isDeleted', false] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: '$product',
                total_qty_shipped: { $sum: '$qty' },
              },
            },
          ],
          as: 'shipment_qty',
        },
      },
      {
        $addFields: {
          production_totalqty: { $sum: '$production_qty.qty' },
          total_qty_shipped: {
            $cond: {
              if: { $gt: [{ $size: '$shipment_qty' }, 0] },
              then: { $arrayElemAt: ['$shipment_qty.total_qty_shipped', 0] },
              else: 0,
            },
          },
          total_ship_return: {
            $cond: {
              if: { $gt: [{ $size: '$returns' }, 0] },
              then: { $arrayElemAt: ['$returns.actualQty', 0] },
              else: 0,
            },
          },
          totalqty_saleadm: {
            $cond: {
              if: { $gt: [{ $size: '$salecontract_qty' }, 0] },
              then: { $arrayElemAt: ['$salecontract_qty.totalqty_saleadm', 0] },
              else: 0,
            },
          },
        },
      },
      // {
      //   $addFields: {
      //     stock: {

      //       $subtract: [
      //         '$production_totalqty', // Production quantity
      //         '$total_qty_shipped', // Shipment quantity
      //       ],
      //     },
      //   },
      // },
      {
        $addFields: {
          stock: {
            $add: [
              {
                $subtract: [
                  '$production_totalqty',
                  '$total_qty_shipped',
                ],
              },
              '$total_ship_return'
            ],
          },
        },
      },
      {
        $project: {
          _id: 0,
          name: 1,
          totalqty_saleadm: 1,
          total_ship_return: 1,
          production_totalqty: 1,
          total_qty_shipped: 1,
          stock: 1,
        },
      },

      { $sort: { production_totalqty: input?.sort } },

    ];
    const stockAggregationPipeline: any = [
      {
        $match: {
          _id: { $exists: true },
          isDeleted:false
        },
      },
      {
        $lookup: {
          from: 'salescontractdtls',
          let: { productId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$product', '$$productId'] },
                    { $eq: ['$isDeleted', false] },
                    {
                      $gte: ['$contractDate', new Date('2020-01-01T00:00:00Z')],
                    },
                    { $lte: ['$contractDate', new Date()] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: '$product',
                totalqty_saleadm: {
                  $sum: {
                    $cond: [{ $eq: ['$InHouse', true] }, '$qty', 0],
                  },
                },
              },
            },
          ],
          as: 'salecontract_qty',
        },
      },
      {
        $lookup: {
          from: 'productiondtls',
          localField: '_id',
          foreignField: 'product',
          as: 'production_qty',
        },
      },
      {
        $lookup: {
          from: "returns",
          localField: "_id",
          foreignField: "product",
          as: "returns"
        },
      },
      {
        $lookup: {
          from: 'shipmentdtls',
          let: { productId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$product', '$$productId'] },
                    { $eq: ['$isDeleted', false] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: '$product',
                total_qty_shipped: { $sum: '$qty' },
              },
            },
          ],
          as: 'shipment_qty',
        },
      },
      {
        $addFields: {
          production_totalqty: { $sum: '$production_qty.qty' },
          total_qty_shipped: {
            $cond: {
              if: { $gt: [{ $size: '$shipment_qty' }, 0] },
              then: { $arrayElemAt: ['$shipment_qty.total_qty_shipped', 0] },
              else: 0,
            },
          },
          total_ship_return: {
            $cond: {
              if: { $gt: [{ $size: '$returns' }, 0] },
              then: { $arrayElemAt: ['$returns.actualQty', 0] },
              else: 0,
            },
          },
          totalqty_saleadm: {
            $cond: {
              if: { $gt: [{ $size: '$salecontract_qty' }, 0] },
              then: { $arrayElemAt: ['$salecontract_qty.totalqty_saleadm', 0] },
              else: 0,
            },
          },
        },
      },
      // {
      //   $addFields: {
      //     stock: {

      //       $subtract: [
      //         '$production_totalqty', // Production quantity
      //         '$total_qty_shipped', // Shipment quantity
      //       ],
      //     },
      //   },
      // },
      {
        $addFields: {
          stock: {
            $add: [
              {
                $subtract: [
                  '$production_totalqty',
                  '$total_qty_shipped',
                ],
              },
              '$total_ship_return'
            ],
          },
        },
      },
      {
        $project: {
          _id: 0,
          name: 1,
          totalqty_saleadm: 1,
          total_ship_return: 1,
          production_totalqty: 1,
          total_qty_shipped: 1,
          stock: 1,
        },
      },
      { $sort: { stock: sortDirection } },
      { $skip: skipCount },
      { $limit: limit },
    ];

    const stockDetailReport = await ProductModel.aggregate(
      stockAggregationPipeline ? stockAggregationPipeline : null
    );
    const total_records = await ProductModel.aggregate(
      stockAggregationPipelineRecord ? stockAggregationPipelineRecord : null
    );

    const totalSumProductionQty = stockDetailReport.reduce(
      (sum, item) => sum + item.production_totalqty,
      0
    );
    const totalSumShipReturnnQty = stockDetailReport.reduce(
      (sum, item) => sum + item.total_ship_return,
      0
    );
    const totalSumSaleAdmQty = stockDetailReport.reduce(
      (sum, item) => sum + item.totalqty_saleadm,
      0
    );
    const totalSumSaleNonAdmQty = stockDetailReport.reduce(
      (sum, item) => sum + item.total_qty_shipped,
      0
    );
    const totalSumStock = stockDetailReport.reduce(
      (sum, item) => sum + item.stock,
      0
    );
    const result = {
      stock_Detail: stockDetailReport,
      totalSumShipReturnnQty: totalSumShipReturnnQty,
      paginated_Record: stockDetailReport.length,
      total_Records: total_records.length,
      totalSumProductionQty: totalSumProductionQty,
      totalSumSaleAdmQty: totalSumSaleAdmQty,
      totalSumSaleNonAdmQty: totalSumSaleNonAdmQty,
      totalSumStock: totalSumStock,
    };

    return result;
  } else if (
    Array.isArray(input.product_id) &&
    input.product_id.length !== 0 &&
    input.name == '' &&
    input.transactiongroup == ''
  ) {
    console.log('only product summary');
    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;

    const productArr = input.product_id
      ? input.product_id.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];

    // const stockDetailReport = await ProductModel.aggregate([
    //   {
    //     $match: {
    //       _id: { $in: productArr },
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'productiondtls',
    //       localField: '_id',
    //       foreignField: 'product',
    //       as: 'production_qty',
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
    //       production_totalqty: {
    //         $sum: {
    //           $map: {
    //             input: '$production_qty',
    //             as: 'item',
    //             in: '$$item.qty',
    //           },
    //         },
    //       },
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'salescontractdtls',
    //       localField: '_id',
    //       foreignField: 'product',
    //       as: 'adm_qty',
    //       pipeline: [
    //         {
    //           $match: {
    //             InHouse: true,
    //           },
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
    //       totalqty_saleadm: {
    //         $sum: {
    //           $map: {
    //             input: '$adm_qty',
    //             as: 'item',
    //             in: '$$item.qty',
    //           },
    //         },
    //       },
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'shipmentdtls',
    //       localField: '_id',
    //       foreignField: 'product',
    //       as: 'non_admqty',
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
    //       totalqty_salenonadm: {
    //         $sum: {
    //           $map: {
    //             input: '$non_admqty',
    //             as: 'item',
    //             in: '$$item.qty',
    //           },
    //         },
    //       },
    //     },
    //   },
    //   {
    //     $addFields: {
    //       stock: {
    //         $subtract: [
    //           '$production_totalqty',
    //           { $sum: ['$totalqty_saleadm', '$totalqty_salenonadm'] },
    //         ],
    //       },
    //     },
    //   },
    //   // {
    //   //   $addFields: {
    //   //     stock: {
    //   //       $subtract: [
    //   //         "$production_totalqty",
    //   //         { $sum: ["$totalqty_saleadm", "$totalqty_salenonadm"] }
    //   //       ]
    //   //     }
    //   //   }
    //   // },

    //   // {
    //   //   $addFields: {
    //   //     stock: { '$abs': '$stock' }
    //   //   }
    //   // },
    //   {
    //     $project: {
    //       name: 1,
    //       production_totalqty: 1,
    //       totalqty_saleadm: 1,
    //       totalqty_salenonadm: 1,
    //       stock: 1,
    //     },
    //   },
    //   { $sort: { production_totalqty: sortDirection } },
    //   { $skip: skipCount },
    //   { $limit: limit },
    // ]);
    const stockAggregationPipelineRecord: any = [
      {
        $match: {
          // _id: { $exists: true },
          _id: { $in: productArr },
        },
      },
      {
        $lookup: {
          from: 'salescontractdtls',
          let: { productId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$product', '$$productId'] },
                    { $eq: ['$isDeleted', false] },
                    {
                      $gte: ['$contractDate', new Date('2020-01-01T00:00:00Z')],
                    },
                    { $lte: ['$contractDate', new Date()] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: '$product',
                totalqty_saleadm: {
                  $sum: {
                    $cond: [{ $eq: ['$InHouse', true] }, '$qty', 0],
                  },
                },
              },
            },
          ],
          as: 'salecontract_qty',
        },
      },
      {
        $lookup: {
          from: 'productiondtls',
          localField: '_id',
          foreignField: 'product',
          as: 'production_qty',
        },
      },
      {
        $lookup: {
          from: 'shipmentdtls',
          let: { productId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$product', '$$productId'] },
                    { $eq: ['$isDeleted', false] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: '$product',
                total_qty_shipped: { $sum: '$qty' },
              },
            },
          ],
          as: 'shipment_qty',
        },
      },
      {
        $addFields: {
          production_totalqty: { $sum: '$production_qty.qty' },
          total_qty_shipped: {
            $cond: {
              if: { $gt: [{ $size: '$shipment_qty' }, 0] },
              then: { $arrayElemAt: ['$shipment_qty.total_qty_shipped', 0] },
              else: 0,
            },
          },
          totalqty_saleadm: {
            $cond: {
              if: { $gt: [{ $size: '$salecontract_qty' }, 0] },
              then: { $arrayElemAt: ['$salecontract_qty.totalqty_saleadm', 0] },
              else: 0,
            },
          },
        },
      },
      {
        $addFields: {
          stock: {
            $subtract: [
              '$production_totalqty', // Production quantity
              '$total_qty_shipped', // Shipment quantity
            ],
          },
        },
      },
      {
        $project: {
          _id: 0,
          name: 1,
          totalqty_saleadm: 1,
          production_totalqty: 1,
          total_qty_shipped: 1,
          stock: 1,
        },
      },
      { $sort: { production_totalqty: input?.sort } },
    ];
    const stockAggregationPipeline: any = [
      {
        $match: {
          // _id: { $exists: true },
          _id: { $in: productArr },
        },
      },
      {
        $lookup: {
          from: 'salescontractdtls',
          let: { productId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$product', '$$productId'] },
                    { $eq: ['$isDeleted', false] },
                    {
                      $gte: ['$contractDate', new Date('2020-01-01T00:00:00Z')],
                    },
                    { $lte: ['$contractDate', new Date()] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: '$product',
                totalqty_saleadm: {
                  $sum: {
                    $cond: [{ $eq: ['$InHouse', true] }, '$qty', 0],
                  },
                },
              },
            },
          ],
          as: 'salecontract_qty',
        },
      },
      {
        $lookup: {
          from: 'productiondtls',
          localField: '_id',
          foreignField: 'product',
          as: 'production_qty',
        },
      },
      {
        $lookup: {
          from: 'shipmentdtls',
          let: { productId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$product', '$$productId'] },
                    { $eq: ['$isDeleted', false] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: '$product',
                total_qty_shipped: { $sum: '$qty' },
              },
            },
          ],
          as: 'shipment_qty',
        },
      },
      {
        $addFields: {
          production_totalqty: { $sum: '$production_qty.qty' },
          total_qty_shipped: {
            $cond: {
              if: { $gt: [{ $size: '$shipment_qty' }, 0] },
              then: { $arrayElemAt: ['$shipment_qty.total_qty_shipped', 0] },
              else: 0,
            },
          },
          totalqty_saleadm: {
            $cond: {
              if: { $gt: [{ $size: '$salecontract_qty' }, 0] },
              then: { $arrayElemAt: ['$salecontract_qty.totalqty_saleadm', 0] },
              else: 0,
            },
          },
        },
      },
      {
        $addFields: {
          stock: {
            $subtract: [
              '$production_totalqty', // Production quantity
              '$total_qty_shipped', // Shipment quantity
            ],
          },
        },
      },
      {
        $project: {
          _id: 0,
          name: 1,
          totalqty_saleadm: 1,
          production_totalqty: 1,
          total_qty_shipped: 1,
          stock: 1,
        },
      },
      { $sort: { stock: sortDirection } },
      { $skip: skipCount },
      { $limit: limit },
    ];
    const stockDetailReport = await ProductModel.aggregate(
      stockAggregationPipeline ? stockAggregationPipeline : null
    );
    const total_records = await ProductModel.aggregate(
      stockAggregationPipelineRecord ? stockAggregationPipelineRecord : null
    );
    const totalSumProductionQty = stockDetailReport.reduce(
      (sum, item) => sum + item.production_totalqty,
      0
    );
    const totalSumSaleAdmQty = stockDetailReport.reduce(
      (sum, item) => sum + item.totalqty_saleadm,
      0
    );
    const totalSumShipQty = stockDetailReport.reduce(
      (sum, item) => sum + item.total_qty_shipped,
      0
    );
    const totalSumStock = stockDetailReport.reduce(
      (sum, item) => sum + item.stock,
      0
    );
    const result = {
      stock_Detail: stockDetailReport,
      total_Records: stockDetailReport.length,
      totalSumProductionQty: totalSumProductionQty,
      totalSumShipmentQty: totalSumShipQty,
      totalSumSaleAdmQty: totalSumSaleAdmQty,
      totalSumStock: totalSumStock,
    };
    return result;
  } else if (
    input.transactiongroup !== '' &&
    Array.isArray(input.product_id) &&
    input.product_id.length !== 0
  ) {
    console.log('transaction   ==== group by');
    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;
    const productArr = input.product_id
      ? input.product_id.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const transaction_groupbyRecords = await ShipmentDtlModel.aggregate([
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate)
          },
          isDeleted: false,

        }
      },
      {
        $match: {
          product: { $in: productArr },
        },
      },
      {
        $lookup: {
          from: "salescontracts",
          localField: "salesContract",
          foreignField: "_id",
          as: "salesContractData"
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "productData"
        }
      },
      {
        $lookup: {
          from: "customers",
          localField: "customer",
          foreignField: "_id",
          as: "customerData"
        }
      },
      {
        $lookup: {
          from: "returns",
          localField: "shipment",
          foreignField: "shipment",
          as: "returns"
        }
      },
      {
        $unwind: {
          path: "$returns",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: {
          path: "$customerData",
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $unwind: {
          path: "$salesContractData",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: {
          path: "$productData",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 0,
          shipmentId: "$_id",
          ShipmentNo: "$shipment_no",
          ship_lot: "$supplierCode",
          date: "$gpDate",
          productName: "$productData.name",
          customerName: "$customerData.name",
          product: "$product",
          shipmentQty: "$qty",
          returnQty: {
            $ifNull: ["$returns.actualQty", 0]
          },
          productionQty: {
            $literal: 0
          },
          // Default to 0 for shipment records
          salesContractPO: "$salesContractData.po",
          ProductionTransactionNo: {
            $literal: null
          },
          type: "shipment"
        }
      },
      {
        $unionWith: {
          coll: "productiondtls",
          pipeline: [
            {
              $match: {
                product: { $in: productArr },
              },
            },
            {
              $lookup: {
                from: "productions",
                localField: "production",
                foreignField: "_id",
                as: "productionMaster"
              }
            },
            {
              $lookup: {
                from: "products",
                localField: "product",
                foreignField: "_id",
                as: "productData"
              }
            },
            {
              $unwind: {
                path: "$productionMaster"
              }
            },
            {
              $unwind: {
                path: "$productData"
              }
            },
            {
              $project: {
                _id: 0,
                shipmentId: "$_id",
                production_lot: "$lot",
                ship_lot: 1,
                ShipmentNo: "$shipment_no",
                date: "$date",
                productName: "$productData.name",
                // customerName:'$customerData.name',
                product: "$product",
                shipmentQty: {
                  $literal: 0
                },
                returnQty: {
                  $ifNull: ["$returnQty", 0]
                },
                // Default to 0 for production records
                productionQty: "$qty",
                salesContractPO: {
                  $literal: null
                },
                ProductionLotNo:
                  "$productionMaster.lot_no",
                ProductionTransactionNo:
                  "$productionMaster.tran",
                type: "production"
              }
            }
          ]
        }
      },
      {
        $addFields: {
          date: {
            $ifNull: ["$date", "$gpDate"]
          }
        }
      },
      {
        $sort: {
          date: -1
        }
      },
      {
        $setWindowFields: {
          sortBy: {
            date: 1
          },
          output: {
            balance: {
              $sum: {
                $add: [
                  {
                    $subtract: [
                      "$productionQty",
                      "$shipmentQty"
                    ]
                  },
                  {
                    $ifNull: ["$returnQty", 0]
                  }
                ]
              },
              window: {
                documents: ["unbounded", "current"]
              }
            }
          }
        }
      },
      {
        $project: {
          shipmentId: 1,
          ShipmentNo: 1,
          ship_lot: 1,
          date: 1,
          production_lot: 1,
          customerName: 1,
          productName: 1,
          product: 1,
          shipmentQty: 1,
          returnQty: 1,
          productionQty: 1,
          balance: 1,
          salesContractPO: 1,
          ProductionLotNo: 1,
          ProductionTransactionNo: 1
        }
      },

    ])
    const transaction_groupbys = await ShipmentDtlModel.aggregate(

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
            // ship_lot:'$lot',
            ship_lot: '$supplierCode',
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
                  production_lot: '$lot',
                  ship_lot: 1,
                  ShipmentNo: '$shipment_no',
                  date: '$date',
                  productName: '$productData.name',
                  // customerName:'$customerData.name',
                  product: '$product',
                  shipmentQty: { $literal: 0 }, // Default to 0 for production records
                  productionQty: '$qty',
                  salesContractPO: { $literal: null },
                  ProductionTransactionNo: '$productionMaster.tran',
                  ProductionLotNo: '$productionMaster.lot_no',
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
            ship_lot: 1,
            date: 1,
            production_lot: 1,
            ProductionLotNo: 1,
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
        { $limit: limit }
      ]
    );

    const transaction_groupby = await ShipmentDtlModel.aggregate([
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate)
          },
          isDeleted: false,
          return: true
        }
      },
      {
        $match: {
          product: { $in: productArr },
        },
      },
      {
        $lookup: {
          from: "salescontracts",
          localField: "salesContract",
          foreignField: "_id",
          as: "salesContractData"
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "productData"
        }
      },
      {
        $lookup: {
          from: "customers",
          localField: "customer",
          foreignField: "_id",
          as: "customerData"
        }
      },
      {
        $lookup: {
          from: "returns",
          localField: "shipment",
          foreignField: "shipment",
          as: "returns"
        }
      },
      {
        $unwind: {
          path: "$returns",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: {
          path: "$customerData",
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $unwind: {
          path: "$salesContractData",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: {
          path: "$productData",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 0,
          shipmentId: "$_id",
          ShipmentNo: "$shipment_no",
          ship_lot: "$supplierCode",
          date: "$gpDate",
          productName: "$productData.name",
          customerName: "$customerData.name",
          product: "$product",
          shipmentQty: "$qty",
          returnQty: {
            $ifNull: ["$returns.actualQty", 0]
          },
          productionQty: {
            $literal: 0
          },
          // Default to 0 for shipment records
          salesContractPO: "$salesContractData.po",
          ProductionTransactionNo: {
            $literal: null
          },
          type: "shipment"
        }
      },
      {
        $unionWith: {
          coll: "productiondtls",
          pipeline: [
            {
              $match: {
                product: { $in: productArr },
              },
            },
            {
              $lookup: {
                from: "productions",
                localField: "production",
                foreignField: "_id",
                as: "productionMaster"
              }
            },
            {
              $lookup: {
                from: "products",
                localField: "product",
                foreignField: "_id",
                as: "productData"
              }
            },
            {
              $unwind: {
                path: "$productionMaster"
              }
            },
            {
              $unwind: {
                path: "$productData"
              }
            },
            {
              $project: {
                _id: 0,
                shipmentId: "$_id",
                production_lot: "$lot",
                ship_lot: 1,
                ShipmentNo: "$shipment_no",
                date: "$date",
                productName: "$productData.name",
                // customerName:'$customerData.name',
                product: "$product",
                shipmentQty: {
                  $literal: 0
                },
                returnQty: {
                  $ifNull: ["$returnQty", 0]
                },
                // Default to 0 for production records
                productionQty: "$qty",
                salesContractPO: {
                  $literal: null
                },
                ProductionLotNo:
                  "$productionMaster.lot_no",
                ProductionTransactionNo:
                  "$productionMaster.tran",
                type: "production"
              }
            }
          ]
        }
      },
      {
        $addFields: {
          date: {
            $ifNull: ["$date", "$gpDate"]
          }
        }
      },
      {
        $sort: {
          date: -1
        }
      },
      {
        $setWindowFields: {
          sortBy: {
            date: 1
          },
          output: {
            balance: {
              $sum: {
                $add: [
                  {
                    $subtract: [
                      "$productionQty",
                      "$shipmentQty"
                    ]
                  },
                  {
                    $ifNull: ["$returnQty", 0]
                  }
                ]
              },
              window: {
                documents: ["unbounded", "current"]
              }
            }
          }
        }
      },
      {
        $project: {
          shipmentId: 1,
          ShipmentNo: 1,
          ship_lot: 1,
          date: 1,
          production_lot: 1,
          customerName: 1,
          productName: 1,
          product: 1,
          shipmentQty: 1,
          returnQty: 1,
          productionQty: 1,
          balance: 1,
          salesContractPO: 1,
          ProductionLotNo: 1,
          ProductionTransactionNo: 1
        }
      },
      { $skip: skipCount },
      { $limit: limit },
    ])
    const totalShipmentSum = transaction_groupbyRecords.reduce(
      (sum, item) => sum + item.shipmentQty,
      0
    );
    const totalProductionSum = transaction_groupbyRecords.reduce(
      (sum, item) => sum + item.productionQty,
      0
    );
    const totalReturnQtySum = transaction_groupbyRecords.reduce(
      (sum, item) => sum + item.returnQty,
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
      totalReturnQtySum: totalReturnQtySum,
      totalBalanceSum: totalBalanceSum,
      total_Records: transaction_groupbyRecords.length,
    };
    return result;
  }
};
export const stockReportPrint = async (input: ProductPrintSchema) => {
  const sortDirection: 1 | -1 = input?.sort === 1 ? 1 : -1;
  if (
    input.name == '' &&
    input.transactiongroup == '' &&
    Array.isArray(input.product_id) &&
    input.product_id.length == 0
  ) {

    const sortDirection: 1 | -1 = input?.sort === 1 ? 1 : -1;

    const stockDetailReport = await ProductModel.aggregate([
      {
        $match: {
          _id: { $exists: true },
        },
      },
      {
        $lookup: {
          from: 'salescontractdtls',
          let: { productId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$product', '$$productId'] },
                    { $eq: ['$isDeleted', false] },
                    {
                      $gte: ['$contractDate', new Date('2020-01-01T00:00:00Z')],
                    },
                    { $lte: ['$contractDate', new Date()] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: '$product',
                totalqty_saleadm: {
                  $sum: {
                    $cond: [{ $eq: ['$InHouse', true] }, '$qty', 0],
                  },
                },
              },
            },
          ],
          as: 'salecontract_qty',
        },
      },
      {
        $lookup: {
          from: 'productiondtls',
          localField: '_id',
          foreignField: 'product',
          as: 'production_qty',
        },
      },
      {
        $lookup: {
          from: "returns",
          localField: "_id",
          foreignField: "product",
          as: "returns"
        },
      },
      {
        $lookup: {
          from: 'shipmentdtls',
          let: { productId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$product', '$$productId'] },
                    { $eq: ['$isDeleted', false] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: '$product',
                total_qty_shipped: { $sum: '$qty' },
              },
            },
          ],
          as: 'shipment_qty',
        },
      },
      {
        $addFields: {
          production_totalqty: { $sum: '$production_qty.qty' },
          total_qty_shipped: {
            $cond: {
              if: { $gt: [{ $size: '$shipment_qty' }, 0] },
              then: { $arrayElemAt: ['$shipment_qty.total_qty_shipped', 0] },
              else: 0,
            },
          },
          total_ship_return: {
            $cond: {
              if: { $gt: [{ $size: '$returns' }, 0] },
              then: { $arrayElemAt: ['$returns.actualQty', 0] },
              else: 0,
            },
          },
          totalqty_saleadm: {
            $cond: {
              if: { $gt: [{ $size: '$salecontract_qty' }, 0] },
              then: { $arrayElemAt: ['$salecontract_qty.totalqty_saleadm', 0] },
              else: 0,
            },
          },
        },
      },
      // {
      //   $addFields: {
      //     stock: {

      //       $subtract: [
      //         '$production_totalqty', // Production quantity
      //         '$total_qty_shipped', // Shipment quantity
      //       ],
      //     },
      //   },
      // },
      {
        $addFields: {
          stock: {
            $add: [
              {
                $subtract: [
                  '$production_totalqty',
                  '$total_qty_shipped',
                ],
              },
              '$total_ship_return'
            ],
          },
        },
      },
      {
        $project: {
          _id: 0,
          name: 1,
          totalqty_saleadm: 1,
          total_ship_return: 1,
          production_totalqty: 1,
          total_qty_shipped: 1,
          stock: 1,
        },
      },
      { $sort: { stock: sortDirection } },

    ]);

    const totalSumProductionQty = stockDetailReport.reduce(
      (sum, item) => sum + item.production_totalqty,
      0
    );
    // const totalSumSaleAdmQty = stockDetailReport.reduce((sum, item) => sum + item.totalqty_saleadm, 0)
    const totalSumSaleNonAdmQty = stockDetailReport.reduce(
      (sum, item) => sum + item.total_qty_shipped,
      0
    );
    const totalSumStock = stockDetailReport.reduce(
      (sum, item) => sum + item.stock,
      0
    );

    const totalSumShipReturnnQty = stockDetailReport.reduce(
      (sum, item) => sum + item.total_ship_return,
      0
    );

    const result = {
      stock_Detail: stockDetailReport,
      paginated_Record: stockDetailReport.length,
      total_Records: stockDetailReport.length,
      totalSumShipReturnnQty: totalSumShipReturnnQty,
      totalSumProductionQty: totalSumProductionQty,
      // totalSumSaleAdmQty: totalSumSaleAdmQty,
      totalSumSaleNonAdmQty: totalSumSaleNonAdmQty,
      totalSumStock: totalSumStock,
    };

    return result;
  } else if (input.name !== '') {
    const sortDirection: 1 | -1 = input?.sort === 1 ? 1 : -1;
    const stockDetailReport = await ProductModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(input.name),
        },
      },
      {
        $lookup: {
          from: 'productiondtls',
          localField: '_id',
          foreignField: 'product',
          as: 'production_qty',
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
          production_totalqty: {
            $sum: {
              $map: {
                input: '$production_qty',
                as: 'item',
                in: '$$item.qty',
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: 'salescontractdtls',
          localField: '_id',
          foreignField: 'product',
          as: 'adm_qty',
          pipeline: [
            {
              $match: {
                InHouse: true,
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
          totalqty_saleadm: {
            $sum: {
              $map: {
                input: '$adm_qty',
                as: 'item',
                in: '$$item.qty',
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: 'shipmentdtls',
          localField: '_id',
          foreignField: 'product',
          as: 'non_admqty',
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
          totalqty_salenonadm: {
            $sum: {
              $map: {
                input: '$non_admqty',
                as: 'item',
                in: '$$item.qty',
              },
            },
          },
        },
      },
      {
        $addFields: {
          stock: {
            $subtract: [
              '$production_totalqty',
              { $sum: ['$totalqty_saleadm', '$totalqty_salenonadm'] },
            ],
          },
        },
      },
      // {
      //   $addFields: {
      //     stock: {
      //       $subtract: [
      //         "$production_totalqty",
      //         { $sum: ["$totalqty_saleadm", "$totalqty_salenonadm"] }
      //       ]
      //     }
      //   }
      // },

      // {
      //   $addFields: {
      //     stock: { '$abs': '$stock' }
      //   }
      // },
      {
        $project: {
          name: 1,
          production_totalqty: 1,
          totalqty_saleadm: 1,
          totalqty_salenonadm: 1,
          stock: 1,
        },
      },
      { $sort: { production_totalqty: sortDirection } },
    ]);

    const totalSumProductionQty = stockDetailReport.reduce(
      (sum, item) => sum + item.production_totalqty,
      0
    );
    const totalSumSaleAdmQty = stockDetailReport.reduce(
      (sum, item) => sum + item.totalqty_saleadm,
      0
    );
    const totalSumSaleNonAdmQty = stockDetailReport.reduce(
      (sum, item) => sum + item.totalqty_salenonadm,
      0
    );
    const totalSumStock = stockDetailReport.reduce(
      (sum, item) => sum + item.stock,
      0
    );
    const result = {
      stock_Detail: stockDetailReport,
      total_Records: stockDetailReport.length,
      totalSumProductionQty: totalSumProductionQty,
      totalSumSaleAdmQty: totalSumSaleAdmQty,
      totalSumSaleNonAdmQty: totalSumSaleNonAdmQty,
      totalSumStock: totalSumStock,
    };
    return result;
  } else if (
    Array.isArray(input.product_id) &&
    input.product_id.length !== 0 &&
    input.name == '' &&
    input.transactiongroup == ''
  ) {
    console.log('only product summary');

    const productArr = input.product_id
      ? input.product_id.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];


    const stockAggregationPipeline: any = [
      {
        $match: {
          _id: { $in: productArr },
        },
      },
      {
        $lookup: {
          from: 'salescontractdtls',
          let: { productId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$product', '$$productId'] },
                    { $eq: ['$isDeleted', false] },
                    {
                      $gte: ['$contractDate', new Date('2020-01-01T00:00:00Z')],
                    },
                    { $lte: ['$contractDate', new Date()] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: '$product',
                totalqty_saleadm: {
                  $sum: {
                    $cond: [{ $eq: ['$InHouse', true] }, '$qty', 0],
                  },
                },
              },
            },
          ],
          as: 'salecontract_qty',
        },
      },
      {
        $lookup: {
          from: 'productiondtls',
          localField: '_id',
          foreignField: 'product',
          as: 'production_qty',
        },
      },
      {
        $lookup: {
          from: 'shipmentdtls',
          let: { productId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$product', '$$productId'] },
                    { $eq: ['$isDeleted', false] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: '$product',
                total_qty_shipped: { $sum: '$qty' },
              },
            },
          ],
          as: 'shipment_qty',
        },
      },
      {
        $addFields: {
          production_totalqty: { $sum: '$production_qty.qty' },
          total_qty_shipped: {
            $cond: {
              if: { $gt: [{ $size: '$shipment_qty' }, 0] },
              then: { $arrayElemAt: ['$shipment_qty.total_qty_shipped', 0] },
              else: 0,
            },
          },
          totalqty_saleadm: {
            $cond: {
              if: { $gt: [{ $size: '$salecontract_qty' }, 0] },
              then: { $arrayElemAt: ['$salecontract_qty.totalqty_saleadm', 0] },
              else: 0,
            },
          },
        },
      },
      {
        $addFields: {
          stock: {
            $subtract: [
              '$production_totalqty', // Production quantity
              '$total_qty_shipped', // Shipment quantity
            ],
          },
        },
      },
      {
        $project: {
          _id: 0,
          name: 1,
          totalqty_saleadm: 1,
          production_totalqty: 1,
          total_qty_shipped: 1,
          stock: 1,
        },
      },
      { $sort: { production_totalqty: input?.sort } },
    ];

    const stockDetailReport = await ProductModel.aggregate(
      stockAggregationPipeline ? stockAggregationPipeline : null
    );
    const totalSumProductionQty = stockDetailReport.reduce(
      (sum, item) => sum + item.production_totalqty,
      0
    );
    const totalSumSaleAdmQty = stockDetailReport.reduce(
      (sum, item) => sum + item.totalqty_saleadm,
      0
    );
    const totalSumShipQty = stockDetailReport.reduce(
      (sum, item) => sum + item.total_qty_shipped,
      0
    );
    const totalSumStock = stockDetailReport.reduce(
      (sum, item) => sum + item.stock,
      0
    );
    const result = {
      stock_Detail: stockDetailReport,
      total_Records: stockDetailReport.length,
      totalSumProductionQty: totalSumProductionQty,
      totalSumSaleAdmQty: totalSumSaleAdmQty,
      totalSumShipmentQty: totalSumShipQty,
      // `totalSumSaleNonAdmQty: totalSumSaleNonAdmQty,`
      totalSumStock: totalSumStock,
    };
    return result;
  } else if (
    input.transactiongroup !== '' &&
    Array.isArray(input.product_id) &&
    input.product_id.length !== 0
  ) {
    console.log('transaction   ==== group by');

    const productArr = input.product_id
      ? input.product_id.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const transaction_groupbys = await ShipmentDtlModel.aggregate(
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
            // ship_lot:'$lot',
            ship_lot: '$supplierCode',
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
                  production_lot: '$lot',
                  ship_lot: 1,
                  ShipmentNo: '$shipment_no',
                  date: '$date',
                  productName: '$productData.name',
                  // customerName:'$customerData.name',
                  product: '$product',
                  shipmentQty: { $literal: 0 }, // Default to 0 for production records
                  productionQty: '$qty',
                  salesContractPO: { $literal: null },
                  ProductionTransactionNo: '$productionMaster.tran',
                  ProductionLotNo: '$productionMaster.lot_no',
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
            ship_lot: 1,
            date: 1,
            production_lot: 1,
            ProductionLotNo: 1,
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
    const transaction_groupby = await ShipmentDtlModel.aggregate([
      {
        $match: {
          gpDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate)
          },
          isDeleted: false,

        }
      },
      {
        $match: {
          product: { $in: productArr },
        },
      },
      {
        $lookup: {
          from: "salescontracts",
          localField: "salesContract",
          foreignField: "_id",
          as: "salesContractData"
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "productData"
        }
      },
      {
        $lookup: {
          from: "customers",
          localField: "customer",
          foreignField: "_id",
          as: "customerData"
        }
      },
      {
        $lookup: {
          from: "returns",
          localField: "shipment",
          foreignField: "shipment",
          as: "returns"
        }
      },
      {
        $unwind: {
          path: "$returns",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: {
          path: "$customerData",
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $unwind: {
          path: "$salesContractData",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: {
          path: "$productData",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 0,
          shipmentId: "$_id",
          ShipmentNo: "$shipment_no",
          ship_lot: "$supplierCode",
          date: "$gpDate",
          productName: "$productData.name",
          customerName: "$customerData.name",
          product: "$product",
          shipmentQty: "$qty",
          returnQty: {
            $ifNull: ["$returns.actualQty", 0]
          },
          productionQty: {
            $literal: 0
          },
          // Default to 0 for shipment records
          salesContractPO: "$salesContractData.po",
          ProductionTransactionNo: {
            $literal: null
          },
          type: "shipment"
        }
      },
      {
        $unionWith: {
          coll: "productiondtls",
          pipeline: [
            {
              $match: {
                product: { $in: productArr },
              },
            },
            {
              $lookup: {
                from: "productions",
                localField: "production",
                foreignField: "_id",
                as: "productionMaster"
              }
            },
            {
              $lookup: {
                from: "products",
                localField: "product",
                foreignField: "_id",
                as: "productData"
              }
            },
            {
              $unwind: {
                path: "$productionMaster"
              }
            },
            {
              $unwind: {
                path: "$productData"
              }
            },
            {
              $project: {
                _id: 0,
                shipmentId: "$_id",
                production_lot: "$lot",
                ship_lot: 1,
                ShipmentNo: "$shipment_no",
                date: "$date",
                productName: "$productData.name",
                // customerName:'$customerData.name',
                product: "$product",
                shipmentQty: {
                  $literal: 0
                },
                returnQty: {
                  $ifNull: ["$returnQty", 0]
                },
                // Default to 0 for production records
                productionQty: "$qty",
                salesContractPO: {
                  $literal: null
                },
                ProductionLotNo:
                  "$productionMaster.lot_no",
                ProductionTransactionNo:
                  "$productionMaster.tran",
                type: "production"
              }
            }
          ]
        }
      },
      {
        $addFields: {
          date: {
            $ifNull: ["$date", "$gpDate"]
          }
        }
      },
      {
        $sort: {
          date: -1
        }
      },
      {
        $setWindowFields: {
          sortBy: {
            date: 1
          },
          output: {
            balance: {
              $sum: {
                $add: [
                  {
                    $subtract: [
                      "$productionQty",
                      "$shipmentQty"
                    ]
                  },
                  {
                    $ifNull: ["$returnQty", 0]
                  }
                ]
              },
              window: {
                documents: ["unbounded", "current"]
              }
            }
          }
        }
      },
      {
        $project: {
          shipmentId: 1,
          ShipmentNo: 1,
          ship_lot: 1,
          date: 1,
          production_lot: 1,
          customerName: 1,
          productName: 1,
          product: 1,
          shipmentQty: 1,
          returnQty: 1,
          productionQty: 1,
          balance: 1,
          salesContractPO: 1,
          ProductionLotNo: 1,
          ProductionTransactionNo: 1
        }
      },

    ])
    const totalShipmentSum = transaction_groupby.reduce(
      (sum, item) => sum + item.shipmentQty,
      0
    );
    const totalReturnQtySum = transaction_groupby.reduce(
      (sum, item) => sum + item.returnQty,
      0
    );
    const totalProductionSum = transaction_groupby.reduce(
      (sum, item) => sum + item.productionQty,
      0
    );
    const totalBalanceSum = transaction_groupby.reduce(
      (sum, item) => sum + item.balance,
      0
    );

    const result = {
      transaction_groupby: transaction_groupby,
      totalShipmentSum: totalShipmentSum,
      totalReturnQtySum: totalReturnQtySum,
      totalProductionSum: totalProductionSum,
      totalBalanceSum: totalBalanceSum,
      total_Records: transaction_groupby.length,
    };
    return result;
  }
};

export const ProductdtlsbyId = async (id: string) => {
  console.log(id);
  const productdtls = await ProductModel.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      },
    },
    {
      $lookup: {
        from: 'productdtls',
        localField: '_id',
        foreignField: 'product',
        as: 'productdtlData',
        pipeline: [
          {
            $lookup: {
              from: 'currencies',
              localField: 'currency',
              foreignField: '_id',
              as: 'currency',
            },
          },
        ],
      },
    },
  ]);

  return productdtls;
};

export const productSummarydtlsByDate = async (input: ProductSummarySchema) => {

  const {
    fromDate,
    toDate,
    pageno = 1,
    perPage = 10,
    product_id,
    customer_id,
    productGroup,
    customerGroup

  } = input;
  
  if (productGroup && !customerGroup) {
    console.log("product-wise");

    // pagination constants
    const limit = perPage;
    const skipCount = (pageno - 1) * limit;

    // Match stage
    const matchStage: any = { isDeleted: false };
  

    if (fromDate && toDate) {
      matchStage.date = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    }

    if (Array.isArray(product_id) && product_id.length > 0) {
      matchStage._id = {
        $in: product_id.map(id => new mongoose.Types.ObjectId(id))
      };
    }

    // === Base Pipeline ===
    const basePipeline: any[] = [
      { $match: matchStage },
      {
        $lookup: {
          from: "productiondtls",
          localField: "_id",
          foreignField: "product",
          as: "production",
          pipeline: [{ $match: { isDeleted: false } }]
        }
      },
      {
        $lookup: {
          from: "returns",
          localField: "_id",
          foreignField: "product",
          as: "returndtls",
          pipeline: [{ $match: { isDeleted: false } }]
        }
      },
      {
        $lookup: {
          from: "shipmentdtls",
          localField: "_id",
          foreignField: "product",
          as: "shipmentdtls",
          pipeline: [{ $match: { isDeleted: false } }]
        }
      },
      {
        $lookup: {
          from: "invoicedtls",
          localField: "_id",
          foreignField: "product",
          as: "invoicedtls",
          pipeline: [{ $match: { isDeleted: false } }]
        }
      },
      {
        $lookup: {
          from: "salescontractdtls",
          localField: "_id",
          foreignField: "product",
          as: "salescontractdtls",
          pipeline: [{ $match: { isDeleted: false } }]
        }
      },
      {
        $lookup: {
          from: "salescontractdtls",
          localField: "_id",
          foreignField: "product",
          as: "pendingSales",
          pipeline: [
            { $match: { isDeleted: false, shipment: false } },
            {
              $lookup: {
                from: "shipmentdtls",
                let: { salesContractId: "$salesContract" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$salesContract", "$$salesContractId"] },
                          { $eq: ["$isDeleted", false] }
                        ]
                      }
                    }
                  },
                  {
                    $group: {
                      _id: null,
                      totalQty: { $sum: "$qty" },
                      totalAmount: { $sum: "$amount" }
                    }
                  }
                ],
                as: "shipmentSummary"
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "salescontractdtls",
          localField: "_id",
          foreignField: "product",
          as: "pendingSalesInvoice",
          pipeline: [
            { $match: { isDeleted: false, invoice: false, shipment: true } },
            {
              $lookup: {
                from: "shipmentdtls",
                let: { salesContractId: "$salesContract" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$salesContract", "$$salesContractId"] },
                          { $eq: ["$isDeleted", false] }
                        ]
                      }
                    }
                  },
                  {
                    $group: {
                      _id: null,
                      totalQty: { $sum: "$qty" },
                      totalAmount: { $sum: "$amount" }
                    }
                  }
                ],
                as: "invoiceSummary"
              }
            }
          ]
        }
      },
      {
        $addFields: {
          totalPendingQty: {
            $sum: {
              $map: {
                input: "$pendingSales",
                as: "sale",
                in: "$$sale.qty"
              }
            }
          },
          totalShippedQty: {
            $sum: {
              $map: {
                input: "$pendingSales",
                as: "sale",
                in: {
                  $ifNull: [
                    { $arrayElemAt: ["$$sale.shipmentSummary.totalQty", 0] },
                    0
                  ]
                }
              }
            }
          },
          totalPendingInvoiceQty: {
            $sum: {
              $map: {
                input: "$pendingSalesInvoice",
                as: "sale",
                in: "$$sale.qty"
              }
            }
          },
          totalInvoicedQty: {
            $sum: {
              $map: {
                input: "$pendingSalesInvoice",
                as: "sale",
                in: {
                  $ifNull: [
                    { $arrayElemAt: ["$$sale.invoiceSummary.totalQty", 0] },
                    0
                  ]
                }
              }
            }
          }
        }
      },
      {
        $addFields: {
          productName: "$name",
          productionQty: { $sum: "$production.qty" },
          salesContractQty: { $sum: "$salescontractdtls.qty" },
          pendingSalesQty: { $subtract: ["$totalPendingQty", "$totalShippedQty"] },
          shipmentQty: { $sum: "$shipmentdtls.qty" },
          pendingInvoiceQty: { $sum: "$totalInvoicedQty" },
          invoiceQty: { $sum: "$invoicedtls.qty" },
          returnQty: { $sum: "$returndtls.actualQty" },
        }
      },
      {
        $project: {
          productName: 1,
          productionQty: 1,
          salesContractQty: 1,
          pendingSalesQty: 1,
          shipmentQty: 1,
          pendingInvoiceQty: 1,
          invoiceQty: 1,
          returnQty: 1,
        }
      },
      { $sort: { productionQty: -1 } }
    ];

    const dataPipeline = [...basePipeline,
    { $skip: skipCount },
    { $limit: limit }
    ];

    // ✅ FIXED: Lightweight count pipeline
    const countPipeline = [
      { $match: matchStage },
      { $count: 'totalRecords' }
    ];

    const summaryPipeline = [...basePipeline,
    {
      $group: {
        _id: null,
        totalProductionQty: { $sum: '$productionQty' },
        totalSalesContractQty: { $sum: '$salesContractQty' },
        totalPendingSalesQty: { $sum: '$pendingSalesQty' },
        totalShipmentQty: { $sum: '$shipmentQty' },
        totalInvoiceQty: { $sum: '$invoiceQty' },
        totalPendingInvoiceQty: { $sum: '$pendingInvoiceQty' },
        totalReturnQty: { $sum: '$returnQty' },
      }
    },
    {
      $project: {
        _id: 0,
        totalProductionQty: 1,
        totalSalesContractQty: 1,
        totalPendingSalesQty: 1,
        totalShipmentQty: 1,
        totalPendingInvoiceQty: 1,
        totalInvoiceQty: 1,
        totalReturnQty: 1,
      }
    }
    ];

    // 🚀 Run all pipelines
    const [details, totalResult, summaryResult] = await Promise.all([
      ProductModel.aggregate(dataPipeline, { allowDiskUse: true }),
      ProductModel.aggregate(countPipeline),
      ProductModel.aggregate(summaryPipeline, { allowDiskUse: true }),
    ]);

    const totalRecords = totalResult?.[0]?.totalRecords || 0;
    const summary = summaryResult.length > 0 ? summaryResult[0] : {
      totalProductionQty: 0,
      totalSalesContractQty: 0,
      totalPendingSalesQty: 0,
      totalShipmentQty: 0,
      totalPendingInvoiceQty: 0,
      totalInvoiceQty: 0,
      totalReturnQty: 0,
    };

    return {
      details,
      summary,
      pagination: {
        page: pageno,
        perPage,
        totalRecords,
        totalPages: Math.ceil(totalRecords / perPage),
      },
    };
  }

  else if (customerGroup && !productGroup) {

    console.log("customer-wise")
    // pagination contants
    const limit = perPage;
    const skipCount = (pageno - 1) * limit;


    const matchStage: any = {};
    const scMatchStage: any = { isDeleted: false };

    if (fromDate && toDate) {
      scMatchStage.contractDate = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    }

    if (Array.isArray(customer_id) && customer_id.length > 0) {
      matchStage._id = {
        $in: customer_id.map(id => new mongoose.Types.ObjectId(id))
      };
    }


    const basePipeline: any = [
      {
        $match: matchStage
      },
      // {
      //   $lookup: {
      //     from: "productiondtls",
      //     localField: "_id",
      //     foreignField: "product",
      //     as: "production",
      //     pipeline: [
      //       {
      //         $match: {
      //           isDeleted: false
      //         }
      //       }
      //     ]
      //   }
      // },
      {
        $lookup: {
          from: "returns",
          localField: "_id",
          foreignField: "customer",
          as: "returndtls",
          pipeline: [
            {
              $match: {
                isDeleted: false
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "shipmentdtls",
          localField: "_id",
          foreignField: "customer",
          as: "shipmentdtls",
          pipeline: [
            {
              $match: {
                isDeleted: false
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "invoicedtls",
          localField: "_id",
          foreignField: "customer",
          as: "invoicedtls",
          pipeline: [
            {
              $match: {
                isDeleted: false
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "salescontractdtls",
          localField: "_id",
          foreignField: "customer",
          as: "salescontractdtls",
          pipeline: [
            {
              $match: {
                isDeleted: false
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "salescontractdtls",
          localField: "_id",
          foreignField: "customer",
          as: "pendingSales",
          pipeline: [
            {
              $match: {
                isDeleted: false,
                shipment: false
              }
            },
            {
              $lookup: {
                from: "shipmentdtls",
                let: { salesContractId: "$salesContract" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$salesContract", "$$salesContractId"] },
                          { $eq: ["$isDeleted", false] }
                        ]
                      }
                    }
                  },
                  {
                    $group: {
                      _id: null,
                      totalQty: { $sum: "$qty" },
                      totalAmount: { $sum: "$amount" }
                    }
                  }
                ],
                as: "shipmentSummary"
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "salescontractdtls",
          localField: "_id",
          foreignField: "customer",
          as: "pendingSalesInvoice",
          pipeline: [
            {
              $match: {
                isDeleted: false,
                invoice: false,
                shipment: true
              }
            },
            {
              $lookup: {
                from: "shipmentdtls",
                let: { salesContractId: "$salesContract" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$salesContract", "$$salesContractId"] },
                          { $eq: ["$isDeleted", false] }
                        ]
                      }
                    }
                  },
                  {
                    $group: {
                      _id: null,
                      totalQty: { $sum: "$qty" },
                      totalAmount: { $sum: "$amount" }
                    }
                  }
                ],
                as: "invoiceSummary"
              }
            }
          ]
        }
      },
      {
        $addFields: {
          totalPendingQty: {
            $sum: {
              $map: {
                input: "$pendingSales",
                as: "sale",
                in: "$$sale.qty"
              }
            }
          },
          totalShippedQty: {
            $sum: {
              $map: {
                input: "$pendingSales",
                as: "sale",
                in: {
                  $ifNull: [
                    { $arrayElemAt: ["$$sale.shipmentSummary.totalQty", 0] },
                    0
                  ]
                }
              }
            }
          },
          totalPendingInvoiceQty: {
            $sum: {
              $map: {
                input: "$pendingSalesInvoice",
                as: "sale",
                in: "$$sale.qty"
              }
            }
          },
          totalInvoicedQty: {
            $sum: {
              $map: {
                input: "$pendingSalesInvoice",
                as: "sale",
                in: {
                  $ifNull: [
                    { $arrayElemAt: ["$$sale.invoiceSummary.totalQty", 0] },
                    0
                  ]
                }
              }
            }
          }
        }
      },
      {
        $addFields: {
          custmerName: "$name",
          // productionQty: { $sum: "$production.qty" },
          salesContractQty: { $sum: "$salescontractdtls.qty" },
          pendingSalesQty: { $subtract: ["$totalPendingQty", "$totalShippedQty"] },
          shipmentQty: { $sum: "$shipmentdtls.qty" },
          // pendingInvoiceQty: { $subtract: ["$totalPendingInvoiceQty", "$totalInvoicedQty"] },
          pendingInvoiceQty: { $sum: "$totalInvoicedQty" },
          invoiceQty: { $sum: "$invoicedtls.qty" },
          returnQty: { $sum: "$returndtls.actualQty" },
        }
      },
      {
        $project: {
          custmerName: 1,
          // productionQty: 1,
          salesContractQty: 1,
          pendingSalesQty: 1,
          shipmentQty: 1,
          pendingInvoiceQty: 1,
          invoiceQty: 1,
          returnQty: 1,
        }
      },
      { $sort: { productionQty: -1 } }
    ]
const basePipelinedate: any = [
      {
        $match: matchStage
      },
  {
        $lookup: {
          from: "salescontractdtls",
          localField: "_id",
          foreignField: "customer",
          as: "salescontractdtls",
          pipeline: [

            {
              $match: scMatchStage
            }
          ]
        }
      },
      {
        $lookup: {
            from: "returns",
            localField: "_id",
            foreignField: "customer",
            as: "returndtls",
          pipeline: [
            {
              $match: {
                isDeleted: false
              }
            },
            {
             $lookup:{
              from:"salescontractdtls",
              localField:"salesContract",
              foreignField:"salesContract",
              as:"salesContractData",
              pipeline: [ 
              {
                $match:scMatchStage
              }
              ]
             }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "shipmentdtls",
          localField: "_id",
          foreignField: "customer",
          as: "shipmentdtls",
           pipeline: [
            {
             $match: {
               isDeleted: false
             }
            },
            {
             $lookup:{
              from:"salescontractdtls",
              localField:"salesContract",
              foreignField:"salesContract",
              as:"salesContractData",
              pipeline: [ 
              {
                $match:scMatchStage
              }
              ]
             }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "invoicedtls",
          localField: "_id",
          foreignField: "customer",
          as: "invoicedtls",
         pipeline: [
            {
              $match: {
                isDeleted: false
              }
            },
            {
             $lookup:{
              from:"salescontractdtls",
              localField:"salesContract",
              foreignField:"salesContract",
              as:"salesContractData",
              pipeline: [ 
              {
                $match:scMatchStage
              }
              ]
             }
            }
          ]
        }
      },
    
      {
        $lookup: {
          from: "salescontractdtls",
          localField: "_id",
          foreignField: "customer",
          as: "pendingSales",
          pipeline: [
            {
              $match: {
                ...scMatchStage,
                shipment: false
              }
            },
            {
              $lookup: {
                from: "shipmentdtls",
                let: { salesContractId: "$salesContract" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$salesContract", "$$salesContractId"] },
                          { $eq: ["$isDeleted", false] }
                        ]
                      }
                    }
                  },
                  {
                    $group: {
                      _id: null,
                      totalQty: { $sum: "$qty" },
                      totalAmount: { $sum: "$amount" }
                    }
                  }
                ],
                as: "shipmentSummary"
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "salescontractdtls",
          localField: "_id",
          foreignField: "customer",
          as: "pendingSalesInvoice",
          pipeline: [
            {
              $match: {
                ...scMatchStage,
                invoice: false,
                shipment: true
              }
            },
            {
              $lookup: {
                from: "shipmentdtls",
                let: { salesContractId: "$salesContract" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$salesContract", "$$salesContractId"] },
                          { $eq: ["$isDeleted", false] }
                        ]
                      }
                    }
                  },
                  {
                    $group: {
                      _id: null,
                      totalQty: { $sum: "$qty" },
                      totalAmount: { $sum: "$amount" }
                    }
                  }
                ],
                as: "invoiceSummary"
              }
            }
          ]
        }
      },
      {
        $addFields: {
          totalPendingQty: {
            $sum: {
              $map: {
                input: "$pendingSales",
                as: "sale",
                in: "$$sale.qty"
              }
            }
          },
          totalShippedQty: {
            $sum: {
              $map: {
                input: "$pendingSales",
                as: "sale",
                in: {
                  $ifNull: [
                    { $arrayElemAt: ["$$sale.shipmentSummary.totalQty", 0] },
                    0
                  ]
                }
              }
            }
          },
          totalPendingInvoiceQty: {
            $sum: {
              $map: {
                input: "$pendingSalesInvoice",
                as: "sale",
                in: "$$sale.qty"
              }
            }
          },
          totalInvoicedQty: {
            $sum: {
              $map: {
                input: "$pendingSalesInvoice",
                as: "sale",
                in: {
                  $ifNull: [
                    { $arrayElemAt: ["$$sale.invoiceSummary.totalQty", 0] },
                    0
                  ]
                }
              }
            }
          }
        }
      },
      {
        $addFields: {
          custmerName: "$name",
          // productionQty: { $sum: "$production.qty" },
          salesContractQty: { $sum: "$salescontractdtls.qty" },
          pendingSalesQty: { $subtract: ["$totalPendingQty", "$totalShippedQty"] },
          shipmentQty: { $sum: "$shipmentdtls.qty" },
          // pendingInvoiceQty: { $subtract: ["$totalPendingInvoiceQty", "$totalInvoicedQty"] },
          pendingInvoiceQty: { $sum: "$totalInvoicedQty" },
          invoiceQty: { $sum: "$invoicedtls.qty" },
          returnQty: { $sum: "$returndtls.actualQty" },
        }
      },
      {
        $project: {
          custmerName: 1,
          // productionQty: 1,
          salesContractQty: 1,
          pendingSalesQty: 1,
          shipmentQty: 1,
          pendingInvoiceQty: 1,
          invoiceQty: 1,
          returnQty: 1,
        }
      },
     {
  $match: {
    salesContractQty: { $gt: 0 }
  }
},
      { $sort: { productionQty: -1 } }
    ]
   const basePipelineSummarydate: any = [
      {
        $match: matchStage
      },
  {
        $lookup: {
          from: "salescontractdtls",
          localField: "_id",
          foreignField: "customer",
          as: "salescontractdtls",
          pipeline: [

            {
              $match: scMatchStage
            }
          ]
        }
      },
      {
        $lookup: {
            from: "returns",
            localField: "_id",
            foreignField: "customer",
            as: "returndtls",
          pipeline: [
            {
              $match: {
                isDeleted: false
              }
            },
            {
             $lookup:{
              from:"salescontractdtls",
              localField:"salesContract",
              foreignField:"salesContract",
              as:"salesContractData",
              pipeline: [ 
              {
                $match:scMatchStage
              }
              ]
             }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "shipmentdtls",
          localField: "_id",
          foreignField: "customer",
          as: "shipmentdtls",
           pipeline: [
            {
             $match: {
               isDeleted: false
             }
            },
            {
             $lookup:{
              from:"salescontractdtls",
              localField:"salesContract",
              foreignField:"salesContract",
              as:"salesContractData",
              pipeline: [ 
              {
                $match:scMatchStage
              }
              ]
             }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "invoicedtls",
          localField: "_id",
          foreignField: "customer",
          as: "invoicedtls",
         pipeline: [
            {
              $match: {
                isDeleted: false
              }
            },
            {
             $lookup:{
              from:"salescontractdtls",
              localField:"salesContract",
              foreignField:"salesContract",
              as:"salesContractData",
              pipeline: [ 
              {
                $match:scMatchStage
              }
              ]
             }
            }
          ]
        }
      },
    
      {
        $lookup: {
          from: "salescontractdtls",
          localField: "_id",
          foreignField: "customer",
          as: "pendingSales",
          pipeline: [
            {
              $match: {
                ...scMatchStage,
                shipment: false
              }
            },
            {
              $lookup: {
                from: "shipmentdtls",
                let: { salesContractId: "$salesContract" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$salesContract", "$$salesContractId"] },
                          { $eq: ["$isDeleted", false] }
                        ]
                      }
                    }
                  },
                  {
                    $group: {
                      _id: null,
                      totalQty: { $sum: "$qty" },
                      totalAmount: { $sum: "$amount" }
                    }
                  }
                ],
                as: "shipmentSummary"
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "salescontractdtls",
          localField: "_id",
          foreignField: "customer",
          as: "pendingSalesInvoice",
          pipeline: [
            {
              $match: {
                ...scMatchStage,
                invoice: false,
                shipment: true
              }
            },
            {
              $lookup: {
                from: "shipmentdtls",
                let: { salesContractId: "$salesContract" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$salesContract", "$$salesContractId"] },
                          { $eq: ["$isDeleted", false] }
                        ]
                      }
                    }
                  },
                  {
                    $group: {
                      _id: null,
                      totalQty: { $sum: "$qty" },
                      totalAmount: { $sum: "$amount" }
                    }
                  }
                ],
                as: "invoiceSummary"
              }
            }
          ]
        }
      },
      {
        $addFields: {
          totalPendingQty: {
            $sum: {
              $map: {
                input: "$pendingSales",
                as: "sale",
                in: "$$sale.qty"
              }
            }
          },
          totalShippedQty: {
            $sum: {
              $map: {
                input: "$pendingSales",
                as: "sale",
                in: {
                  $ifNull: [
                    { $arrayElemAt: ["$$sale.shipmentSummary.totalQty", 0] },
                    0
                  ]
                }
              }
            }
          },
          totalPendingInvoiceQty: {
            $sum: {
              $map: {
                input: "$pendingSalesInvoice",
                as: "sale",
                in: "$$sale.qty"
              }
            }
          },
          totalInvoicedQty: {
            $sum: {
              $map: {
                input: "$pendingSalesInvoice",
                as: "sale",
                in: {
                  $ifNull: [
                    { $arrayElemAt: ["$$sale.invoiceSummary.totalQty", 0] },
                    0
                  ]
                }
              }
            }
          }
        }
      },
      {
        $addFields: {
          custmerName: "$name",
          // productionQty: { $sum: "$production.qty" },
          salesContractQty: { $sum: "$salescontractdtls.qty" },
          pendingSalesQty: { $subtract: ["$totalPendingQty", "$totalShippedQty"] },
          shipmentQty: { $sum: "$shipmentdtls.qty" },
          // pendingInvoiceQty: { $subtract: ["$totalPendingInvoiceQty", "$totalInvoicedQty"] },
          pendingInvoiceQty: { $sum: "$totalInvoicedQty" },
          invoiceQty: { $sum: "$invoicedtls.qty" },
          returnQty: { $sum: "$returndtls.actualQty" },
        }
      },
      {
        $project: {
          custmerName: 1,
          // productionQty: 1,
          salesContractQty: 1,
          pendingSalesQty: 1,
          shipmentQty: 1,
          pendingInvoiceQty: 1,
          invoiceQty: 1,
          returnQty: 1,
        }
      },
      {
  $match: {
    salesContractQty: { $gt: 0 }
  }
},
      { $sort: { productionQty: -1 } }
    ]

   const basePipelineSummary: any = [
      {
        $match: matchStage
      },
  {
        $lookup: {
          from: "salescontractdtls",
          localField: "_id",
          foreignField: "customer",
          as: "salescontractdtls",
          pipeline: [
            {
              $match: scMatchStage
            }
          ]
        }
      },
      {
        $lookup: {
          from: "returns",
          localField: "_id",
          foreignField: "customer",
          as: "returndtls",
          pipeline: [
            {
             $lookup:{
              from:"salescontractdtls",
              localField:"salesContract",
              foreignField:"salesContract",
              as:"salesContractData",
              pipeline: [ 
              {
                $match:scMatchStage
              }
              ]
             }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "shipmentdtls",
          localField: "_id",
          foreignField: "customer",
          as: "shipmentdtls",
           pipeline: [
            {
             $lookup:{
              from:"salescontractdtls",
              localField:"salesContract",
              foreignField:"salesContract",
              as:"salesContractData",
              pipeline: [ 
              {
                $match:scMatchStage
              }
              ]
             }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "invoicedtls",
          localField: "_id",
          foreignField: "customer",
          as: "invoicedtls",
         pipeline: [
            {
             $lookup:{
              from:"salescontractdtls",
              localField:"salesContract",
              foreignField:"salesContract",
              as:"salesContractData",
              pipeline: [ 
              {
                $match:scMatchStage
              }
              ]
             }
            }
          ]
        }
      },
    
      {
        $lookup: {
          from: "salescontractdtls",
          localField: "_id",
          foreignField: "customer",
          as: "pendingSales",
          pipeline: [
            {
              $match: {
                ...scMatchStage,
                shipment: false
              }
            },
            {
              $lookup: {
                from: "shipmentdtls",
                let: { salesContractId: "$salesContract" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$salesContract", "$$salesContractId"] },
                          { $eq: ["$isDeleted", false] }
                        ]
                      }
                    }
                  },
                  {
                    $group: {
                      _id: null,
                      totalQty: { $sum: "$qty" },
                      totalAmount: { $sum: "$amount" }
                    }
                  }
                ],
                as: "shipmentSummary"
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "salescontractdtls",
          localField: "_id",
          foreignField: "customer",
          as: "pendingSalesInvoice",
          pipeline: [
            {
              $match: {
                ...scMatchStage,
                invoice: false,
                shipment: true
              }
            },
            {
              $lookup: {
                from: "shipmentdtls",
                let: { salesContractId: "$salesContract" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$salesContract", "$$salesContractId"] },
                          { $eq: ["$isDeleted", false] }
                        ]
                      }
                    }
                  },
                  {
                    $group: {
                      _id: null,
                      totalQty: { $sum: "$qty" },
                      totalAmount: { $sum: "$amount" }
                    }
                  }
                ],
                as: "invoiceSummary"
              }
            }
          ]
        }
      },
      {
        $addFields: {
          totalPendingQty: {
            $sum: {
              $map: {
                input: "$pendingSales",
                as: "sale",
                in: "$$sale.qty"
              }
            }
          },
          totalShippedQty: {
            $sum: {
              $map: {
                input: "$pendingSales",
                as: "sale",
                in: {
                  $ifNull: [
                    { $arrayElemAt: ["$$sale.shipmentSummary.totalQty", 0] },
                    0
                  ]
                }
              }
            }
          },
          totalPendingInvoiceQty: {
            $sum: {
              $map: {
                input: "$pendingSalesInvoice",
                as: "sale",
                in: "$$sale.qty"
              }
            }
          },
          totalInvoicedQty: {
            $sum: {
              $map: {
                input: "$pendingSalesInvoice",
                as: "sale",
                in: {
                  $ifNull: [
                    { $arrayElemAt: ["$$sale.invoiceSummary.totalQty", 0] },
                    0
                  ]
                }
              }
            }
          }
        }
      },
      {
        $addFields: {
          custmerName: "$name",
          // productionQty: { $sum: "$production.qty" },
          salesContractQty: { $sum: "$salescontractdtls.qty" },
          pendingSalesQty: { $subtract: ["$totalPendingQty", "$totalShippedQty"] },
          shipmentQty: { $sum: "$shipmentdtls.qty" },
          // pendingInvoiceQty: { $subtract: ["$totalPendingInvoiceQty", "$totalInvoicedQty"] },
          pendingInvoiceQty: { $sum: "$totalInvoicedQty" },
          invoiceQty: { $sum: "$invoicedtls.qty" },
          returnQty: { $sum: "$returndtls.actualQty" },
        }
      },
      {
        $project: {
          custmerName: 1,
          // productionQty: 1,
          salesContractQty: 1,
          pendingSalesQty: 1,
          shipmentQty: 1,
          pendingInvoiceQty: 1,
          invoiceQty: 1,
          returnQty: 1,
        }
      },
      { $sort: { productionQty: -1 } }
    ]

    const dataPipeline = [...basePipeline,
    {
      $skip: skipCount,
    },
    {
      $limit: limit,
    },
    ];
    const countPipeline = [
      { $match: matchStage },
      { $count: 'totalRecords' }
    ];

    const summaryPipeline = [...basePipelineSummary,
    {
      $group: {
        _id: null,
        // totalProductionQty: { $sum: '$productionQty' },
        totalSalesContractQty: { $sum: '$salesContractQty' },
        totalPendingSalesQty: { $sum: '$pendingSalesQty' },
        totalShipmentQty: { $sum: '$shipmentQty' },
        totalInvoiceQty: { $sum: '$invoiceQty' },
        totalPendingInvoiceQty: { $sum: '$pendingInvoiceQty' },
        totalReturnQty: { $sum: '$returnQty' },
      },
    },
    {
      $project: {
        _id: 0,
        // totalProductionQty: 1,
        totalSalesContractQty: 1,
        totalPendingSalesQty: 1,
        totalShipmentQty: 1,
        totalPendingInvoiceQty: 1,
        totalInvoiceQty: 1,
        totalReturnQty: 1,
      },
    },
    ];

    const [details, totalResult, summaryResult] = await Promise.all([

      CustomerModel.aggregate(dataPipeline, { allowDiskUse: true }),
      CustomerModel.aggregate(countPipeline, { allowDiskUse: true }),
      CustomerModel.aggregate(summaryPipeline, { allowDiskUse: true }),
    ]);
    const totalRecords = totalResult.length > 0 ? totalResult[0].totalRecords : 0;
    const summary = summaryResult.length > 0 ? summaryResult[0] : {
      // totalproductionQty: 0,
      totalSalesContractQty: 0,
      totalPendingSalesQty: 0,
      totalShipmentQty: 0,
      totalpendingInvoiceQty: 0,
      totalInvoiceQty: 0,
      totalReturnQty: 0,
    };

    return {
      details,
      summary,
      pagination: {
        page: pageno,
        perPage,
        totalRecords,
        totalPages: Math.ceil(totalRecords / perPage),
      },
    }
  }


  else {
    throw new Error("Please select either product-wise or customer-wise report");
  }

}

export const productSummarydtlsByDatePrint = async (input: ProductSummaryPrintSchema) => {

  const {
    fromDate,
    toDate,
    // pageno = 1,
    // perPage = 10,
    product_id,
    customer_id,
    productGroup,
    customerGroup

  } = input;


  // pagination contants
  // const limit = perPage;
  // const skipCount = (pageno - 1) * limit;

  if (productGroup && !customerGroup) {
    const matchStage: any = { isDeleted: false };

    if (fromDate && toDate) {
      matchStage.date = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    }

    if (Array.isArray(product_id) && product_id.length > 0) {
      matchStage._id = {
        $in: product_id.map(id => new mongoose.Types.ObjectId(id))
      };
    }


    const basePipeline: any = [
      {
        $match: matchStage
      },
      {
        $lookup: {
          from: "productiondtls",
          localField: "_id",
          foreignField: "product",
          as: "production",
          pipeline: [
            {
              $match: {
                isDeleted: false
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "returns",
          localField: "_id",
          foreignField: "product",
          as: "returndtls",
          pipeline: [
            {
              $match: {
                isDeleted: false
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "shipmentdtls",
          localField: "_id",
          foreignField: "product",
          as: "shipmentdtls",
          pipeline: [
            {
              $match: {
                isDeleted: false
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "invoicedtls",
          localField: "_id",
          foreignField: "product",
          as: "invoicedtls",
          pipeline: [
            {
              $match: {
                isDeleted: false
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "salescontractdtls",
          localField: "_id",
          foreignField: "product",
          as: "salescontractdtls",
          pipeline: [
            {
              $match: {
                isDeleted: false
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "salescontractdtls",
          localField: "_id",
          foreignField: "product",
          as: "pendingSales",
          pipeline: [
            {
              $match: {
                isDeleted: false,
                shipment: false
              }
            },
            {
              $lookup: {
                from: "shipmentdtls",
                let: { salesContractId: "$salesContract" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$salesContract", "$$salesContractId"] },
                          { $eq: ["$isDeleted", false] }
                        ]
                      }
                    }
                  },
                  {
                    $group: {
                      _id: null,
                      totalQty: { $sum: "$qty" },
                      totalAmount: { $sum: "$amount" }
                    }
                  }
                ],
                as: "shipmentSummary"
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "salescontractdtls",
          localField: "_id",
          foreignField: "product",
          as: "pendingSalesInvoice",
          pipeline: [
            {
              $match: {
                isDeleted: false,
                invoice: false,
                shipment: true
              }
            },
            {
              $lookup: {
                from: "shipmentdtls",
                let: { salesContractId: "$salesContract" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$salesContract", "$$salesContractId"] },
                          { $eq: ["$isDeleted", false] }
                        ]
                      }
                    }
                  },
                  {
                    $group: {
                      _id: null,
                      totalQty: { $sum: "$qty" },
                      totalAmount: { $sum: "$amount" }
                    }
                  }
                ],
                as: "invoiceSummary"
              }
            }
          ]
        }
      },
      {
        $addFields: {
          totalPendingQty: {
            $sum: {
              $map: {
                input: "$pendingSales",
                as: "sale",
                in: "$$sale.qty"
              }
            }
          },
          totalShippedQty: {
            $sum: {
              $map: {
                input: "$pendingSales",
                as: "sale",
                in: {
                  $ifNull: [
                    { $arrayElemAt: ["$$sale.shipmentSummary.totalQty", 0] },
                    0
                  ]
                }
              }
            }
          },
          totalPendingInvoiceQty: {
            $sum: {
              $map: {
                input: "$pendingSalesInvoice",
                as: "sale",
                in: "$$sale.qty"
              }
            }
          },
          totalInvoicedQty: {
            $sum: {
              $map: {
                input: "$pendingSalesInvoice",
                as: "sale",
                in: {
                  $ifNull: [
                    { $arrayElemAt: ["$$sale.invoiceSummary.totalQty", 0] },
                    0
                  ]
                }
              }
            }
          }
        }
      },
      {
        $addFields: {
          productName: "$name",
          productionQty: { $sum: "$production.qty" },
          salesContractQty: { $sum: "$salescontractdtls.qty" },
          pendingSalesQty: { $subtract: ["$totalPendingQty", "$totalShippedQty"] },
          shipmentQty: { $sum: "$shipmentdtls.qty" },
          // pendingInvoiceQty: { $subtract: ["$totalPendingInvoiceQty", "$totalInvoicedQty"] },
          pendingInvoiceQty: { $sum: "$totalInvoicedQty" },
          invoiceQty: { $sum: "$invoicedtls.qty" },
          returnQty: { $sum: "$returndtls.actualQty" },
        }
      },
      {
        $project: {
          productName: 1,
          productionQty: 1,
          returnQty: 1,
          pendingSalesQty: 1,
          shipmentQty: 1,
          pendingInvoiceQty: 1,
          invoiceQty: 1,
          salesContractQty: 1
        }
      },
      { $sort: { productionQty: -1 } }
    ]


    const basePipelineSummary: any = [
      {
        $match: matchStage
      },
      {
        $lookup: {
          from: "productiondtls",
          localField: "_id",
          foreignField: "product",
          as: "production",
          pipeline: [
            {
              $match: {
                isDeleted: false
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "returns",
          localField: "_id",
          foreignField: "product",
          as: "returndtls",
          pipeline: [
            {
              $match: {
                isDeleted: false
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "shipmentdtls",
          localField: "_id",
          foreignField: "product",
          as: "shipmentdtls",
          pipeline: [
            {
              $match: {
                isDeleted: false
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "invoicedtls",
          localField: "_id",
          foreignField: "product",
          as: "invoicedtls",
          pipeline: [
            {
              $match: {
                isDeleted: false
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "salescontractdtls",
          localField: "_id",
          foreignField: "product",
          as: "salescontractdtls",
          pipeline: [
            {
              $match: {
                isDeleted: false
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "salescontractdtls",
          localField: "_id",
          foreignField: "product",
          as: "pendingSales",
          pipeline: [
            {
              $match: {
                isDeleted: false,
                shipment: false
              }
            },
            {
              $lookup: {
                from: "shipmentdtls",
                let: { salesContractId: "$salesContract" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$salesContract", "$$salesContractId"] },
                          { $eq: ["$isDeleted", false] }
                        ]
                      }
                    }
                  },
                  {
                    $group: {
                      _id: null,
                      totalQty: { $sum: "$qty" },
                      totalAmount: { $sum: "$amount" }
                    }
                  }
                ],
                as: "shipmentSummary"
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "salescontractdtls",
          localField: "_id",
          foreignField: "product",
          as: "pendingSalesInvoice",
          pipeline: [
            {
              $match: {
                isDeleted: false,
                invoice: false,
                shipment: true
              }
            },
            {
              $lookup: {
                from: "shipmentdtls",
                let: { salesContractId: "$salesContract" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$salesContract", "$$salesContractId"] },
                          { $eq: ["$isDeleted", false] }
                        ]
                      }
                    }
                  },
                  {
                    $group: {
                      _id: null,
                      totalQty: { $sum: "$qty" },
                      totalAmount: { $sum: "$amount" }
                    }
                  }
                ],
                as: "invoiceSummary"
              }
            }
          ]
        }
      },
      {
        $addFields: {
          totalPendingQty: {
            $sum: {
              $map: {
                input: "$pendingSales",
                as: "sale",
                in: "$$sale.qty"
              }
            }
          },
          totalShippedQty: {
            $sum: {
              $map: {
                input: "$pendingSales",
                as: "sale",
                in: {
                  $ifNull: [
                    { $arrayElemAt: ["$$sale.shipmentSummary.totalQty", 0] },
                    0
                  ]
                }
              }
            }
          },
          totalPendingInvoiceQty: {
            $sum: {
              $map: {
                input: "$pendingSalesInvoice",
                as: "sale",
                in: "$$sale.qty"
              }
            }
          },
          totalInvoicedQty: {
            $sum: {
              $map: {
                input: "$pendingSalesInvoice",
                as: "sale",
                in: {
                  $ifNull: [
                    { $arrayElemAt: ["$$sale.invoiceSummary.totalQty", 0] },
                    0
                  ]
                }
              }
            }
          }
        }
      },
      {
        $addFields: {
          productName: "$name",
          productionQty: { $sum: "$production.qty" },
          salesContractQty: { $sum: "$salescontractdtls.qty" },
          pendingSalesQty: { $subtract: ["$totalPendingQty", "$totalShippedQty"] },
          shipmentQty: { $sum: "$shipmentdtls.qty" },
          // pendingInvoiceQty: { $subtract: ["$totalPendingInvoiceQty", "$totalInvoicedQty"] },
          pendingInvoiceQty: { $sum: "$totalInvoicedQty" },
          invoiceQty: { $sum: "$invoicedtls.qty" },
          returnQty: { $sum: "$returndtls.actualQty" },
        }
      },
      {
        $project: {
          productName: 1,
          productionQty: 1,
          returnQty: 1,
          pendingSalesQty: 1,
          shipmentQty: 1,
          pendingInvoiceQty: 1,
          invoiceQty: 1,
          salesContractQty: 1
        }
      },
      { $sort: { productionQty: -1 } }
    ]

    const dataPipeline = [...basePipeline,
      // {
      //   $skip: skipCount,
      // },
      // {
      //   $limit: limit,
      // },
    ];
    const countPipeline = [...basePipeline,
    { $count: 'totalRecords' },
    { $count: 'totalRecords' }
    ];

    const summaryPipeline = [...basePipelineSummary,
    {
      $group: {
        _id: null,
        totalProductionQty: { $sum: '$productionQty' },
        totalSalesContractQty: { $sum: '$salesContractQty' },
        totalPendingSalesQty: { $sum: '$pendingSalesQty' },
        totalShipmentQty: { $sum: '$shipmentQty' },
        totalPendingInvoiceQty: { $sum: '$pendingInvoiceQty' },
        totalInvoiceQty: { $sum: '$invoiceQty' },
        totalReturnQty: { $sum: '$returnQty' },
      },
    },
    {
      $project: {
        _id: 0,
        totalProductionQty: 1,
        totalSalesContractQty: 1,
        totalPendingSalesQty: 1,
        totalShipmentQty: 1,
        totalInvoiceQty: 1,
        totalPendingInvoiceQty: 1,
        totalReturnQty: 1,
      },
    },
    ];

    const [details, totalResult, summaryResult] = await Promise.all([

      ProductModel.aggregate(dataPipeline, { allowDiskUse: true }),
      ProductModel.aggregate(countPipeline, { allowDiskUse: true }),
      ProductModel.aggregate(summaryPipeline, { allowDiskUse: true }),
    ]);
    const totalRecords = totalResult.length > 0 ? totalResult[0].totalRecords : 0;
    const summary = summaryResult.length > 0 ? summaryResult[0] : {
      totalproductionQty: 0,
      totalSalesContractQty: 0,
      totalPendingSalesQty: 0,
      totalShipmentQty: 0,
      totalpendingInvoiceQty: 0,
      totalInvoiceQty: 0,
      totalReturnQty: 0,
    };

    return {
      details,
      totalRecords,
      summary,
    };
  }
  else if (!productGroup && customerGroup) {
    console.log("customer-wise")
    const matchStage: any = {};

    if (fromDate && toDate) {
      matchStage.createdAt = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    }

    if (Array.isArray(customer_id) && customer_id.length > 0) {
      matchStage._id = {
        $in: customer_id.map(id => new mongoose.Types.ObjectId(id))
      };
    }



    const basePipeline: any = [
      // {
      //   $match: matchStage
      // },
      // {
      //   $lookup: {
      //     from: "productiondtls",
      //     localField: "_id",
      //     foreignField: "product",
      //     as: "production",
      //     pipeline: [
      //       {
      //         $match: {
      //           isDeleted: false
      //         }
      //       }
      //     ]
      //   }
      // },
      {
        $lookup: {
          from: "returns",
          localField: "_id",
          foreignField: "customer",
          as: "returndtls",
          pipeline: [
            {
              $match: {
                isDeleted: false
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "shipmentdtls",
          localField: "_id",
          foreignField: "customer",
          as: "shipmentdtls",
          pipeline: [
            {
              $match: {
                isDeleted: false
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "invoicedtls",
          localField: "_id",
          foreignField: "customer",
          as: "invoicedtls",
          pipeline: [
            {
              $match: {
                isDeleted: false
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "salescontractdtls",
          localField: "_id",
          foreignField: "customer",
          as: "salescontractdtls",
          pipeline: [
            {
              $match: {
                isDeleted: false
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "salescontractdtls",
          localField: "_id",
          foreignField: "customer",
          as: "pendingSales",
          pipeline: [
            {
              $match: {
                isDeleted: false,
                shipment: false
              }
            },
            {
              $lookup: {
                from: "shipmentdtls",
                let: { salesContractId: "$salesContract" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$salesContract", "$$salesContractId"] },
                          { $eq: ["$isDeleted", false] }
                        ]
                      }
                    }
                  },
                  {
                    $group: {
                      _id: null,
                      totalQty: { $sum: "$qty" },
                      totalAmount: { $sum: "$amount" }
                    }
                  }
                ],
                as: "shipmentSummary"
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "salescontractdtls",
          localField: "_id",
          foreignField: "customer",
          as: "pendingSalesInvoice",
          pipeline: [
            {
              $match: {
                isDeleted: false,
                invoice: false,
                shipment: true
              }
            },
            {
              $lookup: {
                from: "shipmentdtls",
                let: { salesContractId: "$salesContract" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$salesContract", "$$salesContractId"] },
                          { $eq: ["$isDeleted", false] }
                        ]
                      }
                    }
                  },
                  {
                    $group: {
                      _id: null,
                      totalQty: { $sum: "$qty" },
                      totalAmount: { $sum: "$amount" }
                    }
                  }
                ],
                as: "invoiceSummary"
              }
            }
          ]
        }
      },
      {
        $addFields: {
          totalPendingQty: {
            $sum: {
              $map: {
                input: "$pendingSales",
                as: "sale",
                in: "$$sale.qty"
              }
            }
          },
          totalShippedQty: {
            $sum: {
              $map: {
                input: "$pendingSales",
                as: "sale",
                in: {
                  $ifNull: [
                    { $arrayElemAt: ["$$sale.shipmentSummary.totalQty", 0] },
                    0
                  ]
                }
              }
            }
          },
          totalPendingInvoiceQty: {
            $sum: {
              $map: {
                input: "$pendingSalesInvoice",
                as: "sale",
                in: "$$sale.qty"
              }
            }
          },
          totalInvoicedQty: {
            $sum: {
              $map: {
                input: "$pendingSalesInvoice",
                as: "sale",
                in: {
                  $ifNull: [
                    { $arrayElemAt: ["$$sale.invoiceSummary.totalQty", 0] },
                    0
                  ]
                }
              }
            }
          }
        }
      },
      {
        $addFields: {
          custmerName: "$name",
          // productionQty: { $sum: "$production.qty" },
          salesContractQty: { $sum: "$salescontractdtls.qty" },
          pendingSalesQty: { $subtract: ["$totalPendingQty", "$totalShippedQty"] },
          shipmentQty: { $sum: "$shipmentdtls.qty" },
          // pendingInvoiceQty: { $subtract: ["$totalPendingInvoiceQty", "$totalInvoicedQty"] },
          pendingInvoiceQty: { $sum: "$totalInvoicedQty" },
          invoiceQty: { $sum: "$invoicedtls.qty" },
          returnQty: { $sum: "$returndtls.actualQty" },
        }
      },
      {
        $project: {
          custmerName: 1,
          // productionQty: 1,
          salesContractQty: 1,
          pendingSalesQty: 1,
          shipmentQty: 1,
          pendingInvoiceQty: 1,
          invoiceQty: 1,
          returnQty: 1,
        }
      },
      { $sort: { salesContractQty: -1 } }
    ]


    const basePipelineSummary: any = [
      {
        $match: matchStage
      },
      // {
      //   $lookup: {
      //     from: "productiondtls",
      //     localField: "_id",
      //     foreignField: "product",
      //     as: "production",
      //     pipeline: [
      //       {
      //         $match: {
      //           isDeleted: false
      //         }
      //       }
      //     ]
      //   }
      // },
      {
        $lookup: {
          from: "returns",
          localField: "_id",
          foreignField: "customer",
          as: "returndtls",
          pipeline: [
            {
              $match: {
                isDeleted: false
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "shipmentdtls",
          localField: "_id",
          foreignField: "customer",
          as: "shipmentdtls",
          pipeline: [
            {
              $match: {
                isDeleted: false
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "invoicedtls",
          localField: "_id",
          foreignField: "customer",
          as: "invoicedtls",
          pipeline: [
            {
              $match: {
                isDeleted: false
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "salescontractdtls",
          localField: "_id",
          foreignField: "customer",
          as: "salescontractdtls",
          pipeline: [
            {
              $match: {
                isDeleted: false
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "salescontractdtls",
          localField: "_id",
          foreignField: "customer",
          as: "pendingSales",
          pipeline: [
            {
              $match: {
                isDeleted: false,
                shipment: false
              }
            },
            {
              $lookup: {
                from: "shipmentdtls",
                let: { salesContractId: "$salesContract" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$salesContract", "$$salesContractId"] },
                          { $eq: ["$isDeleted", false] }
                        ]
                      }
                    }
                  },
                  {
                    $group: {
                      _id: null,
                      totalQty: { $sum: "$qty" },
                      totalAmount: { $sum: "$amount" }
                    }
                  }
                ],
                as: "shipmentSummary"
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "salescontractdtls",
          localField: "_id",
          foreignField: "customer",
          as: "pendingSalesInvoice",
          pipeline: [
            {
              $match: {
                isDeleted: false,
                invoice: false,
                shipment: true
              }
            },
            {
              $lookup: {
                from: "shipmentdtls",
                let: { salesContractId: "$salesContract" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$salesContract", "$$salesContractId"] },
                          { $eq: ["$isDeleted", false] }
                        ]
                      }
                    }
                  },
                  {
                    $group: {
                      _id: null,
                      totalQty: { $sum: "$qty" },
                      totalAmount: { $sum: "$amount" }
                    }
                  }
                ],
                as: "invoiceSummary"
              }
            }
          ]
        }
      },
      {
        $addFields: {
          totalPendingQty: {
            $sum: {
              $map: {
                input: "$pendingSales",
                as: "sale",
                in: "$$sale.qty"
              }
            }
          },
          totalShippedQty: {
            $sum: {
              $map: {
                input: "$pendingSales",
                as: "sale",
                in: {
                  $ifNull: [
                    { $arrayElemAt: ["$$sale.shipmentSummary.totalQty", 0] },
                    0
                  ]
                }
              }
            }
          },
          totalPendingInvoiceQty: {
            $sum: {
              $map: {
                input: "$pendingSalesInvoice",
                as: "sale",
                in: "$$sale.qty"
              }
            }
          },
          totalInvoicedQty: {
            $sum: {
              $map: {
                input: "$pendingSalesInvoice",
                as: "sale",
                in: {
                  $ifNull: [
                    { $arrayElemAt: ["$$sale.invoiceSummary.totalQty", 0] },
                    0
                  ]
                }
              }
            }
          }
        }
      },
      {
        $addFields: {
          custmerName: "$name",
          // productionQty: { $sum: "$production.qty" },
          salesContractQty: { $sum: "$salescontractdtls.qty" },
          pendingSalesQty: { $subtract: ["$totalPendingQty", "$totalShippedQty"] },
          shipmentQty: { $sum: "$shipmentdtls.qty" },
          // pendingInvoiceQty: { $subtract: ["$totalPendingInvoiceQty", "$totalInvoicedQty"] },
          pendingInvoiceQty: { $sum: "$totalInvoicedQty" },
          invoiceQty: { $sum: "$invoicedtls.qty" },
          returnQty: { $sum: "$returndtls.actualQty" },
        }
      },
      {
        $project: {
          custmerName: 1,
          // productionQty: 1,
          salesContractQty: 1,
          pendingSalesQty: 1,
          shipmentQty: 1,
          pendingInvoiceQty: 1,
          invoiceQty: 1,
          returnQty: 1,
        }
      },
      { $sort: { productionQty: -1 } }
    ]

    const dataPipeline = [...basePipeline,
      // {
      //   $skip: skipCount,
      // },
      // {
      //   $limit: limit,
      // },
    ];
    const countPipeline = [...basePipeline,
    { $count: 'totalRecords' },
    { $count: 'totalRecords' }
    ];

    const summaryPipeline = [...basePipelineSummary,
    {
      $group: {
        _id: null,
        // totalProductionQty: { $sum: '$productionQty' },
        totalSalesContractQty: { $sum: '$salesContractQty' },
        totalPendingSalesQty: { $sum: '$pendingSalesQty' },
        totalShipmentQty: { $sum: '$shipmentQty' },
        totalPendingInvoiceQty: { $sum: '$pendingInvoiceQty' },
        totalInvoiceQty: { $sum: '$invoiceQty' },
        totalReturnQty: { $sum: '$returnQty' },
      },
    },
    {
      $project: {
        _id: 0,
        // totalProductionQty: 1,
        totalSalesContractQty: 1,
        totalPendingSalesQty: 1,
        totalShipmentQty: 1,
        totalInvoiceQty: 1,
        totalPendingInvoiceQty: 1,
        totalReturnQty: 1,
      },
    },
    ];

    const [details, totalResult, summaryResult] = await Promise.all([

      CustomerModel.aggregate(dataPipeline, { allowDiskUse: true }),
      CustomerModel.aggregate(countPipeline, { allowDiskUse: true }),
      CustomerModel.aggregate(summaryPipeline, { allowDiskUse: true }),
    ]);
    const totalRecords = totalResult.length > 0 ? totalResult[0].totalRecords : 0;
    const summary = summaryResult.length > 0 ? summaryResult[0] : {
      // totalproductionQty: 0,
      totalSalesContractQty: 0,
      totalPendingSalesQty: 0,
      totalShipmentQty: 0,
      totalpendingInvoiceQty: 0,
      totalInvoiceQty: 0,
      totalReturnQty: 0,
    };

    return {
      details,
      totalRecords,
      summary,
    };

  }
  else {
    throw new Error("Invalid input: Please provide either product_wise or customer_wise as true.");
  }
}