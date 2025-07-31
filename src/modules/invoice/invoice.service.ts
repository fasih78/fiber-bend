import mongoose, { mongo } from 'mongoose';
import { Invoice, InvoiceModel } from './invoice.model';
import {
  CreateInvoiceSchema,
  InvoicePagintionSchema,
  InvoiceReportPrintSchema,
} from './invoice.schema';
import { InvoiceDtl, InvoiceDtlModel } from './invoice_dtl.model';
import dayjs from 'dayjs';
import { ProductModel } from '../product/product.model';
import { SalesContractModel } from '../sales_contract/sales_contract.model';
import { Currency, CurrencyModel } from '../currency/currency.model';
import { SalesContractDtlModel } from '../sales_contract/sales_contract_dtl.model';

import { SaleContractReportSchema } from '../sales_contract/sales_contract.schema';
import { CustomerModel } from '../customer/customer.model';
import { BrandModel } from '../brand/brand.model';
import { PaymentTermModel } from '../payment_term/payment_term.model';
import { InvoiceReportSchema } from './invoice.schema';
import _, { stubFalse } from 'lodash';
import { PaymentModel } from '../payment/payment.model';
import moment = require('moment');
import fastify = require('fastify');
import { hasUncaughtExceptionCaptureCallback } from 'process';
import { pipeline } from 'stream';

// export const createInvoice1 = async (input: CreateInvoiceSchema) => {
//   const {
//     inv,
//     date,
//     salesContract,
//     specialInstruction,
//     invoiceDtl,
//     salesTaxInvoiceNo,
//   } = input;

//   const customer_find = await SalesContractModel.find({ _id: salesContract });
//   const customerobjectid = customer_find[0].customer;
//   if (customerobjectid instanceof mongoose.Types.ObjectId) {
//     if (
//       customerobjectid.equals(
//         new mongoose.Types.ObjectId('648d7c960cee8c1de3294415')
//       )
//     ) {
//       const customer = await SalesContractModel.find({ _id: salesContract });
//       const customer_id = customer[0].customer;

//       const salecontract_contract = await SalesContractModel.findOne({
//         _id: salesContract,
//       });
//       const saleDetailQty = await SalesContractDtlModel.find({
//         salesContract: salesContract,
//       });
//       const saleQty = saleDetailQty[0].qty;
//       const totalInvoiceQty = invoiceDtl.reduce(
//         (sum, item) => sum + Number(item.qty),
//         0
//       );

//       if (totalInvoiceQty <= saleQty) {
//         const invoice = await InvoiceModel.create({
//           inv,
//           date: date,
//           salesContract: new mongoose.Types.ObjectId(salesContract),
//           specialInstruction,
//           salesTaxInvoiceNo: inv,
//           adm_invoice: true,
//         });
//         for (const invDtl of invoiceDtl || []) {
//           const newInvoiceDtl = await InvoiceDtlModel.create({
//             inv: inv,
//             qty: invDtl.qty,
//             rate: invDtl.rate,
//             date: date,
//             amount: +invDtl.qty * +invDtl.rate,
//             uom: invDtl.uom,
//             salesTaxRate: invDtl.salesTaxRate,
//             salesTaxAmount: +invDtl.salesTaxRate * +invDtl.qty * +invDtl.rate,
//             exchangeRate: +invDtl.exchangeRate,
//             customer: new mongoose.Types.ObjectId(customer_id),
//             salesContract: new mongoose.Types.ObjectId(salesContract),
//             product: new mongoose.Types.ObjectId(invDtl.product),
//             currency: new mongoose.Types.ObjectId(invDtl.currency),
//             invoice: new mongoose.Types.ObjectId(invoice._id),
//             contract: salecontract_contract?.contract,
//             adm_invoice: true,
//           });
//         }

//         const invoices = await InvoiceModel.find({
//           salesContract: salesContract,
//           isDeleted: false,
//         });

//         let invoicesDtlsQty = 0;
//         for (let inv of invoices) {
//           const dtl = await InvoiceDtlModel.find({ invoice: inv._id });
//           if (dtl) {
//             for (let d of dtl) {
//               invoicesDtlsQty += +d.qty;
//             }
//           }
//         }

//         let salesContractDtlsQty = 0;

//         const dtl = await SalesContractDtlModel.find({
//           salesContract: salesContract,
//         });
//         if (dtl) {
//           for (let d of dtl) {
//             salesContractDtlsQty += +d.qty;
//           }
//         }

//         if (invoicesDtlsQty >= salesContractDtlsQty) {
//           const sales = await SalesContractModel.findByIdAndUpdate(
//             salesContract,
//             {
//               invoice: true,
//             }
//           );
//           const salesdtl = await SalesContractDtlModel.findByIdAndUpdate(
//             { salesContract: salesContract },
//             {
//               invoice: true,
//             }
//           );
//         }

//         return invoice;
//       } else {
//         console.log('false');
//         return 'invoiceDetailQty is greater than salesContractDetailQty ';
//       }
//     }
//   } else {
//     console.log('elseeeeeeeeeeeeeeee');
//     const customer = await SalesContractModel.find({ _id: salesContract });
//     const customer_id = customer[0].customer;

//     const salecontract_contract = await SalesContractModel.findOne({
//       _id: salesContract,
//     });
//     const saleDetailQty = await SalesContractDtlModel.find({
//       salesContract: salesContract,
//     });
//     const saleQty = saleDetailQty[0].qty;
//     const totalInvoiceQty = invoiceDtl.reduce(
//       (sum, item) => sum + Number(item.qty),
//       0
//     );

//     if (totalInvoiceQty <= saleQty) {
//       const invoice = await InvoiceModel.create({
//         inv,
//         date,
//         salesContract: new mongoose.Types.ObjectId(salesContract),
//         specialInstruction,
//         salesTaxInvoiceNo,
//       });
//       for (const invDtl of invoiceDtl || []) {
//         const newInvoiceDtl = await InvoiceDtlModel.create({
//           inv: inv,
//           qty: invDtl.qty,
//           rate: invDtl.rate,
//           date: date,
//           amount: +invDtl.qty * +invDtl.rate,
//           uom: invDtl.uom,
//           salesTaxRate: invDtl.salesTaxRate,
//           salesTaxAmount: +invDtl.salesTaxRate * +invDtl.qty * +invDtl.rate,
//           exchangeRate: +invDtl.exchangeRate,
//           customer: new mongoose.Types.ObjectId(customer_id),
//           salesContract: new mongoose.Types.ObjectId(salesContract),
//           product: new mongoose.Types.ObjectId(invDtl.product),
//           currency: new mongoose.Types.ObjectId(invDtl.currency),
//           invoice: new mongoose.Types.ObjectId(invoice._id),
//           contract: salecontract_contract?.contract,
//         });
//       }

//       const invoices = await InvoiceModel.find({
//         salesContract: salesContract,
//         isDeleted: false,
//       });

//       let invoicesDtlsQty = 0;
//       for (let inv of invoices) {
//         const dtl = await InvoiceDtlModel.find({ invoice: inv._id });
//         if (dtl) {
//           for (let d of dtl) {
//             invoicesDtlsQty += +d.qty;
//           }
//         }
//       }

//       let salesContractDtlsQty = 0;

//       const dtl = await SalesContractDtlModel.find({
//         salesContract: salesContract,
//       });
//       if (dtl) {
//         for (let d of dtl) {
//           salesContractDtlsQty += +d.qty;
//         }
//       }

//       if (invoicesDtlsQty >= salesContractDtlsQty) {
//         const sales = await SalesContractModel.findByIdAndUpdate(
//           salesContract,
//           {
//             invoice: true,
//           }
//         );
//         const salesdtl = await SalesContractDtlModel.updateOne(
//           { salesContract: salesContract },
//           {
//             invoice: true,
//           }
//         );
//         console.log(salesdtl, sales);
//       }

//       return invoice;
//     } else {
//       console.log('false');
//       return 'invoiceDetailQty is greater than salesContractDetailQty ';
//     }
//   }
// };
export const createInvoice = async (input: CreateInvoiceSchema) => {
  const {
    inv,
    date,
    salesContract,
    brand,
    specialInstruction,
    invoiceDtl,
    salesTaxInvoiceNo,
  } = input;
  if (!invoiceDtl || invoiceDtl.length === 0) {
    throw new Error('returndtl is undefined or empty');
  }

  const customer_find = await SalesContractModel.find({ _id: salesContract });

  const customerobjectid = customer_find[0].customer;
  if (customerobjectid instanceof mongoose.Types.ObjectId) {
    if (
      customerobjectid.equals(
        new mongoose.Types.ObjectId('648d7c960cee8c1de3294415')
      )
    ) {
      const customer = await SalesContractModel.findOne({ _id: salesContract });
      if (!customer) {
        throw new Error('Sales contract not found');
      }
      const customer_id = customer?.customer;

      const saleDetailQty = await SalesContractDtlModel.find({
        salesContract,
        isDeleted: false,
      });
      if (!saleDetailQty || saleDetailQty.length === 0) {
        throw new Error('Sales contract details not found');
      }

      const saleQty = saleDetailQty.reduce(
        (sum: number, item: { qty: any; }) => sum + Number(item.qty),
        0
      );
      const invqty = await InvoiceDtlModel.find({
        salesContract: salesContract,
        isDeleted: false,
      });

      const totalinv = invqty.reduce((sum: any, item: { qty: any; }) => sum + item.qty, 0);
      const totalInvoiceqty = invoiceDtl.reduce(
        (sum: number, item: { qty: any; }) => sum + Number(item.qty),
        0
      );

      const totalInvoiceQty = Number(totalInvoiceqty) + Number(totalinv);

      if (totalInvoiceQty <= saleQty) {
        const invoice = await InvoiceModel.create({
          inv,
          date: customer.contractDate,
          salesContract: new mongoose.Types.ObjectId(salesContract),

          specialInstruction,
          salesTaxInvoiceNo,
          adm_invoice: true,
        });

        for (const invDtl of invoiceDtl || []) {
          await InvoiceDtlModel.create({
            inv: inv,
            qty: Number(invDtl.qty),
            rate: Number(invDtl.rate),
            date: date,
            amount: Number(invDtl.qty) * Number(invDtl.rate),
            uom: invDtl.uom,
            salesTaxRate: Number(invDtl.salesTaxRate),
            salesTaxAmount:
              Number(invDtl.salesTaxRate) *
              Number(invDtl.qty) *
              Number(invDtl.rate),
            exchangeRate: Number(invDtl.exchangeRate),
            customer: new mongoose.Types.ObjectId(customer_id),
            salesContract: new mongoose.Types.ObjectId(salesContract),
            brand: new mongoose.Types.ObjectId(brand),
            product: new mongoose.Types.ObjectId(invDtl.product),
            currency: new mongoose.Types.ObjectId(invDtl.currency),
            invoice: new mongoose.Types.ObjectId(invoice._id),
            contract: customer?.contract,
            adm_invoice: true,
          });
        }

        const invoices = await InvoiceModel.find({
          salesContract,
          isDeleted: false,
        });

        let invoicesDtlsQty = 0;
        for (let inv of invoices) {
          const dtl = await InvoiceDtlModel.find({ invoice: inv._id });
          if (dtl) {
            invoicesDtlsQty += dtl.reduce(
              (sum: number, item: { qty: any; }) => sum + Number(item.qty),
              0
            );
          }
        }

        let salesContractDtlsQty = saleDetailQty.reduce(
          (sum: number, item: { qty: any; }) => sum + Number(item.qty),
          0
        );
        if (invoicesDtlsQty >= salesContractDtlsQty) {
          await SalesContractModel.findByIdAndUpdate(salesContract, {
            invoice: true,
          });
          const salesdtl = await SalesContractDtlModel.updateOne(
            { salesContract: salesContract },
            {
              invoice: true,
            }
          );
          const invoice_adm = await InvoiceModel.updateOne({
            adm_invoice: true,
          });
          const invoice_dtl = await InvoiceDtlModel.updateOne({
            adm_invoice: true,
          });
        }

        return invoice;
      } else {
        console.log('false');
        return 'Invoicedtl Total Quantity Is Greater Than SalesContractdtl Total Quantity';
      }
    } else {
      console.log('else');

      const customer = await SalesContractModel.findOne({ _id: salesContract });
      if (!customer) {
        throw new Error('Sales contract not found');
      }
      const customer_id = customer.customer;

      // Retrieve the details of the sales contract
      const saleDetailQty = await SalesContractDtlModel.find({
        salesContract,
        isDeleted: false,
      });
      if (!saleDetailQty || saleDetailQty.length === 0) {
        throw new Error('Sales contract details not found');
      }

      const saleQty = saleDetailQty.reduce(
        (sum, item) => sum + Number(item.qty),
        0
      );
      const invqty = await InvoiceDtlModel.find({
        salesContract: salesContract,
        isDeleted: false,
      });

      const totalinv = invqty.reduce((sum: any, item: { qty: any; }) => sum + item.qty, 0);
      const totalInvoiceqty = invoiceDtl.reduce(
        (sum, item) => sum + Number(item.qty),
        0
      );
      const totalInvoiceQty = totalInvoiceqty + totalinv;

      if (totalInvoiceQty <= saleQty) {
        const invoice = await InvoiceModel.create({
          inv,
          date,
          salesContract: new mongoose.Types.ObjectId(salesContract),
          specialInstruction,
          salesTaxInvoiceNo,
        });

        // Create invoice details
        for (const invDtl of invoiceDtl || []) {
          await InvoiceDtlModel.create({
            inv: inv,
            qty: Number(invDtl.qty),
            rate: Number(invDtl.rate),
            date: date,
            amount: Number(invDtl.qty) * Number(invDtl.rate),
            uom: invDtl.uom,
            salesTaxRate: Number(invDtl.salesTaxRate),
            salesTaxAmount:
              Number(invDtl.salesTaxRate) *
              Number(invDtl.qty) *
              Number(invDtl.rate),
            exchangeRate: Number(invDtl.exchangeRate),
            customer: new mongoose.Types.ObjectId(customer_id),
            brand: new mongoose.Types.ObjectId(brand),
            salesContract: new mongoose.Types.ObjectId(salesContract),
            product: new mongoose.Types.ObjectId(invDtl.product),
            currency: new mongoose.Types.ObjectId(invDtl.currency),
            invoice: new mongoose.Types.ObjectId(invoice._id),
            contract: customer?.contract,
          });
        }
        const invoices = await InvoiceModel.find({
          salesContract,
          isDeleted: false,
        });

        let invoicesDtlsQty = 0;
        for (let inv of invoices) {
          const dtl = await InvoiceDtlModel.find({ invoice: inv._id });
          if (dtl) {
            invoicesDtlsQty += dtl.reduce(
              (sum, item) => sum + Number(item.qty),
              0
            );
          }
        }

        let salesContractDtlsQty = saleDetailQty.reduce(
          (sum, item) => sum + Number(item.qty),
          0
        );

        if (invoicesDtlsQty >= salesContractDtlsQty) {
          await SalesContractModel.findByIdAndUpdate(salesContract, {
            invoice: true,
          });
          const salesdtl = await SalesContractDtlModel.updateOne(
            { salesContract: salesContract },
            {
              invoice: true,
            }
          );
        }

        return invoice;
      } else {
        console.log('false');
        return 'Invoice total quantity is greater than sales contract quantity';
      }
    }
  }
};

export const getNewInvoiceId = async () => {
  const invoice = await InvoiceModel.findOne()
    .sort({ field: 'asc', _id: -1 })
    .limit(1);

  let newId: number = 1;
  if (invoice != null) {
    newId = invoice.inv + 1;
  }

  return newId;
};

export const findInvoicesWithPagination = async (
  input: InvoicePagintionSchema
) => {
  const limit = input.perPage;
  const skipCount = (input.pageno - 1) * limit;
  const searchQuery = new RegExp(`^${input?.contract}`, 'i');

  const getInvoiceAggregation = (
    matchQuery:
      | { contract: RegExp; isDeleted: boolean }
      | { isDeleted: boolean; contract?: undefined }
  ) => {
    return InvoiceDtlModel.aggregate([
      {
        $match: matchQuery,
      },
      {
        $lookup: {
          from: 'invoices',
          localField: 'invoice',
          foreignField: '_id',
          as: 'invoice',
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salecontract',
        },
      },
      { $skip: skipCount },
      { $limit: limit },
      { $sort: { invoice: 1 } },
    ]);
  };

  const matchQuery = input.contract
    ? { contract: searchQuery, isDeleted: false }
    : { isDeleted: false };

  const [invoice, totalRecords] = await Promise.all([
    getInvoiceAggregation(matchQuery),
    InvoiceDtlModel.countDocuments(matchQuery),
  ]);

  // Prepare the result
  const result = {
    invoicedtl: invoice,
    total_records: totalRecords,
  };

  return result;
};

export const findInvoices = async () => {
  const data = await InvoiceDtlModel.find({ isDeleted: false }).populate({
    path: 'invoice',
    model: InvoiceModel,
    match: { isDeleted: false },
    populate: [{ path: 'salesContract', model: SalesContractModel }],
  });

  return data;
};

export const findInvoicesDtls = async (id: string) => {
  return await InvoiceDtlModel.find({
    invoice: new mongoose.Types.ObjectId(id),
  })
    .populate({ path: 'product', model: ProductModel })
    .populate({ path: 'currency', model: CurrencyModel });
};

export const deleteInvoices = async () => {
  await InvoiceDtlModel.deleteMany({});
  return await InvoiceModel.deleteMany({});
};

export const deleteInvoiceById = async (id: string) => {
  // await InvoiceDtlModel.deleteMany({ invoice: id });

  const invoice = await InvoiceModel.findById(id);
  // console.log('id ', id);
  // console.log('invoice ', invoice);
  const sales = await SalesContractModel.findByIdAndUpdate(
    invoice?.salesContract,
    {
      invoice: false,
    }
  );
  const salesdtl = await SalesContractDtlModel.updateOne(
    { salesContract: invoice?.salesContract },
    {
      invoice: false,
    }
  );
  // console.log('sales', sales);

  const delete1 = await InvoiceDtlModel.updateOne(
    { invoice: id },
    {
      isDeleted: true,
    }
  );
  // console.log({ delete1: delete1 });
  const delete2 = await InvoiceModel.updateOne(
    //{ _id: delete1?.invoice },
    { _id: id },
    { isDeleted: true }
  );

  return invoice;
};

export const updateInvoiceById = async (
  id: string,
  input: CreateInvoiceSchema
) => {
  const {
    inv,
    date,
    salesContract,
    brand,
    specialInstruction,
    invoiceDtl,
    salesTaxInvoiceNo,
  } = input;
  if (!invoiceDtl || invoiceDtl.length === 0) {
    throw new Error('returndtl is undefined or empty');
  }
  const invoiceForAdmInvoice = await InvoiceModel.findOne({ _id: id });
  const adm_invoice = invoiceForAdmInvoice?.adm_invoice;

  const salecontract_contract = await SalesContractModel.findOne({
    _id: salesContract,
  });
  const updatedRecord = invoiceDtl[0];
  const saleDetailQty = await SalesContractDtlModel.find({
    salesContract,
    isDeleted: false,
  });

  const invqty = await InvoiceDtlModel.find({
    salesContract: salesContract,
    isDeleted: false,
  });
  const invtotalqty = invqty.reduce((sum, item) => {
    if (item.invoice.toString() !== id) {
      return sum + item.qty;
    }
    return sum;
  }, 0);

  const invoiceTotalQty = Number(invtotalqty) + Number(updatedRecord.qty);
  const saleTotalQty = saleDetailQty[0].qty;

  if (invoiceTotalQty <= saleTotalQty) {
    const invoice = await InvoiceModel.findByIdAndUpdate(id, {
      inv,
      date,
      salesContract: new mongoose.Types.ObjectId(salesContract),
      specialInstruction,
      salesTaxInvoiceNo,
      adm_invoice: adm_invoice,
    });

    await InvoiceDtlModel.deleteMany({ invoice: id });
    const customer = await SalesContractModel.find({ _id: salesContract });
    const customer_id = customer[0].customer;

    for (const invDtl of invoiceDtl || []) {
      const newInvoiceDtl = await InvoiceDtlModel.create({
        inv: inv,
        qty: invDtl.qty,
        rate: invDtl.rate,
        amount: +invDtl.qty * +invDtl.rate,
        uom: invDtl.uom,
        date: date,
        salesTaxAmount: invDtl.salesTaxAmount,
        salesTaxRate: invDtl.salesTaxRate,
        exchangeRate: +invDtl.exchangeRate,
        customer: new mongoose.Types.ObjectId(customer_id),
        product: new mongoose.Types.ObjectId(invDtl.product),
        salesContract: new mongoose.Types.ObjectId(salesContract),
        brand: new mongoose.Types.ObjectId(brand),
        currency: new mongoose.Types.ObjectId(invDtl.currency),
        invoice: new mongoose.Types.ObjectId(invoice?._id),
        contract: salecontract_contract?.contract,
        adm_invoice: adm_invoice,
      });
    }

    const invoiceQtyAfterUpdate = await InvoiceDtlModel.find({
      salesContract: salesContract,
      isDeleted: false,
    });

    const invoiceQtyAfterUpdates = invoiceQtyAfterUpdate.reduce((sum, item) => {
      return sum + item.qty; // Return the accumulated value
    }, 0);

    if (invoiceQtyAfterUpdates < saleTotalQty) {
      await SalesContractDtlModel.updateOne(
        { isDeleted: false, salesContract: salesContract },
        { $set: { invoice: false } }
      );

      await SalesContractModel.updateOne(
        { isDeleted: false, _id: salesContract },
        { $set: { invoice: false } }
      );
    } else if (invoiceQtyAfterUpdates === saleTotalQty) {
      await SalesContractDtlModel.updateOne(
        { isDeleted: false, salesContract: salesContract },
        { $set: { invoice: true } }
      );

      await SalesContractModel.updateOne(
        { isDeleted: false, _id: salesContract },
        { $set: { invoice: true } }
      );
    }

    return { success: true };
  } else {
    return 'Invoicedtl Total Quantity Is Greater Than SalesContractdtl Total Quantity';
  }
};
export const findInvoiceDtlsByDate_old = async (input: InvoiceReportSchema) => {
  if (
    Array.isArray(input.product) &&
    input.product.length == 0 &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0 &&
    input.customer_group == '' &&
    input.product_group == '' &&
    input.brand_group == '' &&
    input.salesContract_group == '' &&
    input.Adm == '' &&
    input.nonAdm == '' &&
    input.order_status == '' &&
    input.royality_approval == ''
  ) {
    console.log('no filter condition execute!');
    try {
      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      const invoice_groupby = await InvoiceDtlModel.aggregate([
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
            _id: null,
            totalQty: {
              $sum: '$qty',
            },
            totalRate: {
              $sum: '$rate',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
            },
            data: {
              $push: '$$ROOT',
            },
          },
        },
        {
          $addFields: {
            totalValue: {
              $sum: {
                $map: {
                  input: '$data',
                  as: 'item',
                  in: {
                    $divide: [
                      {
                        $multiply: [
                          '$$item.amount',
                          '$$item.exchangeRate',
                          '$$item.salesTaxRate',
                        ],
                      },
                      100,
                    ],
                  },
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalQty: 1,
            totalRate: 1,
            totalValue: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            data: 1,
          },
        },
      ]);

      const total_qty = invoice_groupby.map((item) => item.totalQty);
      const total_amount = invoice_groupby.map((item) => item.totalAmount);
      const total_rate = invoice_groupby.map((item) => item.totalRate);
      const totalValue = invoice_groupby.map((item) => item.totalValue);
      const total_records = await InvoiceDtlModel.aggregate([
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

      const invoiceamountpkr = await InvoiceDtlModel.aggregate([
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

      const qty = invoiceamountpkr.map((item) => item.qty);
      const saletaxrate = invoiceamountpkr.map((item) => item.salesTaxRate);
      const rate = invoiceamountpkr.map((item) => item.rate);

      const saletax = qty.map((amount, index) => amount * rate[index]);
      const saletaxamount = saletaxrate.map(
        (amount, index) => amount * saletax[index]
      );
      const SaleTaxAmount = saletaxamount.reduce(
        (total, value) => total + value,
        0
      );

      const Amount = invoiceamountpkr.map((item) => item.amount);
      const Rate = invoiceamountpkr.map((item) => item.rate);
      const qtypkr = Amount.map((amount, index) => amount * Rate[index]);

      const AmountPKR = qtypkr.reduce((total, value) => total + value, 0);

      const invoice_detail = await InvoiceDtlModel.aggregate([
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
            from: 'invoices',
            localField: 'invoice',
            foreignField: '_id',
            as: 'inv_dtl',
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'sale_dtl',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer_dtl',
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
        { $sort: { date: -1 } },
      ]);
      const result = {
        invoice_detail: invoice_detail,
        paginated_record: invoice_detail.length,
        totalQty: total_qty,
        totalAmount: total_amount,
        totalRate: total_rate,
        totalValue: totalValue,
        total_records: total_records.length,
        totalAmountPKR: [AmountPKR],
        SaleTaxAmount: SaleTaxAmount,
      };
      return result;
    } catch (error) {
      console.log(error);
    }
  } else if (
    input.product_group !== '' &&
    input.Adm == '' &&
    input.nonAdm == '' &&
    input.order_status == '' &&
    input.royality_approval == '' &&
    Array.isArray(input.product) &&
    input.product.length == 0 &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0
  ) {
    console.log('product group');
    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;
    // const total_records = await ProductModel.countDocuments();
    // const product_group = await ProductModel.aggregate([
    //   {
    //     $match: {
    //       isDeleted: false,
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'invoicedtls',
    //       localField: '_id',
    //       foreignField: 'product',
    //       as: 'invoice_record',
    //       pipeline: [
    //         {
    //           $match: {
    //             isDeleted: false,
    //           },
    //         },
    //         {
    //           $project: {
    //             qty: 1,
    //             amount: 1,
    //             salesTaxAmount: 1,
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
    //             input: '$invoice_record',
    //             as: 'item',
    //             in: '$$item.qty',
    //           },
    //         },
    //       },
    //     },
    //   },
    //   {
    //     $addFields: {
    //       totalAmount: {
    //         $sum: {
    //           $map: {
    //             input: '$invoice_record',
    //             as: 'item',
    //             in: '$$item.amount',
    //           },
    //         },
    //       },
    //     },
    //   },
    //   {
    //     $addFields: {
    //       totalSaleTaxAmount: {
    //         $sum: {
    //           $map: {
    //             input: '$invoice_record',
    //             as: 'item',
    //             in: '$$item.salesTaxAmount',
    //           },
    //         },
    //       },
    //     },
    //   },
    //   {
    //     $project: {
    //       name: 1,
    //       invoice_record: {
    //         $size: '$invoice_record',
    //       },
    //       totalQty: 1,
    //       totalAmount: 1,
    //       totalSaleTaxAmount: 1,
    //     },
    //   },
    //   // Move the $match to this point after the totalQty is computed
    //   {
    //     $match: {
    //       totalQty: { $gt: 0 },  // Ensure you're filtering by totalQty > 0
    //     },
    //   },
    //   { $limit: limit },
    //   { $skip: skipCount },
    // ]);

    const productAggregationPipelineRecord: any = [
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
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product',
        },
      },
      {
        $addFields: {
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalSaleTaxAmount: {
            $sum: '$salesTaxAmount',
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
          totalSaleTaxAmount: {
            $gt: 0,
          },
        },
      },
      {
        $group: {
          _id: '$product',
          name: {
            $first: '$product.name', // Retrieve product name
          },
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalSaleTaxAmount: {
            $sum: '$totalSaleTaxAmount',
          },
          totalInvoices: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          name: 1,
          totalQty: 1,
          totalAmount: 1,
          totalSaleTaxAmount: 1,
          totalInvoices: 1,
          _id: 0,
        },
      },
      {
        $sort: {
          totalQty: -1,
          totalAmount: -1,
        },
      },
    ];

    const productAggregationPipeline: any = [
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
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product',
        },
      },
      {
        $addFields: {
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalSaleTaxAmount: {
            $sum: '$salesTaxAmount',
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
          totalSaleTaxAmount: {
            $gt: 0,
          },
        },
      },
      {
        $group: {
          _id: '$product',
          name: {
            $first: '$product.name',
          },
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalSaleTaxAmount: {
            $sum: '$totalSaleTaxAmount',
          },
          totalInvoices: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          name: 1,
          totalQty: 1,
          totalAmount: 1,
          totalSaleTaxAmount: 1,
          totalInvoices: 1,
          _id: 0,
        },
      },
      {
        $sort: {
          totalQty: -1,
          totalAmount: -1,
        },
      },
      { $skip: skipCount },
      { $limit: limit },
    ];

    const product_group = await InvoiceDtlModel.aggregate(
      productAggregationPipeline
    );
    const total_records = await InvoiceDtlModel.aggregate(
      productAggregationPipelineRecord
    );
    const invoiceRecordSum = total_records.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );
    const totalQtySum = total_records.reduce(
      (sum, item) => sum + item.totalQty,
      0
    );
    const totalAmountSum = total_records.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const totalSaleTaxAmountSum = total_records.reduce(
      (sum, item) => sum + item.totalSaleTaxAmount,
      0
    );

    const result = {
      Group: product_group,
      paginated_record: product_group.length,
      total_records: total_records.length,
      invoiceTotalRecordSum: invoiceRecordSum,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalSaleTaxAmountSum: totalSaleTaxAmountSum,
    };
    return result;
  } else if (
    input.customer_group !== '' &&
    input.Adm == '' &&
    input.nonAdm == '' &&
    input.order_status == '' &&
    input.royality_approval == '' &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.product) &&
    input.product.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0
  ) {
    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;
    console.log('customer general ');
    const customerAggregationPipelineRecord: any = [
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
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $addFields: {
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalSaleTaxAmount: {
            $sum: '$salesTaxAmount',
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
          totalSaleTaxAmount: {
            $gt: 0,
          },
        },
      },
      {
        $group: {
          _id: '$customer',
          name: {
            $first: '$customer.name',
          },
          // Retrieve customer name
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalSaleTaxAmount: {
            $sum: '$totalSaleTaxAmount',
          },
          totalInvoices: {
            $sum: 1,
          }, //
        },
      },
      {
        $project: {
          name: 1,
          totalQty: 1,
          totalAmount: 1,
          totalSaleTaxAmount: 1,
          totalInvoices: 1,
          _id: 0,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ];
    const customerAggregationPipeline: any = [
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
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $addFields: {
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalSaleTaxAmount: {
            $sum: '$salesTaxAmount',
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
          totalSaleTaxAmount: {
            $gt: 0,
          },
        },
      },
      {
        $group: {
          _id: '$customer',
          name: {
            $first: '$customer.name',
          },
          // Retrieve customer name
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalSaleTaxAmount: {
            $sum: '$totalSaleTaxAmount',
          },
          totalInvoices: {
            $sum: 1,
          }, //
        },
      },
      {
        $project: {
          name: 1,
          totalQty: 1,
          totalAmount: 1,
          totalSaleTaxAmount: 1,
          totalInvoices: 1,
          _id: 0,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
      { $skip: skipCount },
      { $limit: limit },
    ];
    const customer_group = await InvoiceDtlModel.aggregate(
      customerAggregationPipeline
    );
    const total_records = await InvoiceDtlModel.aggregate(
      customerAggregationPipelineRecord
    );

    const customerQtySum = total_records.reduce(
      (sum, item) => sum + item.totalQty,
      0
    );
    const customerinvoiceRecordSum = total_records.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );
    const customertotalSaleTaxAmountSum = total_records.reduce(
      (sum, item) => sum + item.totalSaleTaxAmount,
      0
    );
    const customertotalAmountSum = total_records.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const result = {
      Group: customer_group,
      paginated_records: customer_group.length,
      total_records: total_records.length,
      customerTotalQtySum: customerQtySum,
      customerTotalInvoiceRecordSum: customerinvoiceRecordSum,
      totalSaleTaxAmountSum: customertotalSaleTaxAmountSum,
      customertotalAmountSum: customertotalAmountSum,
    };
    return result;
  } else if (
    input.salesContract_group !== '' &&
    input.Adm == '' &&
    input.nonAdm == '' &&
    input.order_status == '' &&
    input.royality_approval == '' &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.product) &&
    input.product.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0
  ) {
    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;

    const salesContractAggregationPipelineRecord: any = [
      {
        $match: {
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContract',
        },
      },
      {
        $addFields: {
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalSaleTaxAmount: {
            $sum: '$salesTaxAmount',
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
          totalSaleTaxAmount: {
            $gt: 0,
          },
        },
      },
      {
        $group: {
          _id: '$salesContract',
          salesContractNumber: {
            $first: '$salesContract.contract', // Retrieve sales contract number or identifier
          },
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalSaleTaxAmount: {
            $sum: '$totalSaleTaxAmount',
          },
          totalInvoices: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          salesContractNumber: 1,
          totalQty: 1,
          totalAmount: 1,
          totalSaleTaxAmount: 1,
          totalInvoices: 1,
          _id: 0,
        },
      },
      {
        $sort: {
          totalQty: -1,
          totalAmount: -1,
        },
      },
    ];
    const salesContractAggregationPipeline: any = [
      {
        $match: {
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContract',
        },
      },
      {
        $addFields: {
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalSaleTaxAmount: {
            $sum: '$salesTaxAmount',
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
          totalSaleTaxAmount: {
            $gt: 0,
          },
        },
      },
      {
        $group: {
          _id: '$salesContract',
          salesContractNumber: {
            $first: '$salesContract.contract', // Retrieve sales contract number or identifier
          },
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalSaleTaxAmount: {
            $sum: '$totalSaleTaxAmount',
          },
          totalInvoices: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          salesContractNumber: 1,
          totalQty: 1,
          totalAmount: 1,
          totalSaleTaxAmount: 1,
          totalInvoices: 1,
          _id: 0,
        },
      },
      {
        $sort: {
          totalQty: -1,
          totalAmount: -1,
        },
      },
      { $skip: skipCount },
      { $limit: limit },
    ];
    const salecontract_group = await InvoiceDtlModel.aggregate(
      salesContractAggregationPipeline
    );
    const total_record = await InvoiceDtlModel.aggregate(
      salesContractAggregationPipelineRecord
    );

    const totalInvoiceSum = total_record.reduce(
      (sum, item) => sum + item.totalInvoices,
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
    const totalSaleTaxAmountSum = total_record.reduce(
      (sum, item) => sum + item.totalSaleTaxAmount,
      0
    );
    const salesContractNumberSum = total_record.reduce(
      (sum, item) => sum + item.salesContractNumber,
      0
    );
    const result = {
      Group: salecontract_group,
      total_records: salecontract_group.length,
      paginated_record: total_record.length,
      totalInvoiceSum: totalInvoiceSum,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      salesContractNumberSum: salesContractNumberSum,
      totalSaleTaxAmountSum: totalSaleTaxAmountSum,
    };
    return result;
  } else if (
    input.brand_group !== '' &&
    input.Adm == '' &&
    input.nonAdm == '' &&
    input.order_status == '' &&
    input.royality_approval == '' &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.product) &&
    input.product.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0
  ) {
    console.log('brand group general');

    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;

    const brandAggregationPipelineRecord: any = [
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
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
        },
      },
      {
        $addFields: {
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalSaleTaxAmount: {
            $sum: '$salesTaxAmount',
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
          totalSaleTaxAmount: {
            $gt: 0,
          },
        },
      },
      {
        $group: {
          _id: '$brand',
          name: {
            $first: '$brand.name',
          },
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalSaleTaxAmount: {
            $sum: '$totalSaleTaxAmount',
          },
          totalInvoices: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          brandName: 1,
          totalQty: 1,
          totalAmount: 1,
          totalSaleTaxAmount: 1,
          totalInvoices: 1,
          _id: 0,
        },
      },
      {
        $sort: {
          totalQty: -1,
          totalAmount: -1,
        },
      },
    ];

    const brandAggregationPipeline: any = [
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
        $group: {
          _id: '$brand._id',
          name: { $first: '$brand.name' },
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
          totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
          totalInvoices: { $sum: 1 },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
          totalSaleTaxAmount: { $gt: 0 },
        },
      },
      {
        $project: {
          name: 1,
          totalQty: 1,
          totalAmount: 1,
          totalSaleTaxAmount: 1,
          totalInvoices: 1,
        },
      },
      {
        $sort: {
          totalQty: -1,
          totalAmount: -1,
        },
      },
      { $skip: skipCount },
      { $limit: limit },
    ];
    const brandgroup = await InvoiceDtlModel.aggregate(
      brandAggregationPipeline
    );

    const total_records = await InvoiceDtlModel.aggregate(
      brandAggregationPipelineRecord
    );

    const totalInvoicesSum = total_records.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );
    const invoicetotalSaleTaxAmountSum = total_records.reduce(
      (sum, item) => sum + item.totalSaleTaxAmount,
      0
    );
    const totalQtySum = total_records.reduce(
      (sum, item) => sum + item.totalQty,
      0
    );
    const totalAmountSum = total_records.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const result = {
      Group: brandgroup,
      total_records: total_records.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalInvoicesSum: totalInvoicesSum,
      totalSaleTaxAmount: invoicetotalSaleTaxAmountSum,
    };
    return result;
  } else if (
    input.order_status !== '' &&
    input.royality_approval == '' &&
    input.Adm == '' &&
    input.nonAdm == '' &&
    input.customer_group == '' &&
    input.product_group == '' &&
    input.brand_group == '' &&
    input.salesContract_group == '' &&
    Array.isArray(input.product) &&
    input.product.length == 0 &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0
  ) {
    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;
    console.log('order_status filter');

    console.log(input);

    const order_status = input.order_status;
    const baseMatch = {
      date: {
        $gte: new Date(input.fromDate),
        $lte: new Date(input.toDate),
      },
      isDeleted: false,
      order_status: input.order_status,
    };

    // const allrecordgroupby = await SalesContractDtlModel.aggregate([
    //   {
    //     $match: {
    //       contractDate: {
    //         $gte: new Date(input.fromDate),
    //         $lte: new Date(input.toDate),
    //       },
    //       isDeleted: false,
    //       invoice: true,
    //       order_status: order_status,
    //     },
    //   },
    //   {
    //     $group: {
    //       _id: 'null',
    //       rate: {
    //         $sum: '$rate',
    //       },
    //       amount: {
    //         $sum: '$amount',
    //       },
    //       qty: {
    //         $sum: '$qty',
    //       },
    //     },
    //   },
    // ]);

    // const totalQty = allrecordgroupby.map((item: any) => item.qty);
    // const totalRate = allrecordgroupby.map((item: any) => item.rate);
    // const totalAmount = allrecordgroupby.map((item: any) => item.amount);
    // let where: any = {
    //   contractDate: {
    //     $gte: new Date(input.fromDate),
    //     $lte: new Date(input.toDate),
    //   },
    //   isDeleted: false,
    //   invoice: true,
    //   order_status: order_status,
    // };
    // const salesContract = await SalesContractDtlModel.find(where);

    // const saleContractDetail = await SalesContractDtlModel.aggregate([
    //   {
    //     $match: where,
    //   },
    //   {
    //     $lookup: {
    //       from: 'salescontracts',
    //       localField: 'salesContract',
    //       foreignField: '_id',
    //       as: 'sale_dtl',
    //       pipeline: [
    //         {
    //           $lookup: {
    //             from: 'paymentterms',
    //             localField: 'paymentTerm',
    //             foreignField: '_id',
    //             as: 'payment_term',
    //           },
    //         },
    //       ],
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'brands',
    //       localField: 'brand',
    //       foreignField: '_id',
    //       as: 'branddtl',
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'invoicedtls',
    //       localField: 'salesContract',
    //       foreignField: 'salesContract',
    //       as: 'inv_dtl',
    //       pipeline: [
    //         {
    //           $lookup: {
    //             from: 'invoices',
    //             localField: 'invoice',
    //             foreignField: '_id',
    //             as: 'invoice',
    //           },
    //         },
    //       ],
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'customers',
    //       localField: 'customer',
    //       foreignField: '_id',
    //       as: 'customer_dtl',
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
    //       from: 'currencies',
    //       localField: 'currency',
    //       foreignField: '_id',
    //       as: 'currency_dtl',
    //     },
    //   },
    //   { $skip: skipCount },
    //   { $limit: limit },
    //   { $sort: { totalQty: -1, totalAmount: -1 } },
    // ]);

    const inv_dtl = await InvoiceDtlModel.aggregate([
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
          from: 'salescontractdtls',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'sale_dtl',
          pipeline: [
            {
              $match: {
                order_status: order_status,
              },
            },
          ],
        },
      },
      {
        $match: {
          'sale_dtl.0': {
            $exists: true,
          },
        },
      },
      {
        $lookup: {
          from: 'invoices',
          localField: 'invoice',
          foreignField: '_id',
          as: 'invoice',
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salescontract',
          pipeline: [
            {
              $lookup: {
                from: 'paymentterms',
                localField: 'paymentTerm',
                foreignField: '_id',
                as: 'payment_term',
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
          as: 'customer_dtl',
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product_dtl',
        },
      },
      {
        $unwind: {
          path: '$salescontract',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: '$salescontract.payment_term',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: '$customer_dtl',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: '$product_dtl',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: '$invoice',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $sort: { date: -1 },
      },

      {
        $facet: {
          Summary: [
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
                _id: null,
                qty: { $sum: '$qty' },
                rate: { $sum: '$rate' },
                amount: { $sum: '$amount' },
                salesTaxAmount: { $sum: '$salesTaxAmount' },
              },
            },
          ],
          AmountPkr: [
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
              $addFields: {
                AmountInPkr: {
                  $multiply: ['$amount', '$rate'],
                },
              },
            },
            {
              $group: {
                _id: null,
                totalAmountInPkr: { $sum: '$AmountInPkr' },
              },
            },
          ],
          TotalValue: [
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
              $addFields: {
                totalValue: {
                  $sum: {
                    $divide: [
                      {
                        $multiply: [
                          '$amount',
                          '$exchangeRate',
                          '$salesTaxRate',
                        ],
                      },
                      100,
                    ],
                  },
                },
              },
            },
            {
              $group: {
                _id: null,
                totalAmountInPkr: { $sum: '$totalValue' },
              },
            },
          ],
          ItemDetails: [
            {
              $project: {
                qty: 1,
                amount: 1,
                uom: 1,
                salesTaxAmount: 1,
                rate: 1,
                exchangeRate: 1,
                salesTaxRate: 1,
                contract: '$salescontract.contract',
                saleTaxInvoiceNo: '$invoice.salesTaxInvoiceNo',
                invoiceDate: '$invoice.date',
                customerName: '$customer_dtl.name',
                productName: '$product_dtl.name',
              },
            },
            {
              $skip: skipCount,
            },
            {
              $limit: limit,
            },
          ],
        },
      },
    ]);
    const total_records = await InvoiceDtlModel.aggregate([
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
          from: 'salescontractdtls',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'sale_dtl',
          pipeline: [
            {
              $match: {
                order_status: order_status,
              },
            },
          ],
        },
      },
      {
        $match: {
          'sale_dtl.0': {
            $exists: true,
          },
        },
      },
    ]);

    let result = {
      inv_dtl: inv_dtl,
      total_records: total_records.length,
      paginated_record: inv_dtl[0].ItemDetails.length,
      // salescontract_dtl: saleContractDetail,
      // total_records: salesContract ? salesContract.length : 0,
      // totalQty: totalQty,
      // totalRate: totalRate,
      // totalAmount: totalAmount,
    };
    return result;
  } else if (
    input.royality_approval !== '' &&
    input.order_status == '' &&
    input.Adm == '' &&
    input.nonAdm == '' &&
    input.customer_group == '' &&
    input.salesContract_group == '' &&
    input.product_group == '' &&
    input.brand_group == '' &&
    Array.isArray(input.product) &&
    input.product.length == 0 &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0
  ) {
    console.log('royality approval filter');

    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;

    function stringToBoolean(str: string | undefined) {
      return str?.toLowerCase() === 'true';
    }

    const baseMatch = {
      contractDate: {
        $gte: new Date(input.fromDate),
        $lte: new Date(input.toDate),
      },
      isDeleted: false,
      royality_approval: stringToBoolean(input.royality_approval),
      invoice: true,
    };

    // const salegroupby = await SalesContractDtlModel.aggregate([
    //   { $match: baseMatch },
    //   {
    //     $lookup: {
    //       from: 'invoicedtls',
    //       localField: 'salesContract',
    //       foreignField: 'salesContract',
    //       as: 'invoicedtl',
    //       pipeline: [
    //         {
    //           $project: {
    //             salesTaxAmount: 1,
    //             amount: 1,
    //             rate: 1,
    //             qty: 1,
    //             salesTaxRate: 1,
    //           },
    //         },
    //       ],
    //     },
    //   },
    //   { $unwind: { path: '$invoicedtl', preserveNullAndEmptyArrays: true } },
    //   {
    //     $group: {
    //       _id: null,
    //       totalQty: { $sum: '$qty' },
    //       totalRate: { $sum: '$rate' },
    //       totalAmount: { $sum: '$amount' },
    //       totalSaleTaxAmount: { $sum: '$invoicedtl.salesTaxAmount' },
    //       data: { $push: '$$ROOT' },
    //     },
    //   },
    //   {
    //     $project: {
    //       _id: 0,
    //       totalQty: 1,
    //       totalRate: 1,
    //       totalAmount: 1,
    //       totalSaleTaxAmount: 1,
    //       data: 1,
    //     },
    //   },
    // ]);

    // Step 1: Access `salegroupby` data
    const salegroupby = await InvoiceDtlModel.aggregate([
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
          from: 'salescontractdtls',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'sale_dtl',
          pipeline: [
            {
              $match: {
                royality_approval: stringToBoolean(input.royality_approval),
              },
            },
          ],
        },
      },
      {
        $addFields: {
          sale_dtl: {
            $arrayElemAt: ['$sale_dtl', 0],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalQty: {
            $sum: '$qty',
          },
          totalRate: {
            $sum: '$rate',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalSaleTaxAmount: {
            $sum: '$salesTaxAmount',
          },
          data: {
            $push: '$$ROOT',
          },
        },
      },
      {
        $addFields: {
          totalValue: {
            $sum: {
              $map: {
                input: '$data',
                as: 'item',
                in: {
                  $divide: [
                    {
                      $multiply: [
                        '$$item.amount',
                        '$$item.exchangeRate',
                        '$$item.salesTaxRate',
                      ],
                    },
                    100,
                  ],
                },
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalQty: 1,
          totalRate: 1,
          totalValue: 1,
          totalAmount: 1,
          totalSaleTaxAmount: 1,
          data: 1,
        },
      },
    ]);

    const inv_rate = salegroupby.flatMap(
      (item) => item.data.map((dataItem: any) => dataItem.rate || 0) // Default to 0 if rate is missing
    );
    const inv_amount = salegroupby.flatMap(
      (item) => item.data.map((dataItem: any) => dataItem.amount || 0) // Default to 0 if amount is missing
    );

    const qtypkr = inv_amount.map((amount, index) => amount * inv_rate[index]);

    const AmountPKR = qtypkr.reduce((total, value) => total + value, 0);

    // const sale = await SalesContractDtlModel.aggregate([
    //   { $match: baseMatch },
    //   {
    //     $lookup: {
    //       from: 'shipmentdtls',
    //       localField: 'salesContract',
    //       foreignField: 'salesContract',
    //       as: 'shipmentDetail',
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'salescontracts',
    //       localField: 'salesContract',
    //       foreignField: '_id',
    //       as: 'sale_dtl',
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
    //       as: 'customer_dtl',
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'invoicedtls',
    //       localField: 'salesContract',
    //       foreignField: 'salesContract',
    //       as: 'inv_dtl',
    //       pipeline: [
    //         {
    //           $lookup: {
    //             from: 'invoices',
    //             localField: 'invoice',
    //             foreignField: '_id',
    //             as: 'invoices',
    //           },
    //         },
    //       ],
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'shipments',
    //       localField: 'salesContract',
    //       foreignField: 'salesContract',
    //       as: 'shipment',
    //     },
    //   },
    //   { $skip: skipCount },
    //   { $limit: limit },
    // ]);

    const invoice_dtl = await InvoiceDtlModel.aggregate([
      {
        $lookup: {
          from: 'salescontractdtls',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'sale_dtl',
          pipeline: [
            {
              $match: {
                royality_approval: stringToBoolean(input.royality_approval),
              },
            },
            {
              $lookup: {
                from: 'salescontracts',
                localField: 'salesContract',
                foreignField: '_id',
                as: 'salecontract',
              },
            },
          ],
        },
      },
      {
        $match: {
          'sale_dtl.0': {
            $exists: true,
          },
        },
      },
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
          from: 'invoices',
          localField: 'invoice',
          foreignField: '_id',
          as: 'invoice',
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
          as: 'customer_dtl',
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
        $sort: {
          date: -1,
        },
      },
      {
        $skip: skipCount,
      },
      {
        $limit: limit,
      },
    ]);

    const totalQty = salegroupby.map((item: any) => item.totalQty);
    const totalRate = salegroupby.map((item: any) => item.totalRate);
    const totalAmount = salegroupby.map((item: any) => item.totalAmount);
    const totalValue = salegroupby.map((item: any) => item.totalValue);
    const saleTaxAmount = salegroupby.map(
      (item: any) => item.totalSaleTaxAmount
    );

    const totalRecordCount = await InvoiceDtlModel.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false, // Filter out deleted records
        },
      },
      {
        $lookup: {
          from: 'salescontractdtls',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'sale_dtl',
          pipeline: [
            {
              $match: {
                royality_approval: stringToBoolean(input.royality_approval), // Apply royality_approval filter
              },
            },
          ],
        },
      },
      {
        $match: {
          'sale_dtl.0': { $exists: true }, // Ensure at least one `sale_dtl` exists after the lookup
        },
      },
    ]);

    let result = {
      shipmentdtl: invoice_dtl,
      paginated_record: invoice_dtl.length,
      total_records: totalRecordCount.length,
      totalQty: totalQty,
      totalRate: totalRate,
      totalAmount: totalAmount,
      saleTaxAmount: saleTaxAmount,
      AmountPKR: AmountPKR,
      totalValue: totalValue,
    };
    return result;
  } else if (
    input.customer_group == '' &&
    input.product_group == '' &&
    input.brand_group == '' &&
    input.Adm == '' &&
    input.nonAdm == '' &&
    (input.order_status !== '' ||
      input.royality_approval !== '' ||
      (Array.isArray(input.product) && input.product.length !== 0) ||
      (Array.isArray(input.customer) && input.customer.length !== 0) ||
      (Array.isArray(input.brand) && input.brand.length !== 0) ||
      (Array.isArray(input.salesContract) && input.salesContract.length !== 0))
  ) {
    console.log('general condition ');
    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;

    const salecontractArr = input.salesContract
      ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const productArr = input.product
      ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const customerArr = input.customer
      ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];

    let filter: any = {};
    let filter_records: any = {};
    let where: any = {};

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

    const invoiceamountpkr = await InvoiceDtlModel.aggregate([
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
        $match: filter,
      },
    ]);

    let SaleTaxAmount;
    let AmountPKR;
    if (Array.isArray(invoiceamountpkr) && invoiceamountpkr.length == 0) {
      SaleTaxAmount = [];
      AmountPKR = [];
    } else {
      const qty = invoiceamountpkr.map((item) => (item.qty ? item.qty : []));
      const saletaxrate = invoiceamountpkr.map((item) => item.salesTaxRate);
      const rate = invoiceamountpkr.map((item) => (item.rate ? item.rate : []));

      const saletax = qty.map((amount, index) => amount * rate[index]);

      const saletaxamount = saletaxrate.map(
        (amount, index) => amount * saletax[index]
      );

      SaleTaxAmount = saletaxamount.reduce((total, value) => total + value);

      const Amount = invoiceamountpkr.map((item) =>
        item.amount ? item.amount : []
      );
      const Rate = invoiceamountpkr.map((item) =>
        item.rate ? item.exchangeRate : []
      );

      const qtypkr = Amount.map((amount, index) => amount * Rate[index]);

      AmountPKR = qtypkr.reduce((total, value) => total + value, 0);
    }

    const total_record = await InvoiceDtlModel.aggregate([
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
        $match: filter_records,
      },
    ]);
    const invoicegroupby = await InvoiceDtlModel.aggregate([
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
        $match: filter,
      },
      {
        $group: {
          _id: null,
          totalQty: {
            $sum: '$qty',
          },
          totalRate: {
            $sum: '$rate',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalSaleTaxAmount: {
            $sum: '$salesTaxAmount',
          },
          data: {
            $push: '$$ROOT',
          },
        },
      },
      {
        $addFields: {
          totalValue: {
            $sum: {
              $map: {
                input: '$data',
                as: 'item',
                in: {
                  $divide: [
                    {
                      $multiply: [
                        '$$item.amount',
                        '$$item.exchangeRate',
                        '$$item.salesTaxRate',
                      ],
                    },
                    100,
                  ],
                },
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalQty: 1,
          totalRate: 1,
          totalValue: 1,
          totalAmount: 1,
          totalSaleTaxAmount: 1,
          data: 1,
        },
      },
    ]);
    const totalQty = invoicegroupby.map((item) => item.totalQty);
    const totalAmount = invoicegroupby.map((item) => item.totalAmount);
    const totalRate = invoicegroupby.map((item) => item.totalRate);
    const totalValue = invoicegroupby.map((item) => item.totalValue);
    const invoice_detail = await InvoiceDtlModel.aggregate([
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
        $match: where,
      },
      {
        $lookup: {
          from: 'invoices',
          localField: 'invoice',
          foreignField: '_id',
          as: 'inv_dtl',
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'sale_dtl',
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer_dtl',
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
      { $sort: { date: -1 } },
    ]);
    if (Array.isArray(invoice_detail) && invoice_detail.length == 0) {
      const result = {
        invoice_dtl: [],
        total_record: [],
        paginated_record: [],
        totalAmount: [],
        totalQty: [],
        totalRate: [],
        totalAmountPKR: [],
        SaleTaxAmount: [],
      };
      return result;
    } else {
      const result = {
        invoice_detail: invoice_detail,
        total_records: total_record.length,
        paginated_record: invoice_detail.length,
        totalAmount: totalAmount,
        totalQty: totalQty,
        totalRate: totalRate,
        totalValue: totalValue,
        totalAmountPKR: AmountPKR,
        SaleTaxAmount: SaleTaxAmount,
      };
      return result;
    }
  } else if (
    input.customer_group !== '' &&
    input.royality_approval == '' &&
    input.order_status == '' &&
    Array.isArray(input.customer) &&
    input.customer.length !== 0 &&
    Array.isArray(input.product) &&
    input.product.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0
  ) {
    console.log('customer group customer ');

    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;
    const customerArr = input.customer
      ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const customer = await InvoiceDtlModel.aggregate([
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
        $match: {
          isDeleted: false,
          customer: { $in: customerArr },
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer_details',
        },
      },
      {
        $addFields: {
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
          totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
          totalSaleTaxAmount: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: '$customer', // Group by customer ID
          customerName: { $first: '$customer_details.name' }, // Retrieve customer name
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
          totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
          totalInvoices: { $sum: 1 }, // Count the number of contracts for each customer
        },
      },
      {
        $project: {
          customerName: 1,
          totalQty: 1,
          totalAmount: 1,
          totalInvoices: 1,
          totalSaleTaxAmount: 1,
          _id: 0, // Exclude _id field
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
      { $skip: skipCount },
      { $limit: limit },
    ]);

    const totalInvoicesSum = customer.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );

    const totalQtySum = customer.reduce((sum, item) => sum + item.totalQty, 0);
    const totalAmountSum = customer.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const totalSaleTaxAmountSum = customer.reduce(
      (sum, item) => sum + item.totalSaleTaxAmount,
      0
    );
    const result = {
      customer_groupby: customer,
      total_records: customer.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalSaleTaxAmountSum: totalSaleTaxAmountSum,
      totalInvoicesSum: totalInvoicesSum,
    };
    return result;
  } else if (
    input.product_group !== '' &&
    input.royality_approval == '' &&
    input.order_status == '' &&
    Array.isArray(input.product) &&
    input.product.length !== 0 &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0
  ) {
    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;
    console.log('product to product group');

    const productArr = input.product
      ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];

    const product = await InvoiceDtlModel.aggregate([
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
        $match: {
          isDeleted: false,
          product: { $in: productArr },
        },
      },

      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      {
        $group: {
          _id: '$product',
          productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
          totalInvoices: { $sum: 1 },
          totalQty: { $sum: '$qty' },
          totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
          totalSaleTaxAmount: { $gt: 0 },
        },
      },
      {
        $project: {
          productName: 1,
          totalInvoices: 1,
          totalQty: 1,
          totalAmount: 1,
          totalSaleTaxAmount: 1,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
      { $skip: skipCount },
      { $limit: limit },
    ]);

    const totalInvoices = product.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );
    const totalQtySum = product.reduce((sum, item) => sum + item.totalQty, 0);
    const totalAmountSum = product.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const totalSaleTaxAmountSum = product.reduce(
      (sum, item) => sum + item.totalSaleTaxAmount,
      0
    );
    const result = {
      product_groupby: product,
      total_records: product.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalInvoicesSum: totalInvoices,
      totalSaleTaxAmountSum: totalSaleTaxAmountSum,
    };
    return result;
  } else if (
    input.customer_group !== '' &&
    input.royality_approval == '' &&
    input.order_status == '' &&
    Array.isArray(input.brand) &&
    input.brand.length !== 0 &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.product) &&
    input.product.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0
  ) {
    console.log('customer group brand');

    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;
    const brandArr = input.brand
      ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const customer = await InvoiceDtlModel.aggregate([
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
        $match: {
          isDeleted: false,
          brand: { $in: brandArr },
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer_details',
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand_details',
        },
      },
      {
        $addFields: {
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
          totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
          totalSaleTaxAmount: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: '$customer', // Group by customer ID
          customerName: { $first: '$customer_details.name' },
          brandName: { $first: '$brand_details.name' }, // Retrieve customer name
          totalQty: { $sum: '$qty' },
          totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
          totalAmount: { $sum: '$amount' },
          totalInvoices: { $sum: 1 }, // Count the number of contracts for each customer
        },
      },
      {
        $project: {
          customerName: 1,
          brandName: 1,
          totalQty: 1,
          c: 1,
          totalAmount: 1,
          totalSaleTaxAmount: 1,
          totalInvoices: 1,
          _id: 0, // Exclude _id field
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
      { $skip: skipCount },
      { $limit: limit },
    ]);

    const totalInvoicesSum = customer.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );
    const totalQtySum = customer.reduce((sum, item) => sum + item.totalQty, 0);
    const totalAmountSum = customer.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const totalSaleTaxAmount = customer.reduce(
      (sum, item) => sum + item.totalSaleTaxAmount,
      0
    );

    const result = {
      customer_groupby: customer,
      total_records: customer.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalInvoicesSum: totalInvoicesSum,
      totalSaleTaxAmount: totalSaleTaxAmount,
    };
    return result;
  } else if (
    input.product_group !== '' &&
    input.royality_approval == '' &&
    input.order_status == '' &&
    Array.isArray(input.brand) &&
    input.brand.length !== 0 &&
    Array.isArray(input.product) &&
    input.product.length == 0 &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0
  ) {
    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;
    console.log('product to brand');

    const total_records = await BrandModel.countDocuments();
    const brandArr = input.brand
      ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];

    const product = await InvoiceDtlModel.aggregate([
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
        $match: {
          // isDeleted: false,
          brand: { $in: brandArr },
        },
      },

      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brandInfo',
        },
      },
      {
        $group: {
          _id: '$product',
          productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
          brandName: { $first: { $arrayElemAt: ['$brandInfo.name', 0] } },
          totalInvoices: { $sum: 1 },
          totalQty: { $sum: '$qty' },
          totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
          totalSaleTaxAmount: { $gt: 0 },
        },
      },
      {
        $project: {
          productName: 1,
          brandName: 1,
          totalInvoices: 1,
          totalQty: 1,
          totalSaleTaxAmount: 1,
          totalAmount: 1,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
      { $skip: skipCount },
      { $limit: limit },
    ]);

    const totalInvoices = product.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );
    const totalQtySum = product.reduce((sum, item) => sum + item.totalQty, 0);
    const totalAmountSum = product.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const totalSaleTaxAmountSum = product.reduce(
      (sum, item) => sum + item.totalSaleTaxAmount,
      0
    );
    const result = {
      product_groupby: product,
      total_records: total_records,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalInvoicesSum: totalInvoices,
      totalSaleTaxAmountSum: totalSaleTaxAmountSum,
    };
    return result;
  } else if (
    input.brand_group !== '' &&
    input.royality_approval == '' &&
    input.order_status == '' &&
    Array.isArray(input.brand) &&
    input.brand.length !== 0 &&
    Array.isArray(input.product) &&
    input.product.length == 0 &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length !== 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length !== 0
  ) {
    console.log('brandgroup brand');
    const brandArr = input.brand
      ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];

    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;
    const total_records = await BrandModel.countDocuments();

    const brandgroup = await InvoiceDtlModel.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },

          isDeleted: false,
          brand: { $in: brandArr },
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
        $unwind: '$brand',
      },
      {
        $group: {
          _id: '$brand._id', // Group by brand's _id
          name: { $first: '$brand.name' },
          totalInvoices: { $sum: 1 }, // Calculate the total number of contracts
          totalQty: { $sum: '$qty' }, // Calculate the total quantity
          totalAmount: { $sum: '$amount' },
          totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
          totalSaleTaxAmount: { $gt: 0 },
        },
      },
      {
        $project: {
          _id: 0, // Exclude _id field
          name: 1,
          totalInvoices: 1,
          totalQty: 1,
          totalAmount: 1,
          totalSaleTaxAmount: 1,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
      { $skip: skipCount },
      { $limit: limit },
    ]);

    const totalInvoiceSum = brandgroup.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );
    const totalQtySum = brandgroup.reduce(
      (sum, item) => sum + item.totalQty,
      0
    );
    const totalAmountSum = brandgroup.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const totalSaleTaxAmountSum = brandgroup.reduce(
      (sum, item) => sum + item.totalSaleTaxAmount,
      0
    );
    const result = {
      brand_groupby: brandgroup,
      total_records: brandgroup.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalInvoiceSum: totalInvoiceSum,
      totalSaleTaxAmountSum: totalSaleTaxAmountSum,
    };
    return result;
  } else if (
    input.brand_group !== '' &&
    input.royality_approval == '' &&
    input.order_status == '' &&
    Array.isArray(input.customer) &&
    input.customer.length !== 0 &&
    Array.isArray(input.product) &&
    input.product.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0
  ) {
    console.log('brand to customer');
    const customerArr = input.customer
      ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];

    const brandgroup = await InvoiceDtlModel.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          customer: { $in: customerArr },
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
          _id: '$brand._id',
          brandName: {
            $first: '$brand.name',
          },
          customerName: { $first: '$customer.name' },
          totalInvoices: {
            $sum: 1,
          },
          totalQty: {
            $sum: '$qty',
          },
          totalSaleTaxAmount: {
            $sum: '$salesTaxAmount',
          },
          totalAmount: {
            $sum: '$amount',
          },
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ]);

    const totalInvoicesSum = brandgroup.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );
    const totalQtySum = brandgroup.reduce(
      (sum, item) => sum + item.totalQty,
      0
    );
    const totalAmountSum = brandgroup.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const totalSaleTaxAmountSum = brandgroup.reduce(
      (sum, item) => sum + item.totalSaleTaxAmount,
      0
    );
    const result = {
      brand_groupby: brandgroup,
      total_records: brandgroup.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalSaleTaxAmountSum: totalSaleTaxAmountSum,
      totalInvoicesSum: totalInvoicesSum,
    };
    return result;
  } else if (
    input.product_group !== '' &&
    input.royality_approval == '' &&
    input.order_status == '' &&
    Array.isArray(input.customer) &&
    input.customer.length !== 0 &&
    Array.isArray(input.product) &&
    input.product.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0
  ) {
    console.log('product group customer');
    const customerArr = input.customer
      ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const productdtl = await InvoiceDtlModel.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,

          customer: { $in: customerArr },
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
          as: 'products',
        },
      },

      {
        $group: {
          _id: '$products._id',
          productName: {
            $first: '$products.name',
          },
          customerName: {
            $first: '$customer.name',
          },
          totalInvoices: {
            $sum: 1,
          },
          totalSaleTaxAmount: {
            $sum: '$salesTaxAmount',
          },
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ]);

    const totalInvoiceSum = productdtl.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );
    const totalQtySum = productdtl.reduce(
      (sum, item) => sum + item.totalQty,
      0
    );
    const totalAmountSum = productdtl.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const totalSaleTaxAmountSum = productdtl.reduce(
      (sum, item) => sum + item.totalSaleTaxAmount,
      0
    );
    const result = {
      product_groupby: productdtl,
      total_records: productdtl.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalInvoiceSum: totalInvoiceSum,
      totalSaleTaxAmountSum: totalSaleTaxAmountSum,
    };
    return result;
  } else if (
    input.customer_group !== '' &&
    input.royality_approval == '' &&
    input.order_status == '' &&
    Array.isArray(input.product) &&
    input.product.length !== 0 &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0
  ) {
    console.log('product to customer');
    const productArr = input.product
      ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const customerdtl = await InvoiceDtlModel.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,

          product: { $in: productArr },
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
          _id: '$customer._id',
          CustomerName: {
            $first: '$customer.name',
          },
          productName: {
            $first: '$product.name',
          },
          totalInvoices: {
            $sum: 1,
          },
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalSaleTaxAmount: {
            $sum: '$salesTaxAmount',
          },
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ]);
    const totalInvoicesSum = customerdtl.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );
    const totalQtySum = customerdtl.reduce(
      (sum, item) => sum + item.totalQty,
      0
    );
    const totalAmountSum = customerdtl.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const totalSaleTaxAmountSum = customerdtl.reduce(
      (sum, item) => sum + item.totalSaleTaxAmount,
      0
    );
    const result = {
      customer_groupby: customerdtl,
      total_records: customerdtl.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalInvoicesSum: totalInvoicesSum,
      totalSaleTaxAmountSum: totalSaleTaxAmountSum,
    };
    return result;
  } else if (
    input.brand_group !== '' &&
    input.royality_approval == '' &&
    input.order_status == '' &&
    Array.isArray(input.product) &&
    input.product.length !== 0 &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0
  ) {
    console.log('product to brand');

    const productArr = input.product
      ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const branddtl = await InvoiceDtlModel.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          product: { $in: productArr },
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
          productname: {
            $first: '$products.name',
          },
          brandname: {
            $first: '$brand.name',
          },
          totalInvoices: {
            $sum: 1,
          },
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalSaleTaxAmount: {
            $sum: '$salesTaxAmount',
          },
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ]);
    const totalInvoicesSum = branddtl.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );
    const totalQtySum = branddtl.reduce((sum, item) => sum + item.totalQty, 0);
    const totalAmountSum = branddtl.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const totalSaleTaxAmountSum = branddtl.reduce(
      (sum, item) => sum + item.totalSaleTaxAmount,
      0
    );
    const result = {
      brand_groupby: branddtl,
      total_records: branddtl.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalInvoicesSum: totalInvoicesSum,
      totalSaleTaxAmountSum: totalSaleTaxAmountSum,
    };
    return result;
  } else if (
    input.customer_group !== '' &&
    input.Adm == '' &&
    input.nonAdm == '' &&
    ((Array.isArray(input.product) && input.product.length !== 0) ||
      (Array.isArray(input.customer) && input.customer.length !== 0) ||
      (Array.isArray(input.brand) && input.brand.length !== 0) ||
      (Array.isArray(input.salesContract) && input.salesContract.length !== 0))
  ) {
    console.log('customer group with general filters brand customer product');

    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;

    const salesContractArr = input.salesContract
      ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const customerArr = input.customer
      ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const productArr = input.product
      ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
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

    function stringToBoolean(str: string | undefined) {
      return str?.toLowerCase() === 'true';
    }
    if (input.royality_approval) {
      extrafilter.royality_approval = stringToBoolean(input.royality_approval);
    }
    if (input.order_status !== '') {
      const order_status = input.order_status;

      where.order_status = order_status;
      (filter_records.order_status = order_status),
        (filter.order_status = order_status);
    }

    const customerAggregationPipelineRecords: any = [
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
        $match: where,
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
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product',
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
        $addFields: {
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $group: {
          _id: '$customer._id',
          // Group by customer
          totalInvoices: {
            $sum: 1,
          },
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
          salesTaxAmount: {
            $sum: '$salesTaxAmount',
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
          salesTaxAmount: 1,
          totalInvoices: 1,
        },
      },
      { $sort: { qty: -1, amount: -1 } },
    ];

    const customerAggregationPipeline: any = [
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
        $match: where,
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
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product',
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
        $addFields: {
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $group: {
          _id: '$customer._id',
          // Group by customer
          totalInvoices: {
            $sum: 1,
          },
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
          salesTaxAmount: {
            $sum: '$salesTaxAmount',
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
          salesTaxAmount: 1,
          totalInvoices: 1,
        },
      },
      { $sort: { qty: -1, amount: -1 } },
      { $skip: skipCount },
      { $limit: limit },
    ];

    const customergroup = await InvoiceDtlModel.aggregate(
      customerAggregationPipeline
    );

    const total_records = await InvoiceDtlModel.aggregate(
      customerAggregationPipelineRecords
    );

    const totalInvoicesSum = total_records.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );

    const totalQtySum = total_records.reduce((sum, item) => sum + item.qty, 0);
    const totalAmountSum = total_records.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const totalSaleTaxAmountSum = total_records.reduce(
      (sum, item) => sum + item.salesTaxAmount,
      0
    );
    const result = {
      Group: customergroup,
      total_records: total_records.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalSaleTaxAmountSum: totalSaleTaxAmountSum,
      totalInvoicesSum: totalInvoicesSum,
    };
    return result;
  } else if (
    input.product_group !== '' &&
    input.Adm == '' &&
    input.nonAdm == '' &&
    ((Array.isArray(input.product) && input.product.length !== 0) ||
      (Array.isArray(input.customer) && input.customer.length !== 0) ||
      (Array.isArray(input.brand) && input.brand.length !== 0) ||
      (Array.isArray(input.salesContract) && input.salesContract.length !== 0))
  ) {
    console.log(
      'product group with general filters brand customer product salescontract work'
    );

    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;

    const salesContractArr = input.salesContract
      ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const customerArr = input.customer
      ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const productArr = input.product
      ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
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

    function stringToBoolean(str: string | undefined) {
      return str?.toLowerCase() === 'true';
    }
    if (input.royality_approval) {
      extrafilter.royality_approval = stringToBoolean(input.royality_approval);
    }
    if (input.order_status !== '') {
      const order_status = input.order_status;

      where.order_status = order_status;
      (filter_records.order_status = order_status),
        (filter.order_status = order_status);
    }
    const productAggregationPipelineRecords: any = [
      {
        $match: {
          date: {
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
          totalInvoices: {
            $sum: 1,
          },
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
          salesTaxAmount: {
            $sum: '$salesTaxAmount',
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
          totalInvoices: 1,
          salesTaxAmount: 1,
        },
      },
    ];
    const productAggregationPipeline: any = [
      {
        $match: {
          date: {
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
          totalInvoices: {
            $sum: 1,
          },
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
          salesTaxAmount: {
            $sum: '$salesTaxAmount',
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
          salesTaxAmount: 1,
          totalInvoices: 1,
        },
      },
      { $sort: { qtY: -1, amount: -1 } },
      { $skip: skipCount },
      { $limit: limit },
    ];
    const productgroup = await InvoiceDtlModel.aggregate(
      productAggregationPipeline
    );
    const total_records = await InvoiceDtlModel.aggregate(
      productAggregationPipelineRecords
    );
    const totalInvoicesSum = total_records.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );

    const totalQtySum = total_records.reduce((sum, item) => sum + item.qty, 0);
    const totalAmountSum = total_records.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const saleTaxAmountSum = total_records.reduce(
      (sum, item) => sum + item.salesTaxAmount,
      0
    );
    const result = {
      Group: productgroup,
      total_records: total_records.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalInvoicesSum: totalInvoicesSum,
      saleTaxAmountSum: saleTaxAmountSum,
    };
    return result;
  } else if (
    input.brand_group !== '' &&
    input.Adm == '' &&
    input.nonAdm == '' &&
    ((Array.isArray(input.product) && input.product.length !== 0) ||
      (Array.isArray(input.customer) && input.customer.length !== 0) ||
      (Array.isArray(input.brand) && input.brand.length !== 0) ||
      (Array.isArray(input.salesContract) && input.salesContract.length !== 0))
  ) {
    console.log(
      '  brand group with general filters brand customer product salescontract work'
    );

    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;

    const salesContractArr = input.salesContract
      ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const customerArr = input.customer
      ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const productArr = input.product
      ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
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

    function stringToBoolean(str: string | undefined) {
      return str?.toLowerCase() === 'true';
    }
    if (input.royality_approval) {
      extrafilter.royality_approval = stringToBoolean(input.royality_approval);
    }
    if (input.order_status !== '') {
      const order_status = input.order_status;

      where.order_status = order_status;
      (filter_records.order_status = order_status),
        (filter.order_status = order_status);
    }
    const brandAggregationPipelineRecords: any = [
      {
        $match: {
          date: {
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

          totalInvoices: {
            $sum: 1,
          },
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
          salesTaxAmount: {
            $sum: '$salesTaxAmount',
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
          salesTaxAmount: 1,
          totalInvoices: 1,
        },
      },
      { $sort: { qty: -1, amount: -1 } },
    ];
    console.log(where);
    const brandAggregationPipeline: any = [
      {
        $match: {
          date: {
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

          totalInvoices: {
            $sum: 1,
          },
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
          salesTaxAmount: {
            $sum: '$salesTaxAmount',
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
          salesTaxAmount: 1,
          totalInvoices: 1,
        },
      },
      { $sort: { qty: -1, amount: -1 } },
      { $skip: skipCount },
      { $limit: limit },
    ];
    const brandgroup = await InvoiceDtlModel.aggregate(
      brandAggregationPipeline
    );
    const total_records = await InvoiceDtlModel.aggregate(
      brandAggregationPipelineRecords
    );

    const totalInvoicesSum = total_records.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );

    const totalQtySum = total_records.reduce((sum, item) => sum + item.qty, 0);
    const totalAmountSum = total_records.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const totalSaleTaxAmountSum = total_records.reduce(
      (sum, item) => sum + item.salesTaxAmount,
      0
    );
    console.log(totalQtySum);
    const result = {
      Group: brandgroup,
      total_records: total_records.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalSaleTaxAmountSum: totalSaleTaxAmountSum,
      totalInvoicesSum: totalInvoicesSum,
    };
    return result;
  } else if (
    input.product_group !== '' &&
    input.order_status !== '' &&
    input.royality_approval !== '' &&
    input.nonAdm == '' &&
    input.Adm == ''
  ) {
    console.log('product group  royality_approval and orderstatus');

    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;
    function stringToBoolean(str: string | undefined) {
      return str?.toLowerCase() === 'true';
    }

    const royality_approval = stringToBoolean(input.royality_approval);
    const order_status = input.order_status;

    const productAggregationPipelineRecord: any = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          invoice: true,
          order_status: order_status,
          royality_approval: royality_approval,
        },
      },

      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      {
        $group: {
          _id: '$product',
          productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
          totalInvoices: { $sum: 1 },
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
        },
      },
      {
        $project: {
          productName: 1,
          totalInvoices: 1,
          totalQty: 1,
          totalAmount: 1,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ];

    const productAggregationPipeline: any = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          invoice: true,
          order_status: order_status,
          royality_approval: royality_approval,
        },
      },

      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      {
        $group: {
          _id: '$product',
          productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
          totalInvoices: { $sum: 1 },
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
        },
      },
      {
        $project: {
          productName: 1,
          totalInvoices: 1,
          totalQty: 1,
          totalAmount: 1,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
      { $skip: skipCount },
      { $limit: limit },
    ];

    const product = await SalesContractDtlModel.aggregate(
      productAggregationPipeline
    );
    const total_records = await SalesContractDtlModel.aggregate(
      productAggregationPipelineRecord
    );
    const totalInvoices = product.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );
    const totalQtySum = product.reduce((sum, item) => sum + item.totalQty, 0);
    const totalAmountSum = product.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const result = {
      product_groupby: product,
      total_records: total_records.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalInvoicesSum: totalInvoices,
    };
    return result;
  } else if (
    input.brand_group !== '' &&
    input.order_status !== '' &&
    input.royality_approval !== '' &&
    input.nonAdm == '' &&
    input.Adm == ''
  ) {
    console.log('brand group royality_approval and order_status');

    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;
    function stringToBoolean(str: string | undefined) {
      return str?.toLowerCase() === 'true';
    }

    const royality_approval = stringToBoolean(input.royality_approval);
    const order_status = input.order_status;
    const brandAggregationPipelineRecord: any = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          invoice: true,
          order_status: order_status,
          royality_approval: royality_approval,
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
        $unwind: '$brand',
      },
      {
        $group: {
          _id: '$brand._id',
          name: { $first: '$brand.name' },
          totalInvoices: { $sum: 1 },
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
        },
      },
      {
        $project: {
          _id: 0,
          name: 1,
          totalInvoices: 1,
          totalQty: 1,
          totalAmount: 1,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ];
    const brandAggregationPipeline: any = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          invoice: true,
          order_status: order_status,
          royality_approval: royality_approval,
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
        $unwind: '$brand',
      },
      {
        $group: {
          _id: '$brand._id',
          name: { $first: '$brand.name' },
          totalInvoices: { $sum: 1 },
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
        },
      },
      {
        $project: {
          _id: 0,
          name: 1,
          totalInvoices: 1,
          totalQty: 1,
          totalAmount: 1,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
      { $skip: skipCount },
      { $limit: limit },
    ];
    const brandgroup = await SalesContractDtlModel.aggregate(
      brandAggregationPipeline
    );
    const total_records = await SalesContractDtlModel.aggregate(
      brandAggregationPipelineRecord
    );

    const totalInvoicesSum = brandgroup.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );
    const totalQtySum = brandgroup.reduce(
      (sum, item) => sum + item.totalQty,
      0
    );
    const totalAmountSum = brandgroup.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const result = {
      brand_groupby: brandgroup,
      total_records: total_records.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalInvoicesSum: totalInvoicesSum,
    };
    return result;
  } else if (
    input.customer_group !== '' &&
    input.order_status !== '' &&
    input.royality_approval !== '' &&
    input.nonAdm == '' &&
    input.Adm == ''
  ) {
    console.log('all in three ');

    console.log('customer group royality_approval and orderstatus');
    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;
    function stringToBoolean(str: string | undefined) {
      return str?.toLowerCase() === 'true';
    }

    const royality_approval = stringToBoolean(input.royality_approval);
    const order_status = input.order_status;
    const customerAggregationPipelineRecords: any = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          invoice: true,
          order_status: order_status,
          royality_approval: royality_approval,
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer_details',
        },
      },
      {
        $addFields: {
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: '$customer', // Group by customer ID
          customerName: { $first: '$customer_details.name' },
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
          totalInvoices: { $sum: 1 },
        },
      },
      {
        $project: {
          customerName: 1,
          totalQty: 1,
          totalAmount: 1,
          totalInvoices: 1,
          _id: 0, // Exclude _id field
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ];

    const customerAggregationPipeline: any = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          invoice: true,
          order_status: order_status,
          royality_approval: royality_approval,
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer_details',
        },
      },
      {
        $addFields: {
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: '$customer', // Group by customer ID
          customerName: { $first: '$customer_details.name' },
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
          totalInvoices: { $sum: 1 },
        },
      },
      {
        $project: {
          customerName: 1,
          totalQty: 1,
          totalAmount: 1,
          totalInvoices: 1,
          _id: 0,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
      { $skip: skipCount },
      { $limit: limit },
    ];
    const customer = await SalesContractDtlModel.aggregate(
      customerAggregationPipeline
    );
    const total_records = await SalesContractDtlModel.aggregate(
      customerAggregationPipelineRecords
    );
    const totalInvoicesSum = customer.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );
    const totalQtySum = customer.reduce((sum, item) => sum + item.totalQty, 0);
    const totalAmountSum = customer.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );

    const result = {
      customer_groupby: customer,
      total_records: total_records.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalInvoicesSum: totalInvoicesSum,
    };
    return result;
  } else if (
    input.product_group !== '' &&
    input.order_status !== '' &&
    input.nonAdm == '' &&
    input.Adm == ''
  ) {
    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;
    console.log('order_status product group');
    const order_status = input.order_status;
    const productAggregationPipelineRecord: any = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          invoice: true,
          order_status: order_status,
        },
      },

      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      {
        $group: {
          _id: '$product',
          productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
          totalInvoices: { $sum: 1 },
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
        },
      },
      {
        $project: {
          productName: 1,
          totalInvoices: 1,
          totalQty: 1,
          totalAmount: 1,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ];

    const productAggregationPipeline: any = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          invoice: true,
          order_status: order_status,
        },
      },

      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      {
        $group: {
          _id: '$product',
          productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
          totalInvoices: { $sum: 1 },
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
        },
      },
      {
        $project: {
          productName: 1,
          totalInvoices: 1,
          totalQty: 1,
          totalAmount: 1,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
      { $skip: skipCount },
      { $limit: limit },
    ];

    const product = await SalesContractDtlModel.aggregate(
      productAggregationPipeline
    );
    const total_records = await SalesContractDtlModel.aggregate(
      productAggregationPipelineRecord
    );
    const totalInvoicesSum = product.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );
    const totalQtySum = product.reduce((sum, item) => sum + item.totalQty, 0);
    const totalAmountSum = product.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const result = {
      product_groupby: product,
      total_records: total_records.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalInvoicesSum: totalInvoicesSum,
    };
    return result;
  } else if (
    input.customer_group !== '' &&
    input.order_status !== '' &&
    input.nonAdm == '' &&
    input.Adm == ''
  ) {
    console.log('customer group order_status');
    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;
    const order_status = input.order_status;
    const customerAggregationPipelineRecords: any = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          invoice: true,
          order_status: order_status,
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer_details',
        },
      },
      {
        $addFields: {
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: '$customer', // Group by customer ID
          customerName: { $first: '$customer_details.name' },
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
          totalInvoices: { $sum: 1 },
        },
      },
      {
        $project: {
          customerName: 1,
          totalQty: 1,
          totalAmount: 1,
          totalInvoices: 1,
          _id: 0, // Exclude _id field
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ];

    const customerAggregationPipeline: any = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          invoice: true,
          order_status: order_status,
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer_details',
        },
      },
      {
        $addFields: {
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: '$customer', // Group by customer ID
          customerName: { $first: '$customer_details.name' },
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
          totalInvoices: { $sum: 1 },
        },
      },
      {
        $project: {
          customerName: 1,
          totalQty: 1,
          totalAmount: 1,
          totalInvoices: 1,
          _id: 0,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
      { $skip: skipCount },
      { $limit: limit },
    ];
    const customer = await SalesContractDtlModel.aggregate(
      customerAggregationPipeline
    );
    const total_records = await SalesContractDtlModel.aggregate(
      customerAggregationPipelineRecords
    );
    const totalInvoicesSum = customer.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );
    const totalQtySum = customer.reduce((sum, item) => sum + item.totalQty, 0);
    const totalAmountSum = customer.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );

    const result = {
      customer_groupby: customer,
      total_records: total_records.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalInvoicesSum: totalInvoicesSum,
    };
    return result;
  } else if (
    input.brand_group !== '' &&
    input.order_status !== '' &&
    input.nonAdm == '' &&
    input.Adm == ''
  ) {
    console.log('brand group order_status');

    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;
    const order_status = input.order_status;
    const brandAggregationPipelineRecord: any = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          invoice: true,
          order_status: order_status,
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
        $unwind: '$brand',
      },
      {
        $group: {
          _id: '$brand._id',
          name: { $first: '$brand.name' },
          totalInvoices: { $sum: 1 },
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
        },
      },
      {
        $project: {
          _id: 0,
          name: 1,
          totalInvoices: 1,
          totalQty: 1,
          totalAmount: 1,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ];
    const brandAggregationPipeline: any = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          invoice: true,
          order_status: order_status,
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
        $unwind: '$brand',
      },
      {
        $group: {
          _id: '$brand._id',
          name: { $first: '$brand.name' },
          totalInvoices: { $sum: 1 },
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
        },
      },
      {
        $project: {
          _id: 0,
          name: 1,
          totalInvoices: 1,
          totalQty: 1,
          totalAmount: 1,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
      { $skip: skipCount },
      { $limit: limit },
    ];
    const brandgroup = await SalesContractDtlModel.aggregate(
      brandAggregationPipeline
    );
    const total_records = await SalesContractDtlModel.aggregate(
      brandAggregationPipelineRecord
    );

    const totalInvoicesSum = brandgroup.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );
    const totalQtySum = brandgroup.reduce(
      (sum, item) => sum + item.totalQty,
      0
    );
    const totalAmountSum = brandgroup.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const result = {
      brand_groupby: brandgroup,
      total_records: total_records.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalInvoicesSum: totalInvoicesSum,
    };
    return result;
  } else if (
    input.product_group !== '' &&
    input.royality_approval !== '' &&
    input.nonAdm == '' &&
    input.Adm == ''
  ) {
    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;
    console.log('product group  royality_approval');
    function stringToBoolean(str: string | undefined) {
      return str?.toLowerCase() === 'true';
    }

    const royality_approval = stringToBoolean(input.royality_approval);

    const productAggregationPipelineRecord: any = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          invoice: true,
          royality_approval: royality_approval,
        },
      },

      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      {
        $group: {
          _id: '$product',
          productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
          totalInvoices: { $sum: 1 },
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
        },
      },
      {
        $project: {
          productName: 1,
          totalInvoices: 1,
          totalQty: 1,
          totalAmount: 1,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ];

    const productAggregationPipeline: any = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          invoice: true,
          royality_approval: royality_approval,
        },
      },

      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      {
        $group: {
          _id: '$product',
          productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
          totalInvoices: { $sum: 1 },
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
        },
      },
      {
        $project: {
          productName: 1,
          totalInvoices: 1,
          totalQty: 1,
          totalAmount: 1,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
      { $skip: skipCount },
      { $limit: limit },
    ];

    const product = await SalesContractDtlModel.aggregate(
      productAggregationPipeline
    );
    const total_records = await SalesContractDtlModel.aggregate(
      productAggregationPipelineRecord
    );
    const totalInvoicesSum = product.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );
    const totalQtySum = product.reduce((sum, item) => sum + item.totalQty, 0);
    const totalAmountSum = product.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const result = {
      product_groupby: product,
      total_records: total_records.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalInvoicesSum: totalInvoicesSum,
    };
    return result;
  } else if (
    input.customer_group !== '' &&
    input.royality_approval !== '' &&
    input.nonAdm == '' &&
    input.Adm == ''
  ) {
    console.log('customer group royality_approval');
    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;
    function stringToBoolean(str: string | undefined) {
      return str?.toLowerCase() === 'true';
    }

    const royality_approval = stringToBoolean(input.royality_approval);
    const customerAggregationPipelineRecords: any = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          invoice: true,
          royality_approval: royality_approval,
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer_details',
        },
      },
      {
        $addFields: {
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: '$customer', // Group by customer ID
          customerName: { $first: '$customer_details.name' },
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
          totalInvoices: { $sum: 1 },
        },
      },
      {
        $project: {
          customerName: 1,
          totalQty: 1,
          totalAmount: 1,
          totalInvoices: 1,
          _id: 0, // Exclude _id field
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ];

    const customerAggregationPipeline: any = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          invoice: true,
          royality_approval: royality_approval,
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer_details',
        },
      },
      {
        $addFields: {
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: '$customer', // Group by customer ID
          customerName: { $first: '$customer_details.name' },
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
          totalInvoices: { $sum: 1 },
        },
      },
      {
        $project: {
          customerName: 1,
          totalQty: 1,
          totalAmount: 1,
          totalInvoices: 1,
          _id: 0,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
      { $skip: skipCount },
      { $limit: limit },
    ];
    const customer = await SalesContractDtlModel.aggregate(
      customerAggregationPipeline
    );
    const total_records = await SalesContractDtlModel.aggregate(
      customerAggregationPipelineRecords
    );
    const totalInvoicesSum = customer.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );
    const totalQtySum = customer.reduce((sum, item) => sum + item.totalQty, 0);
    const totalAmountSum = customer.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );

    const result = {
      customer_groupby: customer,
      total_records: total_records.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalInvoicesSum: totalInvoicesSum,
    };
    return result;
  } else if (
    input.brand_group !== '' &&
    input.royality_approval !== '' &&
    input.nonAdm == '' &&
    input.Adm == ''
  ) {
    console.log('brand group royality_approval');

    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;
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
          invoice: true,
          royality_approval: royality_approval,
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
        $unwind: '$brand',
      },
      {
        $group: {
          _id: '$brand._id',
          name: { $first: '$brand.name' },
          totalInvoices: { $sum: 1 },
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
        },
      },
      {
        $project: {
          _id: 0,
          name: 1,
          totalInvoices: 1,
          totalQty: 1,
          totalAmount: 1,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ];
    const brandAggregationPipeline: any = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          invoice: true,
          royality_approval: royality_approval,
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
        $unwind: '$brand',
      },
      {
        $group: {
          _id: '$brand._id',
          name: { $first: '$brand.name' },
          totalInvoices: { $sum: 1 },
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
        },
      },
      {
        $project: {
          _id: 0,
          name: 1,
          totalInvoices: 1,
          totalQty: 1,
          totalAmount: 1,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
      { $skip: skipCount },
      { $limit: limit },
    ];
    const brandgroup = await SalesContractDtlModel.aggregate(
      brandAggregationPipeline
    );
    const total_records = await SalesContractDtlModel.aggregate(
      brandAggregationPipelineRecord
    );

    const totalInvoicesSum = brandgroup.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );
    const totalQtySum = brandgroup.reduce(
      (sum, item) => sum + item.totalQty,
      0
    );
    const totalAmountSum = brandgroup.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const result = {
      brand_groupby: brandgroup,
      total_records: total_records.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalInvoicesSum: totalInvoicesSum,
    };
    return result;
  }

  if (input.Adm !== '') {
    console.log('Adm');
    if (
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0 &&
      input.customer_group == '' &&
      input.product_group == '' &&
      input.brand_group == '' &&
      input.salesContract_group == '' &&
      input.order_status == '' &&
      input.royality_approval == ''
    ) {
      console.log('no filter condition execute!');
      try {
        const limit = input.perPage;
        const skipCount = (input.pageno - 1) * limit;
        const invoice_groupby = await InvoiceDtlModel.aggregate([
          {
            $match: {
              date: {
                $gte: new Date(input.fromDate),
                $lte: new Date(input.toDate),
              },
              isDeleted: false,
              adm_invoice: true,
            },
          },

          {
            $group: {
              _id: null,
              totalQty: {
                $sum: '$qty',
              },
              totalRate: {
                $sum: '$rate',
              },
              totalAmount: {
                $sum: '$amount',
              },
              totalSaleTaxAmount: {
                $sum: '$salesTaxAmount',
              },
              data: {
                $push: '$$ROOT',
              },
            },
          },
          {
            $addFields: {
              totalValue: {
                $sum: {
                  $map: {
                    input: '$data',
                    as: 'item',
                    in: {
                      $divide: [
                        {
                          $multiply: [
                            '$$item.amount',
                            '$$item.exchangeRate',
                            '$$item.salesTaxRate',
                          ],
                        },
                        100,
                      ],
                    },
                  },
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              totalQty: 1,
              totalRate: 1,
              totalValue: 1,
              totalAmount: 1,
              totalSaleTaxAmount: 1,
              data: 1,
            },
          },
        ]);
        const total_qty = invoice_groupby.map((item) => item.totalQty);
        const total_amount = invoice_groupby.map((item) => item.totalAmount);
        const total_rate = invoice_groupby.map((item) => item.totalRate);
        const totalValue = invoice_groupby.map((item) => item.totalValue);
        const total_records = await InvoiceModel.aggregate([
          {
            $match: {
              date: {
                $gte: new Date(input.fromDate),
                $lte: new Date(input.toDate),
              },
              isDeleted: false,
              adm_invoice: true,
            },
          },
        ]);

        const invoiceamountpkr = await InvoiceDtlModel.aggregate([
          {
            $match: {
              date: {
                $gte: new Date(input.fromDate),
                $lte: new Date(input.toDate),
              },
              isDeleted: false,
              adm_invoice: true,
            },
          },
        ]);

        const qty = invoiceamountpkr.map((item) => item.qty);
        const saletaxrate = invoiceamountpkr.map((item) => item.salesTaxRate);
        const rate = invoiceamountpkr.map((item) => item.rate);

        const saletax = qty.map((amount, index) => amount * rate[index]);
        const saletaxamount = saletaxrate.map(
          (amount, index) => amount * saletax[index]
        );
        const SaleTaxAmount = saletaxamount.reduce(
          (total, value) => total + value
        );

        const Amount = invoiceamountpkr.map((item) => item.amount);
        const Rate = invoiceamountpkr.map((item) => item.rate);
        const qtypkr = Amount.map((amount, index) => amount * Rate[index]);

        const AmountPKR = qtypkr.reduce((total, value) => total + value, 0);

        const invoice_detail = await InvoiceDtlModel.aggregate([
          {
            $match: {
              date: {
                $gte: new Date(input.fromDate),
                $lte: new Date(input.toDate),
              },
              isDeleted: false,
              adm_invoice: true,
            },
          },
          {
            $lookup: {
              from: 'invoices',
              localField: 'invoice',
              foreignField: '_id',
              as: 'inv_dtl',
            },
          },
          {
            $lookup: {
              from: 'salescontracts',
              localField: 'salesContract',
              foreignField: '_id',
              as: 'sale_dtl',
            },
          },
          {
            $lookup: {
              from: 'customers',
              localField: 'customer',
              foreignField: '_id',
              as: 'customer_dtl',
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
          { $sort: { date: -1 } },
        ]);
        const result = {
          invoice_detail: invoice_detail,
          paginated_record: invoice_detail.length,
          totalQty: total_qty,
          totalAmount: total_amount,
          totalRate: total_rate,
          total_records: total_records.length,
          totalAmountPKR: AmountPKR,
          totalValue: totalValue,
          SaleTaxAmount: SaleTaxAmount,
        };
        return result;
      } catch (error) {
        console.log(error);
      }
    } else if (
      input.product_group !== '' &&
      input.order_status == '' &&
      input.royality_approval == '' &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('product group');
      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;

      const productAggregationPipelineRecord: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
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
          $addFields: {
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
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
            totalSaleTaxAmount: {
              $gt: 0,
            },
          },
        },
        {
          $group: {
            _id: '$product',
            name: {
              $first: '$product.name', // Retrieve product name
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$totalSaleTaxAmount',
            },
            totalInvoices: {
              $sum: 1,
            },
          },
        },
        {
          $project: {
            name: 1,
            totalQty: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            totalInvoices: 1,
            _id: 0,
          },
        },
        {
          $sort: {
            totalQty: -1,
            totalAmount: -1,
          },
        },
      ];

      const productAggregationPipeline: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
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
          $addFields: {
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
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
            totalSaleTaxAmount: {
              $gt: 0,
            },
          },
        },
        {
          $group: {
            _id: '$product',
            name: {
              $first: '$product.name', // Retrieve product name
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$totalSaleTaxAmount',
            },
            totalInvoices: {
              $sum: 1,
            },
          },
        },
        {
          $project: {
            name: 1,
            totalQty: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            totalInvoices: 1,
            _id: 0,
          },
        },
        {
          $sort: {
            totalQty: -1,
            totalAmount: -1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ];

      const product_group = await InvoiceDtlModel.aggregate(
        productAggregationPipeline
      );
      const total_records = await InvoiceDtlModel.aggregate(
        productAggregationPipelineRecord
      );
      const invoiceRecordSum = total_records.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = total_records.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = total_records.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalSaleTaxAmountSum = total_records.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );

      const result = {
        Group: product_group,
        paginated_record: product_group.length,
        total_records: total_records.length,
        invoiceTotalRecordSum: invoiceRecordSum,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
      };
      return result;
    } else if (
      input.customer_group !== '' &&
      input.order_status == '' &&
      input.royality_approval == '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      console.log('customer general ');
      const customerAggregationPipelineRecord: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
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
          $addFields: {
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
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
            totalSaleTaxAmount: {
              $gt: 0,
            },
          },
        },
        {
          $group: {
            _id: '$customer',
            name: {
              $first: '$customer.name',
            },
            // Retrieve customer name
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$totalSaleTaxAmount',
            },
            totalInvoices: {
              $sum: 1,
            }, //
          },
        },
        {
          $project: {
            name: 1,
            totalQty: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            totalInvoices: 1,
            _id: 0,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];
      const customerAggregationPipeline: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
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
          $addFields: {
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
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
            totalSaleTaxAmount: {
              $gt: 0,
            },
          },
        },
        {
          $group: {
            _id: '$customer',
            customerName: {
              $first: '$customer.name',
            },
            // Retrieve customer name
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$totalSaleTaxAmount',
            },
            totalInvoices: {
              $sum: 1,
            }, //
          },
        },
        {
          $project: {
            customerName: 1,
            totalQty: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            totalInvoices: 1,
            _id: 0,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const customer_group = await InvoiceDtlModel.aggregate(
        customerAggregationPipeline
      );
      const total_records = await InvoiceDtlModel.aggregate(
        customerAggregationPipelineRecord
      );

      const customerQtySum = total_records.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const customerinvoiceRecordSum = total_records.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const customertotalSaleTaxAmountSum = total_records.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const customertotalAmountSum = total_records.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const result = {
        Group: customer_group,
        paginated_records: customer_group.length,
        total_records: total_records.length,
        customerTotalQtySum: customerQtySum,
        customerTotalInvoiceRecordSum: customerinvoiceRecordSum,
        totalSaleTaxAmountSum: customertotalSaleTaxAmountSum,
        customertotalAmountSum: customertotalAmountSum,
      };
      return result;
    } else if (
      input.salesContract_group !== '' &&
      input.order_status == '' &&
      input.royality_approval == '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;

      const salesContractAggregationPipelineRecord: any = [
        {
          $match: {
            isDeleted: false,
            adm_invoice: true,
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContract',
          },
        },
        {
          $addFields: {
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
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
            totalSaleTaxAmount: {
              $gt: 0,
            },
          },
        },
        {
          $group: {
            _id: '$salesContract',
            salesContractNumber: {
              $first: '$salesContract.contract', // Retrieve sales contract number or identifier
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$totalSaleTaxAmount',
            },
            totalInvoices: {
              $sum: 1,
            },
          },
        },
        {
          $project: {
            salesContractNumber: 1,
            totalQty: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            totalInvoices: 1,
            _id: 0,
          },
        },
        {
          $sort: {
            totalQty: -1,
            totalAmount: -1,
          },
        },
      ];
      const salesContractAggregationPipeline: any = [
        {
          $match: {
            isDeleted: false,
            adm_invoice: true,
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContract',
          },
        },
        {
          $addFields: {
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
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
            totalSaleTaxAmount: {
              $gt: 0,
            },
          },
        },
        {
          $group: {
            _id: '$salesContract',
            salesContractNumber: {
              $first: '$salesContract.contract', // Retrieve sales contract number or identifier
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$totalSaleTaxAmount',
            },
            totalInvoices: {
              $sum: 1,
            },
          },
        },
        {
          $project: {
            salesContractNumber: 1,
            totalQty: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            totalInvoices: 1,
            _id: 0,
          },
        },
        {
          $sort: {
            totalQty: -1,
            totalAmount: -1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const salecontract_group = await InvoiceDtlModel.aggregate(
        salesContractAggregationPipeline
      );
      const total_record = await InvoiceDtlModel.aggregate(
        salesContractAggregationPipelineRecord
      );

      const totalInvoiceSum = total_record.reduce(
        (sum, item) => sum + item.totalInvoices,
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
      const totalSaleTaxAmountSum = total_record.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const salesContractNumberSum = total_record.reduce(
        (sum, item) => sum + item.salesContractNumber,
        0
      );
      const result = {
        Group: salecontract_group,
        total_records: salecontract_group.length,
        paginated_record: total_record.length,
        totalInvoiceSum: totalInvoiceSum,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        salesContractNumberSum: salesContractNumberSum,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
      };
      return result;
    } else if (
      input.brand_group !== '' &&
      input.order_status == '' &&
      input.royality_approval == '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('brand group general');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;

      const brandAggregationPipelineRecord: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
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
          $addFields: {
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
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
            totalSaleTaxAmount: {
              $gt: 0,
            },
          },
        },
        {
          $group: {
            _id: '$brand',
            name: {
              $first: '$brand.name',
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$totalSaleTaxAmount',
            },
            totalInvoices: {
              $sum: 1,
            },
          },
        },
        {
          $project: {
            name: 1,
            totalQty: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            totalInvoices: 1,
            _id: 0,
          },
        },
        {
          $sort: {
            totalQty: -1,
            totalAmount: -1,
          },
        },
      ];

      const brandAggregationPipeline: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
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
          $group: {
            _id: '$brand._id',
            name: { $first: '$brand.name' },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
            totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
            totalInvoices: { $sum: 1 },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
            totalSaleTaxAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            name: 1,
            totalQty: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            totalInvoices: 1,
          },
        },
        {
          $sort: {
            totalQty: -1,
            totalAmount: -1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const brandgroup = await InvoiceDtlModel.aggregate(
        brandAggregationPipeline
      );

      const total_records = await InvoiceDtlModel.aggregate(
        brandAggregationPipelineRecord
      );

      const totalInvoicesSum = total_records.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const invoicetotalSaleTaxAmountSum = total_records.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const totalQtySum = total_records.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = total_records.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const result = {
        Group: brandgroup,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
        totalSaleTaxAmount: invoicetotalSaleTaxAmountSum,
      };
      return result;
    } else if (
      input.order_status !== '' &&
      input.royality_approval == '' &&
      input.customer_group == '' &&
      input.product_group == '' &&
      input.brand_group == '' &&
      input.salesContract_group == '' &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      console.log(' adm  order_status filter');

      const order_status = input.order_status;

      // const allrecordgroupby = await SalesContractDtlModel.aggregate([
      //   {
      //     $match: {
      //       contractDate: {
      //         $gte: new Date(input.fromDate),
      //         $lte: new Date(input.toDate),
      //       },
      //       isDeleted: false,
      //       InHouse: true,
      //       invoice: true,
      //       order_status: order_status,
      //     },
      //   },
      //   {
      //     $group: {
      //       _id: 'null',
      //       rate: {
      //         $sum: '$rate',
      //       },
      //       amount: {
      //         $sum: '$amount',
      //       },
      //       qty: {
      //         $sum: '$qty',
      //       },
      //     },
      //   },
      // ]);

      // const totalQty = allrecordgroupby.map((item: any) => item.qty);
      // const totalRate = allrecordgroupby.map((item: any) => item.rate);
      // const totalAmount = allrecordgroupby.map((item: any) => item.amount);
      // let where: any = {
      //   contractDate: {
      //     $gte: new Date(input.fromDate),
      //     $lte: new Date(input.toDate),
      //   },
      //   isDeleted: false,
      //   InHouse: true,
      //   invoice: true,
      //   order_status: order_status,
      // };
      // const salesContract = await SalesContractDtlModel.find(where);

      // const saleContractDetail = await SalesContractDtlModel.aggregate([
      //   {
      //     $match: where,
      //   },
      //   {
      //     $lookup: {
      //       from: 'salescontracts',
      //       localField: 'salesContract',
      //       foreignField: '_id',
      //       as: 'sale_dtl',
      //       pipeline: [
      //         {
      //           $lookup: {
      //             from: 'paymentterms',
      //             localField: 'paymentTerm',
      //             foreignField: '_id',
      //             as: 'payment_term',
      //           },
      //         },
      //       ],
      //     },
      //   },
      //   {
      //     $lookup: {
      //       from: 'brands',
      //       localField: 'brand',
      //       foreignField: '_id',
      //       as: 'branddtl',
      //     },
      //   },
      //   {
      //     $lookup: {
      //       from: 'invoicedtls',
      //       localField: 'salesContract',
      //       foreignField: 'salesContract',
      //       as: 'inv_dtl',
      //       pipeline: [
      //         {
      //           $lookup: {
      //             from: 'invoices',
      //             localField: 'invoice',
      //             foreignField: '_id',
      //             as: 'invoice',
      //           },
      //         },
      //       ],
      //     },
      //   },
      //   {
      //     $lookup: {
      //       from: 'customers',
      //       localField: 'customer',
      //       foreignField: '_id',
      //       as: 'customer_dtl',
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
      //       from: 'currencies',
      //       localField: 'currency',
      //       foreignField: '_id',
      //       as: 'currency_dtl',
      //     },
      //   },
      //   { $skip: skipCount },
      //   { $limit: limit },
      //   { $sort: { totalQty: -1, totalAmount: -1 } },
      // ]);

      const inv_dtl = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
          },
        },
        {
          $lookup: {
            from: 'salescontractdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'sale_dtl',
            pipeline: [
              {
                $match: {
                  order_status: order_status,
                  InHouse: true,
                },
              },
            ],
          },
        },
        {
          $match: {
            'sale_dtl.0': {
              $exists: true,
            },
          },
        },
        {
          $lookup: {
            from: 'invoices',
            localField: 'invoice',
            foreignField: '_id',
            as: 'invoice',
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salescontract',
            pipeline: [
              {
                $lookup: {
                  from: 'paymentterms',
                  localField: 'paymentTerm',
                  foreignField: '_id',
                  as: 'payment_term',
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
            as: 'customer_dtl',
          },
        },
        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'product_dtl',
          },
        },
        {
          $unwind: {
            path: '$salescontract',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: '$salescontract.payment_term',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: '$customer_dtl',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: '$product_dtl',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: '$invoice',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $sort: { date: -1 },
        },

        {
          $facet: {
            Summary: [
              {
                $match: {
                  date: {
                    $gte: new Date(input.fromDate),
                    $lte: new Date(input.toDate),
                  },
                  isDeleted: false,
                  adm_invoice: true,
                },
              },
              {
                $group: {
                  _id: null,
                  qty: { $sum: '$qty' },
                  rate: { $sum: '$rate' },
                  amount: { $sum: '$amount' },
                  salesTaxAmount: { $sum: '$salesTaxAmount' },
                },
              },
            ],
            AmountPkr: [
              {
                $match: {
                  date: {
                    $gte: new Date(input.fromDate),
                    $lte: new Date(input.toDate),
                  },
                  isDeleted: false,
                  adm_invoice: true,
                },
              },

              {
                $addFields: {
                  AmountInPkr: {
                    $multiply: ['$amount', '$rate'],
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  totalAmountInPkr: { $sum: '$AmountInPkr' },
                },
              },
            ],
            TotalValue: [
              {
                $match: {
                  date: {
                    $gte: new Date(input.fromDate),
                    $lte: new Date(input.toDate),
                  },
                  isDeleted: false,
                  adm_invoice: true,
                },
              },

              {
                $addFields: {
                  totalValue: {
                    $sum: {
                      $divide: [
                        {
                          $multiply: [
                            '$amount',
                            '$exchangeRate',
                            '$salesTaxRate',
                          ],
                        },
                        100,
                      ],
                    },
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  totalAmountInPkr: { $sum: '$totalValue' },
                },
              },
            ],
            ItemDetails: [
              {
                $project: {
                  qty: 1,
                  amount: 1,
                  uom: 1,
                  salesTaxAmount: 1,
                  rate: 1,
                  exchangeRate: 1,
                  salesTaxRate: 1,
                  contract: '$salescontract.contract',
                  saleTaxInvoiceNo: '$invoice.salesTaxInvoiceNo',
                  invoiceDate: '$invoice.date',
                  customerName: '$customer_dtl.name',
                  productName: '$product_dtl.name',
                },
              },
              {
                $skip: skipCount,
              },
              {
                $limit: limit,
              },
            ],
          },
        },
      ]);
      const total_records = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
          },
        },
        {
          $lookup: {
            from: 'salescontractdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'sale_dtl',
            pipeline: [
              {
                $match: {
                  order_status: order_status,
                  InHouse: true,
                },
              },
            ],
          },
        },
        {
          $match: {
            'sale_dtl.0': {
              $exists: true,
            },
          },
        },
      ]);

      let result = {
        inv_dtl: inv_dtl,
        total_records: total_records.length,
        paginated_record: inv_dtl.length,
        // totalQty: totalQty,
        // totalRate: totalRate,
        // totalAmount: totalAmount,
      };
      return result;
    } else if (
      input.royality_approval !== '' &&
      input.order_status == '' &&
      input.customer_group == '' &&
      input.salesContract_group == '' &&
      input.product_group == '' &&
      input.brand_group == '' &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('royality approval filter');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;

      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }

      const salegroupby = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
          },
        },
        {
          $lookup: {
            from: 'salescontractdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'sale_dtl',
            pipeline: [
              {
                $match: {
                  royality_approval: stringToBoolean(input.royality_approval),
                },
              },
            ],
          },
        },
        {
          $addFields: {
            sale_dtl: {
              $arrayElemAt: ['$sale_dtl', 0],
            },
          },
        },
        {
          $group: {
            _id: null,
            totalQty: {
              $sum: '$qty',
            },
            totalRate: {
              $sum: '$rate',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
            },
            data: {
              $push: '$$ROOT',
            },
          },
        },
        {
          $addFields: {
            totalValue: {
              $sum: {
                $map: {
                  input: '$data',
                  as: 'item',
                  in: {
                    $divide: [
                      {
                        $multiply: [
                          '$$item.amount',
                          '$$item.exchangeRate',
                          '$$item.salesTaxRate',
                        ],
                      },
                      100,
                    ],
                  },
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalQty: 1,
            totalRate: 1,
            totalValue: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            data: 1,
          },
        },
      ]);

      const inv_rate = salegroupby.flatMap(
        (item) => item.data.map((dataItem: any) => dataItem.rate || 0) // Default to 0 if rate is missing
      );
      const inv_amount = salegroupby.flatMap(
        (item) => item.data.map((dataItem: any) => dataItem.amount || 0) // Default to 0 if amount is missing
      );

      const qtypkr = inv_amount.map(
        (amount, index) => amount * inv_rate[index]
      );

      const AmountPKR = qtypkr.reduce((total, value) => total + value, 0);

      const invoice_dtl = await InvoiceDtlModel.aggregate([
        {
          $lookup: {
            from: 'salescontractdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'sale_dtl',
            pipeline: [
              {
                $match: {
                  InHouse: true,
                  royality_approval: stringToBoolean(input.royality_approval),
                },
              },
              {
                $lookup: {
                  from: 'salescontracts',
                  localField: 'salesContract',
                  foreignField: '_id',
                  as: 'salecontract',
                },
              },
            ],
          },
        },
        {
          $match: {
            'sale_dtl.0': {
              $exists: true,
            },
          },
        },
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
            from: 'invoices',
            localField: 'invoice',
            foreignField: '_id',
            as: 'invoice',
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
            as: 'customer_dtl',
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
          $sort: {
            date: -1,
          },
        },
        {
          $skip: skipCount,
        },
        {
          $limit: limit,
        },
      ]);

      const totalRecordCount = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false, // Filter out deleted records
          },
        },
        {
          $lookup: {
            from: 'salescontractdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'sale_dtl',
            pipeline: [
              {
                $match: {
                  InHouse: true,
                  royality_approval: stringToBoolean(input.royality_approval), // Apply royality_approval filter
                },
              },
            ],
          },
        },
        {
          $match: {
            'sale_dtl.0': { $exists: true }, // Ensure at least one `sale_dtl` exists after the lookup
          },
        },
      ]);
      const totalQty = salegroupby.map((item: any) => item.totalQty);
      const totalRate = salegroupby.map((item: any) => item.totalRate);
      const totalAmount = salegroupby.map((item: any) => item.totalAmount);
      const totalValue = salegroupby.map((item: any) => item.totalValue);
      const saleTaxAmount = salegroupby.map(
        (item: any) => item.totalSaleTaxAmount
      );

      let result = {
        shipmentdtl: invoice_dtl,
        paginated_record: invoice_dtl.length,
        total_records: totalRecordCount.length,
        totalQty: totalQty,
        totalRate: totalRate,
        totalAmount: totalAmount,
        saleTaxAmount: saleTaxAmount,
        AmountPKR: AmountPKR,
        totalValue: totalValue,
      };
      return result;
    } else if (
      input.customer_group == '' &&
      input.product_group == '' &&
      input.brand_group == '' &&
      (input.order_status !== '' ||
        input.royality_approval !== '' ||
        (Array.isArray(input.product) && input.product.length !== 0) ||
        (Array.isArray(input.customer) && input.customer.length !== 0) ||
        (Array.isArray(input.brand) && input.brand.length !== 0) ||
        (Array.isArray(input.salesContract) &&
          input.salesContract.length !== 0))
    ) {
      console.log('general condition');
      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;

      const salecontractArr = input.salesContract
        ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const productArr = input.product
        ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      let filter: any = {};
      let filter_records: any = {};
      let where: any = {};

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

      const invoiceamountpkr = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
          },
        },
        {
          $match: filter,
        },
      ]);

      let SaleTaxAmount;
      let AmountPKR;
      if (Array.isArray(invoiceamountpkr) && invoiceamountpkr.length == 0) {
        SaleTaxAmount = [];
        AmountPKR = [];
      } else {
        const qty = invoiceamountpkr.map((item) => (item.qty ? item.qty : []));
        const saletaxrate = invoiceamountpkr.map((item) => item.salesTaxRate);
        const rate = invoiceamountpkr.map((item) =>
          item.rate ? item.rate : []
        );

        const saletax = qty.map((amount, index) => amount * rate[index]);

        const saletaxamount = saletaxrate.map(
          (amount, index) => amount * saletax[index]
        );

        SaleTaxAmount = saletaxamount.reduce((total, value) => total + value);

        const Amount = invoiceamountpkr.map((item) =>
          item.amount ? item.amount : []
        );
        const Rate = invoiceamountpkr.map((item) =>
          item.rate ? item.exchangeRate : []
        );

        const qtypkr = Amount.map((amount, index) => amount * Rate[index]);

        AmountPKR = qtypkr.reduce((total, value) => total + value, 0);
      }

      const total_record = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
          },
        },
        {
          $match: filter_records,
        },
      ]);
      const invoicegroupby = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
          },
        },
        {
          $match: filter,
        },
        {
          $group: {
            _id: null,
            totalQty: {
              $sum: '$qty',
            },
            totalRate: {
              $sum: '$rate',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
            },
            data: {
              $push: '$$ROOT',
            },
          },
        },
        {
          $addFields: {
            totalValue: {
              $sum: {
                $map: {
                  input: '$data',
                  as: 'item',
                  in: {
                    $divide: [
                      {
                        $multiply: [
                          '$$item.amount',
                          '$$item.exchangeRate',
                          '$$item.salesTaxRate',
                        ],
                      },
                      100,
                    ],
                  },
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalQty: 1,
            totalRate: 1,
            totalValue: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            data: 1,
          },
        },
      ]);
      const totalQty = invoicegroupby.map((item) => item.totalQty);
      const totalAmount = invoicegroupby.map((item) => item.totalAmount);
      const totalRate = invoicegroupby.map((item) => item.totalRate);
      const totalValue = invoicegroupby.map((item) => item.totalValue);
      const invoice_detail = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
          },
        },
        {
          $match: where,
        },
        {
          $lookup: {
            from: 'invoices',
            localField: 'invoice',
            foreignField: '_id',
            as: 'inv_dtl',
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'sale_dtl',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer_dtl',
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
        { $sort: { date: -1 } },
      ]);
      if (Array.isArray(invoice_detail) && invoice_detail.length == 0) {
        const result = {
          invoice_dtl: [],
          total_record: [],
          paginated_record: [],
          totalAmount: [],
          totalQty: [],
          totalRate: [],
          totalAmountPKR: [],
          SaleTaxAmount: [],
        };
        return result;
      } else {
        const result = {
          invoice_detail: invoice_detail,
          total_records: total_record.length,
          paginated_record: invoice_detail.length,
          totalAmount: totalAmount,
          totalQty: totalQty,
          totalRate: totalRate,
          totalValue: totalValue,
          totalAmountPKR: AmountPKR,
          SaleTaxAmount: SaleTaxAmount,
        };
        return result;
      }
    } else if (
      input.customer_group !== '' &&
      input.royality_approval == '' &&
      input.order_status == '' &&
      Array.isArray(input.customer) &&
      input.customer.length !== 0 &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('customer group customer ');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const customer = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
          },
        },
        {
          $match: {
            isDeleted: false,
            customer: { $in: customerArr },
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer_details',
          },
        },
        {
          $addFields: {
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
            totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
            totalSaleTaxAmount: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: '$customer', // Group by customer ID
            customerName: { $first: '$customer_details.name' }, // Retrieve customer name
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
            totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
            totalInvoices: { $sum: 1 }, // Count the number of contracts for each customer
          },
        },
        {
          $project: {
            customerName: 1,
            totalQty: 1,
            totalAmount: 1,
            totalInvoices: 1,
            totalSaleTaxAmount: 1,
            _id: 0, // Exclude _id field
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
        { $skip: skipCount },
        { $limit: limit },
      ]);

      const totalInvoicesSum = customer.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );

      const totalQtySum = customer.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = customer.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalSaleTaxAmountSum = customer.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const result = {
        customer_groupby: customer,
        total_records: customer.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    } else if (
      input.product_group !== '' &&
      input.royality_approval == '' &&
      input.order_status == '' &&
      Array.isArray(input.product) &&
      input.product.length !== 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      console.log('product to product group');

      const productArr = input.product
        ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const product = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
          },
        },

        {
          $match: {
            isDeleted: false,
            product: { $in: productArr },
          },
        },

        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productInfo',
          },
        },
        {
          $group: {
            _id: '$product',
            productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
            totalSaleTaxAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            productName: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
        { $skip: skipCount },
        { $limit: limit },
      ]);

      const totalInvoices = product.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = product.reduce((sum, item) => sum + item.totalQty, 0);
      const totalAmountSum = product.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalSaleTaxAmountSum = product.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const result = {
        product_groupby: product,
        total_records: product.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoices,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
      };
      return result;
    } else if (
      input.customer_group !== '' &&
      input.royality_approval == '' &&
      input.order_status == '' &&
      Array.isArray(input.brand) &&
      input.brand.length !== 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('customer group brand');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      const brandArr = input.brand
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const customer = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
          },
        },
        {
          $match: {
            isDeleted: false,
            brand: { $in: brandArr },
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer_details',
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand_details',
          },
        },
        {
          $addFields: {
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
            totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
            totalSaleTaxAmount: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: '$customer', // Group by customer ID
            customerName: { $first: '$customer_details.name' },
            brandName: { $first: '$brand_details.name' }, // Retrieve customer name
            totalQty: { $sum: '$qty' },
            totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
            totalAmount: { $sum: '$amount' },
            totalInvoices: { $sum: 1 }, // Count the number of contracts for each customer
          },
        },
        {
          $project: {
            customerName: 1,
            brandName: 1,
            totalQty: 1,
            c: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            totalInvoices: 1,
            _id: 0, // Exclude _id field
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
        { $skip: skipCount },
        { $limit: limit },
      ]);

      const totalInvoicesSum = customer.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = customer.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = customer.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalSaleTaxAmount = customer.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );

      const result = {
        customer_groupby: customer,
        total_records: customer.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
        totalSaleTaxAmount: totalSaleTaxAmount,
      };
      return result;
    } else if (
      input.product_group !== '' &&
      input.royality_approval == '' &&
      input.order_status == '' &&
      Array.isArray(input.brand) &&
      input.brand.length !== 0 &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      console.log('product to brand');

      const total_records = await BrandModel.countDocuments();
      const brandArr = input.brand
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const product = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
          },
        },

        {
          $match: {
            // isDeleted: false,
            brand: { $in: brandArr },
          },
        },

        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productInfo',
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brandInfo',
          },
        },
        {
          $group: {
            _id: '$product',
            productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
            brandName: { $first: { $arrayElemAt: ['$brandInfo.name', 0] } },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
            totalSaleTaxAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            productName: 1,
            brandName: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalSaleTaxAmount: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
        { $skip: skipCount },
        { $limit: limit },
      ]);

      const totalInvoices = product.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = product.reduce((sum, item) => sum + item.totalQty, 0);
      const totalAmountSum = product.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalSaleTaxAmountSum = product.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const result = {
        product_groupby: product,
        total_records: total_records,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoices,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
      };
      return result;
    } else if (
      input.brand_group !== '' &&
      input.royality_approval == '' &&
      input.order_status == '' &&
      Array.isArray(input.brand) &&
      input.brand.length !== 0 &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length !== 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length !== 0
    ) {
      console.log('brandgroup brand');
      const brandArr = input.brand
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      const total_records = await BrandModel.countDocuments();

      const brandgroup = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },

            isDeleted: false,
            adm_invoice: true,
            brand: { $in: brandArr },
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
          $unwind: '$brand',
        },
        {
          $group: {
            _id: '$brand._id', // Group by brand's _id
            name: { $first: '$brand.name' },
            totalInvoices: { $sum: 1 }, // Calculate the total number of contracts
            totalQty: { $sum: '$qty' }, // Calculate the total quantity
            totalAmount: { $sum: '$amount' },
            totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
            totalSaleTaxAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            _id: 0, // Exclude _id field
            name: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
        { $skip: skipCount },
        { $limit: limit },
      ]);

      const totalInvoiceSum = brandgroup.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = brandgroup.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = brandgroup.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalSaleTaxAmountSum = brandgroup.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const result = {
        brand_groupby: brandgroup,
        total_records: brandgroup.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoiceSum: totalInvoiceSum,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
      };
      return result;
    } else if (
      input.brand_group !== '' &&
      input.royality_approval == '' &&
      input.order_status == '' &&
      Array.isArray(input.customer) &&
      input.customer.length !== 0 &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('brand to customer');
      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const brandgroup = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
            customer: { $in: customerArr },
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
            _id: '$brand._id',
            brandName: {
              $first: '$brand.name',
            },
            customerName: { $first: '$customer.name' },
            totalInvoices: {
              $sum: 1,
            },
            totalQty: {
              $sum: '$qty',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
            },
            totalAmount: {
              $sum: '$amount',
            },
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ]);

      const totalInvoicesSum = brandgroup.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = brandgroup.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = brandgroup.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalSaleTaxAmountSum = brandgroup.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const result = {
        brand_groupby: brandgroup,
        total_records: brandgroup.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    } else if (
      input.product_group !== '' &&
      input.royality_approval == '' &&
      input.order_status == '' &&
      Array.isArray(input.customer) &&
      input.customer.length !== 0 &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('product group customer');
      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const productdtl = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
            customer: { $in: customerArr },
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
            as: 'products',
          },
        },

        {
          $group: {
            _id: '$products._id',
            productName: {
              $first: '$products.name',
            },
            customerName: {
              $first: '$customer.name',
            },
            totalInvoices: {
              $sum: 1,
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ]);

      const totalInvoiceSum = productdtl.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = productdtl.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = productdtl.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalSaleTaxAmountSum = productdtl.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const result = {
        product_groupby: productdtl,
        total_records: productdtl.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoiceSum: totalInvoiceSum,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
      };
      return result;
    } else if (
      input.customer_group !== '' &&
      input.royality_approval == '' &&
      input.order_status == '' &&
      Array.isArray(input.product) &&
      input.product.length !== 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('product to customer');
      const productArr = input.product
        ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const customerdtl = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
            product: { $in: productArr },
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
            _id: '$customer._id',
            CustomerName: {
              $first: '$customer.name',
            },
            productName: {
              $first: '$product.name',
            },
            totalInvoices: {
              $sum: 1,
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
            },
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ]);
      const totalInvoicesSum = customerdtl.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = customerdtl.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = customerdtl.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalSaleTaxAmountSum = customerdtl.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const result = {
        customer_groupby: customerdtl,
        total_records: customerdtl.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
      };
      return result;
    } else if (
      input.brand_group !== '' &&
      input.royality_approval == '' &&
      input.order_status == '' &&
      Array.isArray(input.product) &&
      input.product.length !== 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('product to brand');

      const productArr = input.product
        ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const branddtl = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
            product: { $in: productArr },
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
            productname: {
              $first: '$products.name',
            },
            brandname: {
              $first: '$brand.name',
            },
            totalInvoices: {
              $sum: 1,
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
            },
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ]);
      const totalInvoicesSum = branddtl.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = branddtl.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = branddtl.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalSaleTaxAmountSum = branddtl.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const result = {
        brand_groupby: branddtl,
        total_records: branddtl.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
      };
      return result;
    } else if (
      input.customer_group !== '' &&
      ((Array.isArray(input.product) && input.product.length !== 0) ||
        (Array.isArray(input.customer) && input.customer.length !== 0) ||
        (Array.isArray(input.brand) && input.brand.length !== 0) ||
        (Array.isArray(input.salesContract) &&
          input.salesContract.length !== 0))
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
      const productArr = input.product
        ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
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

      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }
      if (input.royality_approval) {
        extrafilter.royality_approval = stringToBoolean(
          input.royality_approval
        );
      }
      if (input.order_status !== '') {
        const order_status = input.order_status;

        where.order_status = order_status;
        (filter_records.order_status = order_status),
          (filter.order_status = order_status);
      }

      const customerAggregationPipelineRecords: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
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
            totalInvoices: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            salesTaxAmount: {
              $sum: '$salesTaxAmount',
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
            salesTaxAmount: 1,
            totalInvoices: 1,
          },
        },
      ];

      const customerAggregationPipeline: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
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
            totalInvoices: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            salesTaxAmount: {
              $sum: '$salesTaxAmount',
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
            salesTaxAmount: 1,
            totalInvoices: 1,
          },
        },
        { $sort: { qty: -1, amount: -1 } },
        { $skip: skipCount },
        { $limit: limit },
      ];

      const customergroup = await InvoiceDtlModel.aggregate(
        customerAggregationPipeline
      );

      const total_records = await InvoiceDtlModel.aggregate(
        customerAggregationPipelineRecords
      );

      const totalInvoicesSum = total_records.reduce(
        (sum, item) => sum + item.totalInvoices,
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
      const totalSaleTaxAmountSum = total_records.reduce(
        (sum, item) => sum + item.salesTaxAmount,
        0
      );
      const result = {
        Group: customergroup,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    } else if (
      input.product_group !== '' &&
      ((Array.isArray(input.product) && input.product.length !== 0) ||
        (Array.isArray(input.customer) && input.customer.length !== 0) ||
        (Array.isArray(input.brand) && input.brand.length !== 0) ||
        (Array.isArray(input.salesContract) &&
          input.salesContract.length !== 0))
    ) {
      console.log(
        '  product group with general filters brand customer product salescontract work'
      );

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;

      const salesContractArr = input.salesContract
        ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const productArr = input.product
        ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
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

      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }
      if (input.royality_approval) {
        extrafilter.royality_approval = stringToBoolean(
          input.royality_approval
        );
      }
      if (input.order_status !== '') {
        const order_status = input.order_status;

        where.order_status = order_status;
        (filter_records.order_status = order_status),
          (filter.order_status = order_status);
      }
      const productAggregationPipelineRecords: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
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
            totalInvoices: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            salesTaxAmount: {
              $sum: '$salesTaxAmount',
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
            totalInvoices: 1,
            salesTaxAmount: 1,
          },
        },
      ];
      const productAggregationPipeline: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
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
            totalInvoices: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            salesTaxAmount: {
              $sum: '$salesTaxAmount',
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
            salesTaxAmount: 1,
            totalInvoices: 1,
          },
        },
        { $sort: { qty: -1, amount: -1 } },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const productgroup = await InvoiceDtlModel.aggregate(
        productAggregationPipeline
      );
      const total_records = await InvoiceDtlModel.aggregate(
        productAggregationPipelineRecords
      );
      const totalInvoicesSum = total_records.reduce(
        (sum, item) => sum + item.totalInvoices,
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
      const saleTaxAmountSum = total_records.reduce(
        (sum, item) => sum + item.salesTaxAmount,
        0
      );
      const result = {
        Group: productgroup,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
        saleTaxAmountSum: saleTaxAmountSum,
      };
      return result;
    } else if (
      input.brand_group !== '' &&
      ((Array.isArray(input.product) && input.product.length !== 0) ||
        (Array.isArray(input.customer) && input.customer.length !== 0) ||
        (Array.isArray(input.brand) && input.brand.length !== 0) ||
        (Array.isArray(input.salesContract) &&
          input.salesContract.length !== 0))
    ) {
      console.log(
        '  brand group with general filters brand customer product salescontract work'
      );

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;

      const salesContractArr = input.salesContract
        ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const productArr = input.product
        ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
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
      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }
      if (input.royality_approval) {
        extrafilter.royality_approval = stringToBoolean(
          input.royality_approval
        );
      }
      if (input.order_status !== '') {
        const order_status = input.order_status;

        where.order_status = order_status;
        (filter_records.order_status = order_status),
          (filter.order_status = order_status);
      }
      const brandAggregationPipelineRecords: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
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
            totalInvoices: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            salesTaxAmount: {
              $sum: '$salesTaxAmount',
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
            salesTaxAmount: 1,
            totalInvoices: 1,
          },
        },
      ];
      const brandAggregationPipeline: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
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

            totalInvoices: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            salesTaxAmount: {
              $sum: '$salesTaxAmount',
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
            salesTaxAmount: 1,
            totalInvoices: 1,
          },
        },
        { $sort: { qty: -1, amount: -1 } },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const brandgroup = await InvoiceDtlModel.aggregate(
        brandAggregationPipeline
      );
      const total_records = await InvoiceDtlModel.aggregate(
        brandAggregationPipelineRecords
      );

      const totalInvoicesSum = total_records.reduce(
        (sum, item) => sum + item.totalInvoices,
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
      const totalSaleTaxAmountSum = total_records.reduce(
        (sum, item) => sum + item.salesTaxAmount,
        0
      );
      const result = {
        Group: brandgroup,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    } else if (
      input.product_group !== '' &&
      input.order_status !== '' &&
      input.royality_approval !== ''
    ) {
      console.log('product group  royality_approval and orderstatus');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }

      const royality_approval = stringToBoolean(input.royality_approval);
      const order_status = input.order_status;

      const productAggregationPipelineRecord: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: true,
            order_status: order_status,
            royality_approval: royality_approval,
          },
        },

        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productInfo',
          },
        },
        {
          $group: {
            _id: '$product',
            productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            productName: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];

      const productAggregationPipeline: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: true,
            order_status: order_status,
            royality_approval: royality_approval,
          },
        },

        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productInfo',
          },
        },
        {
          $group: {
            _id: '$product',
            productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            productName: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
        { $skip: skipCount },
        { $limit: limit },
      ];

      const product = await SalesContractDtlModel.aggregate(
        productAggregationPipeline
      );
      const total_records = await SalesContractDtlModel.aggregate(
        productAggregationPipelineRecord
      );
      const totalInvoicesSum = product.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = product.reduce((sum, item) => sum + item.totalQty, 0);
      const totalAmountSum = product.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const result = {
        product_groupby: product,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    } else if (
      input.brand_group !== '' &&
      input.order_status !== '' &&
      input.royality_approval !== ''
    ) {
      console.log('brand group royality_approval and order_status');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }

      const royality_approval = stringToBoolean(input.royality_approval);
      const order_status = input.order_status;
      const brandAggregationPipelineRecord: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: true,
            order_status: order_status,
            royality_approval: royality_approval,
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
          $unwind: '$brand',
        },
        {
          $group: {
            _id: '$brand._id',
            name: { $first: '$brand.name' },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            _id: 0,
            name: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];
      const brandAggregationPipeline: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: true,
            order_status: order_status,
            royality_approval: royality_approval,
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
          $unwind: '$brand',
        },
        {
          $group: {
            _id: '$brand._id',
            name: { $first: '$brand.name' },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            _id: 0,
            name: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const brandgroup = await SalesContractDtlModel.aggregate(
        brandAggregationPipeline
      );
      const total_records = await SalesContractDtlModel.aggregate(
        brandAggregationPipelineRecord
      );

      const totalInvoicesSum = brandgroup.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = brandgroup.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = brandgroup.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const result = {
        brand_groupby: brandgroup,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    } else if (
      input.customer_group !== '' &&
      input.order_status !== '' &&
      input.royality_approval !== ''
    ) {
      console.log('customer group royality_approval and orderstatus');
      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }

      const royality_approval = stringToBoolean(input.royality_approval);
      const order_status = input.order_status;
      const customerAggregationPipelineRecords: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: true,
            order_status: order_status,
            royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer_details',
          },
        },
        {
          $addFields: {
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: '$customer', // Group by customer ID
            customerName: { $first: '$customer_details.name' },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
            totalInvoices: { $sum: 1 },
          },
        },
        {
          $project: {
            customerName: 1,
            totalQty: 1,
            totalAmount: 1,
            totalInvoices: 1,
            _id: 0, // Exclude _id field
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];

      const customerAggregationPipeline: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            order_status: order_status,
            InHouse: true,
            royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer_details',
          },
        },
        {
          $addFields: {
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: '$customer', // Group by customer ID
            customerName: { $first: '$customer_details.name' },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
            totalInvoices: { $sum: 1 },
          },
        },
        {
          $project: {
            customerName: 1,
            totalQty: 1,
            totalAmount: 1,
            totalInvoices: 1,
            _id: 0,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const customer = await SalesContractDtlModel.aggregate(
        customerAggregationPipeline
      );
      const total_records = await SalesContractDtlModel.aggregate(
        customerAggregationPipelineRecords
      );
      const totalInvoicesSum = customer.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
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
        customer_groupby: customer,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    } else if (input.product_group !== '' && input.order_status !== '') {
      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      console.log('order_status product group');
      const order_status = input.order_status;
      const productAggregationPipelineRecord: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: true,
            order_status: order_status,
          },
        },

        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productInfo',
          },
        },
        {
          $group: {
            _id: '$product',
            productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            productName: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];

      const productAggregationPipeline: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: true,
            order_status: order_status,
          },
        },

        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productInfo',
          },
        },
        {
          $group: {
            _id: '$product',
            productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            productName: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
        { $skip: skipCount },
        { $limit: limit },
      ];

      const product = await SalesContractDtlModel.aggregate(
        productAggregationPipeline
      );
      const total_records = await SalesContractDtlModel.aggregate(
        productAggregationPipelineRecord
      );
      const totalInvoicesSum = product.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = product.reduce((sum, item) => sum + item.totalQty, 0);
      const totalAmountSum = product.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const result = {
        product_groupby: product,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    } else if (input.customer_group !== '' && input.order_status !== '') {
      console.log('customer group order_status');
      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      const order_status = input.order_status;
      const customerAggregationPipelineRecords: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: true,
            order_status: order_status,
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer_details',
          },
        },
        {
          $addFields: {
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: '$customer', // Group by customer ID
            customerName: { $first: '$customer_details.name' },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
            totalInvoices: { $sum: 1 },
          },
        },
        {
          $project: {
            customerName: 1,
            totalQty: 1,
            totalAmount: 1,
            totalInvoices: 1,
            _id: 0, // Exclude _id field
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];

      const customerAggregationPipeline: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: true,
            order_status: order_status,
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer_details',
          },
        },
        {
          $addFields: {
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: '$customer', // Group by customer ID
            customerName: { $first: '$customer_details.name' },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
            totalInvoices: { $sum: 1 },
          },
        },
        {
          $project: {
            customerName: 1,
            totalQty: 1,
            totalAmount: 1,
            totalInvoices: 1,
            _id: 0,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const customer = await SalesContractDtlModel.aggregate(
        customerAggregationPipeline
      );
      const total_records = await SalesContractDtlModel.aggregate(
        customerAggregationPipelineRecords
      );
      const totalInvoicesSum = customer.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
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
        customer_groupby: customer,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    } else if (input.brand_group !== '' && input.order_status !== '') {
      console.log('brand group order_status');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      const order_status = input.order_status;
      const brandAggregationPipelineRecord: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: true,
            order_status: order_status,
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
          $unwind: '$brand',
        },
        {
          $group: {
            _id: '$brand._id',
            name: { $first: '$brand.name' },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            _id: 0,
            name: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];
      const brandAggregationPipeline: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: true,
            order_status: order_status,
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
          $unwind: '$brand',
        },
        {
          $group: {
            _id: '$brand._id',
            name: { $first: '$brand.name' },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            _id: 0,
            name: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const brandgroup = await SalesContractDtlModel.aggregate(
        brandAggregationPipeline
      );
      const total_records = await SalesContractDtlModel.aggregate(
        brandAggregationPipelineRecord
      );

      const totalInvoicesSum = brandgroup.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = brandgroup.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = brandgroup.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const result = {
        brand_groupby: brandgroup,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    } else if (input.product_group !== '' && input.royality_approval !== '') {
      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      console.log('product group  royality_approval');
      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }

      const royality_approval = stringToBoolean(input.royality_approval);

      const productAggregationPipelineRecord: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: true,
            royality_approval: royality_approval,
          },
        },

        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productInfo',
          },
        },
        {
          $group: {
            _id: '$product',
            productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            productName: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];

      const productAggregationPipeline: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: true,
            royality_approval: royality_approval,
          },
        },

        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productInfo',
          },
        },
        {
          $group: {
            _id: '$product',
            productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            productName: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
        { $skip: skipCount },
        { $limit: limit },
      ];

      const product = await SalesContractDtlModel.aggregate(
        productAggregationPipeline
      );
      const total_records = await SalesContractDtlModel.aggregate(
        productAggregationPipelineRecord
      );
      const totalInvoices = product.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = product.reduce((sum, item) => sum + item.totalQty, 0);
      const totalAmountSum = product.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const result = {
        product_groupby: product,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalSaleContractsSum: totalInvoices,
      };
      return result;
    } else if (input.customer_group !== '' && input.royality_approval !== '') {
      console.log('customer group royality_approval');
      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }

      const royality_approval = stringToBoolean(input.royality_approval);
      const customerAggregationPipelineRecords: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: true,
            royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer_details',
          },
        },
        {
          $addFields: {
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: '$customer', // Group by customer ID
            customerName: { $first: '$customer_details.name' },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
            totalInvoices: { $sum: 1 },
          },
        },
        {
          $project: {
            customerName: 1,
            totalQty: 1,
            totalAmount: 1,
            totalInvoices: 1,
            _id: 0, // Exclude _id field
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];

      const customerAggregationPipeline: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: true,
            royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer_details',
          },
        },
        {
          $addFields: {
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: '$customer', // Group by customer ID
            customerName: { $first: '$customer_details.name' },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
            totalInvoices: { $sum: 1 },
          },
        },
        {
          $project: {
            customerName: 1,
            totalQty: 1,
            totalAmount: 1,
            totalInvoices: 1,
            _id: 0,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const customer = await SalesContractDtlModel.aggregate(
        customerAggregationPipeline
      );
      const total_records = await SalesContractDtlModel.aggregate(
        customerAggregationPipelineRecords
      );
      const totalInvoicesSum = customer.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
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
        customer_groupby: customer,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    } else if (input.brand_group !== '' && input.royality_approval !== '') {
      console.log('brand group royality_approval');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
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
            invoice: true,
            InHouse: true,
            royality_approval: royality_approval,
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
          $unwind: '$brand',
        },
        {
          $group: {
            _id: '$brand._id',
            name: { $first: '$brand.name' },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            _id: 0,
            name: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];
      const brandAggregationPipeline: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            InHouse: true,
            invoice: true,
            royality_approval: royality_approval,
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
          $unwind: '$brand',
        },
        {
          $group: {
            _id: '$brand._id',
            name: { $first: '$brand.name' },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            _id: 0,
            name: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const brandgroup = await SalesContractDtlModel.aggregate(
        brandAggregationPipeline
      );
      const total_records = await SalesContractDtlModel.aggregate(
        brandAggregationPipelineRecord
      );

      const totalInvoicesSum = brandgroup.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = brandgroup.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = brandgroup.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const result = {
        brand_groupby: brandgroup,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    }
  }
  if (input.nonAdm !== '') {
    console.log('nonAdm');
    if (
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0 &&
      input.customer_group == '' &&
      input.product_group == '' &&
      input.brand_group == '' &&
      input.salesContract_group == '' &&
      input.order_status == '' &&
      input.royality_approval == ''
    ) {
      console.log('no filter condition execute!');
      try {
        const limit = input.perPage;
        const skipCount = (input.pageno - 1) * limit;
        const invoice_groupby = await InvoiceDtlModel.aggregate([
          {
            $match: {
              date: {
                $gte: new Date(input.fromDate),
                $lte: new Date(input.toDate),
              },
              isDeleted: false,
              adm_invoice: false,
            },
          },

          {
            $group: {
              _id: null,
              totalQty: {
                $sum: '$qty',
              },
              totalRate: {
                $sum: '$rate',
              },
              totalAmount: {
                $sum: '$amount',
              },
              totalSaleTaxAmount: {
                $sum: '$salesTaxAmount',
              },
              data: {
                $push: '$$ROOT',
              },
            },
          },
          {
            $addFields: {
              totalValue: {
                $sum: {
                  $map: {
                    input: '$data',
                    as: 'item',
                    in: {
                      $divide: [
                        {
                          $multiply: [
                            '$$item.amount',
                            '$$item.exchangeRate',
                            '$$item.salesTaxRate',
                          ],
                        },
                        100,
                      ],
                    },
                  },
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              totalQty: 1,
              totalRate: 1,
              totalValue: 1,
              totalAmount: 1,
              totalSaleTaxAmount: 1,
              data: 1,
            },
          },
        ]);
        const total_qty = invoice_groupby.map((item) => item.totalQty);
        const total_amount = invoice_groupby.map((item) => item.totalAmount);
        const total_rate = invoice_groupby.map((item) => item.totalRate);
        const totalValue = invoice_groupby.map((item) => item.totalValue);
        const total_records = await InvoiceModel.aggregate([
          {
            $match: {
              date: {
                $gte: new Date(input.fromDate),
                $lte: new Date(input.toDate),
              },
              isDeleted: false,
              adm_invoice: false,
            },
          },
        ]);

        const invoiceamountpkr = await InvoiceDtlModel.aggregate([
          {
            $match: {
              date: {
                $gte: new Date(input.fromDate),
                $lte: new Date(input.toDate),
              },
              isDeleted: false,
              adm_invoice: false,
            },
          },
        ]);

        const qty = invoiceamountpkr.map((item) => item.qty);
        const saletaxrate = invoiceamountpkr.map((item) => item.salesTaxRate);
        const rate = invoiceamountpkr.map((item) => item.rate);

        const saletax = qty.map((amount, index) => amount * rate[index]);
        const saletaxamount = saletaxrate.map(
          (amount, index) => amount * saletax[index]
        );
        const SaleTaxAmount = saletaxamount.reduce(
          (total, value) => total + value
        );

        const Amount = invoiceamountpkr.map((item) => item.amount);
        const Rate = invoiceamountpkr.map((item) => item.rate);
        const qtypkr = Amount.map((amount, index) => amount * Rate[index]);

        const AmountPKR = qtypkr.reduce((total, value) => total + value, 0);

        const invoice_detail = await InvoiceDtlModel.aggregate([
          {
            $match: {
              date: {
                $gte: new Date(input.fromDate),
                $lte: new Date(input.toDate),
              },
              isDeleted: false,
              adm_invoice: false,
            },
          },
          {
            $lookup: {
              from: 'invoices',
              localField: 'invoice',
              foreignField: '_id',
              as: 'inv_dtl',
            },
          },
          {
            $lookup: {
              from: 'salescontracts',
              localField: 'salesContract',
              foreignField: '_id',
              as: 'sale_dtl',
            },
          },
          {
            $lookup: {
              from: 'customers',
              localField: 'customer',
              foreignField: '_id',
              as: 'customer_dtl',
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
          { $sort: { date: -1 } },
        ]);
        const result = {
          invoice_detail: invoice_detail,
          paginated_record: invoice_detail.length,
          totalQty: total_qty,
          totalAmount: total_amount,
          totalRate: total_rate,
          total_records: total_records.length,
          totalAmountPKR: AmountPKR,
          totalValue: totalValue,
          SaleTaxAmount: SaleTaxAmount,
        };
        return result;
      } catch (error) {
        console.log(error);
      }
    } else if (
      input.product_group !== '' &&
      input.order_status == '' &&
      input.royality_approval == '' &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('product group');
      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      // const total_records = await ProductModel.countDocuments();
      // const product_group = await ProductModel.aggregate([
      //   {
      //     $match: {
      //       isDeleted: false,
      //     },
      //   },
      //   {
      //     $lookup: {
      //       from: 'invoicedtls',
      //       localField: '_id',
      //       foreignField: 'product',
      //       as: 'invoice_record',
      //       pipeline: [
      //         {
      //           $match: {
      //             isDeleted: false,
      //           },
      //         },
      //         {
      //           $project: {
      //             qty: 1,
      //             amount: 1,
      //             salesTaxAmount: 1,
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
      //             input: '$invoice_record',
      //             as: 'item',
      //             in: '$$item.qty',
      //           },
      //         },
      //       },
      //     },
      //   },
      //   {
      //     $addFields: {
      //       totalAmount: {
      //         $sum: {
      //           $map: {
      //             input: '$invoice_record',
      //             as: 'item',
      //             in: '$$item.amount',
      //           },
      //         },
      //       },
      //     },
      //   },
      //   {
      //     $addFields: {
      //       totalSaleTaxAmount: {
      //         $sum: {
      //           $map: {
      //             input: '$invoice_record',
      //             as: 'item',
      //             in: '$$item.salesTaxAmount',
      //           },
      //         },
      //       },
      //     },
      //   },
      //   {
      //     $project: {
      //       name: 1,
      //       invoice_record: {
      //         $size: '$invoice_record',
      //       },
      //       totalQty: 1,
      //       totalAmount: 1,
      //       totalSaleTaxAmount: 1,
      //     },
      //   },
      //   // Move the $match to this point after the totalQty is computed
      //   {
      //     $match: {
      //       totalQty: { $gt: 0 },  // Ensure you're filtering by totalQty > 0
      //     },
      //   },
      //   { $limit: limit },
      //   { $skip: skipCount },
      // ]);

      const productAggregationPipelineRecord: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
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
          $addFields: {
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
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
            totalSaleTaxAmount: {
              $gt: 0,
            },
          },
        },
        {
          $group: {
            _id: '$product',
            name: {
              $first: '$product.name', // Retrieve product name
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$totalSaleTaxAmount',
            },
            totalInvoices: {
              $sum: 1,
            },
          },
        },
        {
          $project: {
            name: 1,
            totalQty: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            totalInvoices: 1,
            _id: 0,
          },
        },
        {
          $sort: {
            totalQty: -1,
            totalAmount: -1,
          },
        },
      ];

      const productAggregationPipeline: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
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
          $addFields: {
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
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
            totalSaleTaxAmount: {
              $gt: 0,
            },
          },
        },
        {
          $group: {
            _id: '$product',
            name: {
              $first: '$product.name', // Retrieve product name
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$totalSaleTaxAmount',
            },
            totalInvoices: {
              $sum: 1,
            },
          },
        },
        {
          $project: {
            name: 1,
            totalQty: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            totalInvoices: 1,
            _id: 0,
          },
        },
        {
          $sort: {
            totalQty: -1,
            totalAmount: -1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ];

      const product_group = await InvoiceDtlModel.aggregate(
        productAggregationPipeline
      );
      const total_records = await InvoiceDtlModel.aggregate(
        productAggregationPipelineRecord
      );
      const invoiceRecordSum = total_records.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = total_records.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = total_records.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalSaleTaxAmountSum = total_records.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );

      const result = {
        Group: product_group,
        paginated_record: product_group.length,
        total_records: total_records.length,
        invoiceTotalRecordSum: invoiceRecordSum,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
      };
      return result;
    } else if (
      input.customer_group !== '' &&
      input.order_status == '' &&
      input.royality_approval == '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      console.log('customer general ');
      const customerAggregationPipelineRecord: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
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
          $addFields: {
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
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
            totalSaleTaxAmount: {
              $gt: 0,
            },
          },
        },
        {
          $group: {
            _id: '$customer',
            name: {
              $first: '$customer.name',
            },
            // Retrieve customer name
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$totalSaleTaxAmount',
            },
            totalInvoices: {
              $sum: 1,
            }, //
          },
        },
        {
          $project: {
            name: 1,
            totalQty: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            totalInvoices: 1,
            _id: 0,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];
      const customerAggregationPipeline: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
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
          $addFields: {
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
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
            totalSaleTaxAmount: {
              $gt: 0,
            },
          },
        },
        {
          $group: {
            _id: '$customer',
            name: {
              $first: '$customer.name',
            },
            // Retrieve customer name
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$totalSaleTaxAmount',
            },
            totalInvoices: {
              $sum: 1,
            }, //
          },
        },
        {
          $project: {
            name: 1,
            totalQty: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            totalInvoices: 1,
            _id: 0,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const customer_group = await InvoiceDtlModel.aggregate(
        customerAggregationPipeline
      );
      const total_records = await InvoiceDtlModel.aggregate(
        customerAggregationPipelineRecord
      );

      const customerQtySum = total_records.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const customerinvoiceRecordSum = total_records.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const customertotalSaleTaxAmountSum = total_records.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const customertotalAmountSum = total_records.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const result = {
        Group: customer_group,
        paginated_records: customer_group.length,
        total_records: total_records.length,
        customerTotalQtySum: customerQtySum,
        customerTotalInvoiceRecordSum: customerinvoiceRecordSum,
        totalSaleTaxAmountSum: customertotalSaleTaxAmountSum,
        customertotalAmountSum: customertotalAmountSum,
      };
      return result;
    } else if (
      input.salesContract_group !== '' &&
      input.order_status == '' &&
      input.royality_approval == '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;

      const salesContractAggregationPipelineRecord: any = [
        {
          $match: {
            isDeleted: false,
            adm_invoice: false,
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContract',
          },
        },
        {
          $addFields: {
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
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
            totalSaleTaxAmount: {
              $gt: 0,
            },
          },
        },
        {
          $group: {
            _id: '$salesContract',
            salesContractNumber: {
              $first: '$salesContract.contract', // Retrieve sales contract number or identifier
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$totalSaleTaxAmount',
            },
            totalInvoices: {
              $sum: 1,
            },
          },
        },
        {
          $project: {
            salesContractNumber: 1,
            totalQty: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            totalInvoices: 1,
            _id: 0,
          },
        },
        {
          $sort: {
            totalQty: -1,
            totalAmount: -1,
          },
        },
      ];
      const salesContractAggregationPipeline: any = [
        {
          $match: {
            isDeleted: false,
            adm_invoice: false,
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContract',
          },
        },
        {
          $addFields: {
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
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
            totalSaleTaxAmount: {
              $gt: 0,
            },
          },
        },
        {
          $group: {
            _id: '$salesContract',
            salesContractNumber: {
              $first: '$salesContract.contractNumber', // Retrieve sales contract number or identifier
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$totalSaleTaxAmount',
            },
            totalInvoices: {
              $sum: 1,
            },
          },
        },
        {
          $project: {
            salesContractNumber: 1,
            totalQty: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            totalInvoices: 1,
            _id: 0,
          },
        },
        {
          $sort: {
            totalQty: -1,
            totalAmount: -1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const salecontract_group = await InvoiceDtlModel.aggregate(
        salesContractAggregationPipeline
      );
      const total_record = await InvoiceDtlModel.aggregate(
        salesContractAggregationPipelineRecord
      );

      const totalInvoiceSum = total_record.reduce(
        (sum, item) => sum + item.totalInvoices,
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
      const totalSaleTaxAmountSum = total_record.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const salesContractNumberSum = total_record.reduce(
        (sum, item) => sum + item.salesContractNumber,
        0
      );
      const result = {
        Group: salecontract_group,
        total_records: salecontract_group.length,
        paginated_record: total_record.length,
        totalInvoiceSum: totalInvoiceSum,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        salesContractNumberSum: salesContractNumberSum,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
      };
      return result;
    } else if (
      input.brand_group !== '' &&
      input.order_status == '' &&
      input.royality_approval == '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('brand group general');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;

      const brandAggregationPipelineRecord: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
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
          $addFields: {
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
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
            totalSaleTaxAmount: {
              $gt: 0,
            },
          },
        },
        {
          $group: {
            _id: '$brand',
            name: {
              $first: '$brand.name',
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$totalSaleTaxAmount',
            },
            totalInvoices: {
              $sum: 1,
            },
          },
        },
        {
          $project: {
            name: 1,
            totalQty: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            totalInvoices: 1,
            _id: 0,
          },
        },
        {
          $sort: {
            totalQty: -1,
            totalAmount: -1,
          },
        },
      ];

      const brandAggregationPipeline: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
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
          $group: {
            _id: '$brand._id',
            name: { $first: '$brand.name' },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
            totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
            totalInvoices: { $sum: 1 },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
            totalSaleTaxAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            name: 1,
            totalQty: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            totalInvoices: 1,
          },
        },
        {
          $sort: {
            totalQty: -1,
            totalAmount: -1,
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const brandgroup = await InvoiceDtlModel.aggregate(
        brandAggregationPipeline
      );

      const total_records = await InvoiceDtlModel.aggregate(
        brandAggregationPipelineRecord
      );

      const totalInvoicesSum = total_records.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const invoicetotalSaleTaxAmountSum = total_records.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const totalQtySum = total_records.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = total_records.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const result = {
        Group: brandgroup,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
        totalSaleTaxAmount: invoicetotalSaleTaxAmountSum,
      };
      return result;
    } else if (
      input.order_status !== '' &&
      input.royality_approval == '' &&
      input.customer_group == '' &&
      input.product_group == '' &&
      input.brand_group == '' &&
      input.salesContract_group == '' &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      console.log('order_status filter');

      const order_status = input.order_status;

      // const allrecordgroupby = await SalesContractDtlModel.aggregate([
      //   {
      //     $match: {
      //       contractDate: {
      //         $gte: new Date(input.fromDate),
      //         $lte: new Date(input.toDate),
      //       },
      //       isDeleted: false,
      //       InHouse: false,
      //       invoice: true,
      //       order_status: order_status,
      //     },
      //   },
      //   {
      //     $group: {
      //       _id: 'null',
      //       rate: {
      //         $sum: '$rate',
      //       },
      //       amount: {
      //         $sum: '$amount',
      //       },
      //       qty: {
      //         $sum: '$qty',
      //       },
      //     },
      //   },
      // ]);

      // const totalQty = allrecordgroupby.map((item: any) => item.qty);
      // const totalRate = allrecordgroupby.map((item: any) => item.rate);
      // const totalAmount = allrecordgroupby.map((item: any) => item.amount);
      // let where: any = {
      //   contractDate: {
      //     $gte: new Date(input.fromDate),
      //     $lte: new Date(input.toDate),
      //   },
      //   isDeleted: false,
      //   InHouse: false,
      //   invoice: true,
      //   order_status: order_status,
      // };
      // const salesContract = await SalesContractDtlModel.find(where);

      // const saleContractDetail = await SalesContractDtlModel.aggregate([
      //   {
      //     $match: where,
      //   },
      //   {
      //     $lookup: {
      //       from: 'salescontracts',
      //       localField: 'salesContract',
      //       foreignField: '_id',
      //       as: 'sale_dtl',
      //       pipeline: [
      //         {
      //           $lookup: {
      //             from: 'paymentterms',
      //             localField: 'paymentTerm',
      //             foreignField: '_id',
      //             as: 'payment_term',
      //           },
      //         },
      //       ],
      //     },
      //   },
      //   {
      //     $lookup: {
      //       from: 'brands',
      //       localField: 'brand',
      //       foreignField: '_id',
      //       as: 'branddtl',
      //     },
      //   },
      //   {
      //     $lookup: {
      //       from: 'customers',
      //       localField: 'customer',
      //       foreignField: '_id',
      //       as: 'customer_dtl',
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
      //       from: 'invoicedtls',
      //       localField: 'salesContract',
      //       foreignField: 'salesContract',
      //       as: 'inv_dtl',
      //       pipeline: [
      //         {
      //           $lookup: {
      //             from: 'invoices',
      //             localField: 'invoice',
      //             foreignField: '_id',
      //             as: 'invoice',
      //           },
      //         },
      //       ],
      //     },
      //   },
      //   {
      //     $lookup: {
      //       from: 'currencies',
      //       localField: 'currency',
      //       foreignField: '_id',
      //       as: 'currency_dtl',
      //     },
      //   },
      //   { $skip: skipCount },
      //   { $limit: limit },
      //   { $sort: { totalQty: -1, totalAmount: -1 } },
      // ]);

      const inv_dtl = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
          },
        },
        {
          $lookup: {
            from: 'salescontractdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'sale_dtl',
            pipeline: [
              {
                $match: {
                  order_status: order_status,
                  InHouse: false,
                },
              },
            ],
          },
        },
        {
          $match: {
            'sale_dtl.0': {
              $exists: true,
            },
          },
        },
        {
          $lookup: {
            from: 'invoices',
            localField: 'invoice',
            foreignField: '_id',
            as: 'invoice',
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salescontract',
            pipeline: [
              {
                $lookup: {
                  from: 'paymentterms',
                  localField: 'paymentTerm',
                  foreignField: '_id',
                  as: 'payment_term',
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
            as: 'customer_dtl',
          },
        },
        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'product_dtl',
          },
        },
        {
          $unwind: {
            path: '$salescontract',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: '$salescontract.payment_term',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: '$customer_dtl',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: '$product_dtl',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: '$invoice',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $sort: { date: -1 },
        },

        {
          $facet: {
            Summary: [
              {
                $match: {
                  date: {
                    $gte: new Date(input.fromDate),
                    $lte: new Date(input.toDate),
                  },
                  isDeleted: false,
                  adm_invoice: false,
                },
              },
              {
                $group: {
                  _id: null,
                  qty: { $sum: '$qty' },
                  rate: { $sum: '$rate' },
                  amount: { $sum: '$amount' },
                  salesTaxAmount: { $sum: '$salesTaxAmount' },
                },
              },
            ],
            AmountPkr: [
              {
                $match: {
                  date: {
                    $gte: new Date(input.fromDate),
                    $lte: new Date(input.toDate),
                  },
                  isDeleted: false,
                  adm_invoice: false,
                },
              },
              {
                $addFields: {
                  AmountInPkr: {
                    $multiply: ['$amount', '$rate'],
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  totalAmountInPkr: { $sum: '$AmountInPkr' },
                },
              },
            ],
            TotalValue: [
              {
                $match: {
                  date: {
                    $gte: new Date(input.fromDate),
                    $lte: new Date(input.toDate),
                  },
                  isDeleted: false,
                  adm_invoice: false,
                },
              },
              {
                $addFields: {
                  totalValue: {
                    $sum: {
                      $divide: [
                        {
                          $multiply: [
                            '$amount',
                            '$exchangeRate',
                            '$salesTaxRate',
                          ],
                        },
                        100,
                      ],
                    },
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  totalAmountInPkr: { $sum: '$totalValue' },
                },
              },
            ],
            ItemDetails: [
              {
                $project: {
                  qty: 1,
                  amount: 1,
                  uom: 1,
                  salesTaxAmount: 1,
                  rate: 1,
                  exchangeRate: 1,
                  salesTaxRate: 1,
                  contract: '$salescontract.contract',
                  saleTaxInvoiceNo: '$invoice.salesTaxInvoiceNo',
                  invoiceDate: '$invoice.date',
                  customerName: '$customer_dtl.name',
                  productName: '$product_dtl.name',
                },
              },
              {
                $skip: skipCount,
              },
              {
                $limit: limit,
              },
            ],
          },
        },
      ]);
      const total_records = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
          },
        },
        {
          $lookup: {
            from: 'salescontractdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'sale_dtl',
            pipeline: [
              {
                $match: {
                  order_status: order_status,
                  InHouse: false,
                },
              },
            ],
          },
        },
        {
          $match: {
            'sale_dtl.0': {
              $exists: true,
            },
          },
        },
      ]);

      let result = {
        inv_dtl: inv_dtl,
        total_records: total_records.length,
        paginated_record: inv_dtl.length,
        // totalQty: totalQty,
        // totalRate: totalRate,
        // totalAmount: totalAmount,
      };
      return result;
    } else if (
      input.royality_approval !== '' &&
      input.order_status == '' &&
      input.customer_group == '' &&
      input.salesContract_group == '' &&
      input.product_group == '' &&
      input.brand_group == '' &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('royality approval filter');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;

      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }

      const salegroupby = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
          },
        },
        {
          $lookup: {
            from: 'salescontractdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'sale_dtl',
            pipeline: [
              {
                $match: {
                  royality_approval: stringToBoolean(input.royality_approval),
                },
              },
            ],
          },
        },
        {
          $addFields: {
            sale_dtl: {
              $arrayElemAt: ['$sale_dtl', 0],
            },
          },
        },
        {
          $group: {
            _id: null,
            totalQty: {
              $sum: '$qty',
            },
            totalRate: {
              $sum: '$rate',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
            },
            data: {
              $push: '$$ROOT',
            },
          },
        },
        {
          $addFields: {
            totalValue: {
              $sum: {
                $map: {
                  input: '$data',
                  as: 'item',
                  in: {
                    $divide: [
                      {
                        $multiply: [
                          '$$item.amount',
                          '$$item.exchangeRate',
                          '$$item.salesTaxRate',
                        ],
                      },
                      100,
                    ],
                  },
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalQty: 1,
            totalRate: 1,
            totalValue: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            data: 1,
          },
        },
      ]);

      const inv_rate = salegroupby.flatMap(
        (item) => item.data.map((dataItem: any) => dataItem.rate || 0) // Default to 0 if rate is missing
      );
      const inv_amount = salegroupby.flatMap(
        (item) => item.data.map((dataItem: any) => dataItem.amount || 0) // Default to 0 if amount is missing
      );

      const qtypkr = inv_amount.map(
        (amount, index) => amount * inv_rate[index]
      );

      const AmountPKR = qtypkr.reduce((total, value) => total + value, 0);

      const invoice_dtl = await InvoiceDtlModel.aggregate([
        {
          $lookup: {
            from: 'salescontractdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'sale_dtl',
            pipeline: [
              {
                $match: {
                  InHouse: false,
                  royality_approval: stringToBoolean(input.royality_approval),
                },
              },
              {
                $lookup: {
                  from: 'salescontracts',
                  localField: 'salesContract',
                  foreignField: '_id',
                  as: 'salecontract',
                },
              },
            ],
          },
        },
        {
          $match: {
            'sale_dtl.0': {
              $exists: true,
            },
          },
        },
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
            from: 'invoices',
            localField: 'invoice',
            foreignField: '_id',
            as: 'invoice',
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
            as: 'customer_dtl',
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
          $sort: {
            date: -1,
          },
        },
        {
          $skip: skipCount,
        },
        {
          $limit: limit,
        },
      ]);

      const totalRecordCount = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false, // Filter out deleted records
          },
        },
        {
          $lookup: {
            from: 'salescontractdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'sale_dtl',
            pipeline: [
              {
                $match: {
                  InHouse: false,
                  royality_approval: stringToBoolean(input.royality_approval), // Apply royality_approval filter
                },
              },
            ],
          },
        },
        {
          $match: {
            'sale_dtl.0': { $exists: true }, // Ensure at least one `sale_dtl` exists after the lookup
          },
        },
      ]);
      const totalQty = salegroupby.map((item: any) => item.totalQty);
      const totalRate = salegroupby.map((item: any) => item.totalRate);
      const totalAmount = salegroupby.map((item: any) => item.totalAmount);
      const totalValue = salegroupby.map((item: any) => item.totalValue);
      const saleTaxAmount = salegroupby.map(
        (item: any) => item.totalSaleTaxAmount
      );

      let result = {
        shipmentdtl: invoice_dtl,
        paginated_record: invoice_dtl.length,
        total_records: totalRecordCount.length,
        totalQty: totalQty,
        totalRate: totalRate,
        totalAmount: totalAmount,
        saleTaxAmount: saleTaxAmount,
        totalValue: totalValue,
        AmountPKR: AmountPKR,
      };
      return result;
    } else if (
      input.customer_group == '' &&
      input.product_group == '' &&
      input.brand_group == '' &&
      (input.order_status !== '' ||
        input.royality_approval !== '' ||
        (Array.isArray(input.product) && input.product.length !== 0) ||
        (Array.isArray(input.customer) && input.customer.length !== 0) ||
        (Array.isArray(input.brand) && input.brand.length !== 0) ||
        (Array.isArray(input.salesContract) &&
          input.salesContract.length !== 0))
    ) {
      console.log('general condition');
      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;

      const salecontractArr = input.salesContract
        ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const productArr = input.product
        ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      let filter: any = {};
      let filter_records: any = {};
      let where: any = {};

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

      const invoiceamountpkr = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
          },
        },
        {
          $match: filter,
        },
      ]);

      let SaleTaxAmount;
      let AmountPKR;
      if (Array.isArray(invoiceamountpkr) && invoiceamountpkr.length == 0) {
        SaleTaxAmount = [];
        AmountPKR = [];
      } else {
        const qty = invoiceamountpkr.map((item) => (item.qty ? item.qty : []));
        const saletaxrate = invoiceamountpkr.map((item) => item.salesTaxRate);
        const rate = invoiceamountpkr.map((item) =>
          item.rate ? item.rate : []
        );

        const saletax = qty.map((amount, index) => amount * rate[index]);

        const saletaxamount = saletaxrate.map(
          (amount, index) => amount * saletax[index]
        );

        SaleTaxAmount = saletaxamount.reduce((total, value) => total + value);

        const Amount = invoiceamountpkr.map((item) =>
          item.amount ? item.amount : []
        );
        const Rate = invoiceamountpkr.map((item) =>
          item.rate ? item.exchangeRate : []
        );

        const qtypkr = Amount.map((amount, index) => amount * Rate[index]);

        AmountPKR = qtypkr.reduce((total, value) => total + value, 0);
      }

      const total_record = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
          },
        },
        {
          $match: filter_records,
        },
      ]);
      const invoicegroupby = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
          },
        },
        {
          $match: filter,
        },
        {
          $group: {
            _id: null,
            totalQty: {
              $sum: '$qty',
            },
            totalRate: {
              $sum: '$rate',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
            },
            data: {
              $push: '$$ROOT',
            },
          },
        },
        {
          $addFields: {
            totalValue: {
              $sum: {
                $map: {
                  input: '$data',
                  as: 'item',
                  in: {
                    $divide: [
                      {
                        $multiply: [
                          '$$item.amount',
                          '$$item.exchangeRate',
                          '$$item.salesTaxRate',
                        ],
                      },
                      100,
                    ],
                  },
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalQty: 1,
            totalRate: 1,
            totalValue: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            data: 1,
          },
        },
      ]);
      const totalQty = invoicegroupby.map((item) => item.totalQty);
      const totalAmount = invoicegroupby.map((item) => item.totalAmount);
      const totalRate = invoicegroupby.map((item) => item.totalRate);
      const totalValue = invoicegroupby.map((item) => item.totalValue);
      const invoice_detail = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
          },
        },
        {
          $match: where,
        },
        {
          $lookup: {
            from: 'invoices',
            localField: 'invoice',
            foreignField: '_id',
            as: 'inv_dtl',
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'sale_dtl',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer_dtl',
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
        { $sort: { date: -1 } },
      ]);
      if (Array.isArray(invoice_detail) && invoice_detail.length == 0) {
        const result = {
          invoice_dtl: [],
          total_record: [],
          paginated_record: [],
          totalAmount: [],
          totalQty: [],
          totalRate: [],
          totalAmountPKR: [],
          SaleTaxAmount: [],
        };
        return result;
      } else {
        const result = {
          invoice_detail: invoice_detail,
          total_records: total_record.length,
          paginated_record: invoice_detail.length,
          totalAmount: totalAmount,
          totalQty: totalQty,
          totalRate: totalRate,
          totalValue: totalValue,
          totalAmountPKR: AmountPKR,
          SaleTaxAmount: SaleTaxAmount,
        };
        return result;
      }
    } else if (
      input.customer_group !== '' &&
      input.royality_approval == '' &&
      input.order_status == '' &&
      Array.isArray(input.customer) &&
      input.customer.length !== 0 &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('customer group customer ');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const customer = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
          },
        },
        {
          $match: {
            isDeleted: false,
            customer: { $in: customerArr },
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer_details',
          },
        },
        {
          $addFields: {
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
            totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
            totalSaleTaxAmount: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: '$customer', // Group by customer ID
            customerName: { $first: '$customer_details.name' }, // Retrieve customer name
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
            totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
            totalInvoices: { $sum: 1 }, // Count the number of contracts for each customer
          },
        },
        {
          $project: {
            customerName: 1,
            totalQty: 1,
            totalAmount: 1,
            totalInvoices: 1,
            totalSaleTaxAmount: 1,
            _id: 0, // Exclude _id field
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
        { $skip: skipCount },
        { $limit: limit },
      ]);

      const totalInvoicesSum = customer.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );

      const totalQtySum = customer.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = customer.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalSaleTaxAmountSum = customer.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const result = {
        customer_groupby: customer,
        total_records: customer.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    } else if (
      input.product_group !== '' &&
      input.royality_approval == '' &&
      input.order_status == '' &&
      Array.isArray(input.product) &&
      input.product.length !== 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      console.log('product to product group');

      const productArr = input.product
        ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const product = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
          },
        },

        {
          $match: {
            isDeleted: false,
            product: { $in: productArr },
          },
        },

        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productInfo',
          },
        },
        {
          $group: {
            _id: '$product',
            productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
            totalSaleTaxAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            productName: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
        { $skip: skipCount },
        { $limit: limit },
      ]);

      const totalInvoices = product.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = product.reduce((sum, item) => sum + item.totalQty, 0);
      const totalAmountSum = product.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalSaleTaxAmountSum = product.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const result = {
        product_groupby: product,
        total_records: product.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoices,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
      };
      return result;
    } else if (
      input.customer_group !== '' &&
      input.royality_approval == '' &&
      input.order_status == '' &&
      Array.isArray(input.brand) &&
      input.brand.length !== 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('customer group brand');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      const brandArr = input.brand
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const customer = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
          },
        },
        {
          $match: {
            isDeleted: false,
            brand: { $in: brandArr },
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer_details',
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand_details',
          },
        },
        {
          $addFields: {
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
            totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
            totalSaleTaxAmount: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: '$customer', // Group by customer ID
            customerName: { $first: '$customer_details.name' },
            brandName: { $first: '$brand_details.name' }, // Retrieve customer name
            totalQty: { $sum: '$qty' },
            totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
            totalAmount: { $sum: '$amount' },
            totalInvoices: { $sum: 1 }, // Count the number of contracts for each customer
          },
        },
        {
          $project: {
            customerName: 1,
            brandName: 1,
            totalQty: 1,
            c: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            totalInvoices: 1,
            _id: 0, // Exclude _id field
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
        { $skip: skipCount },
        { $limit: limit },
      ]);

      const totalInvoicesSum = customer.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = customer.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = customer.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalSaleTaxAmount = customer.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );

      const result = {
        customer_groupby: customer,
        total_records: customer.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
        totalSaleTaxAmount: totalSaleTaxAmount,
      };
      return result;
    } else if (
      input.product_group !== '' &&
      input.royality_approval == '' &&
      input.order_status == '' &&
      Array.isArray(input.brand) &&
      input.brand.length !== 0 &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      console.log('product to brand');

      const total_records = await BrandModel.countDocuments();
      const brandArr = input.brand
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const product = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
          },
        },

        {
          $match: {
            // isDeleted: false,
            brand: { $in: brandArr },
          },
        },

        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productInfo',
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brandInfo',
          },
        },
        {
          $group: {
            _id: '$product',
            productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
            brandName: { $first: { $arrayElemAt: ['$brandInfo.name', 0] } },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
            totalSaleTaxAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            productName: 1,
            brandName: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalSaleTaxAmount: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
        { $skip: skipCount },
        { $limit: limit },
      ]);

      const totalInvoices = product.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = product.reduce((sum, item) => sum + item.totalQty, 0);
      const totalAmountSum = product.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalSaleTaxAmountSum = product.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const result = {
        product_groupby: product,
        total_records: total_records,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoices,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
      };
      return result;
    } else if (
      input.brand_group !== '' &&
      input.royality_approval == '' &&
      input.order_status == '' &&
      Array.isArray(input.brand) &&
      input.brand.length !== 0 &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length !== 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length !== 0
    ) {
      console.log('brandgroup brand');
      const brandArr = input.brand
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      const total_records = await BrandModel.countDocuments();

      const brandgroup = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },

            isDeleted: false,
            adm_invoice: false,
            brand: { $in: brandArr },
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
          $unwind: '$brand',
        },
        {
          $group: {
            _id: '$brand._id', // Group by brand's _id
            name: { $first: '$brand.name' },
            totalInvoices: { $sum: 1 }, // Calculate the total number of contracts
            totalQty: { $sum: '$qty' }, // Calculate the total quantity
            totalAmount: { $sum: '$amount' },
            totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
            totalSaleTaxAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            _id: 0, // Exclude _id field
            name: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
        { $skip: skipCount },
        { $limit: limit },
      ]);

      const totalInvoiceSum = brandgroup.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = brandgroup.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = brandgroup.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalSaleTaxAmountSum = brandgroup.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const result = {
        brand_groupby: brandgroup,
        total_records: brandgroup.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoiceSum: totalInvoiceSum,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
      };
      return result;
    } else if (
      input.brand_group !== '' &&
      input.royality_approval == '' &&
      input.order_status == '' &&
      Array.isArray(input.customer) &&
      input.customer.length !== 0 &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('brand to customer');
      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const brandgroup = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
            customer: { $in: customerArr },
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
            _id: '$brand._id',
            brandName: {
              $first: '$brand.name',
            },
            customerName: { $first: '$customer.name' },
            totalInvoices: {
              $sum: 1,
            },
            totalQty: {
              $sum: '$qty',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
            },
            totalAmount: {
              $sum: '$amount',
            },
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ]);

      const totalInvoicesSum = brandgroup.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = brandgroup.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = brandgroup.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalSaleTaxAmountSum = brandgroup.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const result = {
        brand_groupby: brandgroup,
        total_records: brandgroup.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    } else if (
      input.product_group !== '' &&
      input.royality_approval == '' &&
      input.order_status == '' &&
      Array.isArray(input.customer) &&
      input.customer.length !== 0 &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('product group customer');
      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const productdtl = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
            customer: { $in: customerArr },
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
            as: 'products',
          },
        },

        {
          $group: {
            _id: '$products._id',
            productName: {
              $first: '$products.name',
            },
            customerName: {
              $first: '$customer.name',
            },
            totalInvoices: {
              $sum: 1,
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ]);

      const totalInvoiceSum = productdtl.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = productdtl.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = productdtl.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalSaleTaxAmountSum = productdtl.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const result = {
        product_groupby: productdtl,
        total_records: productdtl.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoiceSum: totalInvoiceSum,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
      };
      return result;
    } else if (
      input.customer_group !== '' &&
      input.royality_approval == '' &&
      input.order_status == '' &&
      Array.isArray(input.product) &&
      input.product.length !== 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('product to customer');
      const productArr = input.product
        ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const customerdtl = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
            product: { $in: productArr },
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
            _id: '$customer._id',
            CustomerName: {
              $first: '$customer.name',
            },
            productName: {
              $first: '$product.name',
            },
            totalInvoices: {
              $sum: 1,
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
            },
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ]);
      const totalInvoicesSum = customerdtl.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = customerdtl.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = customerdtl.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalSaleTaxAmountSum = customerdtl.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const result = {
        customer_groupby: customerdtl,
        total_records: customerdtl.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
      };
      return result;
    } else if (
      input.brand_group !== '' &&
      input.royality_approval == '' &&
      input.order_status == '' &&
      Array.isArray(input.product) &&
      input.product.length !== 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('product to brand');

      const productArr = input.product
        ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const branddtl = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
            product: { $in: productArr },
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
            productname: {
              $first: '$products.name',
            },
            brandname: {
              $first: '$brand.name',
            },
            totalInvoices: {
              $sum: 1,
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
            },
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ]);
      const totalInvoicesSum = branddtl.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = branddtl.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = branddtl.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalSaleTaxAmountSum = branddtl.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const result = {
        brand_groupby: branddtl,
        total_records: branddtl.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
      };
      return result;
    } else if (
      input.customer_group !== '' &&
      ((Array.isArray(input.product) && input.product.length !== 0) ||
        (Array.isArray(input.customer) && input.customer.length !== 0) ||
        (Array.isArray(input.brand) && input.brand.length !== 0) ||
        (Array.isArray(input.salesContract) &&
          input.salesContract.length !== 0))
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
      const productArr = input.product
        ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
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
      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }
      if (input.royality_approval) {
        extrafilter.royality_approval = stringToBoolean(
          input.royality_approval
        );
      }
      if (input.order_status !== '') {
        const order_status = input.order_status;

        where.order_status = order_status;
        (filter_records.order_status = order_status),
          (filter.order_status = order_status);
      }

      const customerAggregationPipelineRecords: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
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
            totalInvoices: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            salesTaxAmount: {
              $sum: '$salesTaxAmount',
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
            salesTaxAmount: 1,
            totalInvoices: 1,
          },
        },
      ];

      const customerAggregationPipeline: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
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
            totalInvoices: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            salesTaxAmount: {
              $sum: '$salesTaxAmount',
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
            saleTaxAmount: 1,
            totalInvoices: 1,
          },
        },
        { $sort: { qty: -1, amount: -1 } },
        { $skip: skipCount },
        { $limit: limit },
      ];

      const customergroup = await InvoiceDtlModel.aggregate(
        customerAggregationPipeline
      );

      const total_records = await InvoiceDtlModel.aggregate(
        customerAggregationPipelineRecords
      );

      const totalInvoicesSum = total_records.reduce(
        (sum, item) => sum + item.totalInvoices,
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
      const totalSaleTaxAmountSum = total_records.reduce(
        (sum, item) => sum + item.salesTaxAmount,
        0
      );
      const result = {
        Group: customergroup,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    } else if (
      input.product_group !== '' &&
      ((Array.isArray(input.product) && input.product.length !== 0) ||
        (Array.isArray(input.customer) && input.customer.length !== 0) ||
        (Array.isArray(input.brand) && input.brand.length !== 0) ||
        (Array.isArray(input.salesContract) &&
          input.salesContract.length !== 0))
    ) {
      console.log(
        '  product group with general filters brand customer product salescontract work'
      );

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;

      const salesContractArr = input.salesContract
        ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const productArr = input.product
        ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
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

      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }
      if (input.royality_approval) {
        extrafilter.royality_approval = stringToBoolean(
          input.royality_approval
        );
      }
      if (input.order_status !== '') {
        const order_status = input.order_status;

        where.order_status = order_status;
        (filter_records.order_status = order_status),
          (filter.order_status = order_status);
      }
      const productAggregationPipelineRecords: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
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
            totalInvoices: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            salesTaxAmount: {
              $sum: '$salesTaxAmount',
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
            totalInvoices: 1,
            salesTaxAmount: 1,
          },
        },
      ];
      const productAggregationPipeline: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
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
            totalInvoices: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            salesTaxAmount: {
              $sum: '$salesTaxAmount',
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
            salesTaxAmount: 1,
            totalInvoices: 1,
          },
        },
        { $sort: { qty: -1, amount: -1 } },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const productgroup = await InvoiceDtlModel.aggregate(
        productAggregationPipeline
      );
      const total_records = await InvoiceDtlModel.aggregate(
        productAggregationPipelineRecords
      );
      const totalInvoicesSum = total_records.reduce(
        (sum, item) => sum + item.totalInvoices,
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
      const saleTaxAmountSum = total_records.reduce(
        (sum, item) => sum + item.salesTaxAmount,
        0
      );
      const result = {
        Group: productgroup,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
        saleTaxAmountSum: saleTaxAmountSum,
      };
      return result;
    } else if (
      input.brand_group !== '' &&
      ((Array.isArray(input.product) && input.product.length !== 0) ||
        (Array.isArray(input.customer) && input.customer.length !== 0) ||
        (Array.isArray(input.brand) && input.brand.length !== 0) ||
        (Array.isArray(input.salesContract) &&
          input.salesContract.length !== 0))
    ) {
      console.log(
        '  brand group with general filters brand customer product salescontract work'
      );

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;

      const salesContractArr = input.salesContract
        ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const productArr = input.product
        ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
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

      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }
      if (input.royality_approval) {
        extrafilter.royality_approval = stringToBoolean(
          input.royality_approval
        );
      }
      if (input.order_status !== '') {
        const order_status = input.order_status;

        where.order_status = order_status;
        (filter_records.order_status = order_status),
          (filter.order_status = order_status);
      }
      const brandAggregationPipelineRecords: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
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
            totalInvoices: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            salesTaxAmount: {
              $sum: '$salesTaxAmount',
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
            salesTaxAmount: 1,
            totalInvoices: 1,
          },
        },
      ];
      const brandAggregationPipeline: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
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

            totalInvoices: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            salesTaxAmount: {
              $sum: '$salesTaxAmount',
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
            salesTaxAmount: 1,
            totalInvoices: 1,
          },
        },
        { $sort: { qty: -1, amount: -1 } },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const brandgroup = await InvoiceDtlModel.aggregate(
        brandAggregationPipeline
      );
      const total_records = await InvoiceDtlModel.aggregate(
        brandAggregationPipelineRecords
      );

      const totalInvoicesSum = total_records.reduce(
        (sum, item) => sum + item.totalInvoices,
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
      const totalSaleTaxAmountSum = total_records.reduce(
        (sum, item) => sum + item.salesTaxAmount,
        0
      );
      const result = {
        Group: brandgroup,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    } else if (
      input.product_group !== '' &&
      input.order_status !== '' &&
      input.royality_approval !== ''
    ) {
      console.log('product group  royality_approval and orderstatus');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }

      const royality_approval = stringToBoolean(input.royality_approval);
      const order_status = input.order_status;

      const productAggregationPipelineRecord: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: false,
            order_status: order_status,
            royality_approval: royality_approval,
          },
        },

        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productInfo',
          },
        },
        {
          $group: {
            _id: '$product',
            productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            productName: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];

      const productAggregationPipeline: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: false,
            order_status: order_status,
            royality_approval: royality_approval,
          },
        },

        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productInfo',
          },
        },
        {
          $group: {
            _id: '$product',
            productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            productName: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
        { $skip: skipCount },
        { $limit: limit },
      ];

      const product = await SalesContractDtlModel.aggregate(
        productAggregationPipeline
      );
      const total_records = await SalesContractDtlModel.aggregate(
        productAggregationPipelineRecord
      );
      const totalInvoices = product.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = product.reduce((sum, item) => sum + item.totalQty, 0);
      const totalAmountSum = product.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const result = {
        product_groupby: product,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoices,
      };
      return result;
    } else if (
      input.brand_group !== '' &&
      input.order_status !== '' &&
      input.royality_approval !== ''
    ) {
      console.log('brand group royality_approval and order_status');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }

      const royality_approval = stringToBoolean(input.royality_approval);
      const order_status = input.order_status;
      const brandAggregationPipelineRecord: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: false,
            order_status: order_status,
            royality_approval: royality_approval,
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
          $unwind: '$brand',
        },
        {
          $group: {
            _id: '$brand._id',
            name: { $first: '$brand.name' },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            _id: 0,
            name: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];
      const brandAggregationPipeline: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: false,
            order_status: order_status,
            royality_approval: royality_approval,
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
          $unwind: '$brand',
        },
        {
          $group: {
            _id: '$brand._id',
            name: { $first: '$brand.name' },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            _id: 0,
            name: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const brandgroup = await SalesContractDtlModel.aggregate(
        brandAggregationPipeline
      );
      const total_records = await SalesContractDtlModel.aggregate(
        brandAggregationPipelineRecord
      );

      const totalInvoicesSum = brandgroup.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = brandgroup.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = brandgroup.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const result = {
        brand_groupby: brandgroup,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    } else if (
      input.customer_group !== '' &&
      input.order_status !== '' &&
      input.royality_approval !== ''
    ) {
      console.log('customer group royality_approval and orderstatus');
      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }

      const royality_approval = stringToBoolean(input.royality_approval);
      const order_status = input.order_status;
      const customerAggregationPipelineRecords: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: false,
            order_status: order_status,
            royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer_details',
          },
        },
        {
          $addFields: {
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: '$customer', // Group by customer ID
            customerName: { $first: '$customer_details.name' },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
            totalInvoices: { $sum: 1 },
          },
        },
        {
          $project: {
            customerName: 1,
            totalQty: 1,
            totalAmount: 1,
            totalInvoices: 1,
            _id: 0, // Exclude _id field
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];

      const customerAggregationPipeline: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            order_status: order_status,
            InHouse: false,
            royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer_details',
          },
        },
        {
          $addFields: {
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: '$customer', // Group by customer ID
            customerName: { $first: '$customer_details.name' },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
            totalInvoices: { $sum: 1 },
          },
        },
        {
          $project: {
            customerName: 1,
            totalQty: 1,
            totalAmount: 1,
            totalInvoices: 1,
            _id: 0,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const customer = await SalesContractDtlModel.aggregate(
        customerAggregationPipeline
      );
      const total_records = await SalesContractDtlModel.aggregate(
        customerAggregationPipelineRecords
      );
      const totalInvoicesSum = customer.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
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
        customer_groupby: customer,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    } else if (input.product_group !== '' && input.order_status !== '') {
      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      console.log('order_status product group');
      const order_status = input.order_status;
      const productAggregationPipelineRecord: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: false,
            order_status: order_status,
          },
        },

        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productInfo',
          },
        },
        {
          $group: {
            _id: '$product',
            productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            productName: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];

      const productAggregationPipeline: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: false,
            order_status: order_status,
          },
        },

        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productInfo',
          },
        },
        {
          $group: {
            _id: '$product',
            productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            productName: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
        { $skip: skipCount },
        { $limit: limit },
      ];

      const product = await SalesContractDtlModel.aggregate(
        productAggregationPipeline
      );
      const total_records = await SalesContractDtlModel.aggregate(
        productAggregationPipelineRecord
      );
      const totalInvoices = product.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = product.reduce((sum, item) => sum + item.totalQty, 0);
      const totalAmountSum = product.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const result = {
        product_groupby: product,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoices,
      };
      return result;
    } else if (input.customer_group !== '' && input.order_status !== '') {
      console.log('customer group order_status');
      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      const order_status = input.order_status;
      const customerAggregationPipelineRecords: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: false,
            order_status: order_status,
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer_details',
          },
        },
        {
          $addFields: {
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: '$customer', // Group by customer ID
            customerName: { $first: '$customer_details.name' },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
            totalInvoices: { $sum: 1 },
          },
        },
        {
          $project: {
            customerName: 1,
            totalQty: 1,
            totalAmount: 1,
            totalInvoices: 1,
            _id: 0, // Exclude _id field
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];

      const customerAggregationPipeline: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: false,
            order_status: order_status,
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer_details',
          },
        },
        {
          $addFields: {
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: '$customer', // Group by customer ID
            customerName: { $first: '$customer_details.name' },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
            totalInvoices: { $sum: 1 },
          },
        },
        {
          $project: {
            customerName: 1,
            totalQty: 1,
            totalAmount: 1,
            totalInvoices: 1,
            _id: 0,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const customer = await SalesContractDtlModel.aggregate(
        customerAggregationPipeline
      );
      const total_records = await SalesContractDtlModel.aggregate(
        customerAggregationPipelineRecords
      );
      const totalInvoicesSum = customer.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
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
        customer_groupby: customer,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    } else if (input.brand_group !== '' && input.order_status !== '') {
      console.log('brand group order_status ');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      const order_status = input.order_status;
      const brandAggregationPipelineRecord: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: false,
            order_status: order_status,
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
          $unwind: '$brand',
        },
        {
          $group: {
            _id: '$brand._id',
            name: { $first: '$brand.name' },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            _id: 0,
            name: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];
      const brandAggregationPipeline: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: false,
            order_status: order_status,
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
          $unwind: '$brand',
        },
        {
          $group: {
            _id: '$brand._id',
            name: { $first: '$brand.name' },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            _id: 0,
            name: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const brandgroup = await SalesContractDtlModel.aggregate(
        brandAggregationPipeline
      );
      const total_records = await SalesContractDtlModel.aggregate(
        brandAggregationPipelineRecord
      );

      const totalInvoicesSum = brandgroup.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = brandgroup.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = brandgroup.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const result = {
        brand_groupby: brandgroup,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    } else if (input.product_group !== '' && input.royality_approval !== '') {
      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      console.log('product group  royality_approval');
      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }

      const royality_approval = stringToBoolean(input.royality_approval);

      const productAggregationPipelineRecord: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: false,
            royality_approval: royality_approval,
          },
        },

        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productInfo',
          },
        },
        {
          $group: {
            _id: '$product',
            productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            productName: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];

      const productAggregationPipeline: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: false,
            royality_approval: royality_approval,
          },
        },

        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productInfo',
          },
        },
        {
          $group: {
            _id: '$product',
            productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            productName: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
        { $skip: skipCount },
        { $limit: limit },
      ];

      const product = await SalesContractDtlModel.aggregate(
        productAggregationPipeline
      );
      const total_records = await SalesContractDtlModel.aggregate(
        productAggregationPipelineRecord
      );
      const totalInvoices = product.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = product.reduce((sum, item) => sum + item.totalQty, 0);
      const totalAmountSum = product.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const result = {
        product_groupby: product,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoices,
      };
      return result;
    } else if (input.customer_group !== '' && input.royality_approval !== '') {
      console.log('customer group royality_approval');
      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }

      const royality_approval = stringToBoolean(input.royality_approval);
      const customerAggregationPipelineRecords: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: false,
            royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer_details',
          },
        },
        {
          $addFields: {
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: '$customer', // Group by customer ID
            customerName: { $first: '$customer_details.name' },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
            totalInvoices: { $sum: 1 },
          },
        },
        {
          $project: {
            customerName: 1,
            totalQty: 1,
            totalAmount: 1,
            totalInvoices: 1,
            _id: 0, // Exclude _id field
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];

      const customerAggregationPipeline: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: false,
            royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer_details',
          },
        },
        {
          $addFields: {
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: '$customer', // Group by customer ID
            customerName: { $first: '$customer_details.name' },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
            totalInvoices: { $sum: 1 },
          },
        },
        {
          $project: {
            customerName: 1,
            totalQty: 1,
            totalAmount: 1,
            totalInvoices: 1,
            _id: 0,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const customer = await SalesContractDtlModel.aggregate(
        customerAggregationPipeline
      );
      const total_records = await SalesContractDtlModel.aggregate(
        customerAggregationPipelineRecords
      );
      const totalInvoicesSum = customer.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
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
        customer_groupby: customer,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    } else if (input.brand_group !== '' && input.royality_approval !== '') {
      console.log('brand group royality_approval');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
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
            invoice: false,
            InHouse: false,
            royality_approval: royality_approval,
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
          $unwind: '$brand',
        },
        {
          $group: {
            _id: '$brand._id',
            name: { $first: '$brand.name' },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            _id: 0,
            name: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];
      const brandAggregationPipeline: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            InHouse: false,
            invoice: true,
            royality_approval: royality_approval,
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
          $unwind: '$brand',
        },
        {
          $group: {
            _id: '$brand._id',
            name: { $first: '$brand.name' },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            _id: 0,
            name: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
        { $skip: skipCount },
        { $limit: limit },
      ];
      const brandgroup = await SalesContractDtlModel.aggregate(
        brandAggregationPipeline
      );
      const total_records = await SalesContractDtlModel.aggregate(
        brandAggregationPipelineRecord
      );

      const totalInvoicesSum = brandgroup.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = brandgroup.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = brandgroup.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const result = {
        brand_groupby: brandgroup,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    }
  }
};


export const findInvoiceDtlsByDate = async (input: InvoiceReportSchema) => {
  const {
    brand,
    customer,
    product,
    fromDate,
    toDate,
    pageno = 1,
    perPage = 10,
    order_status,
    royality_approval,
    Adm,
    isDeleted,
    nonAdm,
    brand_group,
    customer_group,
    product_group,
  } = input;

  // pagination contants

  const limit = perPage;
  const skipCount = (pageno - 1) * limit;

  //  Group condition setter
  const groupId: any = {};
  const shouldGroup = product_group || brand_group || customer_group;

  if (product_group) groupId.product = '$products';
  if (brand_group) groupId.brand = '$brands';
  if (customer_group) groupId.customer = '$customers';

  const matchStage: any = { isDeleted: false };

  if (fromDate && toDate) {
    matchStage.date = {
      $gte: new Date(fromDate),
      $lte: new Date(toDate),
    };
  }


  if (Array.isArray(product) && product.length > 0) {
    matchStage.product = {
      $in: product.map(id => new mongoose.Types.ObjectId(id))
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

  if (Adm) matchStage['adm_invoice'] = true;
  if (nonAdm) matchStage['adm_invoice'] = false;

  const scMatchStage: any = {};
  if (royality_approval == 'true')
    scMatchStage['salesContract.royality_approval'] = true;
  if (royality_approval == 'false')
    scMatchStage['salesContract.royality_approval'] = false;

  // const scMatchStage2: any = { isDeleted: false };
  if (order_status == 'confirmed')
    scMatchStage['salesContract.order_status'] = 'confirmed';
  if (order_status == 'forecast')
    scMatchStage['salesContract.order_status'] = 'forecast';


      if (isDeleted && isDeleted.toString().toLowerCase() === "true") {

  matchStage.isDeleted = true;
} 

  const basePipeline: any[] = [
    {
      $match: matchStage
    },
    {
      $lookup: {
        from: "invoices",
        localField: "invoice",
        foreignField: "_id",
        as: "invoices"
      }
    },
    {
      $unwind: {
        path: "$invoices",
        preserveNullAndEmptyArrays: false
      }
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
        preserveNullAndEmptyArrays: false
      }
    },
    {
      $match: scMatchStage,
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
      $unwind:
      {
        path: "$brands",

        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        contract: "$salesContract.contract",
        salesTaxInvoiceNo:
          "$invoices.salesTaxInvoiceNo",
        date: "$date",
        customers: "$customers.name",
        products: "$products.name",
        brands: "$brands.name",
        rate: "$rate",
        qty: "$qty",
        amount: "$amount",
        uom: "$uom",
        exchangeRate: "$exchangeRate",
        salesTaxRate: "$salesTaxRate",
        salesTaxAmounts: "$salesTaxAmount",
        amountInPkr: {
          $multiply: ["$amount", "$exchangeRate"]
        },
        salesTaxAmount: {
          $multiply: [
            "$qty",
            "$rate",
            "$salesTaxRate"
          ]
        },
        totalValue: {
          $divide: [
            {
              $multiply: [
                "$amount",
                "$exchangeRate",
                "$salesTaxRate"
              ]
            },
            100
          ]
        }
      }
    },
    {
      $sort: { date: -1 }
    }


  ]

  const basePipelineSummary: any[] = [
    {
      $match: matchStage
    },
    {
      $lookup: {
        from: "invoices",
        localField: "invoice",
        foreignField: "_id",
        as: "invoices"
      }
    },
    {
      $unwind: {
        path: "$invoices",
        preserveNullAndEmptyArrays: false
      }
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
        preserveNullAndEmptyArrays: false
      }
    },
    {
      $match: scMatchStage,
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
      $unwind:
      {
        path: "$brands",

        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        contract: "$salesContract.contract",
        salesTaxInvoiceNo:
          "$invoices.salesTaxInvoiceNo",
        date: "$date",
        customers: "$customers.name",
        products: "$products.name",
        brands: "$brands.name",
        rate: "$rate",
        qty: "$qty",
        amount: "$amount",
        uom: "$uom",
        exchangeRate: "$exchangeRate",
        salesTaxRate: "$salesTaxRate",
        salesTaxAmounts: "$salesTaxAmount",
        amountInPkr: {
          $multiply: ["$amount", "$exchangeRate"]
        },
        salesTaxAmount: {
          $multiply: [
            "$qty",
            "$rate",
            "$salesTaxRate"
          ]
        },
        totalValue: {
          $divide: [
            {
              $multiply: [
                "$amount",
                "$exchangeRate",
                "$salesTaxRate"
              ]
            },
            100
          ]
        }
      }
    },
    {
      $sort: { date: -1 }
    }


  ]
  const sortStage = { $sort: { totalInvoiceQty: -1 } };

  const groupStage = {
    $group: {
      _id: groupId,
      products: { $first: "$products" },
      brands: { $first: "$brands" },
      customers: { $first: "$customers" },
      totalInvoices: { $sum: 1 },
      totalInvoiceQty: { $sum: "$qty" },
      totalInvoiceAmount: { $sum: "$amount" },
      totalInvoiceRate: { $sum: "$rate" },
      totalamountInPkr: { $sum: "$amountInPkr" },
      totalSalesTaxAmount: { $sum: "$salesTaxAmount" },
      totalValueSum: { $sum: "$totalValue" }
    }
  }
  const groupStageSummary = {
    $group: {
      _id: '',
      // products:{$first:"$products"},
      // brands:{$first:"$brands"},
      // customers:{$first:"$customers"},
      totalInvoices: { $sum: 1 },
      totalInvoiceQty: { $sum: "$qty" },
      totalInvoiceAmount: { $sum: "$amount" },
      totalInvoiceRate: { $sum: "$rate" },
      totalamountInPkr: { $sum: "$amountInPkr" },
      totalSalesTaxAmount: { $sum: "$salesTaxAmount" },
      totalValueSum: { $sum: "$totalValue" }
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
          totalInvoices: { $sum: 1 },
          totalInvoiceQty: { $sum: "$qty" },
          totalInvoiceAmount: { $sum: "$amount" },
          totalInvoiceRate: { $sum: "$rate" },
          totalamountInPkr: { $sum: "$amountInPkr" },
          totalSalesTaxAmount: { $sum: "$salesTaxAmount" },
          totalValueSum: { $sum: "$totalValue" }
        },
      },
    ];
  // Executing the pipelines in parallel
  const [invoicedtl, totalResult, summaryResult] = await Promise.all([
    InvoiceDtlModel.aggregate(dataPipeline, { allowDiskUse: true }),
    InvoiceDtlModel.aggregate(countPipeline, { allowDiskUse: true }),
    InvoiceDtlModel.aggregate(summaryPipeline, { allowDiskUse: true }),
  ]);

  const totalRecords = totalResult?.[0]?.totalRecords || 0;
  const summary = summaryResult?.[0] || {
    totalInvoiceQty: 0,
    totalInvoiceAmount: 0,
    totalInvoices: 0,
    totalInvoiceRate: 0,
    totalamountInPkr: 0,
    totalSalesTaxAmount: 0,
    totalValueSum: 0,

  };
  return {
    invoicedtl,
    summary,
    pagination: {
      page: pageno,
      perPage,
      totalRecords,
      totalPages: Math.ceil(totalRecords / perPage),
    },
  };

}


export const findInvoiceDtlsByDatePrint_old = async (
  input: InvoiceReportPrintSchema
) => {
  if (
    Array.isArray(input.product) &&
    input.product.length == 0 &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0 &&
    input.customer_group == '' &&
    input.product_group == '' &&
    input.brand_group == '' &&
    input.salesContract_group == '' &&
    input.Adm == '' &&
    input.nonAdm == '' &&
    input.order_status == '' &&
    input.royality_approval == ''
  ) {
    console.log('no filter condition execute!');

    try {
      const invoice_groupby = await InvoiceDtlModel.aggregate([
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
            _id: null,
            totalQty: {
              $sum: '$qty',
            },
            totalRate: {
              $sum: '$rate',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
            },
            data: {
              $push: '$$ROOT',
            },
          },
        },
        {
          $addFields: {
            totalValue: {
              $sum: {
                $map: {
                  input: '$data',
                  as: 'item',
                  in: {
                    $divide: [
                      {
                        $multiply: [
                          '$$item.amount',
                          '$$item.exchangeRate',
                          '$$item.salesTaxRate',
                        ],
                      },
                      100,
                    ],
                  },
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalQty: 1,
            totalRate: 1,
            totalValue: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            data: 1,
          },
        },
      ]);
      const total_qty = invoice_groupby.map((item) => item.totalQty);
      const total_amount = invoice_groupby.map((item) => item.totalAmount);
      const total_rate = invoice_groupby.map((item) => item.totalRate);
      const totalValue = invoice_groupby.map((item) => item.totalValue);
      const total_records = await InvoiceDtlModel.aggregate([
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

      const invoiceamountpkr = await InvoiceDtlModel.aggregate([
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

      const qty = invoiceamountpkr.map((item) => item.qty);
      const saletaxrate = invoiceamountpkr.map((item) => item.salesTaxRate);
      const rate = invoiceamountpkr.map((item) => item.rate);

      const saletax = qty.map((amount, index) => amount * rate[index]);
      const saletaxamount = saletaxrate.map(
        (amount, index) => amount * saletax[index]
      );
      const SaleTaxAmount = saletaxamount.reduce(
        (total, value) => total + value
      );

      const Amount = invoiceamountpkr.map((item) => item.amount);
      const Rate = invoiceamountpkr.map((item) => item.rate);
      const qtypkr = Amount.map((amount, index) => amount * Rate[index]);

      const AmountPKR = qtypkr.reduce((total, value) => total + value, 0);

      const invoice_detail = await InvoiceDtlModel.aggregate([
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
            from: 'invoices',
            localField: 'invoice',
            foreignField: '_id',
            as: 'inv_dtl',
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'sale_dtl',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer_dtl',
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

        { $sort: { date: -1 } },
      ]);

      const result = {
        invoice_detail: invoice_detail,
        paginated_record: invoice_detail.length,
        totalQty: total_qty,
        totalAmount: total_amount,
        totalRate: total_rate,
        total_records: total_records.length,
        totalAmountPKR: AmountPKR,
        totalValue: totalValue,
        SaleTaxAmount: SaleTaxAmount,
      };
      return result;
    } catch (error) {
      console.log(error);
    }
  } else if (
    input.product_group !== '' &&
    input.Adm == '' &&
    input.nonAdm == '' &&
    input.order_status == '' &&
    input.royality_approval == '' &&
    Array.isArray(input.product) &&
    input.product.length == 0 &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0
  ) {
    console.log('product group');
    const productAggregationPipelineRecord: any = [
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
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product',
        },
      },
      {
        $addFields: {
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalSaleTaxAmount: {
            $sum: '$salesTaxAmount',
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
          totalSaleTaxAmount: {
            $gt: 0,
          },
        },
      },
      {
        $group: {
          _id: '$product',
          name: {
            $first: '$product.name', // Retrieve product name
          },
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalSaleTaxAmount: {
            $sum: '$totalSaleTaxAmount',
          },
          totalInvoices: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          name: 1,
          totalQty: 1,
          totalAmount: 1,
          totalSaleTaxAmount: 1,
          totalInvoices: 1,
          _id: 0,
        },
      },
      {
        $sort: {
          totalQty: -1,
          totalAmount: -1,
        },
      },
    ];

    const productAggregationPipeline: any = [
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
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product',
        },
      },
      {
        $addFields: {
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalSaleTaxAmount: {
            $sum: '$salesTaxAmount',
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
          totalSaleTaxAmount: {
            $gt: 0,
          },
        },
      },
      {
        $group: {
          _id: '$product',
          name: {
            $first: '$product.name', // Retrieve product name
          },
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalSaleTaxAmount: {
            $sum: '$totalSaleTaxAmount',
          },
          totalInvoices: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          name: 1,
          totalQty: 1,
          totalAmount: 1,
          totalSaleTaxAmount: 1,
          totalInvoices: 1,
          _id: 0,
        },
      },
      {
        $sort: {
          totalQty: -1,
          totalAmount: -1,
        },
      },
    ];

    const product_group = await InvoiceDtlModel.aggregate(
      productAggregationPipeline
    );
    const total_records = await InvoiceDtlModel.aggregate(
      productAggregationPipelineRecord
    );
    const invoiceRecordSum = total_records.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );
    const totalQtySum = total_records.reduce(
      (sum, item) => sum + item.totalQty,
      0
    );
    const totalAmountSum = total_records.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const totalSaleTaxAmountSum = total_records.reduce(
      (sum, item) => sum + item.totalSaleTaxAmount,
      0
    );

    const result = {
      product_group: product_group,
      paginated_record: product_group.length,
      total_records: total_records.length,
      invoiceTotalRecordSum: invoiceRecordSum,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalSaleTaxAmountSum: totalSaleTaxAmountSum,
    };
    return result;
  } else if (
    input.customer_group !== '' &&
    input.Adm == '' &&
    input.nonAdm == '' &&
    input.order_status == '' &&
    input.royality_approval == '' &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.product) &&
    input.product.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0
  ) {
    console.log('customer general ');
    const customerAggregationPipelineRecord: any = [
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
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $addFields: {
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalSaleTaxAmount: {
            $sum: '$salesTaxAmount',
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
          totalSaleTaxAmount: {
            $gt: 0,
          },
        },
      },
      {
        $group: {
          _id: '$customer',
          name: {
            $first: '$customer.name',
          },
          // Retrieve customer name
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalSaleTaxAmount: {
            $sum: '$totalSaleTaxAmount',
          },
          totalInvoices: {
            $sum: 1,
          }, //
        },
      },
      {
        $project: {
          name: 1,
          totalQty: 1,
          totalAmount: 1,
          totalSaleTaxAmount: 1,
          totalInvoices: 1,
          _id: 0,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ];
    const customerAggregationPipeline: any = [
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
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $addFields: {
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalSaleTaxAmount: {
            $sum: '$salesTaxAmount',
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
          totalSaleTaxAmount: {
            $gt: 0,
          },
        },
      },
      {
        $group: {
          _id: '$customer',
          name: {
            $first: '$customer.name',
          },
          // Retrieve customer name
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalSaleTaxAmount: {
            $sum: '$totalSaleTaxAmount',
          },
          totalInvoices: {
            $sum: 1,
          }, //
        },
      },
      {
        $project: {
          name: 1,
          totalQty: 1,
          totalAmount: 1,
          totalSaleTaxAmount: 1,
          totalInvoices: 1,
          _id: 0,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ];
    const customer_group = await InvoiceDtlModel.aggregate(
      customerAggregationPipeline
    );
    const total_records = await InvoiceDtlModel.aggregate(
      customerAggregationPipelineRecord
    );

    const customerQtySum = total_records.reduce(
      (sum, item) => sum + item.totalQty,
      0
    );
    const customerinvoiceRecordSum = total_records.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );
    const customertotalSaleTaxAmountSum = total_records.reduce(
      (sum, item) => sum + item.totalSaleTaxAmount,
      0
    );
    const customertotalAmountSum = total_records.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const result = {
      customer_group: customer_group,
      paginated_records: customer_group.length,
      total_records: total_records.length,
      customerTotalQtySum: customerQtySum,
      customerTotalInvoiceRecordSum: customerinvoiceRecordSum,
      totalSaleTaxAmountSum: customertotalSaleTaxAmountSum,
      customertotalAmountSum: customertotalAmountSum,
    };
    return result;
  } else if (
    input.salesContract_group !== '' &&
    input.Adm == '' &&
    input.nonAdm == '' &&
    input.order_status == '' &&
    input.royality_approval == '' &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.product) &&
    input.product.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0
  ) {
    const salesContractAggregationPipelineRecord: any = [
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
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContract',
        },
      },
      {
        $addFields: {
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalSaleTaxAmount: {
            $sum: '$salesTaxAmount',
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
          totalSaleTaxAmount: {
            $gt: 0,
          },
        },
      },
      {
        $group: {
          _id: '$salesContract',
          salesContractNumber: {
            $first: '$salesContract.contractNumber', // Retrieve sales contract number or identifier
          },
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalSaleTaxAmount: {
            $sum: '$totalSaleTaxAmount',
          },
          totalInvoices: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          salesContractNumber: 1,
          totalQty: 1,
          totalAmount: 1,
          totalSaleTaxAmount: 1,
          totalInvoices: 1,
          _id: 0,
        },
      },
      {
        $sort: {
          totalQty: -1,
          totalAmount: -1,
        },
      },
    ];
    const salesContractAggregationPipeline: any = [
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
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContract',
        },
      },
      {
        $addFields: {
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalSaleTaxAmount: {
            $sum: '$salesTaxAmount',
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
          totalSaleTaxAmount: {
            $gt: 0,
          },
        },
      },
      {
        $group: {
          _id: '$salesContract',
          salesContractNumber: {
            $first: '$salesContract.contractNumber', // Retrieve sales contract number or identifier
          },
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalSaleTaxAmount: {
            $sum: '$totalSaleTaxAmount',
          },
          totalInvoices: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          salesContractNumber: 1,
          totalQty: 1,
          totalAmount: 1,
          totalSaleTaxAmount: 1,
          totalInvoices: 1,
          _id: 0,
        },
      },
      {
        $sort: {
          totalQty: -1,
          totalAmount: -1,
        },
      },
    ];
    const salecontract_group = await InvoiceDtlModel.aggregate(
      salesContractAggregationPipeline
    );
    const total_record = await InvoiceDtlModel.aggregate(
      salesContractAggregationPipelineRecord
    );

    const totalInvoiceSum = total_record.reduce(
      (sum, item) => sum + item.totalInvoices,
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
    const totalSaleTaxAmountSum = total_record.reduce(
      (sum, item) => sum + item.totalSaleTaxAmount,
      0
    );
    const salesContractNumberSum = total_record.reduce(
      (sum, item) => sum + item.salesContractNumber,
      0
    );
    const result = {
      salecontract_group: salecontract_group,
      total_records: salecontract_group.length,
      paginated_record: total_record.length,
      totalInvoiceSum: totalInvoiceSum,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      salesContractNumberSum: salesContractNumberSum,
      totalSaleTaxAmountSum: totalSaleTaxAmountSum,
    };
    return result;
  } else if (
    input.brand_group !== '' &&
    input.Adm == '' &&
    input.nonAdm == '' &&
    input.order_status == '' &&
    input.royality_approval == '' &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.product) &&
    input.product.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0
  ) {
    console.log('brand group general');

    const brandAggregationPipelineRecord: any = [
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
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
        },
      },
      {
        $addFields: {
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalSaleTaxAmount: {
            $sum: '$salesTaxAmount',
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
          totalSaleTaxAmount: {
            $gt: 0,
          },
        },
      },
      {
        $group: {
          _id: '$brand',
          name: {
            $first: '$brand.name',
          },
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalSaleTaxAmount: {
            $sum: '$totalSaleTaxAmount',
          },
          totalInvoices: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          name: 1,
          totalQty: 1,
          totalAmount: 1,
          totalSaleTaxAmount: 1,
          totalInvoices: 1,
          _id: 0,
        },
      },
      {
        $sort: {
          totalQty: -1,
          totalAmount: -1,
        },
      },
    ];

    const brandAggregationPipeline: any = [
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
        $group: {
          _id: '$brand._id',
          name: { $first: '$brand.name' },
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
          totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
          totalInvoices: { $sum: 1 },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
          totalSaleTaxAmount: { $gt: 0 },
        },
      },
      {
        $project: {
          name: 1,
          totalQty: 1,
          totalAmount: 1,
          totalSaleTaxAmount: 1,
          totalInvoices: 1,
        },
      },
      {
        $sort: {
          totalQty: -1,
          totalAmount: -1,
        },
      },
    ];
    const brandgroup = await InvoiceDtlModel.aggregate(
      brandAggregationPipeline
    );

    const total_records = await InvoiceDtlModel.aggregate(
      brandAggregationPipelineRecord
    );

    const totalInvoicesSum = total_records.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );
    const invoicetotalSaleTaxAmountSum = total_records.reduce(
      (sum, item) => sum + item.totalSaleTaxAmount,
      0
    );
    const totalQtySum = total_records.reduce(
      (sum, item) => sum + item.totalQty,
      0
    );
    const totalAmountSum = total_records.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const result = {
      brand_groupby: brandgroup,
      total_records: total_records.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalInvoicesSum: totalInvoicesSum,
      totalSaleTaxAmount: invoicetotalSaleTaxAmountSum,
    };
    return result;
  } else if (
    input.order_status !== '' &&
    input.royality_approval == '' &&
    input.Adm == '' &&
    input.nonAdm == '' &&
    input.customer_group == '' &&
    input.product_group == '' &&
    input.brand_group == '' &&
    input.salesContract_group == '' &&
    Array.isArray(input.product) &&
    input.product.length == 0 &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0
  ) {
    console.log('order_status filter print');

    const order_status = input.order_status;

    // const allrecordgroupby = await SalesContractDtlModel.aggregate([
    //   {
    //     $match: {
    //       contractDate: {
    //         $gte: new Date(input.fromDate),
    //         $lte: new Date(input.toDate),
    //       },
    //       isDeleted: false,
    //       invoice: true,
    //       order_status: order_status,
    //     },
    //   },
    //   {
    //     $group: {
    //       _id: 'null',
    //       rate: {
    //         $sum: '$rate',
    //       },
    //       amount: {
    //         $sum: '$amount',
    //       },
    //       qty: {
    //         $sum: '$qty',
    //       },
    //     },
    //   },
    // ]);

    // const totalQty = allrecordgroupby.map((item: any) => item.qty);
    // const totalRate = allrecordgroupby.map((item: any) => item.rate);
    // const totalAmount = allrecordgroupby.map((item: any) => item.amount);
    // let where: any = {
    //   contractDate: {
    //     $gte: new Date(input.fromDate),
    //     $lte: new Date(input.toDate),
    //   },
    //   isDeleted: false,
    //   invoice: true,
    //   order_status: order_status,
    // };
    // const salesContract = await SalesContractDtlModel.find(where);

    // const saleContractDetail = await SalesContractDtlModel.aggregate([
    //   {
    //     $match: where,
    //   },
    //   {
    //     $lookup: {
    //       from: 'salescontracts',
    //       localField: 'salesContract',
    //       foreignField: '_id',
    //       as: 'sale_dtl',
    //       pipeline: [
    //         {
    //           $lookup: {
    //             from: 'paymentterms',
    //             localField: 'paymentTerm',
    //             foreignField: '_id',
    //             as: 'payment_term',
    //           },
    //         },
    //       ],
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'brands',
    //       localField: 'brand',
    //       foreignField: '_id',
    //       as: 'branddtl',
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'customers',
    //       localField: 'customer',
    //       foreignField: '_id',
    //       as: 'customer_dtl',
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'invoicedtls',
    //       localField: 'salesContract',
    //       foreignField: 'salesContract',
    //       as: 'inv_dtl',
    //       pipeline: [
    //         {
    //           $lookup: {
    //             from: 'invoices',
    //             localField: 'invoice',
    //             foreignField: '_id',
    //             as: 'invoice',
    //           },
    //         },
    //       ],
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
    //       from: 'currencies',
    //       localField: 'currency',
    //       foreignField: '_id',
    //       as: 'currency_dtl',
    //     },
    //   },

    //   { $sort: { totalQty: -1, totalAmount: -1 } },
    // ]);

    const inv_dtl = await InvoiceDtlModel.aggregate([
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
          from: 'salescontractdtls',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'sale_dtl',
          pipeline: [
            {
              $match: {
                order_status: order_status,
              },
            },
          ],
        },
      },
      {
        $match: {
          'sale_dtl.0': {
            $exists: true,
          },
        },
      },
      {
        $lookup: {
          from: 'invoices',
          localField: 'invoice',
          foreignField: '_id',
          as: 'invoice',
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salescontract',
          pipeline: [
            {
              $lookup: {
                from: 'paymentterms',
                localField: 'paymentTerm',
                foreignField: '_id',
                as: 'payment_term',
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
          as: 'customer_dtl',
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product_dtl',
        },
      },
      {
        $unwind: {
          path: '$salescontract',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: '$salescontract.payment_term',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: '$customer_dtl',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: '$product_dtl',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: '$invoice',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $sort: { date: -1 },
      },
      {
        $facet: {
          Summary: [
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
                _id: null,
                qty: { $sum: '$qty' },
                rate: { $sum: '$rate' },
                amount: { $sum: '$amount' },
                salesTaxAmount: { $sum: '$salesTaxAmount' },
              },
            },
          ],
          AmountPkr: [
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
              $addFields: {
                AmountInPkr: {
                  $multiply: ['$amount', '$rate'],
                },
              },
            },
            {
              $group: {
                _id: null,
                totalAmountInPkr: { $sum: '$AmountInPkr' },
              },
            },
          ],
          TotalValue: [
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
              $addFields: {
                totalValue: {
                  $sum: {
                    $divide: [
                      {
                        $multiply: [
                          '$amount',
                          '$exchangeRate',
                          '$salesTaxRate',
                        ],
                      },
                      100,
                    ],
                  },
                },
              },
            },
            {
              $group: {
                _id: null,
                totalAmountInPkr: { $sum: '$totalValue' },
              },
            },
          ],
          ItemDetails: [
            {
              $project: {
                qty: 1,
                amount: 1,
                uom: 1,
                salesTaxAmount: 1,
                rate: 1,
                exchangeRate: 1,
                salesTaxRate: 1,
                contract: '$salescontract.contract',
                saleTaxInvoiceNo: '$invoice.salesTaxInvoiceNo',
                invoiceDate: '$invoice.date',
                customerName: '$customer_dtl.name',
                productName: '$product_dtl.name',
              },
            },
          ],
        },
      },
    ]);
    const total_records = await InvoiceDtlModel.aggregate([
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
          from: 'salescontractdtls',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'sale_dtl',
          pipeline: [
            {
              $match: {
                order_status: order_status,
              },
            },
          ],
        },
      },
      {
        $match: {
          'sale_dtl.0': {
            $exists: true,
          },
        },
      },
    ]);

    let result = {
      inv_dtl: inv_dtl,
      total_records: total_records.length,
      paginated_record: inv_dtl[0].ItemDetails.length,
      // totalQty: totalQty,
      // totalRate: totalRate,
      // totalAmount: totalAmount,
    };
    return result;
  } else if (
    input.royality_approval !== '' &&
    input.order_status == '' &&
    input.Adm == '' &&
    input.nonAdm == '' &&
    input.customer_group == '' &&
    input.salesContract_group == '' &&
    input.product_group == '' &&
    input.brand_group == '' &&
    Array.isArray(input.product) &&
    input.product.length == 0 &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0
  ) {
    console.log('royality approval filter');

    function stringToBoolean(str: string | undefined) {
      return str?.toLowerCase() === 'true';
    }

    const baseMatch = {
      contractDate: {
        $gte: new Date(input.fromDate),
        $lte: new Date(input.toDate),
      },
      isDeleted: false,
      royality_approval: stringToBoolean(input.royality_approval),
      invoice: true,
    };

    const salegroupby = await InvoiceDtlModel.aggregate([
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
          from: 'salescontractdtls',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'sale_dtl',
          pipeline: [
            {
              $match: {
                royality_approval: stringToBoolean(input.royality_approval),
              },
            },
          ],
        },
      },
      {
        $addFields: {
          sale_dtl: {
            $arrayElemAt: ['$sale_dtl', 0],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalQty: {
            $sum: '$qty',
          },
          totalRate: {
            $sum: '$rate',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalSaleTaxAmount: {
            $sum: '$salesTaxAmount',
          },
          data: {
            $push: '$$ROOT',
          },
        },
      },
      {
        $addFields: {
          totalValue: {
            $sum: {
              $map: {
                input: '$data',
                as: 'item',
                in: {
                  $divide: [
                    {
                      $multiply: [
                        '$$item.amount',
                        '$$item.exchangeRate',
                        '$$item.salesTaxRate',
                      ],
                    },
                    100,
                  ],
                },
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalQty: 1,
          totalRate: 1,
          totalValue: 1,
          totalAmount: 1,
          totalSaleTaxAmount: 1,
          data: 1,
        },
      },
    ]);

    const inv_rate = salegroupby.flatMap(
      (item) => item.data.map((dataItem: any) => dataItem.rate || 0) // Default to 0 if rate is missing
    );
    const inv_amount = salegroupby.flatMap(
      (item) => item.data.map((dataItem: any) => dataItem.amount || 0) // Default to 0 if amount is missing
    );

    const qtypkr = inv_amount.map((amount, index) => amount * inv_rate[index]);

    const AmountPKR = qtypkr.reduce((total, value) => total + value, 0);

    const invoice_dtl = await InvoiceDtlModel.aggregate([
      {
        $lookup: {
          from: 'salescontractdtls',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'sale_dtl',
          pipeline: [
            {
              $match: {
                royality_approval: stringToBoolean(input.royality_approval),
              },
            },
            {
              $lookup: {
                from: 'salescontracts',
                localField: 'salesContract',
                foreignField: '_id',
                as: 'salecontract',
              },
            },
          ],
        },
      },
      {
        $match: {
          'sale_dtl.0': {
            $exists: true,
          },
        },
      },
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
          from: 'invoices',
          localField: 'invoice',
          foreignField: '_id',
          as: 'invoice',
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
          as: 'customer_dtl',
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
        $sort: {
          date: -1,
        },
      },
    ]);

    const totalQty = salegroupby.map((item: any) => item.totalQty);
    const totalRate = salegroupby.map((item: any) => item.totalRate);
    const totalAmount = salegroupby.map((item: any) => item.totalAmount);
    const totalValue = salegroupby.map((item: any) => item.totalValue);
    const saleTaxAmount = salegroupby.map(
      (item: any) => item.totalSaleTaxAmount
    );
    let result = {
      shipmentdtl: invoice_dtl,
      paginated_record: invoice_dtl.length,
      total_records: invoice_dtl.length,
      totalQty: totalQty,
      totalRate: totalRate,
      totalAmount: totalAmount,
      saleTaxAmount: saleTaxAmount,
      AmountPKR: AmountPKR,
      totalValue: totalValue,
    };
    return result;
  } else if (
    input.customer_group == '' &&
    input.product_group == '' &&
    input.brand_group == '' &&
    input.Adm == '' &&
    input.nonAdm == '' &&
    (input.order_status !== '' ||
      input.royality_approval !== '' ||
      (Array.isArray(input.product) && input.product.length !== 0) ||
      (Array.isArray(input.customer) && input.customer.length !== 0) ||
      (Array.isArray(input.brand) && input.brand.length !== 0) ||
      (Array.isArray(input.salesContract) && input.salesContract.length !== 0))
  ) {
    console.log('general condition');

    const salecontractArr = input.salesContract
      ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const productArr = input.product
      ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const customerArr = input.customer
      ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];

    let filter: any = {};
    let filter_records: any = {};
    let where: any = {};

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

    const invoiceamountpkr = await InvoiceDtlModel.aggregate([
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
        $match: filter,
      },
    ]);

    let SaleTaxAmount;
    let AmountPKR;
    if (Array.isArray(invoiceamountpkr) && invoiceamountpkr.length == 0) {
      SaleTaxAmount = [];
      AmountPKR = [];
    } else {
      const qty = invoiceamountpkr.map((item) => (item.qty ? item.qty : []));
      const saletaxrate = invoiceamountpkr.map((item) => item.salesTaxRate);
      const rate = invoiceamountpkr.map((item) => (item.rate ? item.rate : []));

      const saletax = qty.map((amount, index) => amount * rate[index]);

      const saletaxamount = saletaxrate.map(
        (amount, index) => amount * saletax[index]
      );

      SaleTaxAmount = saletaxamount.reduce((total, value) => total + value);

      const Amount = invoiceamountpkr.map((item) =>
        item.amount ? item.amount : []
      );
      const Rate = invoiceamountpkr.map((item) =>
        item.rate ? item.exchangeRate : []
      );

      const qtypkr = Amount.map((amount, index) => amount * Rate[index]);

      AmountPKR = qtypkr.reduce((total, value) => total + value, 0);
    }

    const total_record = await InvoiceDtlModel.aggregate([
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
        $match: filter_records,
      },
    ]);
    const invoicegroupby = await InvoiceDtlModel.aggregate([
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
        $match: filter,
      },
      {
        $group: {
          _id: null,
          totalQty: {
            $sum: '$qty',
          },
          totalRate: {
            $sum: '$rate',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalSaleTaxAmount: {
            $sum: '$salesTaxAmount',
          },
          data: {
            $push: '$$ROOT',
          },
        },
      },
      {
        $addFields: {
          totalValue: {
            $sum: {
              $map: {
                input: '$data',
                as: 'item',
                in: {
                  $divide: [
                    {
                      $multiply: [
                        '$$item.amount',
                        '$$item.exchangeRate',
                        '$$item.salesTaxRate',
                      ],
                    },
                    100,
                  ],
                },
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalQty: 1,
          totalRate: 1,
          totalValue: 1,
          totalAmount: 1,
          totalSaleTaxAmount: 1,
          data: 1,
        },
      },
    ]);
    const totalQty = invoicegroupby.map((item) => item.totalQty);
    const totalAmount = invoicegroupby.map((item) => item.totalAmount);
    const totalRate = invoicegroupby.map((item) => item.totalRate);
    const totalValue = invoicegroupby.map((item) => item.totalValue);
    const invoice_detail = await InvoiceDtlModel.aggregate([
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
        $match: where,
      },
      {
        $lookup: {
          from: 'invoices',
          localField: 'invoice',
          foreignField: '_id',
          as: 'inv_dtl',
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'sale_dtl',
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer_dtl',
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

      { $sort: { date: -1 } },
    ]);
    if (Array.isArray(invoice_detail) && invoice_detail.length == 0) {
      const result = {
        invoice_dtl: [],
        total_record: [],
        paginated_record: [],
        totalAmount: [],
        totalQty: [],
        totalRate: [],
        totalAmountPKR: [],
        SaleTaxAmount: [],
      };
      return result;
    } else {
      const result = {
        invoice_detail: invoice_detail,
        total_records: total_record.length,
        paginated_record: invoice_detail.length,
        totalAmount: totalAmount,
        totalQty: totalQty,
        totalRate: totalRate,
        totalValue: totalValue,
        totalAmountPKR: AmountPKR,
        SaleTaxAmount: SaleTaxAmount,
      };
      return result;
    }
  } else if (
    input.customer_group !== '' &&
    input.royality_approval == '' &&
    input.order_status == '' &&
    Array.isArray(input.customer) &&
    input.customer.length !== 0 &&
    Array.isArray(input.product) &&
    input.product.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0
  ) {
    console.log('customer group customer ');

    const customerArr = input.customer
      ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const customer = await InvoiceDtlModel.aggregate([
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
        $match: {
          isDeleted: false,
          customer: { $in: customerArr },
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer_details',
        },
      },
      {
        $addFields: {
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
          totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
          totalSaleTaxAmount: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: '$customer', // Group by customer ID
          name: { $first: '$customer_details.name' }, // Retrieve customer name
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
          totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
          totalInvoices: { $sum: 1 }, // Count the number of contracts for each customer
        },
      },
      {
        $project: {
          name: 1,
          totalQty: 1,
          totalAmount: 1,
          totalInvoices: 1,
          totalSaleTaxAmount: 1,
          _id: 0, // Exclude _id field
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ]);

    const totalInvoicesSum = customer.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );

    const totalQtySum = customer.reduce((sum, item) => sum + item.totalQty, 0);
    const totalAmountSum = customer.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const totalSaleTaxAmountSum = customer.reduce(
      (sum, item) => sum + item.totalSaleTaxAmount,
      0
    );
    const result = {
      customer_groupby: customer,
      total_records: customer.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalSaleTaxAmountSum: totalSaleTaxAmountSum,
      totalInvoicesSum: totalInvoicesSum,
    };
    return result;
  } else if (
    input.product_group !== '' &&
    input.royality_approval == '' &&
    input.order_status == '' &&
    Array.isArray(input.product) &&
    input.product.length !== 0 &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0
  ) {
    console.log('product to product group');

    const productArr = input.product
      ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];

    const product = await InvoiceDtlModel.aggregate([
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
        $match: {
          isDeleted: false,
          product: { $in: productArr },
        },
      },

      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      {
        $group: {
          _id: '$product',
          name: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
          totalInvoices: { $sum: 1 },
          totalQty: { $sum: '$qty' },
          totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
          totalSaleTaxAmount: { $gt: 0 },
        },
      },
      {
        $project: {
          name: 1,
          totalInvoices: 1,
          totalQty: 1,
          totalAmount: 1,
          totalSaleTaxAmount: 1,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ]);

    const totalInvoices = product.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );
    const totalQtySum = product.reduce((sum, item) => sum + item.totalQty, 0);
    const totalAmountSum = product.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const totalSaleTaxAmountSum = product.reduce(
      (sum, item) => sum + item.totalSaleTaxAmount,
      0
    );
    const result = {
      product_groupby: product,
      total_records: product.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalInvoicesSum: totalInvoices,
      totalSaleTaxAmountSum: totalSaleTaxAmountSum,
    };
    return result;
  } else if (
    input.customer_group !== '' &&
    input.royality_approval == '' &&
    input.order_status == '' &&
    Array.isArray(input.brand) &&
    input.brand.length !== 0 &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.product) &&
    input.product.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0
  ) {
    console.log('customer group brand');

    const brandArr = input.brand
      ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const customer = await InvoiceDtlModel.aggregate([
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
        $match: {
          isDeleted: false,
          brand: { $in: brandArr },
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer_details',
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand_details',
        },
      },
      {
        $addFields: {
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
          totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
          totalSaleTaxAmount: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: '$customer', // Group by customer ID
          customerName: { $first: '$customer_details.name' },
          brandName: { $first: '$brand_details.name' }, // Retrieve customer name
          totalQty: { $sum: '$qty' },
          totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
          totalAmount: { $sum: '$amount' },
          totalInvoices: { $sum: 1 }, // Count the number of contracts for each customer
        },
      },
      {
        $project: {
          customerName: 1,
          brandName: 1,
          totalQty: 1,
          c: 1,
          totalAmount: 1,
          totalSaleTaxAmount: 1,
          totalInvoices: 1,
          _id: 0, // Exclude _id field
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ]);

    const totalInvoicesSum = customer.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );
    const totalQtySum = customer.reduce((sum, item) => sum + item.totalQty, 0);
    const totalAmountSum = customer.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const totalSaleTaxAmount = customer.reduce(
      (sum, item) => sum + item.totalSaleTaxAmount,
      0
    );

    const result = {
      customer_groupby: customer,
      total_records: customer.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalInvoicesSum: totalInvoicesSum,
      totalSaleTaxAmount: totalSaleTaxAmount,
    };
    return result;
  } else if (
    input.product_group !== '' &&
    input.royality_approval == '' &&
    input.order_status == '' &&
    Array.isArray(input.brand) &&
    input.brand.length !== 0 &&
    Array.isArray(input.product) &&
    input.product.length == 0 &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0
  ) {
    console.log('product to brand');

    const total_records = await BrandModel.countDocuments();
    const brandArr = input.brand
      ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];

    const product = await InvoiceDtlModel.aggregate([
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
        $match: {
          // isDeleted: false,
          brand: { $in: brandArr },
        },
      },

      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brandInfo',
        },
      },
      {
        $group: {
          _id: '$product',
          productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
          brandName: { $first: { $arrayElemAt: ['$brandInfo.name', 0] } },
          totalInvoices: { $sum: 1 },
          totalQty: { $sum: '$qty' },
          totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
          totalSaleTaxAmount: { $gt: 0 },
        },
      },
      {
        $project: {
          productName: 1,
          brandName: 1,
          totalInvoices: 1,
          totalQty: 1,
          totalSaleTaxAmount: 1,
          totalAmount: 1,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ]);

    const totalInvoices = product.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );
    const totalQtySum = product.reduce((sum, item) => sum + item.totalQty, 0);
    const totalAmountSum = product.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const totalSaleTaxAmountSum = product.reduce(
      (sum, item) => sum + item.totalSaleTaxAmount,
      0
    );
    const result = {
      product_groupby: product,
      total_records: total_records,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalInvoicesSum: totalInvoices,
      totalSaleTaxAmountSum: totalSaleTaxAmountSum,
    };
    return result;
  } else if (
    input.brand_group !== '' &&
    input.royality_approval == '' &&
    input.order_status == '' &&
    Array.isArray(input.brand) &&
    input.brand.length !== 0 &&
    Array.isArray(input.product) &&
    input.product.length == 0 &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length !== 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length !== 0
  ) {
    console.log('brandgroup brand');
    const brandArr = input.brand
      ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];

    const total_records = await BrandModel.countDocuments();

    const brandgroup = await InvoiceDtlModel.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },

          isDeleted: false,
          brand: { $in: brandArr },
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
        $unwind: '$brand',
      },
      {
        $group: {
          _id: '$brand._id', // Group by brand's _id
          name: { $first: '$brand.name' },
          totalInvoices: { $sum: 1 }, // Calculate the total number of contracts
          totalQty: { $sum: '$qty' }, // Calculate the total quantity
          totalAmount: { $sum: '$amount' },
          totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
          totalSaleTaxAmount: { $gt: 0 },
        },
      },
      {
        $project: {
          _id: 0, // Exclude _id field
          name: 1,
          totalInvoices: 1,
          totalQty: 1,
          totalAmount: 1,
          totalSaleTaxAmount: 1,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ]);

    const totalInvoiceSum = brandgroup.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );
    const totalQtySum = brandgroup.reduce(
      (sum, item) => sum + item.totalQty,
      0
    );
    const totalAmountSum = brandgroup.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const totalSaleTaxAmountSum = brandgroup.reduce(
      (sum, item) => sum + item.totalSaleTaxAmount,
      0
    );
    const result = {
      brand_groupby: brandgroup,
      total_records: brandgroup.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalInvoiceSum: totalInvoiceSum,
      totalSaleTaxAmountSum: totalSaleTaxAmountSum,
    };
    return result;
  } else if (
    input.brand_group !== '' &&
    input.royality_approval == '' &&
    input.order_status == '' &&
    Array.isArray(input.customer) &&
    input.customer.length !== 0 &&
    Array.isArray(input.product) &&
    input.product.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0
  ) {
    console.log('brand to customer');
    const customerArr = input.customer
      ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];

    const brandgroup = await InvoiceDtlModel.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          customer: { $in: customerArr },
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
          _id: '$brand._id',
          brandName: {
            $first: '$brand.name',
          },
          customerName: { $first: '$customer.name' },
          totalInvoices: {
            $sum: 1,
          },
          totalQty: {
            $sum: '$qty',
          },
          totalSaleTaxAmount: {
            $sum: '$salesTaxAmount',
          },
          totalAmount: {
            $sum: '$amount',
          },
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ]);

    const totalInvoicesSum = brandgroup.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );
    const totalQtySum = brandgroup.reduce(
      (sum, item) => sum + item.totalQty,
      0
    );
    const totalAmountSum = brandgroup.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const totalSaleTaxAmountSum = brandgroup.reduce(
      (sum, item) => sum + item.totalSaleTaxAmount,
      0
    );
    const result = {
      brand_groupby: brandgroup,
      total_records: brandgroup.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalSaleTaxAmountSum: totalSaleTaxAmountSum,
      totalInvoicesSum: totalInvoicesSum,
    };
    return result;
  } else if (
    input.product_group !== '' &&
    input.royality_approval == '' &&
    input.order_status == '' &&
    Array.isArray(input.customer) &&
    input.customer.length !== 0 &&
    Array.isArray(input.product) &&
    input.product.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0
  ) {
    console.log('product group customer');
    const customerArr = input.customer
      ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const productdtl = await InvoiceDtlModel.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,

          customer: { $in: customerArr },
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
          as: 'products',
        },
      },

      {
        $group: {
          _id: '$products._id',
          productName: {
            $first: '$products.name',
          },
          customerName: {
            $first: '$customer.name',
          },
          totalInvoices: {
            $sum: 1,
          },
          totalSaleTaxAmount: {
            $sum: '$salesTaxAmount',
          },
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ]);

    const totalInvoiceSum = productdtl.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );
    const totalQtySum = productdtl.reduce(
      (sum, item) => sum + item.totalQty,
      0
    );
    const totalAmountSum = productdtl.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const totalSaleTaxAmountSum = productdtl.reduce(
      (sum, item) => sum + item.totalSaleTaxAmount,
      0
    );
    const result = {
      product_groupby: productdtl,
      total_records: productdtl.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalInvoiceSum: totalInvoiceSum,
      totalSaleTaxAmountSum: totalSaleTaxAmountSum,
    };
    return result;
  } else if (
    input.customer_group !== '' &&
    input.royality_approval == '' &&
    input.order_status == '' &&
    Array.isArray(input.product) &&
    input.product.length !== 0 &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0
  ) {
    console.log('product to customer');
    const productArr = input.product
      ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const customerdtl = await InvoiceDtlModel.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,

          product: { $in: productArr },
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
          _id: '$customer._id',
          CustomerName: {
            $first: '$customer.name',
          },
          productName: {
            $first: '$product.name',
          },
          totalInvoices: {
            $sum: 1,
          },
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalSaleTaxAmount: {
            $sum: '$salesTaxAmount',
          },
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ]);
    const totalInvoicesSum = customerdtl.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );
    const totalQtySum = customerdtl.reduce(
      (sum, item) => sum + item.totalQty,
      0
    );
    const totalAmountSum = customerdtl.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const totalSaleTaxAmountSum = customerdtl.reduce(
      (sum, item) => sum + item.totalSaleTaxAmount,
      0
    );
    const result = {
      customer_groupby: customerdtl,
      total_records: customerdtl.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalInvoicesSum: totalInvoicesSum,
      totalSaleTaxAmountSum: totalSaleTaxAmountSum,
    };
    return result;
  } else if (
    input.brand_group !== '' &&
    input.royality_approval == '' &&
    input.order_status == '' &&
    Array.isArray(input.product) &&
    input.product.length !== 0 &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0
  ) {
    console.log('product to brand');

    const productArr = input.product
      ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const branddtl = await InvoiceDtlModel.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          product: { $in: productArr },
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
          productname: {
            $first: '$products.name',
          },
          brandname: {
            $first: '$brand.name',
          },
          totalInvoices: {
            $sum: 1,
          },
          totalQty: {
            $sum: '$qty',
          },
          totalAmount: {
            $sum: '$amount',
          },
          totalSaleTaxAmount: {
            $sum: '$salesTaxAmount',
          },
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ]);
    const totalInvoicesSum = branddtl.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );
    const totalQtySum = branddtl.reduce((sum, item) => sum + item.totalQty, 0);
    const totalAmountSum = branddtl.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const totalSaleTaxAmountSum = branddtl.reduce(
      (sum, item) => sum + item.totalSaleTaxAmount,
      0
    );
    const result = {
      brand_groupby: branddtl,
      total_records: branddtl.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalInvoicesSum: totalInvoicesSum,
      totalSaleTaxAmountSum: totalSaleTaxAmountSum,
    };
    return result;
  } else if (
    input.customer_group !== '' &&
    input.Adm == '' &&
    input.nonAdm == '' &&
    ((Array.isArray(input.product) && input.product.length !== 0) ||
      (Array.isArray(input.customer) && input.customer.length !== 0) ||
      (Array.isArray(input.brand) && input.brand.length !== 0) ||
      (Array.isArray(input.salesContract) && input.salesContract.length !== 0))
  ) {
    console.log(
      '  customer group with general filters brand customer product salescontract work'
    );

    const salesContractArr = input.salesContract
      ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const customerArr = input.customer
      ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const productArr = input.product
      ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
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

    function stringToBoolean(str: string | undefined) {
      return str?.toLowerCase() === 'true';
    }
    if (input.royality_approval) {
      extrafilter.royality_approval = stringToBoolean(input.royality_approval);
    }
    if (input.order_status !== '') {
      const order_status = input.order_status;

      where.order_status = order_status;
      (filter_records.order_status = order_status),
        (filter.order_status = order_status);
    }

    const customerAggregationPipelineRecords: any = [
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
          totalInvoices: {
            $sum: 1,
          },
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
          salesTaxAmount: {
            $sum: '$salesTaxAmount',
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
          salesTaxAmount: 1,
          totalInvoices: 1,
        },
      },
      { $sort: { qty: -1, amount: -1 } },
    ];

    const customerAggregationPipeline: any = [
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
          totalInvoices: {
            $sum: 1,
          },
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
          salesTaxAmount: {
            $sum: '$salesTaxAmount',
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
          salesTaxAmount: 1,
          totalInvoices: 1,
        },
      },
      { $sort: { qty: -1, amount: -1 } },
    ];

    const customergroup = await InvoiceDtlModel.aggregate(
      customerAggregationPipeline
    );

    const total_records = await InvoiceDtlModel.aggregate(
      customerAggregationPipelineRecords
    );

    const totalInvoicesSum = total_records.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );

    const totalQtySum = total_records.reduce((sum, item) => sum + item.qty, 0);
    const totalAmountSum = total_records.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const totalSaleTaxAmountSum = total_records.reduce(
      (sum, item) => sum + item.salesTaxAmount,
      0
    );
    const result = {
      Group: customergroup,
      total_records: total_records.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalSaleTaxAmountSum: totalSaleTaxAmountSum,
      totalInvoicesSum: totalInvoicesSum,
    };
    return result;
  } else if (
    input.product_group !== '' &&
    input.Adm == '' &&
    input.nonAdm == '' &&
    ((Array.isArray(input.product) && input.product.length !== 0) ||
      (Array.isArray(input.customer) && input.customer.length !== 0) ||
      (Array.isArray(input.brand) && input.brand.length !== 0) ||
      (Array.isArray(input.salesContract) && input.salesContract.length !== 0))
  ) {
    console.log(
      '  product group with general filters brand customer product salescontract work'
    );

    const salesContractArr = input.salesContract
      ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const customerArr = input.customer
      ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const productArr = input.product
      ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
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

    function stringToBoolean(str: string | undefined) {
      return str?.toLowerCase() === 'true';
    }
    if (input.royality_approval) {
      extrafilter.royality_approval = stringToBoolean(input.royality_approval);
    }
    if (input.order_status !== '') {
      const order_status = input.order_status;

      where.order_status = order_status;
      (filter_records.order_status = order_status),
        (filter.order_status = order_status);
    }
    const productAggregationPipelineRecords: any = [
      {
        $match: {
          date: {
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
          totalInvoices: {
            $sum: 1,
          },
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
          salesTaxAmount: {
            $sum: '$salesTaxAmount',
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
          totalInvoices: 1,
          salesTaxAmount: 1,
        },
      },
    ];
    const productAggregationPipeline: any = [
      {
        $match: {
          date: {
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
          totalInvoices: {
            $sum: 1,
          },
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
          salesTaxAmount: {
            $sum: '$salesTaxAmount',
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
          salesTaxAmount: 1,
          totalInvoices: 1,
        },
      },
      { $sort: { qty: -1, amount: -1 } },
    ];
    const productgroup = await InvoiceDtlModel.aggregate(
      productAggregationPipeline
    );
    const total_records = await InvoiceDtlModel.aggregate(
      productAggregationPipelineRecords
    );
    const totalInvoicesSum = total_records.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );

    const totalQtySum = total_records.reduce((sum, item) => sum + item.qty, 0);
    const totalAmountSum = total_records.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const saleTaxAmountSum = total_records.reduce(
      (sum, item) => sum + item.salesTaxAmount,
      0
    );
    const result = {
      Group: productgroup,
      total_records: total_records.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalInvoicesSum: totalInvoicesSum,
      saleTaxAmountSum: saleTaxAmountSum,
    };
    return result;
  } else if (
    input.brand_group !== '' &&
    input.Adm == '' &&
    input.nonAdm == '' &&
    ((Array.isArray(input.product) && input.product.length !== 0) ||
      (Array.isArray(input.customer) && input.customer.length !== 0) ||
      (Array.isArray(input.brand) && input.brand.length !== 0) ||
      (Array.isArray(input.salesContract) && input.salesContract.length !== 0))
  ) {
    console.log(
      '  brand group with general filters brand customer product salescontract work'
    );

    const salesContractArr = input.salesContract
      ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const customerArr = input.customer
      ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const productArr = input.product
      ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
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

    function stringToBoolean(str: string | undefined) {
      return str?.toLowerCase() === 'true';
    }
    if (input.royality_approval) {
      extrafilter.royality_approval = stringToBoolean(input.royality_approval);
    }
    if (input.order_status !== '') {
      const order_status = input.order_status;

      where.order_status = order_status;
      (filter_records.order_status = order_status),
        (filter.order_status = order_status);
    }
    const brandAggregationPipelineRecords: any = [
      {
        $match: {
          date: {
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

          totalInvoices: {
            $sum: 1,
          },
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
          salesTaxAmount: {
            $sum: '$salesTaxAmount',
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
          salesTaxAmount: 1,
          totalInvoices: 1,
        },
      },
      { $sort: { qty: -1, amount: -1 } },
    ];
    const brandAggregationPipeline: any = [
      {
        $match: {
          date: {
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

          totalInvoices: {
            $sum: 1,
          },
          qty: {
            $sum: '$qty',
          },
          amount: {
            $sum: '$amount',
          },
          salesTaxAmount: {
            $sum: '$salesTaxAmount',
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
          salesTaxAmount: 1,
          totalInvoices: 1,
        },
      },
      { $sort: { qty: -1, amount: -1 } },
    ];
    const brandgroup = await InvoiceDtlModel.aggregate(
      brandAggregationPipeline
    );
    const total_records = await InvoiceDtlModel.aggregate(
      brandAggregationPipelineRecords
    );

    const totalInvoicesSum = total_records.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );

    const totalQtySum = total_records.reduce((sum, item) => sum + item.qty, 0);
    const totalAmountSum = total_records.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const totalSaleTaxAmountSum = total_records.reduce(
      (sum, item) => sum + item.salesTaxAmount,
      0
    );
    const result = {
      Group: brandgroup,
      total_records: total_records.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalSaleTaxAmountSum: totalSaleTaxAmountSum,
      totalInvoicesSum: totalInvoicesSum,
    };
    return result;
  } else if (
    input.product_group !== '' &&
    input.order_status !== '' &&
    input.royality_approval !== '' &&
    input.nonAdm == '' &&
    input.Adm == ''
  ) {
    console.log('product group  royality_approval and orderstatus');

    function stringToBoolean(str: string | undefined) {
      return str?.toLowerCase() === 'true';
    }

    const royality_approval = stringToBoolean(input.royality_approval);
    const order_status = input.order_status;

    const productAggregationPipelineRecord: any = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          invoice: true,
          order_status: order_status,
          royality_approval: royality_approval,
        },
      },

      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      {
        $group: {
          _id: '$product',
          productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
          totalInvoices: { $sum: 1 },
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
        },
      },
      {
        $project: {
          productName: 1,
          totalInvoices: 1,
          totalQty: 1,
          totalAmount: 1,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ];

    const productAggregationPipeline: any = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          invoice: true,
          order_status: order_status,
          royality_approval: royality_approval,
        },
      },

      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      {
        $group: {
          _id: '$product',
          productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
          totalInvoices: { $sum: 1 },
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
        },
      },
      {
        $project: {
          productName: 1,
          totalInvoices: 1,
          totalQty: 1,
          totalAmount: 1,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ];

    const product = await SalesContractDtlModel.aggregate(
      productAggregationPipeline
    );
    const total_records = await SalesContractDtlModel.aggregate(
      productAggregationPipelineRecord
    );
    const totalInvoices = product.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );
    const totalQtySum = product.reduce((sum, item) => sum + item.totalQty, 0);
    const totalAmountSum = product.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const result = {
      product_groupby: product,
      total_records: total_records.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalInvoicesSum: totalInvoices,
    };
    return result;
  } else if (
    input.brand_group !== '' &&
    input.order_status !== '' &&
    input.royality_approval !== '' &&
    input.nonAdm == '' &&
    input.Adm == ''
  ) {
    console.log('brand group royality_approval and order_status');

    function stringToBoolean(str: string | undefined) {
      return str?.toLowerCase() === 'true';
    }

    const royality_approval = stringToBoolean(input.royality_approval);
    const order_status = input.order_status;
    const brandAggregationPipelineRecord: any = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          invoice: true,
          order_status: order_status,
          royality_approval: royality_approval,
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
        $unwind: '$brand',
      },
      {
        $group: {
          _id: '$brand._id',
          name: { $first: '$brand.name' },
          totalInvoices: { $sum: 1 },
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
        },
      },
      {
        $project: {
          _id: 0,
          name: 1,
          totalInvoices: 1,
          totalQty: 1,
          totalAmount: 1,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ];
    const brandAggregationPipeline: any = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          invoice: true,
          order_status: order_status,
          royality_approval: royality_approval,
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
        $unwind: '$brand',
      },
      {
        $group: {
          _id: '$brand._id',
          name: { $first: '$brand.name' },
          totalInvoices: { $sum: 1 },
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
        },
      },
      {
        $project: {
          _id: 0,
          name: 1,
          totalInvoices: 1,
          totalQty: 1,
          totalAmount: 1,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ];
    const brandgroup = await SalesContractDtlModel.aggregate(
      brandAggregationPipeline
    );
    const total_records = await SalesContractDtlModel.aggregate(
      brandAggregationPipelineRecord
    );

    const totalInvoicesSum = brandgroup.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );
    const totalQtySum = brandgroup.reduce(
      (sum, item) => sum + item.totalQty,
      0
    );
    const totalAmountSum = brandgroup.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const result = {
      brand_groupby: brandgroup,
      total_records: total_records.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalInvoicesSum: totalInvoicesSum,
    };
    return result;
  } else if (
    input.customer_group !== '' &&
    input.order_status !== '' &&
    input.royality_approval !== '' &&
    input.nonAdm == '' &&
    input.Adm == ''
  ) {
    console.log('all in three ');

    console.log('customer group royality_approval and orderstatus');

    function stringToBoolean(str: string | undefined) {
      return str?.toLowerCase() === 'true';
    }

    const royality_approval = stringToBoolean(input.royality_approval);
    const order_status = input.order_status;
    const customerAggregationPipelineRecords: any = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          invoice: true,
          order_status: order_status,
          royality_approval: royality_approval,
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer_details',
        },
      },
      {
        $addFields: {
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: '$customer', // Group by customer ID
          customerName: { $first: '$customer_details.name' },
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
          totalInvoices: { $sum: 1 },
        },
      },
      {
        $project: {
          customerName: 1,
          totalQty: 1,
          totalAmount: 1,
          totalInvoices: 1,
          _id: 0, // Exclude _id field
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ];

    const customerAggregationPipeline: any = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          invoice: true,
          order_status: order_status,
          royality_approval: royality_approval,
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer_details',
        },
      },
      {
        $addFields: {
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: '$customer', // Group by customer ID
          customerName: { $first: '$customer_details.name' },
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
          totalInvoices: { $sum: 1 },
        },
      },
      {
        $project: {
          customerName: 1,
          totalQty: 1,
          totalAmount: 1,
          totalInvoices: 1,
          _id: 0,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ];
    const customer = await SalesContractDtlModel.aggregate(
      customerAggregationPipeline
    );
    const total_records = await SalesContractDtlModel.aggregate(
      customerAggregationPipelineRecords
    );
    const totalInvoicesSum = customer.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );
    const totalQtySum = customer.reduce((sum, item) => sum + item.totalQty, 0);
    const totalAmountSum = customer.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );

    const result = {
      customer_groupby: customer,
      total_records: total_records.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalInvoicesSum: totalInvoicesSum,
    };
    return result;
  } else if (
    input.product_group !== '' &&
    input.order_status !== '' &&
    input.royality_approval == '' &&
    input.nonAdm == '' &&
    input.Adm == ''
  ) {
    console.log('order_status product group');
    const order_status = input.order_status;
    const productAggregationPipelineRecord: any = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          invoice: true,
          order_status: order_status,
        },
      },

      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      {
        $group: {
          _id: '$product',
          productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
          totalInvoices: { $sum: 1 },
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
        },
      },
      {
        $project: {
          productName: 1,
          totalInvoices: 1,
          totalQty: 1,
          totalAmount: 1,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ];

    const productAggregationPipeline: any = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          invoice: true,
          order_status: order_status,
        },
      },

      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      {
        $group: {
          _id: '$product',
          productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
          totalInvoices: { $sum: 1 },
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
        },
      },
      {
        $project: {
          productName: 1,
          totalInvoices: 1,
          totalQty: 1,
          totalAmount: 1,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ];

    const product = await SalesContractDtlModel.aggregate(
      productAggregationPipeline
    );
    const total_records = await SalesContractDtlModel.aggregate(
      productAggregationPipelineRecord
    );
    const totalInvoices = product.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );
    const totalQtySum = product.reduce((sum, item) => sum + item.totalQty, 0);
    const totalAmountSum = product.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const result = {
      product_groupby: product,
      total_records: total_records.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalInvoicesSum: totalInvoices,
    };
    return result;
  } else if (
    input.customer_group !== '' &&
    input.order_status !== '' &&
    input.royality_approval == '' &&
    input.nonAdm == '' &&
    input.Adm == ''
  ) {
    console.log('customer group order_status');

    const order_status = input.order_status;
    const customerAggregationPipelineRecords: any = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          invoice: true,
          order_status: order_status,
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer_details',
        },
      },
      {
        $addFields: {
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: '$customer', // Group by customer ID
          customerName: { $first: '$customer_details.name' },
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
          totalInvoices: { $sum: 1 },
        },
      },
      {
        $project: {
          customerName: 1,
          totalQty: 1,
          totalAmount: 1,
          totalInvoices: 1,
          _id: 0, // Exclude _id field
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ];

    const customerAggregationPipeline: any = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          invoice: true,
          order_status: order_status,
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer_details',
        },
      },
      {
        $addFields: {
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: '$customer', // Group by customer ID
          customerName: { $first: '$customer_details.name' },
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
          totalInvoices: { $sum: 1 },
        },
      },
      {
        $project: {
          customerName: 1,
          totalQty: 1,
          totalAmount: 1,
          totalInvoices: 1,
          _id: 0,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ];
    const customer = await SalesContractDtlModel.aggregate(
      customerAggregationPipeline
    );
    const total_records = await SalesContractDtlModel.aggregate(
      customerAggregationPipelineRecords
    );
    const totalInvoicesSum = customer.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );
    const totalQtySum = customer.reduce((sum, item) => sum + item.totalQty, 0);
    const totalAmountSum = customer.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );

    const result = {
      customer_groupby: customer,
      total_records: total_records.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalInvoicesSum: totalInvoicesSum,
    };
    return result;
  } else if (
    input.brand_group !== '' &&
    input.order_status !== '' &&
    input.royality_approval == '' &&
    input.nonAdm == '' &&
    input.Adm == ''
  ) {
    console.log('brand group order_status');

    const order_status = input.order_status;
    const brandAggregationPipelineRecord: any = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          invoice: true,
          order_status: order_status,
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
        $unwind: '$brand',
      },
      {
        $group: {
          _id: '$brand._id',
          name: { $first: '$brand.name' },
          totalInvoices: { $sum: 1 },
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
        },
      },
      {
        $project: {
          _id: 0,
          name: 1,
          totalInvoices: 1,
          totalQty: 1,
          totalAmount: 1,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ];
    const brandAggregationPipeline: any = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          invoice: true,
          order_status: order_status,
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
        $unwind: '$brand',
      },
      {
        $group: {
          _id: '$brand._id',
          name: { $first: '$brand.name' },
          totalInvoices: { $sum: 1 },
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
        },
      },
      {
        $project: {
          _id: 0,
          name: 1,
          totalInvoices: 1,
          totalQty: 1,
          totalAmount: 1,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ];
    const brandgroup = await SalesContractDtlModel.aggregate(
      brandAggregationPipeline
    );
    const total_records = await SalesContractDtlModel.aggregate(
      brandAggregationPipelineRecord
    );

    const totalInvoicesSum = brandgroup.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );
    const totalQtySum = brandgroup.reduce(
      (sum, item) => sum + item.totalQty,
      0
    );
    const totalAmountSum = brandgroup.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const result = {
      brand_groupby: brandgroup,
      total_records: total_records.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalInvoicesSum: totalInvoicesSum,
    };
    return result;
  } else if (
    input.product_group !== '' &&
    input.royality_approval !== '' &&
    input.order_status == '' &&
    input.nonAdm == '' &&
    input.Adm == ''
  ) {
    console.log('product group  royality_approval');
    function stringToBoolean(str: string | undefined) {
      return str?.toLowerCase() === 'true';
    }

    const royality_approval = stringToBoolean(input.royality_approval);

    const productAggregationPipelineRecord: any = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          invoice: true,
          royality_approval: royality_approval,
        },
      },

      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      {
        $group: {
          _id: '$product',
          productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
          totalInvoices: { $sum: 1 },
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
        },
      },
      {
        $project: {
          productName: 1,
          totalInvoices: 1,
          totalQty: 1,
          totalAmount: 1,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ];

    const productAggregationPipeline: any = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          invoice: true,
          royality_approval: royality_approval,
        },
      },

      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      {
        $group: {
          _id: '$product',
          productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
          totalInvoices: { $sum: 1 },
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
        },
      },
      {
        $project: {
          productName: 1,
          totalInvoices: 1,
          totalQty: 1,
          totalAmount: 1,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ];

    const product = await SalesContractDtlModel.aggregate(
      productAggregationPipeline
    );
    const total_records = await SalesContractDtlModel.aggregate(
      productAggregationPipelineRecord
    );
    const totalInvoices = product.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );
    const totalQtySum = product.reduce((sum, item) => sum + item.totalQty, 0);
    const totalAmountSum = product.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const result = {
      product_groupby: product,
      total_records: total_records.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalInvoicesSum: totalInvoices,
    };
    return result;
  } else if (
    input.customer_group !== '' &&
    input.royality_approval !== '' &&
    input.order_status == '' &&
    input.nonAdm == '' &&
    input.Adm == ''
  ) {
    console.log('customer group royality_approval');

    function stringToBoolean(str: string | undefined) {
      return str?.toLowerCase() === 'true';
    }

    const royality_approval = stringToBoolean(input.royality_approval);
    const customerAggregationPipelineRecords: any = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          invoice: true,
          royality_approval: royality_approval,
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer_details',
        },
      },
      {
        $addFields: {
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: '$customer', // Group by customer ID
          customerName: { $first: '$customer_details.name' },
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
          totalInvoices: { $sum: 1 },
        },
      },
      {
        $project: {
          customerName: 1,
          totalQty: 1,
          totalAmount: 1,
          totalInvoices: 1,
          _id: 0, // Exclude _id field
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ];

    const customerAggregationPipeline: any = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          invoice: true,
          royality_approval: royality_approval,
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer_details',
        },
      },
      {
        $addFields: {
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: '$customer', // Group by customer ID
          customerName: { $first: '$customer_details.name' },
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
          totalInvoices: { $sum: 1 },
        },
      },
      {
        $project: {
          customerName: 1,
          totalQty: 1,
          totalAmount: 1,
          totalInvoices: 1,
          _id: 0,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ];
    const customer = await SalesContractDtlModel.aggregate(
      customerAggregationPipeline
    );
    const total_records = await SalesContractDtlModel.aggregate(
      customerAggregationPipelineRecords
    );
    const totalInvoicesSum = customer.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );
    const totalQtySum = customer.reduce((sum, item) => sum + item.totalQty, 0);
    const totalAmountSum = customer.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );

    const result = {
      customer_groupby: customer,
      total_records: total_records.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalInvoicesSum: totalInvoicesSum,
    };
    return result;
  } else if (
    input.brand_group !== '' &&
    input.royality_approval !== '' &&
    input.order_status == '' &&
    input.nonAdm == '' &&
    input.Adm == ''
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
          invoice: true,
          royality_approval: royality_approval,
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
        $unwind: '$brand',
      },
      {
        $group: {
          _id: '$brand._id',
          name: { $first: '$brand.name' },
          totalInvoices: { $sum: 1 },
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
        },
      },
      {
        $project: {
          _id: 0,
          name: 1,
          totalInvoices: 1,
          totalQty: 1,
          totalAmount: 1,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ];
    const brandAggregationPipeline: any = [
      {
        $match: {
          contractDate: {
            $gte: new Date(input.fromDate),
            $lte: new Date(input.toDate),
          },
          isDeleted: false,
          invoice: true,
          royality_approval: royality_approval,
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
        $unwind: '$brand',
      },
      {
        $group: {
          _id: '$brand._id',
          name: { $first: '$brand.name' },
          totalInvoices: { $sum: 1 },
          totalQty: { $sum: '$qty' },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $match: {
          totalQty: { $gt: 0 },
          totalAmount: { $gt: 0 },
        },
      },
      {
        $project: {
          _id: 0,
          name: 1,
          totalInvoices: 1,
          totalQty: 1,
          totalAmount: 1,
        },
      },
      { $sort: { totalQty: -1, totalAmount: -1 } },
    ];
    const brandgroup = await SalesContractDtlModel.aggregate(
      brandAggregationPipeline
    );
    const total_records = await SalesContractDtlModel.aggregate(
      brandAggregationPipelineRecord
    );

    const totalInvoicesSum = brandgroup.reduce(
      (sum, item) => sum + item.totalInvoices,
      0
    );
    const totalQtySum = brandgroup.reduce(
      (sum, item) => sum + item.totalQty,
      0
    );
    const totalAmountSum = brandgroup.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const result = {
      brand_groupby: brandgroup,
      total_records: total_records.length,
      totalQtySum: totalQtySum,
      totalAmountSum: totalAmountSum,
      totalInvoicesSum: totalInvoicesSum,
    };
    return result;
  }

  if (input.Adm !== '') {
    console.log('Adm');
    if (
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0 &&
      input.customer_group == '' &&
      input.product_group == '' &&
      input.brand_group == '' &&
      input.salesContract_group == '' &&
      input.order_status == '' &&
      input.royality_approval == ''
    ) {
      console.log('no filter condition execute!');
      try {
        const invoice_groupby = await InvoiceDtlModel.aggregate([
          {
            $match: {
              date: {
                $gte: new Date(input.fromDate),
                $lte: new Date(input.toDate),
              },
              isDeleted: false,
              adm_invoice: true,
            },
          },

          {
            $group: {
              _id: null,
              totalQty: {
                $sum: '$qty',
              },
              totalRate: {
                $sum: '$rate',
              },
              totalAmount: {
                $sum: '$amount',
              },
              totalSaleTaxAmount: {
                $sum: '$salesTaxAmount',
              },
              data: {
                $push: '$$ROOT',
              },
            },
          },
          {
            $addFields: {
              totalValue: {
                $sum: {
                  $map: {
                    input: '$data',
                    as: 'item',
                    in: {
                      $divide: [
                        {
                          $multiply: [
                            '$$item.amount',
                            '$$item.exchangeRate',
                            '$$item.salesTaxRate',
                          ],
                        },
                        100,
                      ],
                    },
                  },
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              totalQty: 1,
              totalRate: 1,
              totalValue: 1,
              totalAmount: 1,
              totalSaleTaxAmount: 1,
              data: 1,
            },
          },
        ]);
        const total_qty = invoice_groupby.map((item) => item.totalQty);
        const total_amount = invoice_groupby.map((item) => item.totalAmount);
        const total_rate = invoice_groupby.map((item) => item.totalRate);
        const totalValue = invoice_groupby.map((item) => item.totalValue);
        const total_records = await InvoiceModel.aggregate([
          {
            $match: {
              date: {
                $gte: new Date(input.fromDate),
                $lte: new Date(input.toDate),
              },
              isDeleted: false,
              adm_invoice: true,
            },
          },
        ]);

        const invoiceamountpkr = await InvoiceDtlModel.aggregate([
          {
            $match: {
              date: {
                $gte: new Date(input.fromDate),
                $lte: new Date(input.toDate),
              },
              isDeleted: false,
              adm_invoice: true,
            },
          },
        ]);

        const qty = invoiceamountpkr.map((item) => item.qty);
        const saletaxrate = invoiceamountpkr.map((item) => item.salesTaxRate);
        const rate = invoiceamountpkr.map((item) => item.rate);

        const saletax = qty.map((amount, index) => amount * rate[index]);
        const saletaxamount = saletaxrate.map(
          (amount, index) => amount * saletax[index]
        );
        const SaleTaxAmount = saletaxamount.reduce(
          (total, value) => total + value
        );

        const Amount = invoiceamountpkr.map((item) => item.amount);
        const Rate = invoiceamountpkr.map((item) => item.rate);
        const qtypkr = Amount.map((amount, index) => amount * Rate[index]);

        const AmountPKR = qtypkr.reduce((total, value) => total + value, 0);

        const invoice_detail = await InvoiceDtlModel.aggregate([
          {
            $match: {
              date: {
                $gte: new Date(input.fromDate),
                $lte: new Date(input.toDate),
              },
              isDeleted: false,
              adm_invoice: true,
            },
          },
          {
            $lookup: {
              from: 'invoices',
              localField: 'invoice',
              foreignField: '_id',
              as: 'inv_dtl',
            },
          },
          {
            $lookup: {
              from: 'salescontracts',
              localField: 'salesContract',
              foreignField: '_id',
              as: 'sale_dtl',
            },
          },
          {
            $lookup: {
              from: 'customers',
              localField: 'customer',
              foreignField: '_id',
              as: 'customer_dtl',
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

          { $sort: { date: -1 } },
        ]);
        const result = {
          invoice_detail: invoice_detail,
          paginated_record: invoice_detail.length,
          totalQty: total_qty,
          totalAmount: total_amount,
          totalRate: total_rate,
          total_records: total_records.length,
          totalAmountPKR: AmountPKR,
          totalValue: totalValue,
          SaleTaxAmount: SaleTaxAmount,
        };
        return result;
      } catch (error) {
        console.log(error);
      }
    } else if (
      input.product_group !== '' &&
      input.order_status == '' &&
      input.royality_approval == '' &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('product group');

      // const total_records = await ProductModel.countDocuments();
      // const product_group = await ProductModel.aggregate([
      //   {
      //     $match: {
      //       isDeleted: false,
      //     },
      //   },
      //   {
      //     $lookup: {
      //       from: 'invoicedtls',
      //       localField: '_id',
      //       foreignField: 'product',
      //       as: 'invoice_record',
      //       pipeline: [
      //         {
      //           $match: {
      //             isDeleted: false,
      //           },
      //         },
      //         {
      //           $project: {
      //             qty: 1,
      //             amount: 1,
      //             salesTaxAmount: 1,
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
      //             input: '$invoice_record',
      //             as: 'item',
      //             in: '$$item.qty',
      //           },
      //         },
      //       },
      //     },
      //   },
      //   {
      //     $addFields: {
      //       totalAmount: {
      //         $sum: {
      //           $map: {
      //             input: '$invoice_record',
      //             as: 'item',
      //             in: '$$item.amount',
      //           },
      //         },
      //       },
      //     },
      //   },
      //   {
      //     $addFields: {
      //       totalSaleTaxAmount: {
      //         $sum: {
      //           $map: {
      //             input: '$invoice_record',
      //             as: 'item',
      //             in: '$$item.salesTaxAmount',
      //           },
      //         },
      //       },
      //     },
      //   },
      //   {
      //     $project: {
      //       name: 1,
      //       invoice_record: {
      //         $size: '$invoice_record',
      //       },
      //       totalQty: 1,
      //       totalAmount: 1,
      //       totalSaleTaxAmount: 1,
      //     },
      //   },
      //   // Move the $match to this point after the totalQty is computed
      //   {
      //     $match: {
      //       totalQty: { $gt: 0 },  // Ensure you're filtering by totalQty > 0
      //     },
      //   },
      //   { $limit: limit },
      //   { $skip: skipCount },
      // ]);

      const productAggregationPipelineRecord: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
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
          $addFields: {
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
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
            totalSaleTaxAmount: {
              $gt: 0,
            },
          },
        },
        {
          $group: {
            _id: '$product',
            name: {
              $first: '$product.name', // Retrieve product name
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$totalSaleTaxAmount',
            },
            totalInvoices: {
              $sum: 1,
            },
          },
        },
        {
          $project: {
            name: 1,
            totalQty: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            totalInvoices: 1,
            _id: 0,
          },
        },
        {
          $sort: {
            totalQty: -1,
            totalAmount: -1,
          },
        },
      ];

      const productAggregationPipeline: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
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
          $addFields: {
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
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
            totalSaleTaxAmount: {
              $gt: 0,
            },
          },
        },
        {
          $group: {
            _id: '$product',
            name: {
              $first: '$product.name', // Retrieve product name
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$totalSaleTaxAmount',
            },
            totalInvoices: {
              $sum: 1,
            },
          },
        },
        {
          $project: {
            name: 1,
            totalQty: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            totalInvoices: 1,
            _id: 0,
          },
        },
        {
          $sort: {
            totalQty: -1,
            totalAmount: -1,
          },
        },
      ];

      const product_group = await InvoiceDtlModel.aggregate(
        productAggregationPipeline
      );
      const total_records = await InvoiceDtlModel.aggregate(
        productAggregationPipelineRecord
      );
      const invoiceRecordSum = total_records.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = total_records.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = total_records.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalSaleTaxAmountSum = total_records.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );

      const result = {
        product_group: product_group,
        paginated_record: product_group.length,
        total_records: total_records.length,
        invoiceTotalRecordSum: invoiceRecordSum,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
      };
      return result;
    } else if (
      input.customer_group !== '' &&
      input.order_status == '' &&
      input.royality_approval == '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('customer general ');
      const customerAggregationPipelineRecord: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
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
          $addFields: {
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
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
            totalSaleTaxAmount: {
              $gt: 0,
            },
          },
        },
        {
          $group: {
            _id: '$customer',
            customerName: {
              $first: '$customer.name',
            },
            // Retrieve customer name
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$totalSaleTaxAmount',
            },
            totalInvoices: {
              $sum: 1,
            }, //
          },
        },
        {
          $project: {
            customerName: 1,
            totalQty: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            totalInvoices: 1,
            _id: 0,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];
      const customerAggregationPipeline: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
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
          $addFields: {
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
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
            totalSaleTaxAmount: {
              $gt: 0,
            },
          },
        },
        {
          $group: {
            _id: '$customer',
            name: {
              $first: '$customer.name',
            },
            // Retrieve customer name
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$totalSaleTaxAmount',
            },
            totalInvoices: {
              $sum: 1,
            }, //
          },
        },
        {
          $project: {
            name: 1,
            totalQty: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            totalInvoices: 1,
            _id: 0,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];
      const customer_group = await InvoiceDtlModel.aggregate(
        customerAggregationPipeline
      );
      const total_records = await InvoiceDtlModel.aggregate(
        customerAggregationPipelineRecord
      );

      const customerQtySum = total_records.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const customerinvoiceRecordSum = total_records.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const customertotalSaleTaxAmountSum = total_records.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const customertotalAmountSum = total_records.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const result = {
        customer_group: customer_group,
        paginated_records: customer_group.length,
        total_records: total_records.length,
        customerTotalQtySum: customerQtySum,
        customerTotalInvoiceRecordSum: customerinvoiceRecordSum,
        totalSaleTaxAmountSum: customertotalSaleTaxAmountSum,
        customertotalAmountSum: customertotalAmountSum,
      };
      return result;
    } else if (
      input.salesContract_group !== '' &&
      input.order_status == '' &&
      input.royality_approval == '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      const salesContractAggregationPipelineRecord: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContract',
          },
        },
        {
          $addFields: {
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
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
            totalSaleTaxAmount: {
              $gt: 0,
            },
          },
        },
        {
          $group: {
            _id: '$salesContract',
            salesContractNumber: {
              $first: '$salesContract.contractNumber', // Retrieve sales contract number or identifier
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$totalSaleTaxAmount',
            },
            totalInvoices: {
              $sum: 1,
            },
          },
        },
        {
          $project: {
            salesContractNumber: 1,
            totalQty: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            totalInvoices: 1,
            _id: 0,
          },
        },
        {
          $sort: {
            totalQty: -1,
            totalAmount: -1,
          },
        },
      ];
      const salesContractAggregationPipeline: any = [
        {
          $match: {
            isDeleted: false,
            adm_invoice: true,
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContract',
          },
        },
        {
          $addFields: {
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
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
            totalSaleTaxAmount: {
              $gt: 0,
            },
          },
        },
        {
          $group: {
            _id: '$salesContract',
            salesContractNumber: {
              $first: '$salesContract.contractNumber', // Retrieve sales contract number or identifier
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$totalSaleTaxAmount',
            },
            totalInvoices: {
              $sum: 1,
            },
          },
        },
        {
          $project: {
            salesContractNumber: 1,
            totalQty: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            totalInvoices: 1,
            _id: 0,
          },
        },
        {
          $sort: {
            totalQty: -1,
            totalAmount: -1,
          },
        },
      ];
      const salecontract_group = await InvoiceDtlModel.aggregate(
        salesContractAggregationPipeline
      );
      const total_record = await InvoiceDtlModel.aggregate(
        salesContractAggregationPipelineRecord
      );

      const totalInvoiceSum = total_record.reduce(
        (sum, item) => sum + item.totalInvoices,
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
      const totalSaleTaxAmountSum = total_record.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const salesContractNumberSum = total_record.reduce(
        (sum, item) => sum + item.salesContractNumber,
        0
      );
      const result = {
        salecontract_group: salecontract_group,
        total_records: salecontract_group.length,
        paginated_record: total_record.length,
        totalInvoiceSum: totalInvoiceSum,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        salesContractNumberSum: salesContractNumberSum,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
      };
      return result;
    } else if (
      input.brand_group !== '' &&
      input.order_status == '' &&
      input.royality_approval == '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('brand group general');

      const brandAggregationPipelineRecord: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
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
          $addFields: {
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
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
            totalSaleTaxAmount: {
              $gt: 0,
            },
          },
        },
        {
          $group: {
            _id: '$brand',
            name: {
              $first: '$brand.name',
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$totalSaleTaxAmount',
            },
            totalInvoices: {
              $sum: 1,
            },
          },
        },
        {
          $project: {
            name: 1,
            totalQty: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            totalInvoices: 1,
            _id: 0,
          },
        },
        {
          $sort: {
            totalQty: -1,
            totalAmount: -1,
          },
        },
      ];

      const brandAggregationPipeline: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
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
          $group: {
            _id: '$brand._id',
            name: { $first: '$brand.name' },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
            totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
            totalInvoices: { $sum: 1 },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
            totalSaleTaxAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            name: 1,
            totalQty: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            totalInvoices: 1,
          },
        },
        {
          $sort: {
            totalQty: -1,
            totalAmount: -1,
          },
        },
      ];
      const brandgroup = await InvoiceDtlModel.aggregate(
        brandAggregationPipeline
      );

      const total_records = await InvoiceDtlModel.aggregate(
        brandAggregationPipelineRecord
      );

      const totalInvoicesSum = total_records.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const invoicetotalSaleTaxAmountSum = total_records.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const totalQtySum = total_records.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = total_records.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const result = {
        brand_groupby: brandgroup,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
        totalSaleTaxAmount: invoicetotalSaleTaxAmountSum,
      };
      return result;
    } else if (
      input.order_status !== '' &&
      input.royality_approval == '' &&
      input.customer_group == '' &&
      input.product_group == '' &&
      input.brand_group == '' &&
      input.salesContract_group == '' &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('order_status filter');

      const order_status = input.order_status;

      const inv_dtl = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
          },
        },
        {
          $lookup: {
            from: 'salescontractdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'sale_dtl',
            pipeline: [
              {
                $match: {
                  order_status: order_status,
                  InHouse: true,
                },
              },
            ],
          },
        },
        {
          $match: {
            'sale_dtl.0': {
              $exists: true,
            },
          },
        },
        {
          $lookup: {
            from: 'invoices',
            localField: 'invoice',
            foreignField: '_id',
            as: 'invoice',
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salescontract',
            pipeline: [
              {
                $lookup: {
                  from: 'paymentterms',
                  localField: 'paymentTerm',
                  foreignField: '_id',
                  as: 'payment_term',
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
            as: 'customer_dtl',
          },
        },
        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'product_dtl',
          },
        },
        {
          $unwind: {
            path: '$salescontract',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: '$salescontract.payment_term',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: '$customer_dtl',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: '$product_dtl',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: '$invoice',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $sort: { date: -1 },
        },

        {
          $facet: {
            Summary: [
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
                  _id: null,
                  qty: { $sum: '$qty' },
                  rate: { $sum: '$rate' },
                  amount: { $sum: '$amount' },
                  salesTaxAmount: { $sum: '$salesTaxAmount' },
                },
              },
            ],
            AmountPkr: [
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
                $addFields: {
                  AmountInPkr: {
                    $multiply: ['$amount', '$rate'],
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  totalAmountInPkr: { $sum: '$AmountInPkr' },
                },
              },
            ],
            TotalValue: [
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
                $addFields: {
                  totalValue: {
                    $sum: {
                      $divide: [
                        {
                          $multiply: [
                            '$amount',
                            '$exchangeRate',
                            '$salesTaxRate',
                          ],
                        },
                        100,
                      ],
                    },
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  totalAmountInPkr: { $sum: '$totalValue' },
                },
              },
            ],
            ItemDetails: [
              {
                $project: {
                  qty: 1,
                  amount: 1,
                  uom: 1,
                  salesTaxAmount: 1,
                  rate: 1,
                  exchangeRate: 1,
                  salesTaxRate: 1,
                  contract: '$salescontract.contract',
                  saleTaxInvoiceNo: '$invoice.salesTaxInvoiceNo',
                  invoiceDate: '$invoice.date',
                  customerName: '$customer_dtl.name',
                  productName: '$product_dtl.name',
                },
              },
            ],
          },
        },
      ]);
      const total_records = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
          },
        },
        {
          $lookup: {
            from: 'salescontractdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'sale_dtl',
            pipeline: [
              {
                $match: {
                  order_status: order_status,
                  InHouse: true,
                },
              },
            ],
          },
        },
        {
          $match: {
            'sale_dtl.0': {
              $exists: true,
            },
          },
        },
      ]);
      let result = {
        inv_dtl: inv_dtl,
        total_records: total_records.length,
        paginated_record: inv_dtl.length,
      };
      return result;
    } else if (
      input.royality_approval !== '' &&
      input.order_status == '' &&
      input.customer_group == '' &&
      input.salesContract_group == '' &&
      input.product_group == '' &&
      input.brand_group == '' &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('royality approval filter');

      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }

      const salegroupby = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
          },
        },
        {
          $lookup: {
            from: 'salescontractdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'sale_dtl',
            pipeline: [
              {
                $match: {
                  royality_approval: stringToBoolean(input.royality_approval),
                },
              },
            ],
          },
        },
        {
          $addFields: {
            sale_dtl: {
              $arrayElemAt: ['$sale_dtl', 0],
            },
          },
        },
        {
          $group: {
            _id: null,
            totalQty: {
              $sum: '$qty',
            },
            totalRate: {
              $sum: '$rate',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
            },
            data: {
              $push: '$$ROOT',
            },
          },
        },
        {
          $addFields: {
            totalValue: {
              $sum: {
                $map: {
                  input: '$data',
                  as: 'item',
                  in: {
                    $divide: [
                      {
                        $multiply: [
                          '$$item.amount',
                          '$$item.exchangeRate',
                          '$$item.salesTaxRate',
                        ],
                      },
                      100,
                    ],
                  },
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalQty: 1,
            totalRate: 1,
            totalValue: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            data: 1,
          },
        },
      ]);

      const inv_rate = salegroupby.flatMap(
        (item) => item.data.map((dataItem: any) => dataItem.rate || 0) // Default to 0 if rate is missing
      );
      const inv_amount = salegroupby.flatMap(
        (item) => item.data.map((dataItem: any) => dataItem.amount || 0) // Default to 0 if amount is missing
      );

      const qtypkr = inv_amount.map(
        (amount, index) => amount * inv_rate[index]
      );
      const AmountPKR = qtypkr.reduce((total, value) => total + value, 0);

      const invoice_dtl = await InvoiceDtlModel.aggregate([
        {
          $lookup: {
            from: 'salescontractdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'sale_dtl',
            pipeline: [
              {
                $match: {
                  InHouse: true,
                  royality_approval: stringToBoolean(input.royality_approval),
                },
              },
              {
                $lookup: {
                  from: 'salescontracts',
                  localField: 'salesContract',
                  foreignField: '_id',
                  as: 'salecontract',
                },
              },
            ],
          },
        },
        {
          $match: {
            'sale_dtl.0': {
              $exists: true,
            },
          },
        },
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
            from: 'invoices',
            localField: 'invoice',
            foreignField: '_id',
            as: 'invoice',
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
            as: 'customer_dtl',
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
          $sort: {
            date: -1,
          },
        },
      ]);

      const totalRecordCount = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false, // Filter out deleted records
          },
        },
        {
          $lookup: {
            from: 'salescontractdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'sale_dtl',
            pipeline: [
              {
                $match: {
                  InHouse: true,
                  royality_approval: stringToBoolean(input.royality_approval), // Apply royality_approval filter
                },
              },
            ],
          },
        },
        {
          $match: {
            'sale_dtl.0': { $exists: true }, // Ensure at least one `sale_dtl` exists after the lookup
          },
        },
      ]);
      const totalQty = salegroupby.map((item: any) => item.totalQty);
      const totalRate = salegroupby.map((item: any) => item.totalRate);
      const totalAmount = salegroupby.map((item: any) => item.totalAmount);
      const totalValue = salegroupby.map((item: any) => item.totalValue);
      const saleTaxAmount = salegroupby.map(
        (item: any) => item.totalSaleTaxAmount
      );

      let result = {
        shipmentdtl: invoice_dtl,
        paginated_record: invoice_dtl.length,
        total_records: totalRecordCount.length,
        totalQty: totalQty,
        totalRate: totalRate,
        totalAmount: totalAmount,
        saleTaxAmount: saleTaxAmount,
        totalValue: totalValue,
        AmountPKR: AmountPKR,
      };
      return result;
    } else if (
      input.customer_group == '' &&
      input.product_group == '' &&
      input.brand_group == '' &&
      (input.order_status !== '' ||
        input.royality_approval !== '' ||
        (Array.isArray(input.product) && input.product.length !== 0) ||
        (Array.isArray(input.customer) && input.customer.length !== 0) ||
        (Array.isArray(input.brand) && input.brand.length !== 0) ||
        (Array.isArray(input.salesContract) &&
          input.salesContract.length !== 0))
    ) {
      console.log('general condition');

      const salecontractArr = input.salesContract
        ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const productArr = input.product
        ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      let filter: any = {};
      let filter_records: any = {};
      let where: any = {};

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

      const invoiceamountpkr = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
          },
        },
        {
          $match: filter,
        },
      ]);

      let SaleTaxAmount;
      let AmountPKR;
      if (Array.isArray(invoiceamountpkr) && invoiceamountpkr.length == 0) {
        SaleTaxAmount = [];
        AmountPKR = [];
      } else {
        const qty = invoiceamountpkr.map((item) => (item.qty ? item.qty : []));
        const saletaxrate = invoiceamountpkr.map((item) => item.salesTaxRate);
        const rate = invoiceamountpkr.map((item) =>
          item.rate ? item.rate : []
        );

        const saletax = qty.map((amount, index) => amount * rate[index]);

        const saletaxamount = saletaxrate.map(
          (amount, index) => amount * saletax[index]
        );

        SaleTaxAmount = saletaxamount.reduce((total, value) => total + value);

        const Amount = invoiceamountpkr.map((item) =>
          item.amount ? item.amount : []
        );
        const Rate = invoiceamountpkr.map((item) =>
          item.rate ? item.exchangeRate : []
        );

        const qtypkr = Amount.map((amount, index) => amount * Rate[index]);

        AmountPKR = qtypkr.reduce((total, value) => total + value, 0);
      }

      const total_record = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
          },
        },
        {
          $match: filter_records,
        },
      ]);
      const invoicegroupby = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
          },
        },
        {
          $match: filter,
        },
        {
          $group: {
            _id: null,
            totalQty: {
              $sum: '$qty',
            },
            totalRate: {
              $sum: '$rate',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
            },
            data: {
              $push: '$$ROOT',
            },
          },
        },
        {
          $addFields: {
            totalValue: {
              $sum: {
                $map: {
                  input: '$data',
                  as: 'item',
                  in: {
                    $divide: [
                      {
                        $multiply: [
                          '$$item.amount',
                          '$$item.exchangeRate',
                          '$$item.salesTaxRate',
                        ],
                      },
                      100,
                    ],
                  },
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalQty: 1,
            totalRate: 1,
            totalValue: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            data: 1,
          },
        },
      ]);
      const totalQty = invoicegroupby.map((item) => item.totalQty);
      const totalAmount = invoicegroupby.map((item) => item.totalAmount);
      const totalRate = invoicegroupby.map((item) => item.totalRate);
      const totalValue = invoicegroupby.map((item) => item.totalValue);
      const invoice_detail = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
          },
        },
        {
          $match: where,
        },
        {
          $lookup: {
            from: 'invoices',
            localField: 'invoice',
            foreignField: '_id',
            as: 'inv_dtl',
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'sale_dtl',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer_dtl',
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

        { $sort: { date: -1 } },
      ]);
      if (Array.isArray(invoice_detail) && invoice_detail.length == 0) {
        const result = {
          invoice_dtl: [],
          total_record: [],
          paginated_record: [],
          totalAmount: [],
          totalQty: [],
          totalRate: [],
          totalAmountPKR: [],
          SaleTaxAmount: [],
        };
        return result;
      } else {
        const result = {
          invoice_detail: invoice_detail,
          total_records: total_record.length,
          paginated_record: invoice_detail.length,
          totalAmount: totalAmount,
          totalQty: totalQty,
          totalRate: totalRate,
          totalValue: totalValue,
          totalAmountPKR: AmountPKR,
          SaleTaxAmount: SaleTaxAmount,
        };
        return result;
      }
    } else if (
      input.customer_group !== '' &&
      input.royality_approval == '' &&
      input.order_status == '' &&
      Array.isArray(input.customer) &&
      input.customer.length !== 0 &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('customer group customer ');

      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const customer = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
          },
        },
        {
          $match: {
            isDeleted: false,
            customer: { $in: customerArr },
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer_details',
          },
        },
        {
          $addFields: {
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
            totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
            totalSaleTaxAmount: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: '$customer', // Group by customer ID
            customerName: { $first: '$customer_details.name' }, // Retrieve customer name
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
            totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
            totalInvoices: { $sum: 1 }, // Count the number of contracts for each customer
          },
        },
        {
          $project: {
            customerName: 1,
            totalQty: 1,
            totalAmount: 1,
            totalInvoices: 1,
            totalSaleTaxAmount: 1,
            _id: 0, // Exclude _id field
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ]);

      const totalInvoicesSum = customer.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );

      const totalQtySum = customer.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = customer.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalSaleTaxAmountSum = customer.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const result = {
        customer_groupby: customer,
        total_records: customer.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    } else if (
      input.product_group !== '' &&
      input.royality_approval == '' &&
      input.order_status == '' &&
      Array.isArray(input.product) &&
      input.product.length !== 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('product to product group');

      const productArr = input.product
        ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const product = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
          },
        },

        {
          $match: {
            isDeleted: false,
            product: { $in: productArr },
          },
        },

        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productInfo',
          },
        },
        {
          $group: {
            _id: '$product',
            productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
            totalSaleTaxAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            productName: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ]);

      const totalInvoices = product.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = product.reduce((sum, item) => sum + item.totalQty, 0);
      const totalAmountSum = product.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalSaleTaxAmountSum = product.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const result = {
        product_groupby: product,
        total_records: product.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoices,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
      };
      return result;
    } else if (
      input.customer_group !== '' &&
      input.royality_approval == '' &&
      input.order_status == '' &&
      Array.isArray(input.brand) &&
      input.brand.length !== 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('customer group brand');

      const brandArr = input.brand
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const customer = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
          },
        },
        {
          $match: {
            isDeleted: false,
            brand: { $in: brandArr },
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer_details',
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand_details',
          },
        },
        {
          $addFields: {
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
            totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
            totalSaleTaxAmount: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: '$customer', // Group by customer ID
            customerName: { $first: '$customer_details.name' },
            brandName: { $first: '$brand_details.name' }, // Retrieve customer name
            totalQty: { $sum: '$qty' },
            totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
            totalAmount: { $sum: '$amount' },
            totalInvoices: { $sum: 1 }, // Count the number of contracts for each customer
          },
        },
        {
          $project: {
            customerName: 1,
            brandName: 1,
            totalQty: 1,
            c: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            totalInvoices: 1,
            _id: 0, // Exclude _id field
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ]);

      const totalInvoicesSum = customer.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = customer.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = customer.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalSaleTaxAmount = customer.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );

      const result = {
        customer_groupby: customer,
        total_records: customer.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
        totalSaleTaxAmount: totalSaleTaxAmount,
      };
      return result;
    } else if (
      input.product_group !== '' &&
      input.royality_approval == '' &&
      input.order_status == '' &&
      Array.isArray(input.brand) &&
      input.brand.length !== 0 &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('product to brand');

      const total_records = await BrandModel.countDocuments();
      const brandArr = input.brand
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const product = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
          },
        },

        {
          $match: {
            // isDeleted: false,
            brand: { $in: brandArr },
          },
        },

        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productInfo',
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brandInfo',
          },
        },
        {
          $group: {
            _id: '$product',
            productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
            brandName: { $first: { $arrayElemAt: ['$brandInfo.name', 0] } },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
            totalSaleTaxAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            productName: 1,
            brandName: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalSaleTaxAmount: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ]);

      const totalInvoices = product.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = product.reduce((sum, item) => sum + item.totalQty, 0);
      const totalAmountSum = product.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalSaleTaxAmountSum = product.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const result = {
        product_groupby: product,
        total_records: total_records,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoices,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
      };
      return result;
    } else if (
      input.brand_group !== '' &&
      input.royality_approval == '' &&
      input.order_status == '' &&
      Array.isArray(input.brand) &&
      input.brand.length !== 0 &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length !== 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length !== 0
    ) {
      console.log('brandgroup brand');
      const brandArr = input.brand
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const total_records = await BrandModel.countDocuments();

      const brandgroup = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },

            isDeleted: false,
            adm_invoice: true,
            brand: { $in: brandArr },
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
          $unwind: '$brand',
        },
        {
          $group: {
            _id: '$brand._id', // Group by brand's _id
            name: { $first: '$brand.name' },
            totalInvoices: { $sum: 1 }, // Calculate the total number of contracts
            totalQty: { $sum: '$qty' }, // Calculate the total quantity
            totalAmount: { $sum: '$amount' },
            totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
            totalSaleTaxAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            _id: 0, // Exclude _id field
            name: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ]);

      const totalInvoiceSum = brandgroup.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = brandgroup.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = brandgroup.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalSaleTaxAmountSum = brandgroup.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const result = {
        brand_groupby: brandgroup,
        total_records: brandgroup.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoiceSum: totalInvoiceSum,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
      };
      return result;
    } else if (
      input.brand_group !== '' &&
      input.royality_approval == '' &&
      input.order_status == '' &&
      Array.isArray(input.customer) &&
      input.customer.length !== 0 &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('brand to customer');
      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const brandgroup = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
            customer: { $in: customerArr },
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
            _id: '$brand._id',
            brandName: {
              $first: '$brand.name',
            },
            customerName: { $first: '$customer.name' },
            totalInvoices: {
              $sum: 1,
            },
            totalQty: {
              $sum: '$qty',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
            },
            totalAmount: {
              $sum: '$amount',
            },
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ]);

      const totalInvoicesSum = brandgroup.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = brandgroup.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = brandgroup.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalSaleTaxAmountSum = brandgroup.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const result = {
        brand_groupby: brandgroup,
        total_records: brandgroup.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    } else if (
      input.product_group !== '' &&
      input.royality_approval == '' &&
      input.order_status == '' &&
      Array.isArray(input.customer) &&
      input.customer.length !== 0 &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('product group customer');
      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const productdtl = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
            customer: { $in: customerArr },
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
            as: 'products',
          },
        },

        {
          $group: {
            _id: '$products._id',
            productName: {
              $first: '$products.name',
            },
            customerName: {
              $first: '$customer.name',
            },
            totalInvoices: {
              $sum: 1,
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ]);

      const totalInvoiceSum = productdtl.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = productdtl.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = productdtl.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalSaleTaxAmountSum = productdtl.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const result = {
        product_groupby: productdtl,
        total_records: productdtl.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoiceSum: totalInvoiceSum,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
      };
      return result;
    } else if (
      input.customer_group !== '' &&
      input.royality_approval == '' &&
      input.order_status == '' &&
      Array.isArray(input.product) &&
      input.product.length !== 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('product to customer');
      const productArr = input.product
        ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const customerdtl = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
            product: { $in: productArr },
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
            _id: '$customer._id',
            CustomerName: {
              $first: '$customer.name',
            },
            productName: {
              $first: '$product.name',
            },
            totalInvoices: {
              $sum: 1,
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
            },
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ]);
      const totalInvoicesSum = customerdtl.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = customerdtl.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = customerdtl.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalSaleTaxAmountSum = customerdtl.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const result = {
        customer_groupby: customerdtl,
        total_records: customerdtl.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
      };
      return result;
    } else if (
      input.brand_group !== '' &&
      input.royality_approval == '' &&
      input.order_status == '' &&
      Array.isArray(input.product) &&
      input.product.length !== 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('product to brand');

      const productArr = input.product
        ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const branddtl = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
            product: { $in: productArr },
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
            productname: {
              $first: '$products.name',
            },
            brandname: {
              $first: '$brand.name',
            },
            totalInvoices: {
              $sum: 1,
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
            },
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ]);
      const totalInvoicesSum = branddtl.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = branddtl.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = branddtl.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalSaleTaxAmountSum = branddtl.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const result = {
        brand_groupby: branddtl,
        total_records: branddtl.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
      };
      return result;
    } else if (
      input.customer_group !== '' &&
      ((Array.isArray(input.product) && input.product.length !== 0) ||
        (Array.isArray(input.customer) && input.customer.length !== 0) ||
        (Array.isArray(input.brand) && input.brand.length !== 0) ||
        (Array.isArray(input.salesContract) &&
          input.salesContract.length !== 0))
    ) {
      console.log(
        '  customer group with general filters brand customer product salescontract work'
      );

      const salesContractArr = input.salesContract
        ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const productArr = input.product
        ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
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

      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }
      if (input.royality_approval) {
        extrafilter.royality_approval = stringToBoolean(
          input.royality_approval
        );
      }
      if (input.order_status !== '') {
        const order_status = input.order_status;

        where.order_status = order_status;
        (filter_records.order_status = order_status),
          (filter.order_status = order_status);
      }

      const customerAggregationPipelineRecords: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
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
            totalInvoices: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            salesTaxAmount: {
              $sum: '$salesTaxAmount',
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
            salesTaxAmount: 1,
            totalInvoices: 1,
          },
        },
      ];

      const customerAggregationPipeline: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
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
            totalInvoices: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            salesTaxAmount: {
              $sum: '$salesTaxAmount',
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
            salesTaxAmount: 1,
            totalInvoices: 1,
          },
        },
        { $sort: { qty: -1, amount: -1 } },
      ];

      const customergroup = await InvoiceDtlModel.aggregate(
        customerAggregationPipeline
      );

      const total_records = await InvoiceDtlModel.aggregate(
        customerAggregationPipelineRecords
      );

      const totalInvoicesSum = total_records.reduce(
        (sum, item) => sum + item.totalInvoices,
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
      const totalSaleTaxAmountSum = total_records.reduce(
        (sum, item) => sum + item.salesTaxAmount,
        0
      );
      const result = {
        Group: customergroup,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    } else if (
      input.product_group !== '' &&
      ((Array.isArray(input.product) && input.product.length !== 0) ||
        (Array.isArray(input.customer) && input.customer.length !== 0) ||
        (Array.isArray(input.brand) && input.brand.length !== 0) ||
        (Array.isArray(input.salesContract) &&
          input.salesContract.length !== 0))
    ) {
      console.log(
        '  product group with general filters brand customer product salescontract work'
      );

      const salesContractArr = input.salesContract
        ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const productArr = input.product
        ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
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

      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }
      if (input.royality_approval) {
        extrafilter.royality_approval = stringToBoolean(
          input.royality_approval
        );
      }
      if (input.order_status !== '') {
        const order_status = input.order_status;

        where.order_status = order_status;
        (filter_records.order_status = order_status),
          (filter.order_status = order_status);
      }
      const productAggregationPipelineRecords: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
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
            totalInvoices: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            salesTaxAmount: {
              $sum: '$salesTaxAmount',
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
            totalInvoices: 1,
            salesTaxAmount: 1,
          },
        },
      ];
      const productAggregationPipeline: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
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
            totalInvoices: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            salesTaxAmount: {
              $sum: '$salesTaxAmount',
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
            salesTaxAmount: 1,
            totalInvoices: 1,
          },
        },
        { $sort: { qty: -1, amount: -1 } },
      ];
      const productgroup = await InvoiceDtlModel.aggregate(
        productAggregationPipeline
      );
      const total_records = await InvoiceDtlModel.aggregate(
        productAggregationPipelineRecords
      );
      const totalInvoicesSum = total_records.reduce(
        (sum, item) => sum + item.totalInvoices,
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
      const saleTaxAmountSum = total_records.reduce(
        (sum, item) => sum + item.salesTaxAmount,
        0
      );
      const result = {
        Group: productgroup,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
        saleTaxAmountSum: saleTaxAmountSum,
      };
      return result;
    } else if (
      input.brand_group !== '' &&
      ((Array.isArray(input.product) && input.product.length !== 0) ||
        (Array.isArray(input.customer) && input.customer.length !== 0) ||
        (Array.isArray(input.brand) && input.brand.length !== 0) ||
        (Array.isArray(input.salesContract) &&
          input.salesContract.length !== 0))
    ) {
      console.log(
        '  brand group with general filters brand customer product salescontract work'
      );

      const salesContractArr = input.salesContract
        ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const productArr = input.product
        ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
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
      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }
      if (input.royality_approval) {
        extrafilter.royality_approval = stringToBoolean(
          input.royality_approval
        );
      }
      if (input.order_status !== '') {
        const order_status = input.order_status;

        where.order_status = order_status;
        (filter_records.order_status = order_status),
          (filter.order_status = order_status);
      }
      const brandAggregationPipelineRecords: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
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
            totalInvoices: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            salesTaxAmount: {
              $sum: '$salesTaxAmount',
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
            salesTaxAmount: 1,
            totalInvoices: 1,
          },
        },
      ];
      const brandAggregationPipeline: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: true,
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

            totalInvoices: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            salesTaxAmount: {
              $sum: '$salesTaxAmount',
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
            salesTaxAmount: 1,
            totalInvoices: 1,
          },
        },
        { $sort: { qty: -1, amount: -1 } },
      ];
      const brandgroup = await InvoiceDtlModel.aggregate(
        brandAggregationPipeline
      );
      const total_records = await InvoiceDtlModel.aggregate(
        brandAggregationPipelineRecords
      );

      const totalInvoicesSum = total_records.reduce(
        (sum, item) => sum + item.totalInvoices,
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
      const totalSaleTaxAmountSum = total_records.reduce(
        (sum, item) => sum + item.salesTaxAmount,
        0
      );
      const result = {
        Group: brandgroup,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    } else if (
      input.product_group !== '' &&
      input.order_status !== '' &&
      input.royality_approval !== ''
    ) {
      console.log('product group  royality_approval and orderstatus');

      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }

      const royality_approval = stringToBoolean(input.royality_approval);
      const order_status = input.order_status;

      const productAggregationPipelineRecord: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: true,
            order_status: order_status,
            royality_approval: royality_approval,
          },
        },

        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productInfo',
          },
        },
        {
          $group: {
            _id: '$product',
            productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            productName: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];

      const productAggregationPipeline: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: true,
            order_status: order_status,
            royality_approval: royality_approval,
          },
        },

        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productInfo',
          },
        },
        {
          $group: {
            _id: '$product',
            productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            productName: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];

      const product = await SalesContractDtlModel.aggregate(
        productAggregationPipeline
      );
      const total_records = await SalesContractDtlModel.aggregate(
        productAggregationPipelineRecord
      );
      const totalInvoices = product.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = product.reduce((sum, item) => sum + item.totalQty, 0);
      const totalAmountSum = product.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const result = {
        product_groupby: product,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoices,
      };
      return result;
    } else if (
      input.brand_group !== '' &&
      input.order_status !== '' &&
      input.royality_approval !== ''
    ) {
      console.log('brand group royality_approval and order_status');

      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }

      const royality_approval = stringToBoolean(input.royality_approval);
      const order_status = input.order_status;
      const brandAggregationPipelineRecord: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: true,
            order_status: order_status,
            royality_approval: royality_approval,
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
          $unwind: '$brand',
        },
        {
          $group: {
            _id: '$brand._id',
            name: { $first: '$brand.name' },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            _id: 0,
            name: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];
      const brandAggregationPipeline: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: true,
            order_status: order_status,
            royality_approval: royality_approval,
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
          $unwind: '$brand',
        },
        {
          $group: {
            _id: '$brand._id',
            name: { $first: '$brand.name' },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            _id: 0,
            name: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];
      const brandgroup = await SalesContractDtlModel.aggregate(
        brandAggregationPipeline
      );
      const total_records = await SalesContractDtlModel.aggregate(
        brandAggregationPipelineRecord
      );

      const totalInvoicesSum = brandgroup.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = brandgroup.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = brandgroup.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const result = {
        brand_groupby: brandgroup,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    } else if (
      input.customer_group !== '' &&
      input.order_status !== '' &&
      input.royality_approval !== ''
    ) {
      console.log('customer group royality_approval and orderstatus');

      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }

      const royality_approval = stringToBoolean(input.royality_approval);
      const order_status = input.order_status;
      const customerAggregationPipelineRecords: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: true,
            order_status: order_status,
            royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer_details',
          },
        },
        {
          $addFields: {
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: '$customer', // Group by customer ID
            customerName: { $first: '$customer_details.name' },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
            totalInvoices: { $sum: 1 },
          },
        },
        {
          $project: {
            customerName: 1,
            totalQty: 1,
            totalAmount: 1,
            totalInvoices: 1,
            _id: 0, // Exclude _id field
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];

      const customerAggregationPipeline: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            order_status: order_status,
            InHouse: true,
            royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer_details',
          },
        },
        {
          $addFields: {
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: '$customer', // Group by customer ID
            customerName: { $first: '$customer_details.name' },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
            totalInvoices: { $sum: 1 },
          },
        },
        {
          $project: {
            customerName: 1,
            totalQty: 1,
            totalAmount: 1,
            totalInvoices: 1,
            _id: 0,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];
      const customer = await SalesContractDtlModel.aggregate(
        customerAggregationPipeline
      );
      const total_records = await SalesContractDtlModel.aggregate(
        customerAggregationPipelineRecords
      );
      const totalInvoicesSum = customer.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
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
        customer_groupby: customer,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    } else if (input.product_group !== '' && input.order_status !== '') {
      console.log('order_status product group');
      const order_status = input.order_status;
      const productAggregationPipelineRecord: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: true,
            order_status: order_status,
          },
        },

        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productInfo',
          },
        },
        {
          $group: {
            _id: '$product',
            productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            productName: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];

      const productAggregationPipeline: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: true,
            order_status: order_status,
          },
        },

        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productInfo',
          },
        },
        {
          $group: {
            _id: '$product',
            productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            productName: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];

      const product = await SalesContractDtlModel.aggregate(
        productAggregationPipeline
      );
      const total_records = await SalesContractDtlModel.aggregate(
        productAggregationPipelineRecord
      );
      const totalInvoices = product.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = product.reduce((sum, item) => sum + item.totalQty, 0);
      const totalAmountSum = product.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const result = {
        product_groupby: product,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoices,
      };
      return result;
    } else if (input.customer_group !== '' && input.order_status !== '') {
      console.log('customer group order_status');

      const order_status = input.order_status;
      const customerAggregationPipelineRecords: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: true,
            order_status: order_status,
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer_details',
          },
        },
        {
          $addFields: {
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: '$customer', // Group by customer ID
            customerName: { $first: '$customer_details.name' },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
            totalInvoices: { $sum: 1 },
          },
        },
        {
          $project: {
            customerName: 1,
            totalQty: 1,
            totalAmount: 1,
            totalInvoices: 1,
            _id: 0, // Exclude _id field
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];

      const customerAggregationPipeline: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: true,
            order_status: order_status,
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer_details',
          },
        },
        {
          $addFields: {
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: '$customer', // Group by customer ID
            customerName: { $first: '$customer_details.name' },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
            totalInvoices: { $sum: 1 },
          },
        },
        {
          $project: {
            customerName: 1,
            totalQty: 1,
            totalAmount: 1,
            totalInvoices: 1,
            _id: 0,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];
      const customer = await SalesContractDtlModel.aggregate(
        customerAggregationPipeline
      );
      const total_records = await SalesContractDtlModel.aggregate(
        customerAggregationPipelineRecords
      );
      const totalInvoicesSum = customer.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
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
        customer_groupby: customer,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    } else if (input.brand_group !== '' && input.order_status !== '') {
      console.log('brand group order_status');

      const order_status = input.order_status;
      const brandAggregationPipelineRecord: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: true,
            order_status: order_status,
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
          $unwind: '$brand',
        },
        {
          $group: {
            _id: '$brand._id',
            name: { $first: '$brand.name' },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            _id: 0,
            name: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];
      const brandAggregationPipeline: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: true,
            order_status: order_status,
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
          $unwind: '$brand',
        },
        {
          $group: {
            _id: '$brand._id',
            name: { $first: '$brand.name' },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            _id: 0,
            name: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];
      const brandgroup = await SalesContractDtlModel.aggregate(
        brandAggregationPipeline
      );
      const total_records = await SalesContractDtlModel.aggregate(
        brandAggregationPipelineRecord
      );

      const totalInvoicesSum = brandgroup.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = brandgroup.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = brandgroup.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const result = {
        brand_groupby: brandgroup,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    } else if (input.product_group !== '' && input.royality_approval !== '') {
      console.log('product group  royality_approval');
      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }

      const royality_approval = stringToBoolean(input.royality_approval);

      const productAggregationPipelineRecord: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: true,
            royality_approval: royality_approval,
          },
        },

        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productInfo',
          },
        },
        {
          $group: {
            _id: '$product',
            productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            productName: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];

      const productAggregationPipeline: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: true,
            royality_approval: royality_approval,
          },
        },

        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productInfo',
          },
        },
        {
          $group: {
            _id: '$product',
            productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            productName: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];

      const product = await SalesContractDtlModel.aggregate(
        productAggregationPipeline
      );
      const total_records = await SalesContractDtlModel.aggregate(
        productAggregationPipelineRecord
      );
      const totalInvoices = product.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = product.reduce((sum, item) => sum + item.totalQty, 0);
      const totalAmountSum = product.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const result = {
        product_groupby: product,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoices,
      };
      return result;
    } else if (input.customer_group !== '' && input.royality_approval !== '') {
      console.log('customer group royality_approval');

      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }

      const royality_approval = stringToBoolean(input.royality_approval);
      const customerAggregationPipelineRecords: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: true,
            royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer_details',
          },
        },
        {
          $addFields: {
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: '$customer', // Group by customer ID
            customerName: { $first: '$customer_details.name' },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
            totalInvoices: { $sum: 1 },
          },
        },
        {
          $project: {
            customerName: 1,
            totalQty: 1,
            totalAmount: 1,
            totalInvoices: 1,
            _id: 0, // Exclude _id field
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];

      const customerAggregationPipeline: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: true,
            royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer_details',
          },
        },
        {
          $addFields: {
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: '$customer', // Group by customer ID
            customerName: { $first: '$customer_details.name' },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
            totalInvoices: { $sum: 1 },
          },
        },
        {
          $project: {
            customerName: 1,
            totalQty: 1,
            totalAmount: 1,
            totalInvoices: 1,
            _id: 0,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];
      const customer = await SalesContractDtlModel.aggregate(
        customerAggregationPipeline
      );
      const total_records = await SalesContractDtlModel.aggregate(
        customerAggregationPipelineRecords
      );
      const totalInvoicesSum = customer.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
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
        customer_groupby: customer,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    } else if (input.brand_group !== '' && input.royality_approval !== '') {
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
            invoice: true,
            InHouse: true,
            royality_approval: royality_approval,
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
          $unwind: '$brand',
        },
        {
          $group: {
            _id: '$brand._id',
            name: { $first: '$brand.name' },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            _id: 0,
            name: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];
      const brandAggregationPipeline: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            InHouse: true,
            invoice: true,
            royality_approval: royality_approval,
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
          $unwind: '$brand',
        },
        {
          $group: {
            _id: '$brand._id',
            name: { $first: '$brand.name' },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            _id: 0,
            name: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];
      const brandgroup = await SalesContractDtlModel.aggregate(
        brandAggregationPipeline
      );
      const total_records = await SalesContractDtlModel.aggregate(
        brandAggregationPipelineRecord
      );

      const totalInvoicesSum = brandgroup.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = brandgroup.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = brandgroup.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const result = {
        brand_groupby: brandgroup,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    }
  }
  if (input.nonAdm !== '') {
    console.log('nonAdm');
    if (
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0 &&
      input.customer_group == '' &&
      input.product_group == '' &&
      input.brand_group == '' &&
      input.salesContract_group == '' &&
      input.order_status == '' &&
      input.royality_approval == ''
    ) {
      console.log('no filter condition execute!');
      try {
        const invoice_groupby = await InvoiceDtlModel.aggregate([
          {
            $match: {
              date: {
                $gte: new Date(input.fromDate),
                $lte: new Date(input.toDate),
              },
              isDeleted: false,
              adm_invoice: false,
            },
          },

          {
            $group: {
              _id: null,
              totalQty: {
                $sum: '$qty',
              },
              totalRate: {
                $sum: '$rate',
              },
              totalAmount: {
                $sum: '$amount',
              },
              totalSaleTaxAmount: {
                $sum: '$salesTaxAmount',
              },
              data: {
                $push: '$$ROOT',
              },
            },
          },
          {
            $addFields: {
              totalValue: {
                $sum: {
                  $map: {
                    input: '$data',
                    as: 'item',
                    in: {
                      $divide: [
                        {
                          $multiply: [
                            '$$item.amount',
                            '$$item.exchangeRate',
                            '$$item.salesTaxRate',
                          ],
                        },
                        100,
                      ],
                    },
                  },
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              totalQty: 1,
              totalRate: 1,
              totalValue: 1,
              totalAmount: 1,
              totalSaleTaxAmount: 1,
              data: 1,
            },
          },
        ]);
        const total_qty = invoice_groupby.map((item) => item.totalQty);
        const total_amount = invoice_groupby.map((item) => item.totalAmount);
        const total_rate = invoice_groupby.map((item) => item.totalRate);
        const totalValue = invoice_groupby.map((item) => item.totalValue);
        const total_records = await InvoiceModel.aggregate([
          {
            $match: {
              date: {
                $gte: new Date(input.fromDate),
                $lte: new Date(input.toDate),
              },
              isDeleted: false,
              adm_invoice: false,
            },
          },
        ]);

        const invoiceamountpkr = await InvoiceDtlModel.aggregate([
          {
            $match: {
              date: {
                $gte: new Date(input.fromDate),
                $lte: new Date(input.toDate),
              },
              isDeleted: false,
              adm_invoice: false,
            },
          },
        ]);

        const qty = invoiceamountpkr.map((item) => item.qty);
        const saletaxrate = invoiceamountpkr.map((item) => item.salesTaxRate);
        const rate = invoiceamountpkr.map((item) => item.rate);

        const saletax = qty.map((amount, index) => amount * rate[index]);
        const saletaxamount = saletaxrate.map(
          (amount, index) => amount * saletax[index]
        );
        const SaleTaxAmount = saletaxamount.reduce(
          (total, value) => total + value
        );

        const Amount = invoiceamountpkr.map((item) => item.amount);
        const Rate = invoiceamountpkr.map((item) => item.rate);
        const qtypkr = Amount.map((amount, index) => amount * Rate[index]);

        const AmountPKR = qtypkr.reduce((total, value) => total + value, 0);

        const invoice_detail = await InvoiceDtlModel.aggregate([
          {
            $match: {
              date: {
                $gte: new Date(input.fromDate),
                $lte: new Date(input.toDate),
              },
              isDeleted: false,
              adm_invoice: false,
            },
          },
          {
            $lookup: {
              from: 'invoices',
              localField: 'invoice',
              foreignField: '_id',
              as: 'inv_dtl',
            },
          },
          {
            $lookup: {
              from: 'salescontracts',
              localField: 'salesContract',
              foreignField: '_id',
              as: 'sale_dtl',
            },
          },
          {
            $lookup: {
              from: 'customers',
              localField: 'customer',
              foreignField: '_id',
              as: 'customer_dtl',
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

          { $sort: { date: -1 } },
        ]);
        const result = {
          invoice_detail: invoice_detail,
          paginated_record: invoice_detail.length,
          totalQty: total_qty,
          totalAmount: total_amount,
          totalRate: total_rate,
          total_records: total_records.length,
          totalAmountPKR: AmountPKR,
          totalValue: totalValue,
          SaleTaxAmount: SaleTaxAmount,
        };
        return result;
      } catch (error) {
        console.log(error);
      }
    } else if (
      input.product_group !== '' &&
      input.order_status == '' &&
      input.royality_approval == '' &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('product group');

      // const total_records = await ProductModel.countDocuments();
      // const product_group = await ProductModel.aggregate([
      //   {
      //     $match: {
      //       isDeleted: false,
      //     },
      //   },
      //   {
      //     $lookup: {
      //       from: 'invoicedtls',
      //       localField: '_id',
      //       foreignField: 'product',
      //       as: 'invoice_record',
      //       pipeline: [
      //         {
      //           $match: {
      //             isDeleted: false,
      //           },
      //         },
      //         {
      //           $project: {
      //             qty: 1,
      //             amount: 1,
      //             salesTaxAmount: 1,
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
      //             input: '$invoice_record',
      //             as: 'item',
      //             in: '$$item.qty',
      //           },
      //         },
      //       },
      //     },
      //   },
      //   {
      //     $addFields: {
      //       totalAmount: {
      //         $sum: {
      //           $map: {
      //             input: '$invoice_record',
      //             as: 'item',
      //             in: '$$item.amount',
      //           },
      //         },
      //       },
      //     },
      //   },
      //   {
      //     $addFields: {
      //       totalSaleTaxAmount: {
      //         $sum: {
      //           $map: {
      //             input: '$invoice_record',
      //             as: 'item',
      //             in: '$$item.salesTaxAmount',
      //           },
      //         },
      //       },
      //     },
      //   },
      //   {
      //     $project: {
      //       name: 1,
      //       invoice_record: {
      //         $size: '$invoice_record',
      //       },
      //       totalQty: 1,
      //       totalAmount: 1,
      //       totalSaleTaxAmount: 1,
      //     },
      //   },
      //   // Move the $match to this point after the totalQty is computed
      //   {
      //     $match: {
      //       totalQty: { $gt: 0 },  // Ensure you're filtering by totalQty > 0
      //     },
      //   },
      //   { $limit: limit },
      //   { $skip: skipCount },
      // ]);

      const productAggregationPipelineRecord: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
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
          $addFields: {
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
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
            totalSaleTaxAmount: {
              $gt: 0,
            },
          },
        },
        {
          $group: {
            _id: '$product',
            name: {
              $first: '$product.name', // Retrieve product name
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$totalSaleTaxAmount',
            },
            totalInvoices: {
              $sum: 1,
            },
          },
        },
        {
          $project: {
            name: 1,
            totalQty: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            totalInvoices: 1,
            _id: 0,
          },
        },
        {
          $sort: {
            totalQty: -1,
            totalAmount: -1,
          },
        },
      ];

      const productAggregationPipeline: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
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
          $addFields: {
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
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
            totalSaleTaxAmount: {
              $gt: 0,
            },
          },
        },
        {
          $group: {
            _id: '$product',
            name: {
              $first: '$product.name', // Retrieve product name
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$totalSaleTaxAmount',
            },
            totalInvoices: {
              $sum: 1,
            },
          },
        },
        {
          $project: {
            name: 1,
            totalQty: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            totalInvoices: 1,
            _id: 0,
          },
        },
        {
          $sort: {
            totalQty: -1,
            totalAmount: -1,
          },
        },
      ];

      const product_group = await InvoiceDtlModel.aggregate(
        productAggregationPipeline
      );
      const total_records = await InvoiceDtlModel.aggregate(
        productAggregationPipelineRecord
      );
      const invoiceRecordSum = total_records.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = total_records.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = total_records.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalSaleTaxAmountSum = total_records.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );

      const result = {
        product_group: product_group,
        paginated_record: product_group.length,
        total_records: total_records.length,
        invoiceTotalRecordSum: invoiceRecordSum,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
      };
      return result;
    } else if (
      input.customer_group !== '' &&
      input.order_status == '' &&
      input.royality_approval == '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('customer general ');
      const customerAggregationPipelineRecord: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
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
          $addFields: {
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
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
            totalSaleTaxAmount: {
              $gt: 0,
            },
          },
        },
        {
          $group: {
            _id: '$customer',
            name: {
              $first: '$customer.name',
            },
            // Retrieve customer name
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$totalSaleTaxAmount',
            },
            totalInvoices: {
              $sum: 1,
            }, //
          },
        },
        {
          $project: {
            name: 1,
            totalQty: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            totalInvoices: 1,
            _id: 0,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];
      const customerAggregationPipeline: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
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
          $addFields: {
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
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
            totalSaleTaxAmount: {
              $gt: 0,
            },
          },
        },
        {
          $group: {
            _id: '$customer',
            name: {
              $first: '$customer.name',
            },
            // Retrieve customer name
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$totalSaleTaxAmount',
            },
            totalInvoices: {
              $sum: 1,
            }, //
          },
        },
        {
          $project: {
            name: 1,
            totalQty: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            totalInvoices: 1,
            _id: 0,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];
      const customer_group = await InvoiceDtlModel.aggregate(
        customerAggregationPipeline
      );
      const total_records = await InvoiceDtlModel.aggregate(
        customerAggregationPipelineRecord
      );

      const customerQtySum = total_records.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const customerinvoiceRecordSum = total_records.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const customertotalSaleTaxAmountSum = total_records.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const customertotalAmountSum = total_records.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const result = {
        Group: customer_group,
        paginated_records: customer_group.length,
        total_records: total_records.length,
        customerTotalQtySum: customerQtySum,
        customerTotalInvoiceRecordSum: customerinvoiceRecordSum,
        totalSaleTaxAmountSum: customertotalSaleTaxAmountSum,
        customertotalAmountSum: customertotalAmountSum,
      };
      return result;
    } else if (
      input.salesContract_group !== '' &&
      input.order_status == '' &&
      input.royality_approval == '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      const salesContractAggregationPipelineRecord: any = [
        {
          $match: {
            isDeleted: false,
            adm_invoice: false,
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContract',
          },
        },
        {
          $addFields: {
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
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
            totalSaleTaxAmount: {
              $gt: 0,
            },
          },
        },
        {
          $group: {
            _id: '$salesContract',
            salesContractNumber: {
              $first: '$salesContract.contract', // Retrieve sales contract number or identifier
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$totalSaleTaxAmount',
            },
            totalInvoices: {
              $sum: 1,
            },
          },
        },
        {
          $project: {
            salesContractNumber: 1,
            totalQty: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            totalInvoices: 1,
            _id: 0,
          },
        },
        {
          $sort: {
            totalQty: -1,
            totalAmount: -1,
          },
        },
      ];
      const salesContractAggregationPipeline: any = [
        {
          $match: {
            isDeleted: false,
            adm_invoice: false,
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salesContract',
          },
        },
        {
          $addFields: {
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
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
            totalSaleTaxAmount: {
              $gt: 0,
            },
          },
        },
        {
          $group: {
            _id: '$salesContract',
            salesContractNumber: {
              $first: '$salesContract.contract', // Retrieve sales contract number or identifier
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$totalSaleTaxAmount',
            },
            totalInvoices: {
              $sum: 1,
            },
          },
        },
        {
          $project: {
            salesContractNumber: 1,
            totalQty: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            totalInvoices: 1,
            _id: 0,
          },
        },
        {
          $sort: {
            totalQty: -1,
            totalAmount: -1,
          },
        },
      ];
      const salecontract_group = await InvoiceDtlModel.aggregate(
        salesContractAggregationPipeline
      );
      const total_record = await InvoiceDtlModel.aggregate(
        salesContractAggregationPipelineRecord
      );

      const totalInvoiceSum = total_record.reduce(
        (sum, item) => sum + item.totalInvoices,
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
      const totalSaleTaxAmountSum = total_record.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const salesContractNumberSum = total_record.reduce(
        (sum, item) => sum + item.salesContractNumber,
        0
      );
      const result = {
        salecontract_group: salecontract_group,
        total_records: salecontract_group.length,
        paginated_record: total_record.length,
        totalInvoiceSum: totalInvoiceSum,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        salesContractNumberSum: salesContractNumberSum,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
      };
      return result;
    } else if (
      input.brand_group !== '' &&
      input.order_status == '' &&
      input.royality_approval == '' &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('brand group general');

      const brandAggregationPipelineRecord: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
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
          $addFields: {
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
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
            totalSaleTaxAmount: {
              $gt: 0,
            },
          },
        },
        {
          $group: {
            _id: '$brand',
            name: {
              $first: '$brand.name',
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$totalSaleTaxAmount',
            },
            totalInvoices: {
              $sum: 1,
            },
          },
        },
        {
          $project: {
            name: 1,
            totalQty: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            totalInvoices: 1,
            _id: 0,
          },
        },
        {
          $sort: {
            totalQty: -1,
            totalAmount: -1,
          },
        },
      ];

      const brandAggregationPipeline: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
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
          $group: {
            _id: '$brand._id',
            name: { $first: '$brand.name' },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
            totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
            totalInvoices: { $sum: 1 },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
            totalSaleTaxAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            name: 1,
            totalQty: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            totalInvoices: 1,
          },
        },
        {
          $sort: {
            totalQty: -1,
            totalAmount: -1,
          },
        },
      ];
      const brandgroup = await InvoiceDtlModel.aggregate(
        brandAggregationPipeline
      );

      const total_records = await InvoiceDtlModel.aggregate(
        brandAggregationPipelineRecord
      );

      const totalInvoicesSum = total_records.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const invoicetotalSaleTaxAmountSum = total_records.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const totalQtySum = total_records.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = total_records.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const result = {
        brand_groupby: brandgroup,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
        totalSaleTaxAmount: invoicetotalSaleTaxAmountSum,
      };
      return result;
    } else if (
      input.order_status !== '' &&
      input.royality_approval == '' &&
      input.customer_group == '' &&
      input.product_group == '' &&
      input.brand_group == '' &&
      input.salesContract_group == '' &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('order_status filter');

      const order_status = input.order_status;

      const inv_dtl = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
          },
        },
        {
          $lookup: {
            from: 'salescontractdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'sale_dtl',
            pipeline: [
              {
                $match: {
                  order_status: order_status,
                  InHouse: false,
                },
              },
            ],
          },
        },
        {
          $match: {
            'sale_dtl.0': {
              $exists: true,
            },
          },
        },
        {
          $lookup: {
            from: 'invoices',
            localField: 'invoice',
            foreignField: '_id',
            as: 'invoice',
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salescontract',
            pipeline: [
              {
                $lookup: {
                  from: 'paymentterms',
                  localField: 'paymentTerm',
                  foreignField: '_id',
                  as: 'payment_term',
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
            as: 'customer_dtl',
          },
        },
        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'product_dtl',
          },
        },
        {
          $unwind: {
            path: '$salescontract',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: '$salescontract.payment_term',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: '$customer_dtl',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: '$product_dtl',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: '$invoice',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $sort: { date: -1 },
        },
        {
          $facet: {
            Summary: [
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
                  _id: null,
                  qty: { $sum: '$qty' },
                  rate: { $sum: '$rate' },
                  amount: { $sum: '$amount' },
                  salesTaxAmount: { $sum: '$salesTaxAmount' },
                },
              },
            ],
            AmountPkr: [
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
                $addFields: {
                  AmountInPkr: {
                    $multiply: ['$amount', '$rate'],
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  totalAmountInPkr: { $sum: '$AmountInPkr' },
                },
              },
            ],
            TotalValue: [
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
                $addFields: {
                  totalValue: {
                    $sum: {
                      $divide: [
                        {
                          $multiply: [
                            '$amount',
                            '$exchangeRate',
                            '$salesTaxRate',
                          ],
                        },
                        100,
                      ],
                    },
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  totalAmountInPkr: { $sum: '$totalValue' },
                },
              },
            ],
            ItemDetails: [
              {
                $project: {
                  qty: 1,
                  amount: 1,
                  uom: 1,
                  salesTaxAmount: 1,
                  rate: 1,
                  exchangeRate: 1,
                  salesTaxRate: 1,
                  contract: '$salescontract.contract',
                  saleTaxInvoiceNo: '$invoice.salesTaxInvoiceNo',
                  invoiceDate: '$invoice.date',
                  customerName: '$customer_dtl.name',
                  productName: '$product_dtl.name',
                },
              },
            ],
          },
        },
      ]);
      const total_records = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
          },
        },
        {
          $lookup: {
            from: 'salescontractdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'sale_dtl',
            pipeline: [
              {
                $match: {
                  order_status: order_status,
                  InHouse: false,
                },
              },
            ],
          },
        },
        {
          $match: {
            'sale_dtl.0': {
              $exists: true,
            },
          },
        },
      ]);

      let result = {
        inv_dtl: inv_dtl,
        total_records: total_records.length,
        paginated_record: inv_dtl.length,
      };
      return result;
    } else if (
      input.royality_approval !== '' &&
      input.order_status == '' &&
      input.customer_group == '' &&
      input.salesContract_group == '' &&
      input.product_group == '' &&
      input.brand_group == '' &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('royality approval filter');

      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }

      const salegroupby = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
          },
        },
        {
          $lookup: {
            from: 'salescontractdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'sale_dtl',
            pipeline: [
              {
                $match: {
                  royality_approval: stringToBoolean(input.royality_approval),
                },
              },
            ],
          },
        },
        {
          $addFields: {
            sale_dtl: {
              $arrayElemAt: ['$sale_dtl', 0],
            },
          },
        },
        {
          $group: {
            _id: null,
            totalQty: {
              $sum: '$qty',
            },
            totalRate: {
              $sum: '$rate',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
            },
            data: {
              $push: '$$ROOT',
            },
          },
        },
        {
          $addFields: {
            totalValue: {
              $sum: {
                $map: {
                  input: '$data',
                  as: 'item',
                  in: {
                    $divide: [
                      {
                        $multiply: [
                          '$$item.amount',
                          '$$item.exchangeRate',
                          '$$item.salesTaxRate',
                        ],
                      },
                      100,
                    ],
                  },
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalQty: 1,
            totalRate: 1,
            totalValue: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            data: 1,
          },
        },
      ]);

      const inv_rate = salegroupby.flatMap(
        (item) => item.data.map((dataItem: any) => dataItem.rate || 0) // Default to 0 if rate is missing
      );
      const inv_amount = salegroupby.flatMap(
        (item) => item.data.map((dataItem: any) => dataItem.amount || 0) // Default to 0 if amount is missing
      );
      const qtypkr = inv_amount.map(
        (amount, index) => amount * inv_rate[index]
      );
      const AmountPKR = qtypkr.reduce((total, value) => total + value, 0);

      const invoice_dtl = await InvoiceDtlModel.aggregate([
        {
          $lookup: {
            from: 'salescontractdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'sale_dtl',
            pipeline: [
              {
                $match: {
                  InHouse: false,
                  royality_approval: stringToBoolean(input.royality_approval),
                },
              },
              {
                $lookup: {
                  from: 'salescontracts',
                  localField: 'salesContract',
                  foreignField: '_id',
                  as: 'salecontract',
                },
              },
            ],
          },
        },
        {
          $match: {
            'sale_dtl.0': {
              $exists: true,
            },
          },
        },
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
            from: 'invoices',
            localField: 'invoice',
            foreignField: '_id',
            as: 'invoice',
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
            as: 'customer_dtl',
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
          $sort: {
            date: -1,
          },
        },
      ]);

      const totalRecordCount = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false, // Filter out deleted records
          },
        },
        {
          $lookup: {
            from: 'salescontractdtls',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'sale_dtl',
            pipeline: [
              {
                $match: {
                  InHouse: false,
                  royality_approval: stringToBoolean(input.royality_approval), // Apply royality_approval filter
                },
              },
            ],
          },
        },
        {
          $match: {
            'sale_dtl.0': { $exists: true }, // Ensure at least one `sale_dtl` exists after the lookup
          },
        },
      ]);
      const totalQty = salegroupby.map((item: any) => item.totalQty);
      const totalRate = salegroupby.map((item: any) => item.totalRate);
      const totalAmount = salegroupby.map((item: any) => item.totalAmount);
      const totalValue = salegroupby.map((item: any) => item.totalValue);
      const saleTaxAmount = salegroupby.map(
        (item: any) => item.totalSaleTaxAmount
      );

      let result = {
        shipmentdtl: invoice_dtl,
        paginated_record: invoice_dtl.length,
        total_records: totalRecordCount.length,
        totalQty: totalQty,
        totalRate: totalRate,
        totalAmount: totalAmount,
        saleTaxAmount: saleTaxAmount,
        AmountPKR: AmountPKR,
        totalValue: totalValue,
      };
      return result;
    } else if (
      input.customer_group == '' &&
      input.product_group == '' &&
      input.brand_group == '' &&
      (input.order_status !== '' ||
        input.royality_approval !== '' ||
        (Array.isArray(input.product) && input.product.length !== 0) ||
        (Array.isArray(input.customer) && input.customer.length !== 0) ||
        (Array.isArray(input.brand) && input.brand.length !== 0) ||
        (Array.isArray(input.salesContract) &&
          input.salesContract.length !== 0))
    ) {
      console.log('general condition');

      const salecontractArr = input.salesContract
        ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const productArr = input.product
        ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      let filter: any = {};
      let filter_records: any = {};
      let where: any = {};

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

      const invoiceamountpkr = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
          },
        },
        {
          $match: filter,
        },
      ]);

      let SaleTaxAmount;
      let AmountPKR;
      if (Array.isArray(invoiceamountpkr) && invoiceamountpkr.length == 0) {
        SaleTaxAmount = [];
        AmountPKR = [];
      } else {
        const qty = invoiceamountpkr.map((item) => (item.qty ? item.qty : []));
        const saletaxrate = invoiceamountpkr.map((item) => item.salesTaxRate);
        const rate = invoiceamountpkr.map((item) =>
          item.rate ? item.rate : []
        );

        const saletax = qty.map((amount, index) => amount * rate[index]);

        const saletaxamount = saletaxrate.map(
          (amount, index) => amount * saletax[index]
        );

        SaleTaxAmount = saletaxamount.reduce((total, value) => total + value);

        const Amount = invoiceamountpkr.map((item) =>
          item.amount ? item.amount : []
        );
        const Rate = invoiceamountpkr.map((item) =>
          item.rate ? item.exchangeRate : []
        );

        const qtypkr = Amount.map((amount, index) => amount * Rate[index]);

        AmountPKR = qtypkr.reduce((total, value) => total + value, 0);
      }

      const total_record = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
          },
        },
        {
          $match: filter_records,
        },
      ]);
      const invoicegroupby = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
          },
        },
        {
          $match: filter,
        },
        {
          $group: {
            _id: null,
            totalQty: {
              $sum: '$qty',
            },
            totalRate: {
              $sum: '$rate',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
            },
            data: {
              $push: '$$ROOT',
            },
          },
        },
        {
          $addFields: {
            totalValue: {
              $sum: {
                $map: {
                  input: '$data',
                  as: 'item',
                  in: {
                    $divide: [
                      {
                        $multiply: [
                          '$$item.amount',
                          '$$item.exchangeRate',
                          '$$item.salesTaxRate',
                        ],
                      },
                      100,
                    ],
                  },
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalQty: 1,
            totalRate: 1,
            totalValue: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            data: 1,
          },
        },
      ]);
      const totalQty = invoicegroupby.map((item) => item.totalQty);
      const totalAmount = invoicegroupby.map((item) => item.totalAmount);
      const totalRate = invoicegroupby.map((item) => item.totalRate);
      const totalValue = invoicegroupby.map((item) => item.totalValue);
      const invoice_detail = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
          },
        },
        {
          $match: where,
        },
        {
          $lookup: {
            from: 'invoices',
            localField: 'invoice',
            foreignField: '_id',
            as: 'inv_dtl',
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'sale_dtl',
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer_dtl',
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

        { $sort: { date: -1 } },
      ]);
      if (Array.isArray(invoice_detail) && invoice_detail.length == 0) {
        const result = {
          invoice_dtl: [],
          total_record: [],
          paginated_record: [],
          totalAmount: [],
          totalQty: [],
          totalRate: [],
          totalAmountPKR: [],
          SaleTaxAmount: [],
        };
        return result;
      } else {
        const result = {
          invoice_detail: invoice_detail,
          total_records: total_record.length,
          paginated_record: invoice_detail.length,
          totalAmount: totalAmount,
          totalQty: totalQty,
          totalRate: totalRate,
          totalValue: totalValue,
          totalAmountPKR: AmountPKR,
          SaleTaxAmount: SaleTaxAmount,
        };
        return result;
      }
    } else if (
      input.customer_group !== '' &&
      input.royality_approval == '' &&
      input.order_status == '' &&
      Array.isArray(input.customer) &&
      input.customer.length !== 0 &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('customer group customer ');

      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const customer = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
          },
        },
        {
          $match: {
            isDeleted: false,
            customer: { $in: customerArr },
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer_details',
          },
        },
        {
          $addFields: {
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
            totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
            totalSaleTaxAmount: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: '$customer', // Group by customer ID
            customerName: { $first: '$customer_details.name' }, // Retrieve customer name
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
            totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
            totalInvoices: { $sum: 1 }, // Count the number of contracts for each customer
          },
        },
        {
          $project: {
            customerName: 1,
            totalQty: 1,
            totalAmount: 1,
            totalInvoices: 1,
            totalSaleTaxAmount: 1,
            _id: 0, // Exclude _id field
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ]);

      const totalInvoicesSum = customer.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );

      const totalQtySum = customer.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = customer.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalSaleTaxAmountSum = customer.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const result = {
        customer_groupby: customer,
        total_records: customer.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    } else if (
      input.product_group !== '' &&
      input.royality_approval == '' &&
      input.order_status == '' &&
      Array.isArray(input.product) &&
      input.product.length !== 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('product to product group');

      const productArr = input.product
        ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const product = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
          },
        },

        {
          $match: {
            isDeleted: false,
            product: { $in: productArr },
          },
        },

        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productInfo',
          },
        },
        {
          $group: {
            _id: '$product',
            productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
            totalSaleTaxAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            productName: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ]);

      const totalInvoices = product.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = product.reduce((sum, item) => sum + item.totalQty, 0);
      const totalAmountSum = product.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalSaleTaxAmountSum = product.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const result = {
        product_groupby: product,
        total_records: product.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoices,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
      };
      return result;
    } else if (
      input.customer_group !== '' &&
      input.royality_approval == '' &&
      input.order_status == '' &&
      Array.isArray(input.brand) &&
      input.brand.length !== 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('customer group brand');

      const brandArr = input.brand
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const customer = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
          },
        },
        {
          $match: {
            isDeleted: false,
            brand: { $in: brandArr },
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer_details',
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand_details',
          },
        },
        {
          $addFields: {
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
            totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
            totalSaleTaxAmount: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: '$customer', // Group by customer ID
            customerName: { $first: '$customer_details.name' },
            brandName: { $first: '$brand_details.name' }, // Retrieve customer name
            totalQty: { $sum: '$qty' },
            totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
            totalAmount: { $sum: '$amount' },
            totalInvoices: { $sum: 1 }, // Count the number of contracts for each customer
          },
        },
        {
          $project: {
            customerName: 1,
            brandName: 1,
            totalQty: 1,
            c: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
            totalInvoices: 1,
            _id: 0, // Exclude _id field
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ]);

      const totalInvoicesSum = customer.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = customer.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = customer.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalSaleTaxAmount = customer.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );

      const result = {
        customer_groupby: customer,
        total_records: customer.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
        totalSaleTaxAmount: totalSaleTaxAmount,
      };
      return result;
    } else if (
      input.product_group !== '' &&
      input.royality_approval == '' &&
      input.order_status == '' &&
      Array.isArray(input.brand) &&
      input.brand.length !== 0 &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('product to brand');

      const total_records = await BrandModel.countDocuments();
      const brandArr = input.brand
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const product = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
          },
        },

        {
          $match: {
            // isDeleted: false,
            brand: { $in: brandArr },
          },
        },

        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productInfo',
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brandInfo',
          },
        },
        {
          $group: {
            _id: '$product',
            productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
            brandName: { $first: { $arrayElemAt: ['$brandInfo.name', 0] } },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
            totalSaleTaxAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            productName: 1,
            brandName: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalSaleTaxAmount: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ]);

      const totalInvoices = product.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = product.reduce((sum, item) => sum + item.totalQty, 0);
      const totalAmountSum = product.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalSaleTaxAmountSum = product.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const result = {
        product_groupby: product,
        total_records: total_records,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoices,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
      };
      return result;
    } else if (
      input.brand_group !== '' &&
      input.royality_approval == '' &&
      input.order_status == '' &&
      Array.isArray(input.brand) &&
      input.brand.length !== 0 &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length !== 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length !== 0
    ) {
      console.log('brandgroup brand');
      const brandArr = input.brand
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const total_records = await BrandModel.countDocuments();

      const brandgroup = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },

            isDeleted: false,
            adm_invoice: false,
            brand: { $in: brandArr },
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
          $unwind: '$brand',
        },
        {
          $group: {
            _id: '$brand._id', // Group by brand's _id
            name: { $first: '$brand.name' },
            totalInvoices: { $sum: 1 }, // Calculate the total number of contracts
            totalQty: { $sum: '$qty' }, // Calculate the total quantity
            totalAmount: { $sum: '$amount' },
            totalSaleTaxAmount: { $sum: '$salesTaxAmount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
            totalSaleTaxAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            _id: 0, // Exclude _id field
            name: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
            totalSaleTaxAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ]);

      const totalInvoiceSum = brandgroup.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = brandgroup.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = brandgroup.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalSaleTaxAmountSum = brandgroup.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const result = {
        brand_groupby: brandgroup,
        total_records: brandgroup.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoiceSum: totalInvoiceSum,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
      };
      return result;
    } else if (
      input.brand_group !== '' &&
      input.royality_approval == '' &&
      input.order_status == '' &&
      Array.isArray(input.customer) &&
      input.customer.length !== 0 &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('brand to customer');
      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      const brandgroup = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
            customer: { $in: customerArr },
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
            _id: '$brand._id',
            brandName: {
              $first: '$brand.name',
            },
            customerName: { $first: '$customer.name' },
            totalInvoices: {
              $sum: 1,
            },
            totalQty: {
              $sum: '$qty',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
            },
            totalAmount: {
              $sum: '$amount',
            },
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ]);

      const totalInvoicesSum = brandgroup.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = brandgroup.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = brandgroup.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalSaleTaxAmountSum = brandgroup.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const result = {
        brand_groupby: brandgroup,
        total_records: brandgroup.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    } else if (
      input.product_group !== '' &&
      input.royality_approval == '' &&
      input.order_status == '' &&
      Array.isArray(input.customer) &&
      input.customer.length !== 0 &&
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('product group customer');
      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const productdtl = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
            customer: { $in: customerArr },
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
            as: 'products',
          },
        },

        {
          $group: {
            _id: '$products._id',
            productName: {
              $first: '$products.name',
            },
            customerName: {
              $first: '$customer.name',
            },
            totalInvoices: {
              $sum: 1,
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ]);

      const totalInvoiceSum = productdtl.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = productdtl.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = productdtl.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalSaleTaxAmountSum = productdtl.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const result = {
        product_groupby: productdtl,
        total_records: productdtl.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoiceSum: totalInvoiceSum,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
      };
      return result;
    } else if (
      input.customer_group !== '' &&
      input.royality_approval == '' &&
      input.order_status == '' &&
      Array.isArray(input.product) &&
      input.product.length !== 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('product to customer');
      const productArr = input.product
        ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const customerdtl = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
            product: { $in: productArr },
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
            _id: '$customer._id',
            CustomerName: {
              $first: '$customer.name',
            },
            productName: {
              $first: '$product.name',
            },
            totalInvoices: {
              $sum: 1,
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
            },
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ]);
      const totalInvoicesSum = customerdtl.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = customerdtl.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = customerdtl.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalSaleTaxAmountSum = customerdtl.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const result = {
        customer_groupby: customerdtl,
        total_records: customerdtl.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
      };
      return result;
    } else if (
      input.brand_group !== '' &&
      input.royality_approval == '' &&
      input.order_status == '' &&
      Array.isArray(input.product) &&
      input.product.length !== 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      Array.isArray(input.salesContract) &&
      input.salesContract.length == 0
    ) {
      console.log('product to brand');

      const productArr = input.product
        ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const branddtl = await InvoiceDtlModel.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
            product: { $in: productArr },
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
            productname: {
              $first: '$products.name',
            },
            brandname: {
              $first: '$brand.name',
            },
            totalInvoices: {
              $sum: 1,
            },
            totalQty: {
              $sum: '$qty',
            },
            totalAmount: {
              $sum: '$amount',
            },
            totalSaleTaxAmount: {
              $sum: '$salesTaxAmount',
            },
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ]);
      const totalInvoicesSum = branddtl.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = branddtl.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = branddtl.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const totalSaleTaxAmountSum = branddtl.reduce(
        (sum, item) => sum + item.totalSaleTaxAmount,
        0
      );
      const result = {
        brand_groupby: branddtl,
        total_records: branddtl.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
      };
      return result;
    } else if (
      input.customer_group !== '' &&
      ((Array.isArray(input.product) && input.product.length !== 0) ||
        (Array.isArray(input.customer) && input.customer.length !== 0) ||
        (Array.isArray(input.brand) && input.brand.length !== 0) ||
        (Array.isArray(input.salesContract) &&
          input.salesContract.length !== 0))
    ) {
      console.log(
        '  customer group with general filters brand customer product salescontract work'
      );

      const salesContractArr = input.salesContract
        ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const productArr = input.product
        ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
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

      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }
      if (input.royality_approval) {
        extrafilter.royality_approval = stringToBoolean(
          input.royality_approval
        );
      }
      if (input.order_status !== '') {
        const order_status = input.order_status;

        where.order_status = order_status;
        (filter_records.order_status = order_status),
          (filter.order_status = order_status);
      }

      const customerAggregationPipelineRecords: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
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
            totalInvoices: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            salesTaxAmount: {
              $sum: '$salesTaxAmount',
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
            salesTaxAmount: 1,
            totalInvoices: 1,
          },
        },
      ];

      const customerAggregationPipeline: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
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
            totalInvoices: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            salesTaxAmount: {
              $sum: '$salesTaxAmount',
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
            salesTaxAmount: 1,
            totalInvoices: 1,
          },
        },
        { $sort: { qty: -1, amount: -1 } },
      ];

      const customergroup = await InvoiceDtlModel.aggregate(
        customerAggregationPipeline
      );

      const total_records = await InvoiceDtlModel.aggregate(
        customerAggregationPipelineRecords
      );

      const totalInvoicesSum = total_records.reduce(
        (sum, item) => sum + item.totalInvoices,
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
      const totalSaleTaxAmountSum = total_records.reduce(
        (sum, item) => sum + item.saleTaxAmount,
        0
      );
      const result = {
        Group: customergroup,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    } else if (
      input.product_group !== '' &&
      ((Array.isArray(input.product) && input.product.length !== 0) ||
        (Array.isArray(input.customer) && input.customer.length !== 0) ||
        (Array.isArray(input.brand) && input.brand.length !== 0) ||
        (Array.isArray(input.salesContract) &&
          input.salesContract.length !== 0))
    ) {
      console.log(
        '  product group with general filters brand customer product salescontract work'
      );

      const salesContractArr = input.salesContract
        ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const productArr = input.product
        ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
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

      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }
      if (input.royality_approval) {
        extrafilter.royality_approval = stringToBoolean(
          input.royality_approval
        );
      }
      if (input.order_status !== '') {
        const order_status = input.order_status;

        where.order_status = order_status;
        (filter_records.order_status = order_status),
          (filter.order_status = order_status);
      }
      const productAggregationPipelineRecords: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
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
            totalInvoices: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            salesTaxAmount: {
              $sum: '$salesTaxAmount',
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
            totalInvoices: 1,
            salesTaxAmount: 1,
          },
        },
      ];
      const productAggregationPipeline: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
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
            totalInvoices: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            salesTaxAmount: {
              $sum: '$salesTaxAmount',
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
            salesTaxAmount: 1,
            totalInvoices: 1,
          },
        },
        { $sort: { qty: -1, amount: -1 } },
      ];
      const productgroup = await InvoiceDtlModel.aggregate(
        productAggregationPipeline
      );
      const total_records = await InvoiceDtlModel.aggregate(
        productAggregationPipelineRecords
      );
      const totalInvoicesSum = total_records.reduce(
        (sum, item) => sum + item.totalInvoices,
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
      const saleTaxAmountSum = total_records.reduce(
        (sum, item) => sum + item.salesTaxAmount,
        0
      );
      const result = {
        Group: productgroup,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
        saleTaxAmountSum: saleTaxAmountSum,
      };
      return result;
    } else if (
      input.brand_group !== '' &&
      ((Array.isArray(input.product) && input.product.length !== 0) ||
        (Array.isArray(input.customer) && input.customer.length !== 0) ||
        (Array.isArray(input.brand) && input.brand.length !== 0) ||
        (Array.isArray(input.salesContract) &&
          input.salesContract.length !== 0))
    ) {
      console.log(
        '  brand group with general filters brand customer product salescontract work'
      );

      const salesContractArr = input.salesContract
        ? input.salesContract.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const productArr = input.product
        ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
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

      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }
      if (input.royality_approval) {
        extrafilter.royality_approval = stringToBoolean(
          input.royality_approval
        );
      }
      if (input.order_status !== '') {
        const order_status = input.order_status;

        where.order_status = order_status;
        (filter_records.order_status = order_status),
          (filter.order_status = order_status);
      }
      const brandAggregationPipelineRecords: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
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
            totalInvoices: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            salesTaxAmount: {
              $sum: '$salesTaxAmount',
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
            salesTaxAmount: 1,
            totalInvoices: 1,
          },
        },
      ];
      const brandAggregationPipeline: any = [
        {
          $match: {
            date: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            adm_invoice: false,
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

            totalInvoices: {
              $sum: 1,
            },
            qty: {
              $sum: '$qty',
            },
            amount: {
              $sum: '$amount',
            },
            salesTaxAmount: {
              $sum: '$salesTaxAmount',
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
            salesTaxAmount: 1,
            totalInvoices: 1,
          },
        },
        { $sort: { qty: -1, amount: -1 } },
      ];
      const brandgroup = await InvoiceDtlModel.aggregate(
        brandAggregationPipeline
      );
      const total_records = await InvoiceDtlModel.aggregate(
        brandAggregationPipelineRecords
      );

      const totalInvoicesSum = total_records.reduce(
        (sum, item) => sum + item.totalInvoices,
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
      const totalSaleTaxAmountSum = total_records.reduce(
        (sum, item) => sum + item.salesTaxAmount,
        0
      );
      const result = {
        Group: brandgroup,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalSaleTaxAmountSum: totalSaleTaxAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    } else if (
      input.product_group !== '' &&
      input.order_status !== '' &&
      input.royality_approval !== ''
    ) {
      console.log('product group  royality_approval and orderstatus');

      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }

      const royality_approval = stringToBoolean(input.royality_approval);
      const order_status = input.order_status;

      const productAggregationPipelineRecord: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: false,
            order_status: order_status,
            royality_approval: royality_approval,
          },
        },

        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productInfo',
          },
        },
        {
          $group: {
            _id: '$product',
            productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            productName: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];

      const productAggregationPipeline: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: false,
            order_status: order_status,
            royality_approval: royality_approval,
          },
        },

        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productInfo',
          },
        },
        {
          $group: {
            _id: '$product',
            productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            productName: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];

      const product = await SalesContractDtlModel.aggregate(
        productAggregationPipeline
      );
      const total_records = await SalesContractDtlModel.aggregate(
        productAggregationPipelineRecord
      );
      const totalInvoices = product.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = product.reduce((sum, item) => sum + item.totalQty, 0);
      const totalAmountSum = product.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const result = {
        product_groupby: product,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoices,
      };
      return result;
    } else if (
      input.brand_group !== '' &&
      input.order_status !== '' &&
      input.royality_approval !== ''
    ) {
      console.log('brand group royality_approval and order_status');

      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }

      const royality_approval = stringToBoolean(input.royality_approval);
      const order_status = input.order_status;
      const brandAggregationPipelineRecord: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: false,
            order_status: order_status,
            royality_approval: royality_approval,
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
          $unwind: '$brand',
        },
        {
          $group: {
            _id: '$brand._id',
            name: { $first: '$brand.name' },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            _id: 0,
            name: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];
      const brandAggregationPipeline: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: false,
            order_status: order_status,
            royality_approval: royality_approval,
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
          $unwind: '$brand',
        },
        {
          $group: {
            _id: '$brand._id',
            name: { $first: '$brand.name' },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            _id: 0,
            name: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];
      const brandgroup = await SalesContractDtlModel.aggregate(
        brandAggregationPipeline
      );
      const total_records = await SalesContractDtlModel.aggregate(
        brandAggregationPipelineRecord
      );

      const totalInvoicesSum = brandgroup.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = brandgroup.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = brandgroup.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const result = {
        brand_groupby: brandgroup,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    } else if (
      input.customer_group !== '' &&
      input.order_status !== '' &&
      input.royality_approval !== ''
    ) {
      console.log('customer group royality_approval and orderstatus');

      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }

      const royality_approval = stringToBoolean(input.royality_approval);
      const order_status = input.order_status;
      const customerAggregationPipelineRecords: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: false,
            order_status: order_status,
            royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer_details',
          },
        },
        {
          $addFields: {
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: '$customer', // Group by customer ID
            customerName: { $first: '$customer_details.name' },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
            totalInvoices: { $sum: 1 },
          },
        },
        {
          $project: {
            customerName: 1,
            totalQty: 1,
            totalAmount: 1,
            totalInvoices: 1,
            _id: 0, // Exclude _id field
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];

      const customerAggregationPipeline: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            order_status: order_status,
            InHouse: false,
            royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer_details',
          },
        },
        {
          $addFields: {
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: '$customer', // Group by customer ID
            customerName: { $first: '$customer_details.name' },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
            totalInvoices: { $sum: 1 },
          },
        },
        {
          $project: {
            customerName: 1,
            totalQty: 1,
            totalAmount: 1,
            totalInvoices: 1,
            _id: 0,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];
      const customer = await SalesContractDtlModel.aggregate(
        customerAggregationPipeline
      );
      const total_records = await SalesContractDtlModel.aggregate(
        customerAggregationPipelineRecords
      );
      const totalInvoicesSum = customer.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
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
        customer_groupby: customer,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    } else if (input.product_group !== '' && input.order_status !== '') {
      console.log('order_status product group');
      const order_status = input.order_status;
      const productAggregationPipelineRecord: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: false,
            order_status: order_status,
          },
        },

        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productInfo',
          },
        },
        {
          $group: {
            _id: '$product',
            productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            productName: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];

      const productAggregationPipeline: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: false,
            order_status: order_status,
          },
        },

        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productInfo',
          },
        },
        {
          $group: {
            _id: '$product',
            productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            productName: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];

      const product = await SalesContractDtlModel.aggregate(
        productAggregationPipeline
      );
      const total_records = await SalesContractDtlModel.aggregate(
        productAggregationPipelineRecord
      );
      const totalInvoices = product.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = product.reduce((sum, item) => sum + item.totalQty, 0);
      const totalAmountSum = product.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const result = {
        product_groupby: product,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoices,
      };
      return result;
    } else if (input.customer_group !== '' && input.order_status !== '') {
      console.log('customer group order_status');

      const order_status = input.order_status;
      const customerAggregationPipelineRecords: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: false,
            order_status: order_status,
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer_details',
          },
        },
        {
          $addFields: {
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: '$customer', // Group by customer ID
            customerName: { $first: '$customer_details.name' },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
            totalInvoices: { $sum: 1 },
          },
        },
        {
          $project: {
            customerName: 1,
            totalQty: 1,
            totalAmount: 1,
            totalInvoices: 1,
            _id: 0, // Exclude _id field
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];

      const customerAggregationPipeline: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: false,
            order_status: order_status,
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer_details',
          },
        },
        {
          $addFields: {
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: '$customer', // Group by customer ID
            customerName: { $first: '$customer_details.name' },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
            totalInvoices: { $sum: 1 },
          },
        },
        {
          $project: {
            customerName: 1,
            totalQty: 1,
            totalAmount: 1,
            totalInvoices: 1,
            _id: 0,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];
      const customer = await SalesContractDtlModel.aggregate(
        customerAggregationPipeline
      );
      const total_records = await SalesContractDtlModel.aggregate(
        customerAggregationPipelineRecords
      );
      const totalInvoicesSum = customer.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
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
        customer_groupby: customer,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    } else if (input.brand_group !== '' && input.order_status !== '') {
      console.log('brand group order_status');
      const order_status = input.order_status;

      const brandAggregationPipelineRecord: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: false,
            order_status: order_status,
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
          $unwind: '$brand',
        },
        {
          $group: {
            _id: '$brand._id',
            name: { $first: '$brand.name' },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            _id: 0,
            name: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];
      const brandAggregationPipeline: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: false,
            order_status: order_status,
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
          $unwind: '$brand',
        },
        {
          $group: {
            _id: '$brand._id',
            name: { $first: '$brand.name' },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            _id: 0,
            name: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];
      const brandgroup = await SalesContractDtlModel.aggregate(
        brandAggregationPipeline
      );
      const total_records = await SalesContractDtlModel.aggregate(
        brandAggregationPipelineRecord
      );

      const totalInvoicesSum = brandgroup.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = brandgroup.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = brandgroup.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const result = {
        brand_groupby: brandgroup,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    } else if (input.product_group !== '' && input.royality_approval !== '') {
      console.log('product group  royality_approval');
      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }

      const royality_approval = stringToBoolean(input.royality_approval);

      const productAggregationPipelineRecord: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: false,
            royality_approval: royality_approval,
          },
        },

        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productInfo',
          },
        },
        {
          $group: {
            _id: '$product',
            productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            productName: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];

      const productAggregationPipeline: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: false,
            royality_approval: royality_approval,
          },
        },

        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'productInfo',
          },
        },
        {
          $group: {
            _id: '$product',
            productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            productName: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];

      const product = await SalesContractDtlModel.aggregate(
        productAggregationPipeline
      );
      const total_records = await SalesContractDtlModel.aggregate(
        productAggregationPipelineRecord
      );
      const totalInvoices = product.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = product.reduce((sum, item) => sum + item.totalQty, 0);
      const totalAmountSum = product.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const result = {
        product_groupby: product,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoices,
      };
      return result;
    } else if (input.customer_group !== '' && input.royality_approval !== '') {
      console.log('customer group royality_approval');

      function stringToBoolean(str: string | undefined) {
        return str?.toLowerCase() === 'true';
      }

      const royality_approval = stringToBoolean(input.royality_approval);
      const customerAggregationPipelineRecords: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: false,
            royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer_details',
          },
        },
        {
          $addFields: {
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: '$customer', // Group by customer ID
            customerName: { $first: '$customer_details.name' },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
            totalInvoices: { $sum: 1 },
          },
        },
        {
          $project: {
            customerName: 1,
            totalQty: 1,
            totalAmount: 1,
            totalInvoices: 1,
            _id: 0, // Exclude _id field
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];

      const customerAggregationPipeline: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            invoice: true,
            InHouse: false,
            royality_approval: royality_approval,
          },
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer_details',
          },
        },
        {
          $addFields: {
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: '$customer', // Group by customer ID
            customerName: { $first: '$customer_details.name' },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
            totalInvoices: { $sum: 1 },
          },
        },
        {
          $project: {
            customerName: 1,
            totalQty: 1,
            totalAmount: 1,
            totalInvoices: 1,
            _id: 0,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];
      const customer = await SalesContractDtlModel.aggregate(
        customerAggregationPipeline
      );
      const total_records = await SalesContractDtlModel.aggregate(
        customerAggregationPipelineRecords
      );
      const totalInvoicesSum = customer.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
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
        customer_groupby: customer,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    } else if (input.brand_group !== '' && input.royality_approval !== '') {
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
            invoice: false,
            InHouse: false,
            royality_approval: royality_approval,
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
          $unwind: '$brand',
        },
        {
          $group: {
            _id: '$brand._id',
            name: { $first: '$brand.name' },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            _id: 0,
            name: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];
      const brandAggregationPipeline: any = [
        {
          $match: {
            contractDate: {
              $gte: new Date(input.fromDate),
              $lte: new Date(input.toDate),
            },
            isDeleted: false,
            InHouse: false,
            invoice: true,
            royality_approval: royality_approval,
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
          $unwind: '$brand',
        },
        {
          $group: {
            _id: '$brand._id',
            name: { $first: '$brand.name' },
            totalInvoices: { $sum: 1 },
            totalQty: { $sum: '$qty' },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $match: {
            totalQty: { $gt: 0 },
            totalAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            _id: 0,
            name: 1,
            totalInvoices: 1,
            totalQty: 1,
            totalAmount: 1,
          },
        },
        { $sort: { totalQty: -1, totalAmount: -1 } },
      ];
      const brandgroup = await SalesContractDtlModel.aggregate(
        brandAggregationPipeline
      );
      const total_records = await SalesContractDtlModel.aggregate(
        brandAggregationPipelineRecord
      );

      const totalInvoicesSum = brandgroup.reduce(
        (sum, item) => sum + item.totalInvoices,
        0
      );
      const totalQtySum = brandgroup.reduce(
        (sum, item) => sum + item.totalQty,
        0
      );
      const totalAmountSum = brandgroup.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );
      const result = {
        brand_groupby: brandgroup,
        total_records: total_records.length,
        totalQtySum: totalQtySum,
        totalAmountSum: totalAmountSum,
        totalInvoicesSum: totalInvoicesSum,
      };
      return result;
    }
  }
};

export const findInvoiceDtlsByDatePrint = async (input: InvoiceReportPrintSchema) => {
  const {
    brand,
    customer,
    product,
    fromDate,
    toDate,
    order_status,
    royality_approval,
    Adm,
    nonAdm,
    brand_group,
    isDeleted,
    customer_group,
    product_group,
  } = input;



  //  Group condition setter
  const groupId: any = {};
  const shouldGroup = product_group || brand_group || customer_group;

  if (product_group) groupId.product = '$products';
  if (brand_group) groupId.brand = '$brands';
  if (customer_group) groupId.customer = '$customers';

  const matchStage: any = { isDeleted: false };

  if (fromDate && toDate) {
    matchStage.date = {
      $gte: new Date(fromDate),
      $lte: new Date(toDate),
    };
  }


  if (Array.isArray(product) && product.length > 0) {
    matchStage.product = {
      $in: product.map(id => new mongoose.Types.ObjectId(id))
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

  if (Adm) matchStage['adm_invoice'] = true;
  if (nonAdm) matchStage['adm_invoice'] = false;

  const scMatchStage: any = {};
  if (royality_approval == 'true')
    scMatchStage['salesContract.royality_approval'] = true;
  if (royality_approval == 'false')
    scMatchStage['salesContract.royality_approval'] = false;

  // const scMatchStage2: any = { isDeleted: false };
  if (order_status == 'confirmed')
    scMatchStage['salesContract.order_status'] = 'confirmed';
  if (order_status == 'forecast')
    scMatchStage['salesContract.order_status'] = 'forecast';

     if (isDeleted && isDeleted.toString().toLowerCase() === "true") {

  matchStage.isDeleted = true;
}

  const basePipeline: any[] = [
    {
      $match: matchStage
    },
    {
      $lookup: {
        from: "invoices",
        localField: "invoice",
        foreignField: "_id",
        as: "invoices",
        pipeline: [
          {
            $match: {
              isDeleted: false,
              // invoice: true
            }
          }
        ]
      }
    },
    {
      $unwind: {
        path: "$invoices",
        preserveNullAndEmptyArrays: false
      }
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
        preserveNullAndEmptyArrays: false
      }
    },
    {
      $match: scMatchStage,
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
      $unwind:
      {
        path: "$brands",

        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        contract: "$salesContract.contract",
        salesTaxInvoiceNo:
          "$invoices.salesTaxInvoiceNo",
        date: "$date",
        customers: "$customers.name",
        products: "$products.name",
        brands: "$brands.name",
        rate: "$rate",
        qty: "$qty",
        amount: "$amount",
        uom: "$uom",
        exchangeRate: "$exchangeRate",
        salesTaxRate: "$salesTaxRate",
        salesTaxAmounts: "$salesTaxAmount",
        amountInPkr: {
          $multiply: ["$amount", "$exchangeRate"]
        },
        salesTaxAmount: {
          $multiply: [
            "$qty",
            "$rate",
            "$salesTaxRate"
          ]
        },
        totalValue: {
          $divide: [
            {
              $multiply: [
                "$amount",
                "$exchangeRate",
                "$salesTaxRate"
              ]
            },
            100
          ]
        }
      }
    },
    {
      $sort: { date: -1 }
    }


  ]

  const basePipelineSummary: any[] = [
    {
      $match: matchStage
    },
    {
      $lookup: {
        from: "invoices",
        localField: "invoice",
        foreignField: "_id",
        as: "invoices"
      }
    },
    {
      $unwind: {
        path: "$invoices",
        preserveNullAndEmptyArrays: false
      }
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
        preserveNullAndEmptyArrays: false
      }
    },
    {
      $match: scMatchStage,
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
      $unwind:
      {
        path: "$brands",

        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        contract: "$salesContract.contract",
        salesTaxInvoiceNo:
          "$invoices.salesTaxInvoiceNo",
        date: "$date",
        customers: "$customers.name",
        products: "$products.name",
        brands: "$brands.name",
        rate: "$rate",
        qty: "$qty",
        amount: "$amount",
        uom: "$uom",
        exchangeRate: "$exchangeRate",
        salesTaxRate: "$salesTaxRate",
        salesTaxAmounts: "$salesTaxAmount",
        amountInPkr: {
          $multiply: ["$amount", "$exchangeRate"]
        },
        salesTaxAmount: {
          $multiply: [
            "$qty",
            "$rate",
            "$salesTaxRate"
          ]
        },
        totalValue: {
          $divide: [
            {
              $multiply: [
                "$amount",
                "$exchangeRate",
                "$salesTaxRate"
              ]
            },
            100
          ]
        }
      }
    },
    {
      $sort: { date: -1 }
    }


  ]
  const sortStage = { $sort: { totalInvoiceQty: -1 } };

  const groupStage = {
    $group: {
      _id: groupId,
      products: { $first: "$products" },
      brands: { $first: "$brands" },
      customers: { $first: "$customers" },
      totalInvoices: { $sum: 1 },
      totalInvoiceQty: { $sum: "$qty" },
      totalInvoiceAmount: { $sum: "$amount" },
      totalInvoiceRate: { $sum: "$rate" },
      totalamountInPkr: { $sum: "$amountInPkr" },
      totalSalesTaxAmount: { $sum: "$salesTaxAmount" },
      totalValueSum: { $sum: "$totalValue" }
    }
  }
  const groupStageSummary = {
    $group: {
      _id: '',
      // products:{$first:"$products"},
      // brands:{$first:"$brands"},
      // customers:{$first:"$customers"},
      totalInvoices: { $sum: 1 },
      totalInvoiceQty: { $sum: "$qty" },
      totalInvoiceAmount: { $sum: "$amount" },
      totalInvoiceRate: { $sum: "$rate" },
      totalamountInPkr: { $sum: "$amountInPkr" },
      totalSalesTaxAmount: { $sum: "$salesTaxAmount" },
      totalValueSum: { $sum: "$totalValue" }
    }
  }

  // If grouping is not required, we can skip the group stage
  const dataPipeline = shouldGroup
    ? [...basePipeline, groupStage, sortStage]
    : [...basePipeline];

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
          totalInvoices: { $sum: 1 },
          totalInvoiceQty: { $sum: "$qty" },
          totalInvoiceAmount: { $sum: "$amount" },
          totalInvoiceRate: { $sum: "$rate" },
          totalamountInPkr: { $sum: "$amountInPkr" },
          totalSalesTaxAmount: { $sum: "$salesTaxAmount" },
          totalValueSum: { $sum: "$totalValue" }
        },
      },
    ];
  // Executing the pipelines in parallel
  const [invoicedtl, summaryResult] = await Promise.all([
    InvoiceDtlModel.aggregate(dataPipeline, { allowDiskUse: true }),
    // InvoiceDtlModel.aggregate(countPipeline, { allowDiskUse: true }),
    InvoiceDtlModel.aggregate(summaryPipeline, { allowDiskUse: true }),
  ]);

  //  const totalRecords = totalResult?.[0]?.totalRecords || 0;
  const summary = summaryResult?.[0] || {
    totalInvoiceQty: 0,
    totalInvoiceAmount: 0,
    totalInvoices: 0,
    totalInvoiceRate: 0,
    totalamountInPkr: 0,
    totalSalesTaxAmount: 0,
    totalValueSum: 0,

  };
  return {
    invoicedtl,
    summary,
    // pagination: {
    //   page: pageno,
    //   perPage,
    //   totalRecords,
    //   totalPages: Math.ceil(totalRecords / perPage),
    // },
  };

}



export const findNotPaymentInvoice = async () => {
  const invoice = await InvoiceDtlModel.find({
    isDeleted: false,
    payment: false,
  }).populate({
    path: 'invoice',
    model: InvoiceModel,
    match: { isDeleted: false },
    populate: [{ path: 'salesContract', model: SalesContractModel }],
  });
  console.log(invoice.length);
  return invoice;
};
export const updatePaymentfalse = async () => {
  const update = await InvoiceDtlModel.updateMany({ payment: false });

  return update;
};

export const invoiceReportfilterSalesContract = async () => {
  const contracts = await SalesContractModel.aggregate([
    {
      $match: {
        isDeleted: false,
      },
    },
    {
      $project: {
        contract: 1,
      },
    },
  ]);
  return contracts;
};
export const findNetInovioceDtlsByDate = async (input: InvoiceReportSchema) => {
  try {
    const {
      brand,
      customer,
      product,
      salesContract,
      fromDate,
      toDate,
      pageno = 1,
      perPage = 10,
      royality_approval,
      Adm,
      nonAdm,
      brand_group,
      customer_group,
      product_group,
    } = input;

    const limit = perPage;
    const skipCount = (pageno - 1) * limit;

    const groupId: any = {};
    const shouldGroup = product_group || brand_group || customer_group;

    if (product_group) groupId.product = '$product';
    if (brand_group) groupId.brand = '$brand';
    if (customer_group) groupId.customer = '$customer';

    const matchStage: any = { isDeleted: false };

    if (fromDate && toDate) {
      matchStage.date = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    }

    if (Array.isArray(product) && product.length > 0) {
      matchStage.product = new mongoose.Types.ObjectId(product[0]);
    }

    if (Array.isArray(brand) && brand.length > 0) {
      matchStage.brand = new mongoose.Types.ObjectId(brand[0]);
    }

    if (Array.isArray(customer) && customer.length > 0) {
      matchStage.customer = new mongoose.Types.ObjectId(customer[0]);
    }

    if (Adm) matchStage['adm_invoice'] = true;
    if (nonAdm) matchStage['adm_invoice'] = false;

    //  Sales Contract match stage
    const scMatchStage: any = { isDeleted: false };
    if (royality_approval == 'true')
      scMatchStage['salesContracts.royality_approval'] = true;
    if (royality_approval == 'false')
      scMatchStage['salesContracts.royality_approval'] = false;

    const basePipeline: any[] = [
      {
        $match: matchStage,
      },
      {
        $lookup: {
          from: 'returns',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'returns',
        },
      },
      {
        $unwind: {
          path: '$returns',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
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
        $lookup: {
          from: 'invoices',
          localField: 'invoice',
          foreignField: '_id',
          as: 'invoice',
        },
      },
      {
        $unwind: {
          path: '$invoice',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          contract: '$salesContracts.contract',
          salesTaxInvoiceNo: '$invoice.salesTaxInvoiceNo',
          date: 1,
          customer: '$customer.name',
          product: '$product.name',
          brand: '$brand.name',
          rate: 1,
          uom: 1,
          invQty: '$qty',
          invAmount: '$amount',
          exchangeRate: 1,
          salesTaxRate: 1,
          salesTaxAmount: 1,
          returnQty: {
            $cond: {
              if: {
                $gt: ['$returns.actualQty', null],
              },
              then: '$returns.actualQty',
              else: 0,
            },
          },
          balance: {
            $cond: {
              if: {
                $gt: ['$returns.balance', null],
              },
              then: '$returns.balance',
              else: 0,
            },
          },
          returnAmount: {
            $cond: {
              if: {
                $gt: ['$returns.actualAmount', null],
              },
              then: '$returns.actualAmount',
              else: 0,
            },
          },
          netQty: {
            $subtract: [
              {
                $ifNull: ['$qty', 0],
              },
              {
                $ifNull: ['$returns.actualQty', 0],
              },
            ],
          },
          netAmount: {
            $subtract: [
              {
                $ifNull: ['$amount', 0],
              },
              {
                $ifNull: ['$returns.actualAmount', 0],
              },
            ],
          },
          amountInPkr: {
            $multiply: [
              {
                $ifNull: ['$exchangeRate', 0],
              },
              {
                $ifNull: ['$amount', 0],
              },
            ],
          },
          totalValue: {
            $divide: [
              {
                $multiply: [
                  { $ifNull: ["$amount", 0] },
                  { $ifNull: ["$exchangeRate", 0] },
                  { $ifNull: ["$salesTaxRate", 0] }
                ],
              },
              100
            ]
          },
        },
      },
    ];
    const basePipelineSummary: any[] = [
      {
        $match: matchStage,
      },
      {
        $lookup: {
          from: 'returns',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'returns',
        },
      },
      {
        $unwind: {
          path: '$returns',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
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
        $lookup: {
          from: 'invoices',
          localField: 'invoice',
          foreignField: '_id',
          as: 'invoice',
        },
      },
      {
        $unwind: {
          path: '$invoice',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          contract: '$salesContracts.contract',
          salesTaxInvoiceNo: '$invoice.salesTaxInvoiceNo',
          date: 1,
          customer: '$customer.name',
          product: '$product.name',
          brand: '$brand.name',
          rate: 1,
          uom: 1,
          totalInvQty: '$qty',
          totalInvAmount: '$amount',
          exchangeRate: 1,
          salesTaxRate: 1,
          totalSalesTaxAmount: 1,
          totalReturnQty: {
            $cond: {
              if: {
                $gt: ['$returns.actualQty', null],
              },
              then: '$returns.actualQty',
              else: 0,
            },
          },
          totalBalance: {
            $cond: {
              if: {
                $gt: ['$returns.balance', null],
              },
              then: '$returns.balance',
              else: 0,
            },
          },
          totalReturnAmount: {
            $cond: {
              if: {
                $gt: ['$returns.actualAmount', null],
              },
              then: '$returns.actualAmount',
              else: 0,
            },
          },
          totalNetQty: {
            $subtract: [
              {
                $ifNull: ['$qty', 0],
              },
              {
                $ifNull: ['$returns.actualQty', 0],
              },
            ],
          },
          totalNetAmount: {
            $subtract: [
              {
                $ifNull: ['$amount', 0],
              },
              {
                $ifNull: ['$returns.actualAmount', 0],
              },
            ],
          },
          totalAmountInPkr: {
            $multiply: [
              {
                $ifNull: ['$exchangeRate', 0],
              },
              {
                $ifNull: ['$amount', 0],
              },
            ],
          },
          totalValue: {
            $divide: [
              {
                $multiply: [
                  { $ifNull: ["$amount", 0] },
                  { $ifNull: ["$exchangeRate", 0] },
                  { $ifNull: ["$salesTaxRate", 0] }
                ],
              },
              100
            ]
          },
        },
      },
    ];

    const groupStage = {
      $group: {
        _id: groupId,
        product: { $first: '$product' },
        brand: { $first: '$brand' },
        customer: { $first: '$customer' },
        totalInvQty: { $sum: '$invQty' },
        totalValue: { $sum: '$totalValue' },
        totalInvAmount: { $sum: '$invAmount' },
        totalReturnQty: { $sum: '$returnQty' },
        totalReturnAmount: { $sum: '$returnAmount' },
        totalBalance: { $sum: '$balance' },
        totalAmountInPkr: { $sum: '$amountInPkr' },
        totalSalesTaxAmount: { $sum: '$salesTaxAmount' },
        totalNetQty: { $sum: '$netQty' },
        totalNetAmount: { $sum: '$netAmount' },
        totalInvoices: { $sum: 1 },
      },
    };

    const groupStageSummary = {
      $group: {
        _id: '',
        totalInvQty: { $sum: '$totalInvQty' },
        totalReturnQty: { $sum: '$totalReturnQty' },
        totalValue: { $sum: '$totalValue' },
        totalSalesTaxAmount: { $sum: '$totalSalesTaxAmount' },
        totalInvAmount: { $sum: '$totalInvAmount' },
        totalReturnAmount: { $sum: '$totalReturnAmount' },
        totalBalance: { $sum: '$totalBalance' },
        totalAmountInPkr: { $sum: '$totalAmountInPkr' },
        totalNetQty: { $sum: '$totalNetQty' },
        totalNetAmount: { $sum: '$totalNetAmount' },
        totalInvoices: { $sum: 1 },
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
            totalInvQty: { $sum: '$totalInvQty' },
            totalInvAmount: { $sum: '$totalInvAmount' },
            totalValue: { $sum: '$totalValue' },
            totalReturnQty: { $sum: '$totalReturnQty' },
            totalReturnAmount: { $sum: '$totalReturnAmount' },
            totalBalance: { $sum: '$totalBalance' },
            totalAmountInPkr: { $sum: '$totalAmountInPkr' },
            totalSalesTaxAmount: { $sum: '$totalSalesTaxAmount' },
            totalNetQty: { $sum: '$totalNetQty' },
            totalNetAmount: { $sum: '$totalNetAmount' },
          },
        },
      ];

    // Executing the pipelines in parallel
    const [netinvoicedtl, totalResult, summaryResult] = await Promise.all([
      InvoiceDtlModel.aggregate(dataPipeline, { allowDiskUse: true }),
      InvoiceDtlModel.aggregate(countPipeline, { allowDiskUse: true }),
      InvoiceDtlModel.aggregate(summaryPipeline, { allowDiskUse: true }),
    ]);
    // Extracting total records and summary from the results
    const totalRecords = totalResult?.[0]?.totalRecords || 0;

    const summary = summaryResult?.[0] || {
      totalInvQty: 0,
      totalReturnQty: 0,
      totalValue: 0,
      totalInvAmount: 0,
      totalReturnAmount: 0,
      totalBalance: 0,
      totalAmountInPkr: 0,
      totalSalesTaxAmount: 0,
      totalNetQty: 0,
      totalNetAmount: 0,
    };
    return {
      netinvoicedtl,
      summary,
      pagination: {
        page: pageno,
        perPage,
        totalRecords,
        totalPages: Math.ceil(totalRecords / perPage),
      },
    };
  } catch (e) {
    console.error('Error in findReturnDtlsByDate:', e);
    throw e;
  }
};
export const findNetInovioceDtlsByDatePrint = async (
  input: InvoiceReportPrintSchema
) => {
  try {
    const {
      brand,
      customer,
      product,
      salesContract,
      fromDate,
      toDate,
      royality_approval,
      Adm,
      nonAdm,
      brand_group,
      customer_group,
      product_group,
    } = input;

    const groupId: any = {};
    const shouldGroup = product_group || brand_group || customer_group;

    if (product_group) groupId.product = '$product';
    if (brand_group) groupId.brand = '$brand';
    if (customer_group) groupId.customer = '$customer';

    const matchStage: any = { isDeleted: false };

    if (fromDate && toDate) {
      matchStage.date = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    }

    if (Array.isArray(product) && product.length > 0) {
      matchStage.product = new mongoose.Types.ObjectId(product[0]);
    }

    if (Array.isArray(brand) && brand.length > 0) {
      matchStage.brand = new mongoose.Types.ObjectId(brand[0]);
    }

    if (Array.isArray(customer) && customer.length > 0) {
      matchStage.customer = new mongoose.Types.ObjectId(customer[0]);
    }

    if (Adm) matchStage['adm_invoice'] = true;
    if (nonAdm) matchStage['adm_invoice'] = false;

    //  Sales Contract match stage
    const scMatchStage: any = { isDeleted: false };
    if (royality_approval == 'true')
      scMatchStage['salesContracts.royality_approval'] = true;
    if (royality_approval == 'false')
      scMatchStage['salesContracts.royality_approval'] = false;

    const basePipeline: any[] = [
      {
        $match: matchStage,
      },
      {
        $lookup: {
          from: 'returns',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'returns',
        },
      },
      {
        $unwind: {
          path: '$returns',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
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
        $lookup: {
          from: 'invoices',
          localField: 'invoice',
          foreignField: '_id',
          as: 'invoice',
        },
      },
      {
        $unwind: {
          path: '$invoice',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          contract: '$salesContracts.contract',
          salesTaxInvoiceNo: '$invoice.salesTaxInvoiceNo',
          date: 1,
          customer: '$customer.name',
          product: '$product.name',
          brand: '$brand.name',
          rate: 1,
          uom: 1,
          invQty: '$qty',
          invAmount: '$amount',
          exchangeRate: 1,
          salesTaxRate: 1,
          salesTaxAmount: 1,
          returnQty: {
            $cond: {
              if: {
                $gt: ['$returns.actualQty', null],
              },
              then: '$returns.actualQty',
              else: 0,
            },
          },
          balance: {
            $cond: {
              if: {
                $gt: ['$returns.balance', null],
              },
              then: '$returns.balance',
              else: 0,
            },
          },
          returnAmount: {
            $cond: {
              if: {
                $gt: ['$returns.actualAmount', null],
              },
              then: '$returns.actualAmount',
              else: 0,
            },
          },
          netQty: {
            $subtract: [
              {
                $ifNull: ['$qty', 0],
              },
              {
                $ifNull: ['$returns.actualQty', 0],
              },
            ],
          },
          netAmount: {
            $subtract: [
              {
                $ifNull: ['$amount', 0],
              },
              {
                $ifNull: ['$returns.actualAmount', 0],
              },
            ],
          },
          amountInPkr: {
            $multiply: [
              {
                $ifNull: ['$exchangeRate', 0],
              },
              {
                $ifNull: ['$amount', 0],
              },
            ],
          },
          totalValue: {
            $divide: [
              {
                $multiply: [
                  { $ifNull: ["$amount", 0] },
                  { $ifNull: ["$exchangeRate", 0] },
                  { $ifNull: ["$salesTaxRate", 0] }
                ],
              },
              100
            ]
          },
        },
      },
    ];
    const basePipelineSummary: any[] = [
      {
        $match: matchStage,
      },
      {
        $lookup: {
          from: 'returns',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'returns',
        },
      },
      {
        $unwind: {
          path: '$returns',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
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
        $lookup: {
          from: 'invoices',
          localField: 'invoice',
          foreignField: '_id',
          as: 'invoice',
        },
      },
      {
        $unwind: {
          path: '$invoice',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          contract: '$salesContracts.contract',
          salesTaxInvoiceNo: '$invoice.salesTaxInvoiceNo',
          date: 1,
          customer: '$customer.name',
          product: '$product.name',
          brand: '$brand.name',
          rate: 1,
          uom: 1,
          totalInvQty: '$qty',
          totalInvAmount: '$amount',
          exchangeRate: 1,
          salesTaxRate: 1,
          totalSalesTaxAmount: 1,
          returnQty: {
            $cond: {
              if: {
                $gt: ['$returns.actualQty', null],
              },
              then: '$returns.actualQty',
              else: 0,
            },
          },
          totalBalance: {
            $cond: {
              if: {
                $gt: ['$returns.balance', null],
              },
              then: '$returns.balance',
              else: 0,
            },
          },
          totalReturnAmount: {
            $cond: {
              if: {
                $gt: ['$returns.actualAmount', null],
              },
              then: '$returns.actualAmount',
              else: 0,
            },
          },
          totalNetQty: {
            $subtract: [
              {
                $ifNull: ['$qty', 0],
              },
              {
                $ifNull: ['$returns.actualQty', 0],
              },
            ],
          },
          totalNetAmount: {
            $subtract: [
              {
                $ifNull: ['$amount', 0],
              },
              {
                $ifNull: ['$returns.actualAmount', 0],
              },
            ],
          },
          totalAmountInPkr: {
            $multiply: [
              {
                $ifNull: ['$exchangeRate', 0],
              },
              {
                $ifNull: ['$amount', 0],
              },
            ],
          },
          totalValue: {
            $divide: [
              {
                $multiply: [
                  { $ifNull: ["$amount", 0] },
                  { $ifNull: ["$exchangeRate", 0] },
                  { $ifNull: ["$salesTaxRate", 0] }
                ],
              },
              100
            ]
          },
        },
      },
    ];

    const groupStage = {
      $group: {
        _id: groupId,
        product: { $first: '$product' },
        brand: { $first: '$brand' },
        customer: { $first: '$customer' },
        totalInvQty: { $sum: '$invQty' },
        totalInvAmount: { $sum: '$invAmount' },
        totalReturnQty: { $sum: '$returnQty' },
        totalValue: { $sum: '$totalValue' },
        totalReturnAmount: { $sum: '$returnAmount' },
        totalBalance: { $sum: '$balance' },
        totalAmountInPkr: { $sum: '$amountInPkr' },
        totalSalesTaxAmount: { $sum: '$salesTaxAmount' },
        totalNetQty: { $sum: '$netQty' },
        totalNetAmount: { $sum: '$netAmount' },
        totalInvoices: { $sum: 1 },
      },
    };

    const groupStageSummary = {
      $group: {
        _id: '',
        totalInvQty: { $sum: '$totalInvQty' },
        totalReturnQty: { $sum: '$totalReturnQty' },
        totalValue: { $sum: '$totalValue' },
        totalInvAmount: { $sum: '$totalInvAmount' },
        totalSalesTaxAmount: { $sum: '$totalSalesTaxAmount' },
        totalReturnAmount: { $sum: '$totalReturnAmount' },
        totalBalance: { $sum: '$totalBalance' },
        totalAmountInPkr: { $sum: '$totalAmountInPkr' },
        totalNetQty: { $sum: '$totalNetQty' },
        totalNetAmount: { $sum: '$totalNetAmount' },
        totalInvoices: { $sum: 1 },
      },
    };
    // If grouping is not required, we can skip the group stage
    const dataPipeline = shouldGroup
      ? [...basePipeline, groupStage]
      : [...basePipeline];

    // Count pipeline for total records
    // const countPipeline = shouldGroup
    //   ? [...basePipeline, groupStage, { $count: 'totalRecords' }]
    //   : [...basePipeline, { $count: 'totalRecords' }];

    // Summary pipeline for total records
    const summaryPipeline = shouldGroup
      ? [...basePipelineSummary, groupStageSummary]
      : [
        ...basePipelineSummary,
        {
          $group: {
            _id: null,
            totalInvQty: { $sum: '$totalInvQty' },
            totalReturnQty: { $sum: '$totalReturnQty' },
            totalValue: { $sum: '$totalValue' },
            totalInvAmount: { $sum: '$totalInvAmount' },
            totalReturnAmount: { $sum: '$totalReturnAmount' },
            totalBalance: { $sum: '$totalBalance' },
            totalAmountInPkr: { $sum: '$totalAmountInPkr' },
            totalSalesTaxAmount: { $sum: '$totalSalesTaxAmount' },
            totalNetQty: { $sum: '$totalNetQty' },
            totalNetAmount: { $sum: '$netAmount' },
          },
        },
      ];

    // Executing the pipelines in parallel
    const [netinvoicedtl, summaryResult] = await Promise.all([
      InvoiceDtlModel.aggregate(dataPipeline, { allowDiskUse: true }),
      // InvoiceDtlModel.aggregate(countPipeline, { allowDiskUse: true }),
      InvoiceDtlModel.aggregate(summaryPipeline, { allowDiskUse: true }),
    ]);
    // Extracting total records and summary from the results
    // const totalRecords = totalResult?.[0]?.totalRecords || 0;

    const summary = summaryResult?.[0] || {
      totalInvQty: 0,
      totalReturnQty: 0,
      totalValue: 0,
      totalInvAmount: 0,
      totalReturnAmount: 0,
      totalBalance: 0,
      totalAmountInPkr: 0,
      totalSalesTaxAmount: 0,
      totalNetQty: 0,
      totalNetAmount: 0,
    };
    return {
      netinvoicedtl,
      summary,
      // pagination: {
      //   page: pageno,
      //   perPage,
      //   totalRecords,
      //   totalPages: Math.ceil(totalRecords / perPage),
      // },
    };
  } catch (e) {
    console.error('Error in findReturnDtlsByDate:', e);
    throw e;
  }
};
