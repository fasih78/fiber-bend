import mongoose, { Mongoose, model } from 'mongoose';
import { Royality, RoyalityModel } from './royality.model';
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
import { Payment, PaymentModel } from '../payment/payment.model';
import { InvoiceDtlModel } from '../invoice/invoice_dtl.model';
import dayjs from 'dayjs';
import {
  SalesContract,
  SalesContractModel,
} from '../sales_contract/sales_contract.model';
import { SalesContractDtlModel } from '../sales_contract/sales_contract_dtl.model';
import { CustomerModel } from '../customer/customer.model';
//import { PaymentModel } from '../payment/payment.model';
import { ShipmentModel } from '../shipment/shipment.model';
import { Invoice, InvoiceModel } from '../invoice/invoice.model';
import { BrandModel } from '../brand/brand.model';
import { ProductModel } from '../product/product.model';
import { CurrencyModel } from '../currency/currency.model';
import _ from 'lodash';
import { payementSchema } from '../payment/payement.schema';
import invoiceRoutes from '../invoice/invoice.routes';
import { PaymentTermModel } from '../payment_term/payment_term.model';
import moment from 'moment';
import { RoyalityAdmModel } from './royalityAdmDenim.model';
import { R } from 'vitest/dist/types-c800444e';
import { setFlagsFromString } from 'v8';

export const createRoyality = async (input: CreateRoyalitySchema) => {
  const {
    id,
    paid,
    paymentDate,
    paymentDate1,
    payment,
    invoice,
    saletaxinvoicedate,
    royalityrate,
  } = input;

  const paymentModel = await PaymentModel.findById(payment);

  const invoiceDtls = await InvoiceDtlModel.aggregate([
    { $match: { invoice: paymentModel?.invoice } },
    {
      $group: {
        _id: '$invoice',
        invoice: { $first: '$invoice' },
        amount: { $sum: '$amount' },
        salesTaxAmount: { $sum: '$salesTaxAmount' },
      },
    },
  ]);
  const amount = (invoiceDtls[0].amount * 15) / 100;
  const saletax = await InvoiceModel.findOne({ _id: invoice });

  const sales_contract = await InvoiceModel.findOne({ _id: invoice });

  const sale = await InvoiceModel.findOne({ _id: invoice });
  const Customer = await SalesContractModel.findOne({
    _id: sale?.salesContract,
  });

  const sale_product = await InvoiceModel.findOne({ _id: invoice });
  const product = await SalesContractDtlModel.findOne({
    salesContract: sale_product?.salesContract,
  });

  const royality = await RoyalityModel.create({
    id,
    paid,
    paymentDate,
    paymentDate1,
    saletaxinvoicedate,
    payment: new mongoose.Types.ObjectId(payment),
    invoice: new mongoose.Types.ObjectId(invoice),
    salesContract: new mongoose.Types.ObjectId(sales_contract?.salesContract),
    customer: new mongoose.Types.ObjectId(Customer?.customer),
    product: new mongoose.Types.ObjectId(product?.product),
    amount,
    salesTaxInvoiceNo: saletax?.salesTaxInvoiceNo,
    royalityrate,
  });

  const royality1 = await RoyalityModel.find({
    payment: payment,
    isDeleted: false,
  });

  for (let royality of royality1) {
    const dtl = await RoyalityModel.find({ payment: royality._id });
    if (dtl) {
      const payment1 = await PaymentModel.findByIdAndUpdate(payment, {
        royality: true,
      });
    }
  }

  return royality;
};

export const createRoyalityAdmDenim = async (
  input: CreateRoyalityAdmDenimSchema
) => {
  const { salesContract, royalityrate, customer } = input;

  const sales = await SalesContractModel.findOne({ _id: input.salesContract });
  const dtl = await SalesContractDtlModel.findOne({
    salesContract: sales?._id,
  });
  console.log(dtl?.product, 'product id');
  const LastUser = await RoyalityModel.findOne().sort({ _id: -1 });
  const id = LastUser ? LastUser.id + 1 : 1;

  const salecontract = await SalesContractDtlModel.findOne({
    salesContract: salesContract,
  });
  const saleinvoice = await SalesContractModel.findOne({
    _id: salesContract,
  });
  const saletaxinvoice = saleinvoice?.salesTaxInvoiceNo;
  const extracted = salecontract?.amount;

  const amount = (extracted * 15) / 100;

  const royality = await RoyalityModel.create({
    id: id,
    saletaxinvoicedate: moment(new Date()).format('YYYY-MM-DD'),
    salesContract: new mongoose.Types.ObjectId(salesContract),
    amount: amount,
    royalityrate: royalityrate,
    paid: true,
    InHouse: true,
    customer: new mongoose.Types.ObjectId(customer),
    product: new mongoose.Types.ObjectId(dtl.product),
    salesTaxInvoiceNo: saletaxinvoice,
  });
  const sale = await SalesContractModel.findByIdAndUpdate(salesContract, {
    royality: true,
  });
};

export const updateRoyalityById = async (
  id: string,
  input: CreateRoyalitySchema
) => {
  const { paid, paymentDate, payment, paymentDate1, royalityrate } = input;

  const royalityupdate = await RoyalityModel.findByIdAndUpdate(id, {
    paid,
    paymentDate,
    paymentDate1,
    payment: new mongoose.Types.ObjectId(payment),
    royalityrate,
  });
  console.log('response', royalityupdate);
  return royalityupdate;
};

export const deleteRoyality = async () => {
  await RoyalityModel.deleteMany({});
  return await RoyalityModel.deleteMany({});
};

export const deleteRoyalityById = async (id: string) => {
  //await PaymentModel.deleteMany({payement:id})
  const royality = await RoyalityModel.findById(id);

  const sales = await PaymentModel.findByIdAndUpdate(royality?.payment, {
    royality: false,
  });
  const delete1 = await RoyalityModel.findByIdAndUpdate(id, {
    isDeleted: true,
  });
  return royality;
};

export const findRoyality = async (input: RoyalityPaginationSchema) => {
  const limit = input.perPage;
  const skipCount = (input.pageno - 1) * limit;
  const royalityrecords = await RoyalityModel.countDocuments();
  const royality = await RoyalityModel.find({
    Payment: Payment,
    isDeleted: false,
  })
    .populate({
      path: 'payment',
      model: PaymentModel,
      populate: [{ path: 'invoice', model: InvoiceModel }],
    })
    .limit(limit)
    .skip(skipCount)
    .sort({ id: 1 });

  // const invoiceDetails = await InvoiceDtlModel.find({ isDeleted: false })
  //   .populate({
  //     path: 'product',
  //     model: ProductModel,
  //   })
  //   .populate({
  //     path: 'currency',
  //     model: CurrencyModel,
  //   })
  //   .populate({
  //     path: 'invoice',
  //     model: InvoiceModel,
  //     populate: [
  //       {
  //         path: 'salesContract',
  //         model: SalesContractModel,
  //         populate: [
  //           { path: 'brand', model: BrandModel },
  //           { path: 'customer', model: CustomerModel },
  //           { path: 'paymentTerm', model: PaymentTermModel },
  //         ],
  //       },
  //     ],
  //   });

  const result = {
    royality_dtl: royality,
    total_Records: royalityrecords,
  };
  return result;
};
export const getNewRoyalityId = async () => {
  const Royality = await RoyalityModel.findOne()
    .sort({ field: 'asc', _id: -1 })
    .limit(1);

  let newId: number = 1;
  if (Royality != null) {
    newId = Royality.id + 1;
  }

  return newId;
};

export const getNewRoyalityAdmDenimId = async () => {
  const Royality = await RoyalityAdmModel.findOne()
    .sort({ field: 'asc', _id: -1 })
    .limit(1);

  let newId: number = 1;
  if (Royality != null) {
    newId = Royality.id + 1;
  }

  return newId;
};

export const RoyalityDtlsByDate = async (input: ReportSchema) => {
  const royality = await RoyalityModel.aggregate([
    {
      $match: {
        saletaxinvoicedate: {
          $gte: new Date(
            moment(input.fromDate).startOf('date').format('YYYY-MM-DD')
          ),
          $lte: new Date(
            moment(input.toDate).endOf('date').format('YYYY-MM-DD')
          ),
        },
        isDeleted: false,
        InHouse: false,
      },
    },

    {
      $lookup: {
        from: 'salescontracts',
        localField: 'salesContract',
        foreignField: '_id',
        as: 'sale',
        pipeline: [
          {
            $lookup: {
              from: 'salescontractdtls',
              localField: '_id',
              foreignField: 'salesContract',
              as: 'sale_dtl',
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
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'product',
      },
    },

    // {
    //   $lookup: {
    //     from: 'payments',
    //     localField: 'payment',
    //     foreignField: '_id',
    //     as: 'payments',
    //     pipeline: [
    //       {
    //         $lookup: {
    //           from: 'invoices',
    //           localField: 'invoice',
    //           foreignField: '_id',
    //           as: 'invoices',
    //           pipeline: [
    //             {
    //               $lookup: {
    //                 from: 'invoicedtls',
    //                 localField: '_id',
    //                 foreignField: 'invoice',
    //                 as: 'invoicedtls',
    //                 pipeline: [
    //                   {
    //                     $lookup: {
    //                       from: 'products',
    //                       localField: 'product',
    //                       foreignField: '_id',
    //                       as: 'product',
    //                     },
    //                   },
    //                 ],
    //               },
    //             },
    //             {
    //               $lookup: {
    //                 from: 'salescontracts',
    //                 localField: 'salesContract',
    //                 foreignField: '_id',
    //                 as: 'salescontracts',
    //                 pipeline: [
    //                   {
    //                     $lookup: {
    //                       from: 'customers',
    //                       localField: 'customer',
    //                       foreignField: '_id',
    //                       as: 'customer',
    //                     },
    //                   },
    //                   {
    //                     $lookup: {
    //                       from: 'brands',
    //                       localField: 'brand',
    //                       foreignField: '_id',
    //                       as: 'Brand',
    //                     },
    //                   },
    //                 ],
    //               },
    //             },
    //           ],
    //         },
    //       },
    //     ],
    //   },
    // },
  ]);
  return royality;
};
export const royalityAdmdenimReport = async (
  input: updateRoyalityrateSchema
) => {
  console.log(input);
  const royality = await RoyalityModel.aggregate([
    {
      $match: {
        saletaxinvoicedate: {
          $gte: new Date(
            moment(input.fromDate).startOf('date').format('YYYY-MM-DD')
          ),
          $lte: new Date(
            moment(input.toDate).endOf('date').format('YYYY-MM-DD')
          ),
        },
        customer: new mongoose.Types.ObjectId(input.customer),
        isDeleted: false,
        InHouse: true,
      },
    },
    {
      $lookup: {
        from: 'salescontracts',
        localField: 'salesContract',
        foreignField: '_id',
        as: 'sale',
        pipeline: [
          {
            $lookup: {
              from: 'salescontractdtls',
              localField: '_id',
              foreignField: 'salesContract',
              as: 'sale_dtl',
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
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'product',
      },
    },
  ]);
  return royality;
};

export const royalityrateipdate = async (input: updateRoyalityrateSchema) => {
  // const { royalityrate } = input;

  console.log('input', input);
  const royalityupdate = await RoyalityModel.updateMany({
    // royalityrate,
  });
  console.log('response', royalityupdate);
  return royalityupdate;
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// export const findAllDetailToReport = async (input: ReportSchema) => {
//   let where: any = {
//     saletaxinvoicedate: {
//       $gte: dayjs(input.fromDate).startOf('date'),
//       $lte: dayjs(input.toDate).endOf('date'),
//     },
//   };
//   if (input?.customer != '') {
//     where.customer = input.customer;
//   }

//   const saleContract = await SalesContractModel.find()

//     .populate({
//       path: 'customer',
//       model: CustomerModel,
//     })
//     .populate({
//       path: 'brand',
//       model: BrandModel,
//     });

//   const saleContractDetail = await SalesContractDtlModel.find({
//     salesContract: saleContract,
//   })
//     .populate({
//       path: 'product',
//       model: ProductModel,
//     })
//     .populate({
//       path: 'currency',
//       model: CurrencyModel,
//     })
//     .populate({
//       path: 'salesContract',
//       model: SalesContractModel,
//       populate: [
//         { path: 'customer', model: CustomerModel },
//         { path: 'brand', model: BrandModel },
//       ],
//     });

//   const shipment = await ShipmentModel.find({
//     salesContract: saleContract,
//   });

//   const invoice = await InvoiceModel.find({
//     salesContract: { $in: saleContract },
//   });
//   const payment = await PaymentModel.find({ invoice: { $in: invoice } });
//   const royality = await RoyalityModel.find({
//     payment: { $in: payment },
//   }).populate({
//     path: 'payment',
//     model: PaymentModel,
//     populate: [
//       {
//         path: 'invoice',
//         model: InvoiceModel,
//         populate: [{ path: 'salesContract', model: SalesContractModel }],
//       },
//     ],
//   });

//   const royalties = royality.map((r) => {
//     const scd = saleContractDetail.find(
//       (s) =>
//         s.salesContract._id.toString() ==
//         r['payment']['invoice']['salesContract']['_id'].toString()
//     );

//     const ship = shipment.find(
//       (s) =>
//         s.salesContract._id.toString() ==
//         r['payment']['invoice']['salesContract']['_id'].toString()
//     );

//     let data = _.merge(r, scd, ship);

//     return data;
//   });

//   return royalties;
// };

export const findroyalityamount = async (input: RoyalityamountSchema) => {
  const { payment } = input;
  const paymentModel = await PaymentModel.findById(payment);

  const invoiceDtls = await InvoiceDtlModel.aggregate([
    { $match: { invoice: paymentModel?.invoice } },
    {
      $group: {
        _id: '$invoice',
        invoice: { $first: '$invoice' },
        amount: { $sum: '$amount' },
        salesTaxAmount: { $sum: '$salesTaxAmount' },
      },
    },
  ]);
  console.log(invoiceDtls, 'invoiceDtls');
  const amount = (invoiceDtls[0].amount / 100) * 15;
  console.log(amount, 'amount');
  return amount;
};
export const findAdmroyalityamount = async (input: RoyalityamountSchema) => {
  const { salescontract } = input;
  const salecontracts = await SalesContractDtlModel.findOne({
    salesContract: salescontract,
  });
  console.log(salecontracts);
  const amount = salecontracts?.amount;
  const cal = (amount * 15) / 100;

  return cal;
};

export const RoyalityReportDtlwithAdmDenim = async (
  input: RoyalityReportSchema
) => {
  if (input.Admdenim == '' && input.otherthanadmdenim == '') {
    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;

    let where: any = {};
    let filter = {};
    let filter_records: any = {};

    const salecontractArr = input.salesContract
      ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const productArr = input.product
      ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const customerArr = input.customer
      ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    if (
      salecontractArr.length > 0 &&
      productArr.length > 0 &&
      customerArr.length > 0
    ) {
      where.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salecontractArr },
          product: { $in: productArr },
        },
      ];
      filter = {
        customer: { $in: customerArr },
        salesContract: { $in: salecontractArr },
        product: { $in: productArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salecontractArr },
          product: { $in: productArr },
        },
      ];
    } else if (salecontractArr.length > 0 && customerArr.length > 0) {
      where.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salecontractArr },
        },
      ];
      filter = {
        customer: { $in: customerArr },
        salesContract: { $in: salecontractArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salecontractArr },
        },
      ];
    } else if (salecontractArr.length > 0 && productArr.length > 0) {
      where.$and = [
        {
          salesContract: { $in: salecontractArr },
          product: { $in: productArr },
        },
      ];
      filter = {
        salesContract: { $in: salecontractArr },
        product: { $in: productArr },
      };
      filter_records.$and = [
        {
          salesContract: { $in: salecontractArr },
          product: { $in: productArr },
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
        customer: { $in: customerArr },

        product: { $in: productArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },

          product: { $in: productArr },
        },
      ];
    } else if (salecontractArr.length > 0) {
      where = {
        salesContract: { $in: salecontractArr },
      };
      filter = {
        salesContract: { $in: salecontractArr },
      };
      filter_records = {
        salesContract: { $in: salecontractArr },
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
    }
    const group_by = await RoyalityModel.aggregate([
      {
        $match: {
          saletaxinvoicedate: {
            $gte: new Date(
              moment(input.fromDate).startOf('date').format('YYYY-MM-DD')
            ),
            $lte: new Date(
              moment(input.toDate).endOf('date').format('YYYY-MM-DD')
            ),
          },
          isDeleted: false,
        },
      },
      {
        $match: filter,
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'sale',
          pipeline: [
            {
              $lookup: {
                from: 'salescontractdtls',
                localField: '_id',
                foreignField: 'salesContract',
                as: 'sale_dtl',
              },
            },
          ],
        },
      },
      {
        $project: {
          qty: {
            $first: '$sale.sale_dtl.qty',
          },
          rate: {
            $first: '$sale.sale_dtl.rate',
          },
          amount: {
            $first: '$sale.sale_dtl.amount',
          },
        },
      },
      {
        $project: {
          qty: {
            $sum: '$qty',
          },
          rate: {
            $first: '$rate',
          },
          amount: {
            $first: '$amount',
          },
        },
      },
      {
        $group: {
          _id: '_id',
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
        },
      },
    ]);

    const totalQty = group_by.map((item: any) => item.qty);
    const totalAmount = group_by.map((item: any) => item.amount);

    const RoyalityAmount = await RoyalityModel.aggregate([
      {
        $match: {
          saletaxinvoicedate: {
            $gte: new Date(
              moment(input.fromDate).startOf('date').format('YYYY-MM-DD')
            ),
            $lte: new Date(
              moment(input.toDate).endOf('date').format('YYYY-MM-DD')
            ),
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
          Royality_Amount: {
            $sum: '$amount',
          },
        },
      },
    ]);

    const royalitymaount=RoyalityAmount.map((item)=>item.Royality_Amount)
    const total_records = await RoyalityModel.aggregate([
      {
        $match: {
          saletaxinvoicedate: {
            $gte: new Date(
              moment(input.fromDate).startOf('date').format('YYYY-MM-DD')
            ),
            $lte: new Date(
              moment(input.toDate).endOf('date').format('YYYY-MM-DD')
            ),
          },
          isDeleted: false,
        },
      },
      {
        $match: filter_records,
      },
    ]);

    const royality = await RoyalityModel.aggregate([
      {
        $match: {
          saletaxinvoicedate: {
            $gte: new Date(
              moment(input.fromDate).startOf('date').format('YYYY-MM-DD')
            ),
            $lte: new Date(
              moment(input.toDate).endOf('date').format('YYYY-MM-DD')
            ),
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
          as: 'sale',
          pipeline: [
            {
              $lookup: {
                from: 'salescontractdtls',
                localField: '_id',
                foreignField: 'salesContract',
                as: 'sale_dtl',
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
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $skip: skipCount },
      { $limit: limit },
      { $sort: { id: 1 } },
    ]);
    const result = {
      royality_dtl: royality,
      paginated_result: royality.length,
      total_records: total_records.length,
      totalQty: totalQty,
      totalAmount: totalAmount,
      RoyalityAmount:royalitymaount
    };
    return result;
  } 
  else if (input.Admdenim !== '') {
    console.log('adm denim');
    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;
    let where: any = {};
    let filter = {};
    let filter_records: any = {};

    const salecontractArr = input.salesContract
      ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const productArr = input.product
      ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const customerArr = input.customer
      ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    if (
      salecontractArr.length > 0 &&
      productArr.length > 0 &&
      customerArr.length > 0
    ) {
      where.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salecontractArr },
          product: { $in: productArr },
        },
      ];
      filter = {
        customer: { $in: customerArr },
        salesContract: { $in: salecontractArr },
        product: { $in: productArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salecontractArr },
          product: { $in: productArr },
        },
      ];
    } else if (salecontractArr.length > 0 && customerArr.length > 0) {
      where.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salecontractArr },
        },
      ];
      filter = {
        customer: { $in: customerArr },
        salesContract: { $in: salecontractArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salecontractArr },
        },
      ];
    } else if (salecontractArr.length > 0 && productArr.length > 0) {
      where.$and = [
        {
          salesContract: { $in: salecontractArr },
          product: { $in: productArr },
        },
      ];
      filter = {
        salesContract: { $in: salecontractArr },
        product: { $in: productArr },
      };
      filter_records.$and = [
        {
          salesContract: { $in: salecontractArr },
          product: { $in: productArr },
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
        customer: { $in: customerArr },

        product: { $in: productArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },

          product: { $in: productArr },
        },
      ];
    } else if (salecontractArr.length > 0) {
      where = {
        salesContract: { $in: salecontractArr },
      };
      filter = {
        salesContract: { $in: salecontractArr },
      };
      filter_records = {
        salesContract: { $in: salecontractArr },
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
    }
    const group_by = await RoyalityModel.aggregate([
      {
        $match: {
          saletaxinvoicedate: {
            $gte: new Date(
              moment(input.fromDate).startOf('date').format('YYYY-MM-DD')
            ),
            $lte: new Date(
              moment(input.toDate).endOf('date').format('YYYY-MM-DD')
            ),
          },
          isDeleted: false,
          InHouse: true,
        },
      },
      {
        $match: filter,
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'sale',
          pipeline: [
            {
              $lookup: {
                from: 'salescontractdtls',
                localField: '_id',
                foreignField: 'salesContract',
                as: 'sale_dtl',
              },
            },
          ],
        },
      },
      {
        $project: {
          qty: {
            $first: '$sale.sale_dtl.qty',
          },
          rate: {
            $first: '$sale.sale_dtl.rate',
          },
          amount: {
            $first: '$sale.sale_dtl.amount',
          },
        },
      },
      {
        $project: {
          qty: {
            $sum: '$qty',
          },
          rate: {
            $first: '$rate',
          },
          amount: {
            $first: '$amount',
          },
        },
      },
      {
        $group: {
          _id: '_id',
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
        },
      },
    ]);

    const totalQty = group_by.map((item: any) => item.qty);
    const totalAmount = group_by.map((item: any) => item.amount);

    const RoyalityAmount = await RoyalityModel.aggregate([
      {
        $match: {
          saletaxinvoicedate: {
            $gte: new Date(
              moment(input.fromDate).startOf('date').format('YYYY-MM-DD')
            ),
            $lte: new Date(
              moment(input.toDate).endOf('date').format('YYYY-MM-DD')
            ),
          },
          isDeleted: false,
          InHouse: true,
        },
      },
      {
        $match: filter,
      },

      {
        $group: {
          _id: 'null',
          Royality_Amount: {
            $sum: '$amount',
          },
        },
      },
    ]);

    const royalitymaount=RoyalityAmount.map((item)=>item.Royality_Amount)
    const total_records = await RoyalityModel.aggregate([
      {
        $match: {
          saletaxinvoicedate: {
            $gte: new Date(
              moment(input.fromDate).startOf('date').format('YYYY-MM-DD')
            ),
            $lte: new Date(
              moment(input.toDate).endOf('date').format('YYYY-MM-DD')
            ),
          },
          isDeleted: false,
          InHouse: true,
        },
      },
      {
        $match: filter_records,
      },
    ]);

    const royality = await RoyalityModel.aggregate([
      {
        $match: {
          saletaxinvoicedate: {
            $gte: new Date(
              moment(input.fromDate).startOf('date').format('YYYY-MM-DD')
            ),
            $lte: new Date(
              moment(input.toDate).endOf('date').format('YYYY-MM-DD')
            ),
          },
          isDeleted: false,
          InHouse: true,
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
          as: 'sale',
          pipeline: [
            {
              $lookup: {
                from: 'salescontractdtls',
                localField: '_id',
                foreignField: 'salesContract',
                as: 'sale_dtl',
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
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $skip: skipCount },
      { $limit: limit },
      { $sort: { id: 1 } },
    ]);
    const result = {
      royality_dtl: royality,
      paginated_result: royality.length,
      total_records: total_records.length,
      totalQty: totalQty,
      totalAmount: totalAmount,
      RoyalityAmount:royalitymaount
    };
    return result;
  }
   else if (input.otherthanadmdenim !== '') {
    console.log(' other than adm denim');
    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;
    let where: any = {};
    let filter = {};
    let filter_records: any = {};

    const salecontractArr = input.salesContract
      ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const productArr = input.product
      ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const customerArr = input.customer
      ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    if (
      salecontractArr.length > 0 &&
      productArr.length > 0 &&
      customerArr.length > 0
    ) {
      where.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salecontractArr },
          product: { $in: productArr },
        },
      ];
      filter = {
        customer: { $in: customerArr },
        salesContract: { $in: salecontractArr },
        product: { $in: productArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salecontractArr },
          product: { $in: productArr },
        },
      ];
    } else if (salecontractArr.length > 0 && customerArr.length > 0) {
      where.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salecontractArr },
        },
      ];
      filter = {
        customer: { $in: customerArr },
        salesContract: { $in: salecontractArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salecontractArr },
        },
      ];
    } else if (salecontractArr.length > 0 && productArr.length > 0) {
      where.$and = [
        {
          salesContract: { $in: salecontractArr },
          product: { $in: productArr },
        },
      ];
      filter = {
        salesContract: { $in: salecontractArr },
        product: { $in: productArr },
      };
      filter_records.$and = [
        {
          salesContract: { $in: salecontractArr },
          product: { $in: productArr },
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
        customer: { $in: customerArr },

        product: { $in: productArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },

          product: { $in: productArr },
        },
      ];
    } else if (salecontractArr.length > 0) {
      where = {
        salesContract: { $in: salecontractArr },
      };
      filter = {
        salesContract: { $in: salecontractArr },
      };
      filter_records = {
        salesContract: { $in: salecontractArr },
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
    }
    const group_by = await RoyalityModel.aggregate([
      {
        $match: {
          saletaxinvoicedate: {
            $gte: new Date(
              moment(input.fromDate).startOf('date').format('YYYY-MM-DD')
            ),
            $lte: new Date(
              moment(input.toDate).endOf('date').format('YYYY-MM-DD')
            ),
          },
          isDeleted: false,
          InHouse: false,
        },
      },
      {
        $match: filter,
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'sale',
          pipeline: [
            {
              $lookup: {
                from: 'salescontractdtls',
                localField: '_id',
                foreignField: 'salesContract',
                as: 'sale_dtl',
              },
            },
          ],
        },
      },
      {
        $project: {
          qty: {
            $first: '$sale.sale_dtl.qty',
          },
          rate: {
            $first: '$sale.sale_dtl.rate',
          },
          amount: {
            $first: '$sale.sale_dtl.amount',
          },
        },
      },
      {
        $project: {
          qty: {
            $sum: '$qty',
          },
          rate: {
            $first: '$rate',
          },
          amount: {
            $first: '$amount',
          },
        },
      },
      {
        $group: {
          _id: '_id',
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
        },
      },
    ]);

    const totalQty = group_by.map((item: any) => item.qty);
    const totalAmount = group_by.map((item: any) => item.amount);
    const RoyalityAmount = await RoyalityModel.aggregate([
      {
        $match: {
          saletaxinvoicedate: {
            $gte: new Date(
              moment(input.fromDate).startOf('date').format('YYYY-MM-DD')
            ),
            $lte: new Date(
              moment(input.toDate).endOf('date').format('YYYY-MM-DD')
            ),
          },
          isDeleted: false,
          InHouse:false
        },
      },
      {
        $match: filter,
      },

      {
        $group: {
          _id: 'null',
          Royality_Amount: {
            $sum: '$amount',
          },
        },
      },
    ]);

    const royalitymaount=RoyalityAmount.map((item)=>item.Royality_Amount)
    





    const total_records = await RoyalityModel.aggregate([
      {
        $match: {
          saletaxinvoicedate: {
            $gte: new Date(
              moment(input.fromDate).startOf('date').format('YYYY-MM-DD')
            ),
            $lte: new Date(
              moment(input.toDate).endOf('date').format('YYYY-MM-DD')
            ),
          },
          isDeleted: false,
          InHouse: false,
        },
      },
      {
        $match: filter_records,
      },
    ]);

    const royality = await RoyalityModel.aggregate([
      {
        $match: {
          saletaxinvoicedate: {
            $gte: new Date(
              moment(input.fromDate).startOf('date').format('YYYY-MM-DD')
            ),
            $lte: new Date(
              moment(input.toDate).endOf('date').format('YYYY-MM-DD')
            ),
          },
          isDeleted: false,
          InHouse: false,
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
          as: 'sale',
          pipeline: [
            {
              $lookup: {
                from: 'salescontractdtls',
                localField: '_id',
                foreignField: 'salesContract',
                as: 'sale_dtl',
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
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $skip: skipCount },
      { $limit: limit },
      { $sort: { id: 1 } },
    ]);
    const result = {
      royality_dtl: royality,
      paginated_result: royality.length,
      total_records: total_records.length,
      totalQty: totalQty,
      totalAmount: totalAmount,
      RoyalityAmount:RoyalityAmount
    };
    return result;
  }
};



export const  RoyalitydtlReportPrint = async(input:RoyalityReportPrintSchema)=>{

  if (input.Admdenim == '' && input.otherthanadmdenim == '') {
   

    let where: any = {};
    let filter = {};
    let filter_records: any = {};

    const salecontractArr = input.salesContract
      ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const productArr = input.product
      ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const customerArr = input.customer
      ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    if (
      salecontractArr.length > 0 &&
      productArr.length > 0 &&
      customerArr.length > 0
    ) {
      where.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salecontractArr },
          product: { $in: productArr },
        },
      ];
      filter = {
        customer: { $in: customerArr },
        salesContract: { $in: salecontractArr },
        product: { $in: productArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salecontractArr },
          product: { $in: productArr },
        },
      ];
    } else if (salecontractArr.length > 0 && customerArr.length > 0) {
      where.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salecontractArr },
        },
      ];
      filter = {
        customer: { $in: customerArr },
        salesContract: { $in: salecontractArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salecontractArr },
        },
      ];
    } else if (salecontractArr.length > 0 && productArr.length > 0) {
      where.$and = [
        {
          salesContract: { $in: salecontractArr },
          product: { $in: productArr },
        },
      ];
      filter = {
        salesContract: { $in: salecontractArr },
        product: { $in: productArr },
      };
      filter_records.$and = [
        {
          salesContract: { $in: salecontractArr },
          product: { $in: productArr },
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
        customer: { $in: customerArr },

        product: { $in: productArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },

          product: { $in: productArr },
        },
      ];
    } else if (salecontractArr.length > 0) {
      where = {
        salesContract: { $in: salecontractArr },
      };
      filter = {
        salesContract: { $in: salecontractArr },
      };
      filter_records = {
        salesContract: { $in: salecontractArr },
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
    }
    const group_by = await RoyalityModel.aggregate([
      {
        $match: {
          saletaxinvoicedate: {
            $gte: new Date(
              moment(input.fromDate).startOf('date').format('YYYY-MM-DD')
            ),
            $lte: new Date(
              moment(input.toDate).endOf('date').format('YYYY-MM-DD')
            ),
          },
          isDeleted: false,
        },
      },
      {
        $match: filter,
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'sale',
          pipeline: [
            {
              $lookup: {
                from: 'salescontractdtls',
                localField: '_id',
                foreignField: 'salesContract',
                as: 'sale_dtl',
              },
            },
          ],
        },
      },
      {
        $project: {
          qty: {
            $first: '$sale.sale_dtl.qty',
          },
          rate: {
            $first: '$sale.sale_dtl.rate',
          },
          amount: {
            $first: '$sale.sale_dtl.amount',
          },
        },
      },
      {
        $project: {
          qty: {
            $sum: '$qty',
          },
          rate: {
            $first: '$rate',
          },
          amount: {
            $first: '$amount',
          },
        },
      },
      {
        $group: {
          _id: '_id',
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
        },
      },
    ]);

    const totalQty = group_by.map((item: any) => item.qty);
    const totalAmount = group_by.map((item: any) => item.amount);

    const RoyalityAmount = await RoyalityModel.aggregate([
      {
        $match: {
          saletaxinvoicedate: {
            $gte: new Date(
              moment(input.fromDate).startOf('date').format('YYYY-MM-DD')
            ),
            $lte: new Date(
              moment(input.toDate).endOf('date').format('YYYY-MM-DD')
            ),
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
          Royality_Amount: {
            $sum: '$amount',
          },
        },
      },
    ]);

    const royalitymaount=RoyalityAmount.map((item)=>item.Royality_Amount)
    const total_records = await RoyalityModel.aggregate([
      {
        $match: {
          saletaxinvoicedate: {
            $gte: new Date(
              moment(input.fromDate).startOf('date').format('YYYY-MM-DD')
            ),
            $lte: new Date(
              moment(input.toDate).endOf('date').format('YYYY-MM-DD')
            ),
          },
          isDeleted: false,
        },
      },
      {
        $match: filter_records,
      },
    ]);

    const royality = await RoyalityModel.aggregate([
      {
        $match: {
          saletaxinvoicedate: {
            $gte: new Date(
              moment(input.fromDate).startOf('date').format('YYYY-MM-DD')
            ),
            $lte: new Date(
              moment(input.toDate).endOf('date').format('YYYY-MM-DD')
            ),
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
          as: 'sale',
          pipeline: [
            {
              $lookup: {
                from: 'salescontractdtls',
                localField: '_id',
                foreignField: 'salesContract',
                as: 'sale_dtl',
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
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product',
        },
      },
    
    ]);
    const result = {
      royality_dtl: royality,
      paginated_result: royality.length,
      total_records: total_records.length,
      totalQty: totalQty,
      totalAmount: totalAmount,
      RoyalityAmount:royalitymaount
    };
    return result;
  } 
  else if (input.Admdenim !== '') {
    console.log('adm denim');

    let where: any = {};
    let filter = {};
    let filter_records: any = {};

    const salecontractArr = input.salesContract
      ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const productArr = input.product
      ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const customerArr = input.customer
      ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    if (
      salecontractArr.length > 0 &&
      productArr.length > 0 &&
      customerArr.length > 0
    ) {
      where.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salecontractArr },
          product: { $in: productArr },
        },
      ];
      filter = {
        customer: { $in: customerArr },
        salesContract: { $in: salecontractArr },
        product: { $in: productArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salecontractArr },
          product: { $in: productArr },
        },
      ];
    } else if (salecontractArr.length > 0 && customerArr.length > 0) {
      where.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salecontractArr },
        },
      ];
      filter = {
        customer: { $in: customerArr },
        salesContract: { $in: salecontractArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salecontractArr },
        },
      ];
    } else if (salecontractArr.length > 0 && productArr.length > 0) {
      where.$and = [
        {
          salesContract: { $in: salecontractArr },
          product: { $in: productArr },
        },
      ];
      filter = {
        salesContract: { $in: salecontractArr },
        product: { $in: productArr },
      };
      filter_records.$and = [
        {
          salesContract: { $in: salecontractArr },
          product: { $in: productArr },
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
        customer: { $in: customerArr },

        product: { $in: productArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },

          product: { $in: productArr },
        },
      ];
    } else if (salecontractArr.length > 0) {
      where = {
        salesContract: { $in: salecontractArr },
      };
      filter = {
        salesContract: { $in: salecontractArr },
      };
      filter_records = {
        salesContract: { $in: salecontractArr },
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
    }
    const group_by = await RoyalityModel.aggregate([
      {
        $match: {
          saletaxinvoicedate: {
            $gte: new Date(
              moment(input.fromDate).startOf('date').format('YYYY-MM-DD')
            ),
            $lte: new Date(
              moment(input.toDate).endOf('date').format('YYYY-MM-DD')
            ),
          },
          isDeleted: false,
          InHouse: true,
        },
      },
      {
        $match: filter,
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'sale',
          pipeline: [
            {
              $lookup: {
                from: 'salescontractdtls',
                localField: '_id',
                foreignField: 'salesContract',
                as: 'sale_dtl',
              },
            },
          ],
        },
      },
      {
        $project: {
          qty: {
            $first: '$sale.sale_dtl.qty',
          },
          rate: {
            $first: '$sale.sale_dtl.rate',
          },
          amount: {
            $first: '$sale.sale_dtl.amount',
          },
        },
      },
      {
        $project: {
          qty: {
            $sum: '$qty',
          },
          rate: {
            $first: '$rate',
          },
          amount: {
            $first: '$amount',
          },
        },
      },
      {
        $group: {
          _id: '_id',
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
        },
      },
    ]);

    const totalQty = group_by.map((item: any) => item.qty);
    const totalAmount = group_by.map((item: any) => item.amount);

    const RoyalityAmount = await RoyalityModel.aggregate([
      {
        $match: {
          saletaxinvoicedate: {
            $gte: new Date(
              moment(input.fromDate).startOf('date').format('YYYY-MM-DD')
            ),
            $lte: new Date(
              moment(input.toDate).endOf('date').format('YYYY-MM-DD')
            ),
          },
          isDeleted: false,
          InHouse: true,
        },
      },
      {
        $match: filter,
      },

      {
        $group: {
          _id: 'null',
          Royality_Amount: {
            $sum: '$amount',
          },
        },
      },
    ]);

    const royalitymaount=RoyalityAmount.map((item)=>item.Royality_Amount)
    const total_records = await RoyalityModel.aggregate([
      {
        $match: {
          saletaxinvoicedate: {
            $gte: new Date(
              moment(input.fromDate).startOf('date').format('YYYY-MM-DD')
            ),
            $lte: new Date(
              moment(input.toDate).endOf('date').format('YYYY-MM-DD')
            ),
          },
          isDeleted: false,
          InHouse: true,
        },
      },
      {
        $match: filter_records,
      },
    ]);

    const royality = await RoyalityModel.aggregate([
      {
        $match: {
          saletaxinvoicedate: {
            $gte: new Date(
              moment(input.fromDate).startOf('date').format('YYYY-MM-DD')
            ),
            $lte: new Date(
              moment(input.toDate).endOf('date').format('YYYY-MM-DD')
            ),
          },
          isDeleted: false,
          InHouse: true,
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
          as: 'sale',
          pipeline: [
            {
              $lookup: {
                from: 'salescontractdtls',
                localField: '_id',
                foreignField: 'salesContract',
                as: 'sale_dtl',
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
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product',
        },
      },
 
    ]);
    const result = {
      royality_dtl: royality,
      paginated_result: royality.length,
      total_records: total_records.length,
      totalQty: totalQty,
      totalAmount: totalAmount,
      RoyalityAmount:royalitymaount
    };
    return result;
  }
   else if (input.otherthanadmdenim !== '') {
    console.log(' other than adm denim');
   
    let where: any = {};
    let filter = {};
    let filter_records: any = {};

    const salecontractArr = input.salesContract
      ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const productArr = input.product
      ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const customerArr = input.customer
      ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    if (
      salecontractArr.length > 0 &&
      productArr.length > 0 &&
      customerArr.length > 0
    ) {
      where.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salecontractArr },
          product: { $in: productArr },
        },
      ];
      filter = {
        customer: { $in: customerArr },
        salesContract: { $in: salecontractArr },
        product: { $in: productArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salecontractArr },
          product: { $in: productArr },
        },
      ];
    } else if (salecontractArr.length > 0 && customerArr.length > 0) {
      where.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salecontractArr },
        },
      ];
      filter = {
        customer: { $in: customerArr },
        salesContract: { $in: salecontractArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },
          salesContract: { $in: salecontractArr },
        },
      ];
    } else if (salecontractArr.length > 0 && productArr.length > 0) {
      where.$and = [
        {
          salesContract: { $in: salecontractArr },
          product: { $in: productArr },
        },
      ];
      filter = {
        salesContract: { $in: salecontractArr },
        product: { $in: productArr },
      };
      filter_records.$and = [
        {
          salesContract: { $in: salecontractArr },
          product: { $in: productArr },
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
        customer: { $in: customerArr },

        product: { $in: productArr },
      };
      filter_records.$and = [
        {
          customer: { $in: customerArr },

          product: { $in: productArr },
        },
      ];
    } else if (salecontractArr.length > 0) {
      where = {
        salesContract: { $in: salecontractArr },
      };
      filter = {
        salesContract: { $in: salecontractArr },
      };
      filter_records = {
        salesContract: { $in: salecontractArr },
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
    }
    const group_by = await RoyalityModel.aggregate([
      {
        $match: {
          saletaxinvoicedate: {
            $gte: new Date(
              moment(input.fromDate).startOf('date').format('YYYY-MM-DD')
            ),
            $lte: new Date(
              moment(input.toDate).endOf('date').format('YYYY-MM-DD')
            ),
          },
          isDeleted: false,
          InHouse: false,
        },
      },
      {
        $match: filter,
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'sale',
          pipeline: [
            {
              $lookup: {
                from: 'salescontractdtls',
                localField: '_id',
                foreignField: 'salesContract',
                as: 'sale_dtl',
              },
            },
          ],
        },
      },
      {
        $project: {
          qty: {
            $first: '$sale.sale_dtl.qty',
          },
          rate: {
            $first: '$sale.sale_dtl.rate',
          },
          amount: {
            $first: '$sale.sale_dtl.amount',
          },
        },
      },
      {
        $project: {
          qty: {
            $sum: '$qty',
          },
          rate: {
            $first: '$rate',
          },
          amount: {
            $first: '$amount',
          },
        },
      },
      {
        $group: {
          _id: '_id',
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
        },
      },
    ]);

    const totalQty = group_by.map((item: any) => item.qty);
    const totalAmount = group_by.map((item: any) => item.amount);
    const RoyalityAmount = await RoyalityModel.aggregate([
      {
        $match: {
          saletaxinvoicedate: {
            $gte: new Date(
              moment(input.fromDate).startOf('date').format('YYYY-MM-DD')
            ),
            $lte: new Date(
              moment(input.toDate).endOf('date').format('YYYY-MM-DD')
            ),
          },
          isDeleted: false,
          InHouse:false
        },
      },
      {
        $match: filter,
      },

      {
        $group: {
          _id: 'null',
          Royality_Amount: {
            $sum: '$amount',
          },
        },
      },
    ]);

    const royalitymaount=RoyalityAmount.map((item)=>item.Royality_Amount)
    





    const total_records = await RoyalityModel.aggregate([
      {
        $match: {
          saletaxinvoicedate: {
            $gte: new Date(
              moment(input.fromDate).startOf('date').format('YYYY-MM-DD')
            ),
            $lte: new Date(
              moment(input.toDate).endOf('date').format('YYYY-MM-DD')
            ),
          },
          isDeleted: false,
          InHouse: false,
        },
      },
      {
        $match: filter_records,
      },
    ]);

    const royality = await RoyalityModel.aggregate([
      {
        $match: {
          saletaxinvoicedate: {
            $gte: new Date(
              moment(input.fromDate).startOf('date').format('YYYY-MM-DD')
            ),
            $lte: new Date(
              moment(input.toDate).endOf('date').format('YYYY-MM-DD')
            ),
          },
          isDeleted: false,
          InHouse: false,
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
          as: 'sale',
          pipeline: [
            {
              $lookup: {
                from: 'salescontractdtls',
                localField: '_id',
                foreignField: 'salesContract',
                as: 'sale_dtl',
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
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product',
        },
      },
     
    ]);
    const result = {
      royality_dtl: royality,
      paginated_result: royality.length,
      total_records: total_records.length,
      totalQty: totalQty,
      totalAmount: totalAmount,
      RoyalityAmount:RoyalityAmount
    };
    return result;
  }

}