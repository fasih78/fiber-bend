import mongoose, { mongo } from 'mongoose';
import { CurrencyModel } from '../currency/currency.model';
import { SalesContract, SalesContractModel } from './sales_contract.model';
import { SalesContractDtlModel } from './sales_contract_dtl.model';
import dayjs from 'dayjs';
import { Customer, CustomerModel } from '../customer/customer.model';
import { BrandModel } from '../brand/brand.model';
import { PaymentTermModel } from '../payment_term/payment_term.model';
import { SalesContractDtl } from './sales_contract_dtl.model';
import { ProductModel } from '../product/product.model';
import { CityModel } from '../city/city.model';
import { InvoiceModel } from '../invoice/invoice.model';
import { InvoiceDtlModel } from '../invoice/invoice_dtl.model';
import { ShipViaModel } from '../shipvia/shipvia.model';
import {
  CreateSalesContractSchema,
  SaleContractReportPrintSchema,
  SaleContractReportProductSchema,
  SaleContractReportSchema,
  Salecontractdrop_downSchema,
  tempSchema,
} from './sales_contract.schema';
//import { SalesContractDtl } from './sales_contract_dtl.model';
// import utc from 'dayjs/plugin/utc';
// dayjs.extend(utc);
import moment from 'moment';
import { isEmpty, map, update } from 'lodash';
import { ShipmentModel } from '../shipment/shipment.model';
import { ShipmentDtlModel } from '../shipment/shipment_dtls.model';
import { EMPTY_PATH, array } from 'zod';
import { empty } from '@prisma/client/runtime';
import salesContractRoutes from './sales_contract.routes';
import { RoyalityAdmModel } from '../royality/royalityAdmDenim.model';
import { RoyalityModel } from '../royality/royality.model';
import { ProductionDtlModel } from '../production/production_dtl.model';
import { ProductionModel } from '../production/production.model';

export const createSalesContract = async (input: CreateSalesContractSchema) => {
  const { customer } = input;
  const customerid = { _id: customer };
  const customers = await CustomerModel.findById(customerid);
  const filt = customers?.name;
  console.log(filt);
  if (filt === 'ADM DENIM') {
    const {
      tran,
      po,
      contract,
      specialInstruction,
      customer,
      brand,
      paymentTerm,
      shipvia,
      salesContractDtl,
      poDate,
      contractDate,
      tc_no,
      vendorgarment,
    } = input;
    const LastUser = await SalesContractModel.findOne().sort({ _id: -1 });
    const Invoice_no = LastUser ? LastUser.tran + 1 : 1;

    const salesContract1 = await SalesContractModel.create({
      salesTaxInvoiceNo: Invoice_no,
      royality: false,
      tran,
      po,
      contract,
      specialInstruction,
      customer: new mongoose.Types.ObjectId(customer),
      brand: new mongoose.Types.ObjectId(brand),
      paymentTerm: new mongoose.Types.ObjectId(paymentTerm),
      shipvia: new mongoose.Types.ObjectId(shipvia),
      poDate,
      contractDate,
      tc_no,
      vendorgarment,
    });
    for (const sale of salesContractDtl) {
      const newSalesDtl = await SalesContractDtlModel.create({
        tran: tran,
        contractDate: contractDate,
        qty: sale.qty,
        rate: sale.rate,
        amount: +sale.qty * +sale.rate,
        uom: sale.uom,
        shipmentDate: sale.shipmentDate,
        customer: new mongoose.Types.ObjectId(customer),
        brand: new mongoose.Types.ObjectId(brand),
        product: new mongoose.Types.ObjectId(sale.product),
        currency: new mongoose.Types.ObjectId(sale.currency),
        salesContract: new mongoose.Types.ObjectId(salesContract1._id),
        exchangeRate: sale.exchangeRate,
      });
    }
    return salesContract1;
    // const {
    //   tran,
    //   po,
    //   contract,
    //   specialInstruction,
    //   customer,
    //   brand,
    //   paymentTerm,
    //   shipvia,
    //   salesContractDtl,
    //   poDate,
    //   contractDate,
    //   tc_no,
    //   vendorgarment,
    // } = input;
  } else {
    const {
      tran,
      po,
      contract,
      specialInstruction,
      customer,
      brand,
      paymentTerm,
      shipvia,
      salesContractDtl,
      poDate,
      contractDate,
      tc_no,
      vendorgarment,
    } = input;

    const salesContract = await SalesContractModel.create({
      tran,
      po,
      contract,
      specialInstruction,
      customer: new mongoose.Types.ObjectId(customer),
      brand: new mongoose.Types.ObjectId(brand),
      paymentTerm: new mongoose.Types.ObjectId(paymentTerm),
      shipvia: new mongoose.Types.ObjectId(shipvia),
      poDate,
      contractDate,
      tc_no,
      vendorgarment,
    });

    for (const sale of salesContractDtl) {
      const newSalesDtl = await SalesContractDtlModel.create({
        tran: tran,
        qty: sale.qty,
        contractDate: contractDate,
        rate: sale.rate,
        amount: +sale.qty * +sale.rate,
        uom: sale.uom,
        shipmentDate: sale.shipmentDate,
        customer: new mongoose.Types.ObjectId(customer),
        brand: new mongoose.Types.ObjectId(brand),
        product: new mongoose.Types.ObjectId(sale.product),
        currency: new mongoose.Types.ObjectId(sale.currency),
        salesContract: new mongoose.Types.ObjectId(salesContract._id),
        exchangeRate: sale.exchangeRate,
      });
    }

    return salesContract;
  }
};
export const getNewSalesContractId = async () => {
  const salesContract = await SalesContractModel.findOne()
    .sort({ field: 'asc', _id: -1 })
    .limit(1);

  let newId: number = 1;
  if (salesContract != null) {
    newId = salesContract.tran + 1;
  }

  return newId;
};

export const findSalesContractswithPagination = async (
  input: SaleContractReportProductSchema
) => {
  const limit = input.perPage;
  const skipCount = (input.pageno - 1) * limit;
  const saleContractlength = await SalesContractModel.countDocuments();
  const saleContractDetail = await SalesContractDtlModel.find({
    isDeleted: false,
  })
    .populate({
      path: 'salesContract',
      model: SalesContractModel,

      populate: [
        {
          path: 'shipvia',
          model: ShipViaModel,
        },
        {
          path: 'brand',
          model: BrandModel,
        },
        {
          path: 'customer',
          model: CustomerModel,
        },
      ],
    })
    .limit(limit)
    .skip(skipCount)
    .sort({ tran: 1 });

  let result = {
    saleContractDetail,
    saleContractlength,
  };
  return result;
};

export const findSalesContracts = async () => {
  const saleContractDetail = await SalesContractDtlModel.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: '$salesContract',
        salesContract: { $first: '$salesContract' },
        qty: { $sum: '$qty' },
        rate: { $sum: '$rate' },
        amount: { $sum: '$amount' },
        shipmentDate: { $first: '$shipmentDate' },
      },
    },
  ]);
  await SalesContractDtlModel.populate(saleContractDetail, {
    path: 'salesContract',
    model: SalesContractModel,
    populate: [
      {
        path: 'shipvia',
        model: ShipViaModel,
      },
      {
        path: 'brand',
        model: BrandModel,
      },
      {
        path: 'customer',
        model: CustomerModel,
      },
    ],
  });

  return {
    saleContractDetail,
  };
};

export const findNotInvoicedSalesContracts = async () => {
  const saleContract = await SalesContractModel.find({
    invoice: false,
    isDeleted: false,
  })
    .populate({
      path: 'brand',
      model: BrandModel,
    })
    .populate({
      path: 'customer',
      model: CustomerModel,
    })
    .populate({ path: 'paymentTerm', model: PaymentTermModel });
  console.log(saleContract.length);

  return saleContract;
};
export const findSaleContractAdmdenim = async () => {
  const saleContract = await SalesContractModel.aggregate([
    {
      $match: {
        royality: false,
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
      $project: {
        salesTaxInvoiceNo: 1,
        customer: { $first: '$customer._id' },
      },
    },
  ]);
  console.log(saleContract.length);

  return saleContract;
};

export const findSalesContractsDtls = async (id: string) => {
  return await SalesContractDtlModel.find({
    salesContract: new mongoose.Types.ObjectId(id),
  })
    .populate({ path: 'product', model: ProductModel })
    .populate({ path: 'currency', model: CurrencyModel });
};

export const deleteSalesContracts = async () => {
  await SalesContractDtlModel.deleteMany({});
  return await SalesContractModel.deleteMany({});
};

export const deleteSalesContractById = async (id: string) => {
  const salesContractDtls = await SalesContractDtlModel.find({
    salesContract: id,
  });
  salesContractDtls.forEach((scd) => {
    scd.isDeleted = true;
    scd.save();
  });

  return SalesContractModel.findByIdAndUpdate(id, { isDeleted: true });
};

export const updateSalesContractById = async (
  id: string,
  input: CreateSalesContractSchema
) => {
  const {
    tran,
    po,
    contract,
    specialInstruction,
    customer,
    brand,
    paymentTerm,
    salesContractDtl,
    shipvia,
    poDate,
    contractDate,
    tc_no,
    vendorgarment,
  } = input;

  const salesContract = await SalesContractModel.findByIdAndUpdate(id, {
    tran,
    po,
    contract,
    specialInstruction,
    customer: new mongoose.Types.ObjectId(customer),
    brand: new mongoose.Types.ObjectId(brand),
    paymentTerm: new mongoose.Types.ObjectId(paymentTerm),
    shipvia: new mongoose.Types.ObjectId(shipvia),
    poDate,
    contractDate,
    tc_no,
    vendorgarment,
  });

  await SalesContractDtlModel.deleteMany({ salesContract: id });

  for (const sale of salesContractDtl) {
    const newSalesDtl = await SalesContractDtlModel.create({
      tran: tran,
      qty: sale.qty,
      rate: sale.rate,
      amount: +sale.qty * +sale.rate,
      uom: sale.uom,
      product: new mongoose.Types.ObjectId(sale.product),
      currency: new mongoose.Types.ObjectId(sale.currency),
      salesContract: new mongoose.Types.ObjectId(salesContract?._id),
      brand: new mongoose.Types.ObjectId(brand),
      customer: new mongoose.Types.ObjectId(customer),
      exchangeRate: sale.exchangeRate,
    });
  }
  return { success: true };
};

export const findSalesContractsWithInvoice = async (id: string) => {
  const invoices = await InvoiceModel.find({
    salesContract: id,
    isDeleted: false,
  });

  const invoicesDtls: any[] = [];
  for (let inv of invoices) {
    const dtl = await InvoiceDtlModel.find({ invoice: inv._id });
    if (dtl) {
      for (let d of dtl) {
        invoicesDtls.push(d);
      }
    }
  }

  let salesDtl = await SalesContractDtlModel.find({
    salesContract: new mongoose.Types.ObjectId(id),
  })
    .populate({ path: 'product', model: ProductModel })
    .populate({ path: 'currency', model: CurrencyModel });

  if (salesDtl && invoicesDtls.length > 0) {
    salesDtl.forEach((sale, index) => {
      invoicesDtls.forEach((inv) => {
        if (inv.product.toString() == sale.product._id.toString()) {
          salesDtl[index].qty -= inv.qty;
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
    const dtls = await findSalesContractsWithInvoice(s._id);
    if (dtls.length > 0) res.push(s);
    console.log(s.id);
  }
  return res;
};

//=============================================================

export const findSalesContractDtlsByDate = async (
  input: SaleContractReportSchema
) => {
  try {
    if (
      Array.isArray(input.product) &&
      input.product.length == 0 &&
      Array.isArray(input.customer) &&
      input.customer.length == 0 &&
      Array.isArray(input.brand) &&
      input.brand.length == 0 &&
      input.customer_group == '' &&
      input.product_group == '' &&
      input.brand_group == ''
    ) {
      console.log('no filter condition execute');

      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;

      const allrecordgroupby = await SalesContractDtlModel.aggregate([
        {
          $match: {
            contractDate: {
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
        contractDate: {
          $gte: new Date(input.fromDate),
          $lte: new Date(input.toDate),
        },
        isDeleted: false,
      };
      const salesContract = await SalesContractDtlModel.find(where);

      const saleContractDetail = await SalesContractDtlModel.aggregate([
        {
          $match: where,
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salecontract_dtl',
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
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'branddtl',
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
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'product_dtl',
          },
        },

        {
          $lookup: {
            from: 'currencies',
            localField: 'currency',
            foreignField: '_id',
            as: 'currency_dtl',
          },
        },
        { $skip: skipCount },
        { $limit: limit },
        { $sort: { tran: 1 } },
      ]);
      let result = {
        salescontract_dtl: saleContractDetail,
        total_records: salesContract ? salesContract.length : 0,
        paginated_record: saleContractDetail.length,
        totalQty: totalQty,
        totalRate: totalRate,
        totalAmount: totalAmount,
      };
      return result;
    } else if (input.customer_group !== '') {
      console.log('customer group');
      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      const total_records = await CustomerModel.countDocuments();

      const customer = await CustomerModel.aggregate([
        {
          $lookup: {
            from: 'salescontractdtls',
            localField: '_id',
            foreignField: 'customer',
            as: 'sales_dtl',
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
                  input: '$sales_dtl',
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
            total_sales: {
              $size: '$sales_dtl',
            },
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ]);
      const result = {
        customer_groupby: customer,
        total_records: total_records,
      };
      return result;
    } else if (input.product_group !== '') {
      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
      console.log('product');

      const total_records = await ProductModel.countDocuments();

      const product = await ProductModel.aggregate([
        {
          $lookup: {
            from: 'salescontractdtls',
            localField: '_id',
            foreignField: 'product',
            as: 'sales_dtl',
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
                  input: '$sales_dtl',
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
            sales_dtl: {
              $size: '$sales_dtl',
            },
            salesContract: {
              $first: '$sales_dtl.salesContract',
            },
          },
        },
        {
          $lookup: {
            from: 'salescontracts',
            localField: 'salesContract',
            foreignField: '_id',
            as: 'salecontracts',
          },
        },
        {
          $project: {
            sales_dtl: 1,
            totalQty: 1,
            name: 1,
            saleContracts: {
              $first: '$salecontracts.contract',
            },
          },
        },
        { $skip: skipCount },
        { $limit: limit },
      ]);

      const result = {
        product_groupby: product,
        total_records: total_records,
      };
      return result;
    } else if (input.brand_group !== '') {
      console.log('brand execute!');
      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;
const total_records = await BrandModel.countDocuments()
      const brandgroup = await BrandModel.aggregate([
        {
          $lookup: {
            from: 'salescontractdtls',
            localField: '_id',
            foreignField: 'brand',
            as: 'salecontract',
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
                  input: '$salecontract',
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
            salecontract: {
              $size: '$salecontract',
            },
          },
        },
        
        { $skip: skipCount },
        { $limit: limit },
      ]);
      const result={
        brand_groupby:brandgroup,
        total_records:total_records
      }
      return result
    } else if (
      (Array.isArray(input.product) && input.product.length !== 0) ||
      (Array.isArray(input.customer) && input.customer.length !== 0) ||
      (Array.isArray(input.brand) && input.brand.length !== 0)
    ) {
      let where: any = {};
      const limit = input.perPage;
      const skipCount = (input.pageno - 1) * limit;

      const customerArr = input.customer
        ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const productArr = input.product
        ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];
      const brandArr = input.brand
        ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
        : [];

      where = {};
      let filter: any = {};
      let filter_records: any = {};
      // where = {
      //   contractDate: {
      //     $gte: new Date(input.fromDate),
      //     $lte: new Date(input.toDate),
      //   },
      //   isDeleted: false,
      // };
      // filter_records = {
      //   contractDate: {
      //     $gte: new Date(input.fromDate),
      //     $lte: new Date(input.toDate),
      //   },
      //   isDeleted: false,
      // };
      if (
        customerArr.length > 0 &&
        brandArr.length > 0 &&
        productArr.length > 0
      ) {
        where.$and = [
          {
            customer: { $in: customerArr },
            brand: { $in: brandArr },
            product: { $in: productArr },
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
            brand: { $in: brandArr },
            product: { $in: productArr },
          },
        ];
      } else if (customerArr.length > 0 && brandArr.length > 0) {
        where.$and = [
          {
            customer: { $in: customerArr },
            brand: { $in: brandArr },
          },
        ];
        filter.$and = [
          {
            customer: { $in: customerArr },
            brand: { $in: brandArr },
          },
        ];
        filter_records.$and = [
          {
            customer: { $in: customerArr },
            brand: { $in: brandArr },
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
      } else if (brandArr.length > 0 && productArr.length > 0) {
        where.$and = [
          {
            brand: { $in: brandArr },
            product: { $in: productArr },
          },
        ];
        filter = {
          product: { $in: productArr },
          brand: { $in: brandArr },
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
      } else if (brandArr.length > 0) {
        (where = {
          brand: { $in: brandArr },
        }),
          (filter = {
            brand: { $in: brandArr },
          });
        filter_records = {
          brand: { $in: brandArr },
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

      const total_record = await SalesContractDtlModel.aggregate([
        {
          $match: {
            contractDate: {
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
      console.log(filter);
      const productgroupby = await SalesContractDtlModel.aggregate([
        {
          $match: {
            contractDate: {
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
      console.log(productgroupby, 'records');
      const totalQty = productgroupby.map((item: any) => item.qty);
      const totalRate = productgroupby.map((item: any) => item.rate);
      const totalAmount = productgroupby.map((item: any) => item.amount);

      // console.log("qty" , totalQty);
      // console.log("totalamount" , totalAmount)
      const saleContractDetail = await SalesContractDtlModel.aggregate([
        {
          $match: {
            contractDate: {
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
            as: 'salecontract_dtl',
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
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'branddtl',
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
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'product_dtl',
          },
        },
        {
          $lookup: {
            from: 'currencies',
            localField: 'currency',
            foreignField: '_id',
            as: 'currency_dtl',
          },
        },
        { $skip: skipCount },
        { $limit: limit },
        { $sort: { tran: 1 } },
      ]);

      const result = {
        salescontract_dtl: saleContractDetail,
        total_record: total_record.length,
        paginated_record: saleContractDetail.length,
        totalAmount: totalAmount,
        totalQty: totalQty,
        totalRate: totalRate,
      };
      return result;
    }
  } catch (err) {
    console.log({ err });
  }
};

//---------------------------------------------------------

export const findSalesContractDtlsByDatePrint = async (
  input: SaleContractReportPrintSchema
) => {
  if (
    Array.isArray(input.product) &&
    input.product.length == 0 &&
    Array.isArray(input.customer) &&
    input.customer.length == 0 &&
    Array.isArray(input.brand) &&
    input.brand.length == 0 &&
    input.customer_group == '' &&
    input.product_group == '' &&
    input.brand_group == ''
  ) {
    console.log('no filter condition execute');

    const allrecordgroupby = await SalesContractDtlModel.aggregate([
      {
        $match: {
          contractDate: {
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
      contractDate: {
        $gte: new Date(input.fromDate),
        $lte: new Date(input.toDate),
      },
      isDeleted: false,
    };
    const salesContract = await SalesContractDtlModel.find(where);

    const saleContractDetail = await SalesContractDtlModel.aggregate([
      {
        $match: where,
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salecontract_dtl',
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
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'branddtl',
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
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product_dtl',
        },
      },

      {
        $lookup: {
          from: 'currencies',
          localField: 'currency',
          foreignField: '_id',
          as: 'currency_dtl',
        },
      },
    ]);
    let result = {
      salescontract_dtl: saleContractDetail,
      total_records: salesContract ? salesContract.length : 0,
      totalQty: totalQty,
      totalRate: totalRate,
      totalAmount: totalAmount,
    };
    return result;
  } else if (input.customer_group !== '') {
    console.log('customer group');

    const customer = await CustomerModel.aggregate([
      {
        $lookup: {
          from: 'salescontractdtls',
          localField: '_id',
          foreignField: 'customer',
          as: 'sales_dtl',
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
                input: '$sales_dtl',
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
          total_sales: {
            $size: '$sales_dtl',
          },
        },
      },
    ]);
    return customer;
  } else if (input.product_group !== '') {
    console.log('product');
    const product = await ProductModel.aggregate([
      {
        $lookup: {
          from: 'salescontractdtls',
          localField: '_id',
          foreignField: 'product',
          as: 'sales_dtl',
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
                input: '$sales_dtl',
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
          sales_dtl: {
            $size: '$sales_dtl',
          },
          salesContract: {
            $first: '$sales_dtl.salesContract',
          },
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salecontracts',
        },
      },
      {
        $project: {
          sales_dtl: 1,
          totalQty: 1,
          name: 1,
          saleContracts: {
            $first: '$salecontracts.contract',
          },
        },
      },
    ]);

    return product;
  } else if (input.brand_group !== '') {
    console.log('brand execute!');

    const brandgroup = await BrandModel.aggregate([
      {
        $lookup: {
          from: 'salescontractdtls',
          localField: '_id',
          foreignField: 'brand',
          as: 'salecontract',
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
                input: '$salecontract',
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
          salecontract: {
            $size: '$salecontract',
          },
        },
      },
    ]);

    return brandgroup;
  } else if (
    (Array.isArray(input.product) && input.product.length !== 0) ||
    (Array.isArray(input.customer) && input.customer.length !== 0) ||
    (Array.isArray(input.brand) && input.brand.length !== 0)
  ) {
    let where: any = {};

    const customerArr = input.customer
      ? input.customer.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const productArr = input.product
      ? input.product.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];
    const brandArr = input.brand
      ? input.brand.map((id: any) => new mongoose.Types.ObjectId(id))
      : [];

    where = {};
    let filter: any = {};
    let filter_records: any = {};

    if (
      customerArr.length > 0 &&
      brandArr.length > 0 &&
      productArr.length > 0
    ) {
      where.$and = [
        {
          customer: { $in: customerArr },
          brand: { $in: brandArr },
          product: { $in: productArr },
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
          brand: { $in: brandArr },
          product: { $in: productArr },
        },
      ];
    } else if (customerArr.length > 0 && brandArr.length > 0) {
      where.$and = [
        {
          customer: { $in: customerArr },
          brand: { $in: brandArr },
        },
      ];
      (filter = {
        customer: { $in: customerArr },
        brand: { $in: brandArr },
      }),
        (filter_records.$and = [
          {
            customer: { $in: customerArr },
            brand: { $in: brandArr },
          },
        ]);
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
    } else if (brandArr.length > 0 && productArr.length > 0) {
      where.$and = [
        {
          brand: { $in: brandArr },
          product: { $in: productArr },
        },
      ];
      filter = {
        product: { $in: productArr },
        brand: { $in: brandArr },
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
    } else if (brandArr.length > 0) {
      (where = {
        brand: { $in: brandArr },
      }),
        (filter = {
          brand: { $in: brandArr },
        });
      filter_records = {
        brand: { $in: brandArr },
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

    const total_record = await SalesContractDtlModel.aggregate([
      {
        $match: {
          contractDate: {
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

    const productgroupby = await SalesContractDtlModel.aggregate([
      {
        $match: {
          contractDate: {
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

    const totalQty = productgroupby.map((item: any) => item.qty);
    const totalRate = productgroupby.map((item: any) => item.rate);
    const totalAmount = productgroupby.map((item: any) => item.amount);

    const saleContractDetail = await SalesContractDtlModel.aggregate([
      {
        $match: {
          contractDate: {
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
          as: 'salecontract_dtl',
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
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'branddtl',
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
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product_dtl',
        },
      },
      {
        $lookup: {
          from: 'currencies',
          localField: 'currency',
          foreignField: '_id',
          as: 'currency_dtl',
        },
      },
    ]);

    const result = {
      salescontract_dtl: saleContractDetail,
      total_record: total_record.length,
      totalAmount: totalAmount,
      totalQty: totalQty,
      totalRate: totalRate,
    };
    return result;
  }
};

export const findIsDeletedSalesContractByDate = async (
  input: SaleContractReportSchema
) => {
  let where: any = {
    date: {
      $gte: moment(input.fromDate).format('YYYY-MM-DD'),
      $lte: moment(input.toDate).format('YYYY-MM-DD'),
    },
    isDeleted: true,
  };

  if (input?.customer != '') {
    where.customer = input.customer;
  }

  console.log({ where });

  const saleContract = await SalesContractModel.find(where)

    .populate({
      path: 'brand',
      model: BrandModel,
    })
    .populate({
      path: 'customer',
      model: CustomerModel,
    });

  const IsDeletedDetail = await SalesContractDtlModel.find({
    isDeleted: true,
  })

    .populate({
      path: 'product',
      model: ProductModel,
    })
    .populate({
      path: 'currency',
      model: CurrencyModel,
    })
    .populate({
      path: 'salesContract',
      model: SalesContractModel,
      populate: [
        { path: 'customer', model: CustomerModel },
        { path: 'brand', model: BrandModel },
      ],
    });

  return IsDeletedDetail;
};
export const findNotShipmentSalesContract = async () => {
  const saleContract = await SalesContractModel.find({
    shipment: false,
    isDeleted: false,
  });
  const saleContractDetail = await SalesContractDtlModel.aggregate([
    { $match: { $and: [{ isDeleted: false }, { shipment: false }] } },
    {
      $group: {
        _id: '$salesContract',
        salesContract: { $first: '$salesContract' },
        qty: { $sum: '$qty' },
        rate: { $sum: '$rate' },
        amount: { $sum: '$amount' },
        shipmentDate: { $first: '$shipmentDate' },
      },
    },
  ]);
  await SalesContractDtlModel.populate(saleContractDetail, {
    path: 'salesContract',
    model: SalesContractModel,

    populate: [
      {
        path: 'brand',
        model: BrandModel,
      },
      {
        path: 'customer',
        model: CustomerModel,
      },
    ],
  });

  return saleContractDetail;
};

export const updateinvoice_Noadmdenim = async (input: tempSchema) => {};

export const Salecontract_drop_down = async (
  input: Salecontractdrop_downSchema
) => {
  const limit = input?.limit;
  const searchQuery = new RegExp(`^${input?.contract}`, 'i');

  if (input.record == true) {
    const salecontract = await SalesContractModel.aggregate([
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
    ]).exec();

    return salecontract;
  } else if (input.contract !== '') {
    try {
      const salecontract = await SalesContractModel.aggregate([
        {
          $match: {
            contract: { $regex: searchQuery },
            isDeleted: false,
          },
        },
        { $limit: limit },
      ]).exec();

      return salecontract;
    } catch (error) {
      return error;
    }
  } else {
    const salecontract = await SalesContractModel.aggregate([
      {
        $match: {
          isDeleted: false,
        },
      },
      { $limit: limit },
    ]).exec();

    return salecontract;
  }
};
