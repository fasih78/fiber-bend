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
//import momentTimezone = require('moment-timezone');
//momentTimezone.tz.setDefault('Asia/Karachi');
//momentTimezone(date).format('MM-DD-YYYY')
export const createInvoice = async (input: CreateInvoiceSchema) => {
  const {
    inv,
    date,
    salesContract,
    specialInstruction,
    invoiceDtl,
    salesTaxInvoiceNo,
  } = input;
  const customer = await SalesContractModel.find({ _id: salesContract });
  const customer_id = customer[0].customer;

  const invoice = await InvoiceModel.create({
    inv,
    date,
    salesContract: new mongoose.Types.ObjectId(salesContract),
    specialInstruction,
    salesTaxInvoiceNo,
  });
  for (const invDtl of invoiceDtl) {
    const newInvoiceDtl = await InvoiceDtlModel.create({
      inv: inv,
      qty: invDtl.qty,
      rate: invDtl.rate,
      date: date,
      amount: +invDtl.qty * +invDtl.rate,
      uom: invDtl.uom,
      salesTaxRate: invDtl.salesTaxRate,
      salesTaxAmount: +invDtl.salesTaxRate * +invDtl.qty * +invDtl.rate,
      exchangeRate: +invDtl.exchangeRate,
      customer: new mongoose.Types.ObjectId(customer_id),
      salesContract: new mongoose.Types.ObjectId(salesContract),
      product: new mongoose.Types.ObjectId(invDtl.product),
      currency: new mongoose.Types.ObjectId(invDtl.currency),
      invoice: new mongoose.Types.ObjectId(invoice._id),
    });
  }

  const invoices = await InvoiceModel.find({
    salesContract: salesContract,
    isDeleted: false,
  });

  let invoicesDtlsQty = 0;
  for (let inv of invoices) {
    const dtl = await InvoiceDtlModel.find({ invoice: inv._id });
    if (dtl) {
      for (let d of dtl) {
        invoicesDtlsQty += +d.qty;
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

  if (invoicesDtlsQty >= salesContractDtlsQty) {
    const sales = await SalesContractModel.findByIdAndUpdate(salesContract, {
      invoice: true,
    });
  }

  return invoice;
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
  const records = await InvoiceModel.countDocuments({ isDeleted: false });
  const invdtl = await InvoiceDtlModel.find({ isDeleted: false })
    .populate({
      path: 'invoice',
      model: InvoiceModel,
      populate: [{ path: 'salesContract', model: SalesContractModel }],
    })
    .limit(limit)
    .skip(skipCount)
    .sort({ inv: 1 });
  const result = {
    invoice_dtl: invdtl,
    total_Records: records,
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
// //const invoices = await invoice.map(async (r) => {
// let invoices: any[] = [];
// for (let r of invoice) {
//   const scd = await SalesContractDtlModel.findOne({
//     salesContract: r['salesContract']['_id'].toString(),
//   });

//   let data = _.merge({ invoice: r }, { saledtl: scd });

//   //return data;
//   invoices.push(data);
// }

// console.log('invoice', JSON.stringify(invoice));

// return invoice;

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
    specialInstruction,
    invoiceDtl,
    salesTaxInvoiceNo,
  } = input;
  //console.log("v" , invoiceDtl);

  const invoice = await InvoiceModel.findByIdAndUpdate(id, {
    inv,
    date,
    salesContract: new mongoose.Types.ObjectId(salesContract),
    specialInstruction,
    salesTaxInvoiceNo,
  });

  await InvoiceDtlModel.deleteMany({ invoice: id });
  const customer = await SalesContractModel.find({ _id: salesContract });
  const customer_id = customer[0].customer;

  for (const invDtl of invoiceDtl) {
    const newInvoiceDtl = await InvoiceDtlModel.create({
      qty: invDtl.qty,
      rate: invDtl.rate,
      amount: +invDtl.qty * +invDtl.rate,
      uom: invDtl.uom,
      date:date,
      salesTaxAmount: invDtl.salesTaxAmount,
      salesTaxRate: invDtl.salesTaxRate,
      exchangeRate: +invDtl.exchangeRate,
      customer: new mongoose.Types.ObjectId(customer_id),
      product: new mongoose.Types.ObjectId(invDtl.product),
      salesContract: new mongoose.Types.ObjectId(salesContract),
      currency: new mongoose.Types.ObjectId(invDtl.currency),
      invoice: new mongoose.Types.ObjectId(invoice?._id),
    });
  }
  return { success: true };
};
export const findInvoiceDtlsByDate = async (input: InvoiceReportSchema) => {
  if (
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0 &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.product) &&
    input.product.length == 0 &&
    input.product_group == '' &&
    input.customer_group == '' &&
    input.salesContract_group == ''
  ) {
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
      const total_qty = invoice_groupby.map((item) => item.qty);
      const total_amount = invoice_groupby.map((item) => item.amount);
      const total_rate = invoice_groupby.map((item) => item.rate);
      const total_records = await InvoiceModel.aggregate([
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
        { $skip: skipCount },
        { $limit: limit },
        { $sort: { tran: 1 } },
      ]);
      const result = {
        invoice_detail: invoice_detail,
        paginated_record: invoice_detail.length,
        totalQty: total_qty,
        totalAmount: total_amount,
        totalRate: total_rate,
        total_records: total_records.length,
        totalAmountPKR: AmountPKR,
        SaleTaxAmount: SaleTaxAmount,
      };
      return result;
    } catch (error) {
      console.log(error);
    }
  } else if (input.product_group !== '') {
    console.log('product group');

    const product_group = await ProductModel.aggregate([
      {
        $lookup: {
          from: 'invoicedtls',
          localField: '_id',
          foreignField: 'product',
          as: 'invoice_record',
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
                input: '$invoice_record',
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
          invoice_record: {
            $size: '$invoice_record',
          },
          totalQty: 1,
        },
      },
    ]);
    return product_group;
  } else if (input.customer_group !== '') {
    const customer_group = await CustomerModel.aggregate([
      {
        $lookup: {
          from: 'invoicedtls',
          localField: '_id',
          foreignField: 'customer',
          as: 'customer_dtl',
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
                input: '$customer_dtl',
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
          totalQty: 1,
          invoice_record: {
            $size: '$customer_dtl',
          },
        },
      },
    ]);
    return customer_group;
  } else if (input.salesContract_group !== '') {
    const salecontract_group1 = await SalesContractModel.aggregate([
      {
        $lookup: {
          from: 'invoices',
          localField: '_id',
          foreignField: 'salesContract',
          as: 'invoice_record',
        },
      },
      {
        $project: {
          contract: 1,
          invoice_record: {
            $size: '$invoice_record',
          },
        },
      },
    ]);

    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;
    const salecontract_group = await SalesContractModel.aggregate([
      {
        $lookup: {
          from: 'invoices',
          localField: '_id',
          foreignField: 'salesContract',
          as: 'invoice_record',
        },
      },
      {
        $project: {
          contract: 1,
          invoice_record: {
            $size: '$invoice_record',
          },
        },
      },
      { $skip: skipCount },
      { $limit: limit },
    ]);
    const result = {
      salecontract_group: salecontract_group,
      total_records: salecontract_group1.length,
      paginaetd_record: salecontract_group.length,
    };
    return result;
  } else if (
    (Array.isArray(input.salesContract) && input.salesContract.length > 0) ||
    (Array.isArray(input.customer) && input.customer.length > 0) ||
    (Array.isArray(input.product) && input.product.length > 0)
  ) {
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
    const totalQty = invoicegroupby.map((item: any) =>
      item.qty ? item.qty : []
    );
    const totalRate = invoicegroupby.map((item: any) =>
      item.rate ? item.rate : []
    );
    const totalAmount = invoicegroupby.map((item: any) =>
      item.amount ? item.amount : []
    );
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
      { $sort: { tran: 1 } },
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
        totalAmountPKR: AmountPKR,
        SaleTaxAmount: SaleTaxAmount,
      };
      return result;
    }
  }
};
export const findInvoiceDtlsByDatePrint = async (
  input: InvoiceReportPrintSchema
) => {
  if (
    Array.isArray(input.salesContract) &&
    input.salesContract.length == 0 &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.product) &&
    input.product.length == 0 &&
    input.product_group == '' &&
    input.customer_group == '' &&
    input.salesContract_group == ''
  ) {
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
      const total_qty = invoice_groupby.map((item) => item.qty);
      const total_amount = invoice_groupby.map((item) => item.amount);
      const total_rate = invoice_groupby.map((item) => item.rate);
      const total_records = await InvoiceModel.aggregate([
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
      ]);
      const result = {
        invoice_detail: invoice_detail,
        totalQty: total_qty,
        totalAmount: total_amount,
        totalRate: total_rate,
        total_records: total_records.length,
        totalAmountPKR: AmountPKR,
        SaleTaxAmount: SaleTaxAmount,
      };
      return result;
    } catch (error) {
      console.log(error);
    }
  } else if (input.product_group !== '') {
    console.log('product group');

    const product_group = await ProductModel.aggregate([
      {
        $lookup: {
          from: 'invoicedtls',
          localField: '_id',
          foreignField: 'product',
          as: 'invoice_record',
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
                input: '$invoice_record',
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
          invoice_record: {
            $size: '$invoice_record',
          },
          totalQty: 1,
        },
      },
    ]);
    return product_group;
  } else if (input.customer_group !== '') {
    const customer_group = await CustomerModel.aggregate([
      {
        $lookup: {
          from: 'invoicedtls',
          localField: '_id',
          foreignField: 'customer',
          as: 'customer_dtl',
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
                input: '$customer_dtl',
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
          totalQty: 1,
          invoice_record: {
            $size: '$customer_dtl',
          },
        },
      },
    ]);
    return customer_group;
  } else if (input.salesContract_group !== '') {
    const salecontract_group = await SalesContractModel.aggregate([
      {
        $lookup: {
          from: 'invoices',
          localField: '_id',
          foreignField: 'salesContract',
          as: 'invoice_record',
        },
      },
      {
        $project: {
          contract: 1,
          invoice_record: {
            $size: '$invoice_record',
          },
        },
      },
    ]);

    return salecontract_group;
  } else if (
    (Array.isArray(input.salesContract) && input.salesContract.length > 0) ||
    (Array.isArray(input.customer) && input.customer.length > 0) ||
    (Array.isArray(input.product) && input.product.length > 0)
  ) {
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
    const totalQty = invoicegroupby.map((item: any) =>
      item.qty ? item.qty : []
    );
    const totalRate = invoicegroupby.map((item: any) =>
      item.rate ? item.rate : []
    );
    const totalAmount = invoicegroupby.map((item: any) =>
      item.amount ? item.amount : []
    );
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
        totalAmountPKR: AmountPKR,
        SaleTaxAmount: SaleTaxAmount,
      };
      return result;
    }
  }
};
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
