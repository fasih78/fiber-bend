import mongoose, { Aggregate, Mongoose, model } from 'mongoose';
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
  UpdateRoyalitySchema,
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
import _, { cloneWith } from 'lodash';
import { payementSchema } from '../payment/payement.schema';
import invoiceRoutes from '../invoice/invoice.routes';
import { PaymentTermModel } from '../payment_term/payment_term.model';
import moment from 'moment';
import { RoyalityAdmModel } from './royalityAdmDenim.model';
import { R } from 'vitest/dist/types-c800444e';
import { setFlagsFromString } from 'v8';
import { pipeline } from 'stream';
import { lookup } from 'dns';

export const createRoyalityPrac = async (input: CreateRoyalitySchema) => {
  const {
    id,
    paid,
    paymentDate,
    paymentDate1,
    payment,
    invoice,
    amount,
    saletaxinvoicedate,
    royalityrate,
  } = input;
  console.log(input);


  const saletax = await InvoiceModel.findOne({ _id: invoice });

  const sales_contract = await InvoiceModel.findOne({ _id: invoice });

  const sale_contract = await SalesContractModel.findOne({
    _id: sales_contract?.salesContract,
  });

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
    salesContract: sales_contract?.salesContract
      ? new mongoose.Types.ObjectId(
        (sales_contract.salesContract as any)?._id ||
        sales_contract.salesContract
      )
      : undefined,

    customer: Customer?.customer
      ? new mongoose.Types.ObjectId(
        (typeof Customer.customer === 'object' && '_id' in Customer.customer
          ? Customer.customer._id
          : Customer.customer
        ).toString()
      )
      : undefined,

    product: product?.product
      ? new mongoose.Types.ObjectId(
        (typeof product.product === 'object' && '_id' in product.product
          ? product.product._id
          : product.product
        ).toString()
      )
      : undefined,

    brand: Customer?.brand
      ? new mongoose.Types.ObjectId(
        (typeof Customer.brand === 'object' && '_id' in Customer.brand
          ? Customer.brand._id
          : Customer.brand
        ).toString()
      )
      : undefined,
    amount,
    contract: sale_contract?.contract,
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
  const salecontract = sales_contract?.salesContract;
  const royality_nonAdm = await SalesContractModel.updateOne(
    { _id: salecontract },
    {
      $set: {
        royality_nonadm: true,
      },
    }
  );
  const royality_nonAdm1 = await SalesContractDtlModel.updateOne(
    { salesContract: salecontract },
    {
      $set: {
        royality_nonadm: true,
      },
    }
  );
  return royality;
};

export const createRoyalityAdmDenim = async (
  input: CreateRoyalityAdmDenimSchema
) => {
  const { salesContract, royalityrate, customer, shipment_date, amount } =
    input;
  console.log(input, 'request');
  const sales = await SalesContractModel.findOne({ _id: input.salesContract });
  const dtl = await SalesContractDtlModel.findOne({
    salesContract: sales?._id,
  });

  const LastUser = await RoyalityModel.findOne().sort({ _id: -1 });
  const id = LastUser ? LastUser.id + 1 : 1;

  const salecontract = await SalesContractDtlModel.findOne({
    salesContract: salesContract,
  });
  const saleinvoice = await SalesContractModel.findOne({
    _id: salesContract,
  });
  const saletaxinvoice = saleinvoice?.salesTaxInvoiceNo;
  const extracted: any = salecontract?.amount;

  const sale_contract = await SalesContractModel.findOne({
    _id: salesContract,
  });

  // const amount = (extracted * 15) / 100;

  const royality = await RoyalityModel.create({
    id: id,
    saletaxinvoicedate: moment(saleinvoice?.contractDate).format('YYYY-MM-DD'),
    salesContract: new mongoose.Types.ObjectId(salesContract),
    amount: amount,
    royalityrate: royalityrate,
    paid: true,
    InHouse: true,
    shipment_date: input?.shipment_date,
    customer: new mongoose.Types.ObjectId(customer),
    product: new mongoose.Types.ObjectId(dtl.product),
    brand: new mongoose.Types.ObjectId(sale_contract?.brand),
    salesTaxInvoiceNo: saletaxinvoice,
    contract: sale_contract?.contract,
  });
  const sale = await SalesContractModel.findByIdAndUpdate(salesContract, {
    royality: true,
  });
  const saledtl = await SalesContractDtlModel.updateOne(
    { salesContract: new mongoose.Types.ObjectId(salesContract) },
    {
      royality: true,
    }
  );
  return royality;
};
export const createRoyality = async (input: CreateRoyalitySchema) => {
  const { invoice } = input;

  try {
    const customer_find = await InvoiceDtlModel.findOne({ invoice: invoice });
    const customerobjectid = customer_find?.customer;

    if (customerobjectid instanceof mongoose.Types.ObjectId) {
      if (
        customerobjectid.equals(
          new mongoose.Types.ObjectId('648d7c960cee8c1de3294415')
        )
      ) {
        console.log('InHouse ', 'true');

        const {
          id,
          paid,
          paymentDate,
          shipment_date,
          payment,
          invoice,
          amount,
          saletaxinvoicedate,
          royalityrate,
          salesContract,
          customer,
        } = input;
        console.log(input, 'request from frontened create');

        const saletax = await InvoiceModel.findOne({ _id: invoice });

        const sale_contract = await SalesContractModel.findOne({
          _id: salesContract,
        });
        const sale_product = await SalesContractDtlModel.findOne({
          salesContract: salesContract,
        });

        const royality = await RoyalityModel.create({
          id: id,
          saletaxinvoicedate: moment(saletaxinvoicedate).format('YYYY-MM-DD'),
          paymentDate: moment(paymentDate).format('YYYY-MM-DD'),
          salesContract: new mongoose.Types.ObjectId(salesContract),
          amount: amount,
          royalityrate: royalityrate,
          paid: paid,
          InHouse: true,
          shipment_date: moment(input.shipment_date).format('YYYY-MM-DD'),
          invoice: new mongoose.Types.ObjectId(invoice),
          payment: new mongoose.Types.ObjectId(payment),
          customer: new mongoose.Types.ObjectId(customer),
          product: new mongoose.Types.ObjectId(sale_product.product),
          brand: new mongoose.Types.ObjectId(sale_product?.brand),
          salesTaxInvoiceNo: saletax?.salesTaxInvoiceNo,
          contract: sale_contract?.contract,
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
        const sale = await SalesContractModel.findByIdAndUpdate(salesContract, {
          royality: true,
        });
        const saledtl = await SalesContractDtlModel.updateOne(
          { salesContract: new mongoose.Types.ObjectId(salesContract) },
          {
            royality: true,
          }
        );
        return royality;
      } else {
       
        const {
          id,
          paid,
          paymentDate,
          payment,
          invoice,
          shipment_date,
          amount,
          saletaxinvoicedate,
          royalityrate,
          salesContract,
          customer,
        } = input;

        console.log('InHouse ', 'false');
        console.log(customer, 'customer from frontend');
        const customer_find = await CustomerModel.findOne({_id: customer });
        if (!customer_find) {
          throw new Error('Customer not found');
          
        }

        const saletax = await InvoiceModel.findOne({ _id: invoice });

        const sales_contract = await InvoiceModel.findOne({ _id: invoice });

        const sale_contract = await SalesContractModel.findOne({
          _id: salesContract,
        });

        const sale = await InvoiceModel.findOne({ _id: invoice });
        const Customer = await SalesContractModel.findOne({
          _id: salesContract,
        });

        const sale_product = await InvoiceModel.findOne({ _id: invoice });
        const product = await SalesContractDtlModel.findOne({
          salesContract: sale_product?.salesContract,
        });

        const royality = await RoyalityModel.create({
          id,
          paid,
          paymentDate,
          paymentDate1: paid ? 'Paid' : 'Unpaid',
          saletaxinvoicedate,
          shipment_date: moment(input.shipment_date).format('YYYY-MM-DD'),
          payment: new mongoose.Types.ObjectId(payment),
          invoice: new mongoose.Types.ObjectId(invoice),
          salesContract: new mongoose.Types.ObjectId(salesContract),
          customer: new mongoose.Types.ObjectId(customer),
          product: new mongoose.Types.ObjectId(product?.product),
          brand: new mongoose.Types.ObjectId(Customer?.brand),
          amount,
          contract: sale_contract?.contract,
          salesTaxInvoiceNo: saletax?.salesTaxInvoiceNo,
          royalityrate,
          InHouse: false,
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
        const salecontract = sales_contract?.salesContract;
        const royality_nonAdm = await SalesContractModel.updateOne(
          { _id: salecontract },
          {
            $set: {
              royality_nonadm: true,
            },
          }
        );
        const royality_nonAdm1 = await SalesContractDtlModel.updateOne(
          { salesContract: salecontract },
          {
            $set: {
              royality_nonadm: true,
            },
          }
        );
        return royality;
      }
    }
  } catch (error) {
    console.log(error);
  }
};

export const updateRoyalityById = async (
  id: string,
  input: UpdateRoyalitySchema
) => {
  const {
    customer,
    salesContract,
    invoice,
    payment,
    paid,
    brand,
    paymentDate1,
    paymentDate,
    royalityrate,
    shipment_date,
    salesTaxInvoiceNo,
    amount,
    product,
    contract,
    saletaxinvoicedate,
  } = input;

  console.log(input, 'request from frontend');

  

  if (customer == '648d7c960cee8c1de3294415') {

    const royality = await RoyalityModel.findByIdAndUpdate(
      id,
      {
        $set: {
          saletaxinvoicedate: saletaxinvoicedate,
          amount: amount,
          royalityrate: royalityrate,
          paymentDate: paymentDate,
          shipment_date: shipment_date,
          paymentDate1: true,
          InHouse: true,
          paid: paid,
          salesContract: new mongoose.Types.ObjectId(salesContract),
          payment: new mongoose.Types.ObjectId(payment),
          invoice: new mongoose.Types.ObjectId(invoice),
          customer: new mongoose.Types.ObjectId(customer),
          product: new mongoose.Types.ObjectId(product),
          brand: new mongoose.Types.ObjectId(brand),
          salesTaxInvoiceNo: salesTaxInvoiceNo,
          contract: contract,
        },
      },
      { new: true } // Return the updated document
    );

    return royality;
  } else {
const find_customer = await CustomerModel.findOne({ _id: customer });

if (!find_customer) {
  throw new Error('Customer not found');
}

    const royalityupdate = await RoyalityModel.findByIdAndUpdate(id, {
      $set: {
        saletaxinvoicedate: saletaxinvoicedate,
        amount: amount,
        paymentDate: paymentDate,
        royalityrate: royalityrate,
        shipment_date: shipment_date,
        paymentDate1: true,
        InHouse: false,
        paid: paid,
        salesContract: new mongoose.Types.ObjectId(salesContract),
        payment: new mongoose.Types.ObjectId(payment),
        invoice: new mongoose.Types.ObjectId(invoice),
        customer: new mongoose.Types.ObjectId(customer),
        product: new mongoose.Types.ObjectId(product),
        brand: new mongoose.Types.ObjectId(brand),
        salesTaxInvoiceNo: salesTaxInvoiceNo,
        contract: contract,
      },
    });

    return royalityupdate;
  }
};

export const deleteRoyality = async () => {
  await RoyalityModel.deleteMany({});
  return await RoyalityModel.deleteMany({});
};

export const deleteRoyalityById = async (id: string) => {
  const royalityfind = await RoyalityModel.findOne({ _id: id });

  const customer = royalityfind?.customer;
  const constract = royalityfind?.salesContract;

  if (customer && customer.toString() === '648d7c960cee8c1de3294415') {
    const delete1 = await RoyalityModel.findByIdAndUpdate(id, {
      isDeleted: true,
    });
    const salecontract = await SalesContractModel.findByIdAndUpdate(constract, {
      royality: false,
    });
    const salecontractdtl = await SalesContractDtlModel.updateOne(
      { salesContract: new mongoose.Types.ObjectId(constract) },
      {
        royality: false,
      }
    );
    return salecontractdtl;
  } else {
    const royality = await RoyalityModel.findById(id);

    const sales = await PaymentModel.findByIdAndUpdate(royality?.payment, {
      royality: false,
    });
    const delete1 = await RoyalityModel.findByIdAndUpdate(id, {
      isDeleted: true,
    });
    return delete1;
  }
};

export const findRoyality = async (input: RoyalityPaginationSchema) => {
  const limit = input.perPage;
  const skipCount = (input.pageno - 1) * limit;
  const searchQuery = new RegExp(`^${input?.contract}`, 'i');

  const getRoyalityAggregation = (matchQuery: { contract: { $regex: RegExp; }; isDeleted: boolean; } | { isDeleted: boolean; contract?: undefined; }) => {
    return RoyalityModel.aggregate([
      {
        $match: matchQuery,
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
        $lookup: {
          from: 'payments',
          localField: 'payment',
          foreignField: '_id',
          as: 'payment',
        },
      },
      {
        $lookup: {
          from: 'invoices',
          localField: 'invoice',
          foreignField: '_id',
          as: 'invoice',
          pipeline: [
            {
              $lookup: {
                from: 'salescontracts',
                localField: 'salesContract',
                foreignField: '_id',
                as: 'salesContract',
              },
            },
          ],
        },
      },
      { $skip: skipCount },
      { $limit: limit },
      { $sort: { id: 1 } },
    ]);
  };


  const matchQuery = input.contract
    ? { contract: { $regex: searchQuery }, isDeleted: false }
    : { isDeleted: false };


  const [royality, totalRecords] = await Promise.all([
    getRoyalityAggregation(matchQuery),
    RoyalityModel.countDocuments(matchQuery),
  ]);

  const result = {
    royality_dtl: royality,
    total_records: totalRecords,
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

export const findroyalityamount = async (input: RoyalityamountSchema) => {
  const { payment, royaltyRate } = input;

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

  const amount = (invoiceDtls[0].amount / 100) * royaltyRate;

  return amount;
};
export const findAdmroyalityamount = async (input: RoyalityamountSchema) => {
  const { salescontract, royaltyRate, contractDate } = input;

  const inputDate = new Date(contractDate ?? new Date());

  const thresholdDate = new Date('2024-06-10');
  let cal: number = 0;

  if (inputDate < thresholdDate) {
    const salecontracts = await SalesContractDtlModel.findOne({
      salesContract: salescontract,
    });

    const amount = salecontracts?.amount || 0;
    cal = (amount * 15) / 100;
  } else {
    const salecontracts = await SalesContractDtlModel.findOne({
      salesContract: salescontract,
    });

    const amount = salecontracts?.amount || 0;
    cal = (amount * royaltyRate) / 100;
  }

  return cal;
};



export const RoyalityReportDtlwithAdmDenim = async (input: RoyalityReportSchema) => {
  try {

    const {
      otherthanadmdenim,
      Admdenim,
      product,
      brand,
      salesContract,
      customer,
      pageno = 1,
      perPage = 10,
      fromDate,
      toDate,
      isDeleted,
      royality_return,
      order_status,
      royality_approval,
      productgroup,
      customergroup,
      brandgroup,
    } = input



    if (royality_return !== '') {

      console.log("royality return")

      const limit = perPage;
      const skipCount = (pageno - 1) * limit;

      //  Group condition setter
      const groupId: any = {};
      const shouldGroup = productgroup || brandgroup || customergroup;

      if (productgroup) groupId.product = '$product';
      if (brandgroup) groupId.brand = '$brand';
      if (customergroup) groupId.customer = '$customer';


      // royality match stage
      const matchStage: any = { isDeleted: false };


      if (fromDate && toDate) {
        matchStage.saletaxinvoicedate = {
          $gte: new Date(fromDate),
          $lte: new Date(toDate),
        };
      }

      if (product?.length > 0) {
        matchStage.product = {
    $in: product.map(id => new mongoose.Types.ObjectId(id))
  };
      }

      if (brand?.length > 0) {
        matchStage.brand ={
    $in: brand.map(id => new mongoose.Types.ObjectId(id))
  };
      }

      if (customer?.length > 0) {
        matchStage.customer ={
    $in: customer.map(id => new mongoose.Types.ObjectId(id))
  };
      }


      if (Admdenim) matchStage['InHouse'] = true;
      if (otherthanadmdenim) matchStage['InHouse'] = false;
      if (royality_return) matchStage['return'] = false;


      const scMatchStage: any = { };
      if (royality_approval == 'true')
        scMatchStage['salesContracts.royality_approval'] = true;
      if (royality_approval == 'false')
        scMatchStage['salesContracts.royality_approval'] = false;

      // const scMatchStage2: any = { isDeleted: false };
      if (order_status == 'confirmed')
        scMatchStage['salesContracts.order_status'] = 'confirmed';
      if (order_status == 'forecast')
        scMatchStage['salesContracts.order_status'] = 'forecast';
     if (isDeleted && isDeleted.toString().toLowerCase() === "true") {

  matchStage.isDeleted = true;
}

      const basePipeline: any[] = [
        {
          $match: matchStage
        },
        {

          $lookup: {
            from: 'returns',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'returns',

          }
        },
        {
          $unwind: {
            path: "$returns",
            preserveNullAndEmptyArrays: true
          }
        },

        {
          $lookup: {
            from: "salescontracts",
            localField: "salesContract",
            foreignField: "_id",
            as: "salesContracts"
          }
        },
        {
          $unwind: {
            path: "$salesContracts",
            preserveNullAndEmptyArrays: true
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
            preserveNullAndEmptyArrays: true
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
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: "invoicedtls",
            localField: "invoice",
            foreignField: "invoice",
            as: "invoicedtls"
          }
        },
        {
          $unwind: {
            path: "$invoicedtls",
            preserveNullAndEmptyArrays: true
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
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {


            contract: "$salesContracts.contract",
            salesTaxInvoiceNo: 1,
            royalityRate: '$royalityrate',
            saleTaxInvoiceDate: "$saletaxinvoicedate",
            customer: "$customers.name",
            product: "$products.name",
            payemntDate: "$paymentDate",
            paid: "$paid",
            brand: "$brands.name",
            invoiceRate: "$invoicedtls.rate",
            invoiceQty: "$invoicedtls.qty",
            invoiceAmount: "$invoicedtls.amount",
            royalityAmount: "$amount",
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
                  $ifNull: ['$invoicedtls.qty', 0],
                },
                {
                  $ifNull: ['$returns.actualQty', 0],
                },
              ],
            },
            netAmount: {
              $subtract: [
                {
                  $ifNull: ['$invoicedtls.amount', 0],
                },
                {
                  $ifNull: ['$returns.actualAmount', 0],
                },
              ],
            },

          }
        },
        {
          $sort: {
            // _id: -1,
            saleTaxInvoiceDate: -1
          }
        }
      ]
      const basePipelineSummary: any[] = [
        {
          $match: matchStage
        },
        {

          $lookup: {
            from: 'returns',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'returns',

          }
        },
        {
          $unwind: {
            path: "$returns",
            preserveNullAndEmptyArrays: true
          }
        },

        {
          $lookup: {
            from: "salescontracts",
            localField: "salesContract",
            foreignField: "_id",
            as: "salesContracts"
          }
        },
        {
          $unwind: {
            path: "$salesContracts",
            preserveNullAndEmptyArrays: true
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
            preserveNullAndEmptyArrays: true
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
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: "invoicedtls",
            localField: "invoice",
            foreignField: "invoice",
            as: "invoicedtls"
          }
        },
        {
          $unwind: {
            path: "$invoicedtls",
            preserveNullAndEmptyArrays: true
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
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {


            contract: "$salesContracts.contract",
            salesTaxInvoiceNo: 1,
            royalityRate: '$royalityrate',
            saleTaxInvoiceDate: "$saletaxinvoicedate",
            customer: "$customers.name",
            product: "$products.name",
            payemntDate: "$paymentDate",
            paid: "$paid",
            brand: "$brands.name",
            invoiceRate: "$invoicedtls.rate",
            invoiceQty: "$invoicedtls.qty",
            invoiceAmount: "$invoicedtls.amount",
            royalityAmount: "$amount",
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
                  $ifNull: ['$invoicedtls.qty', 0],
                },
                {
                  $ifNull: ['$returns.actualQty', 0],
                },
              ],
            },
            netAmount: {
              $subtract: [
                {
                  $ifNull: ['$invoicedtls.amount', 0],
                },
                {
                  $ifNull: ['$returns.actualAmount', 0],
                },
              ],
            },

          }
        },
        {
          $sort: {
            // _id: -1,
            saleTaxInvoiceDate: -1
          }
        }
      ]
      const sortStage = { $sort: { totalInvoiceQtySum: -1 } };

      const groupStage = {
        $group: {
          _id: groupId,
          product: {
            $first: "$product"
          },

          brand: {
            $first: "$brand"
          },
          customer: {
            $first: "$customer"
          },
          totalInvoiceQtySum: {
            $sum: "$invoiceQty"
          },
          totalInvoiceAmountSum: {
            $sum: "$invoiceAmount"
          },
          totalRoyalityAmountSum: {
            $sum: "$royalityAmount"
          },
          totalReturnQty: { $sum: '$returnQty' },
          totalReturnAmount: { $sum: '$returnAmount' },
          totalBalance: { $sum: '$balance' },
          totalNetQty: { $sum: '$netQty' },
          totalNetAmount: { $sum: '$netAmount' },

        },


      }
      const groupStageSummary = {
        $group: {
          _id: '',
          // product: {
          //   $first: "$product"
          // },

          // brand: {
          //   $first: "$brand"
          // },
          // customer: {
          //   $first: "$customer"
          // },
          totalInvoiceQtySum: {
            $sum: "$invoiceQty"
          },
          totalInvoiceAmountSum: {
            $sum: "$invoiceAmount"
          },
          totalRoyalityAmountSum: {
            $sum: "$royalityAmount"
          },
          totalReturnQty: { $sum: '$returnQty' },
          totalReturnAmount: { $sum: '$returnAmount' },
          totalBalance: { $sum: '$balance' },
          totalNetQty: { $sum: '$netQty' },
          totalNetAmount: { $sum: '$netAmount' },
        },


      }

      // If grouping is not required, we can skip the group stage
      const dataPipeline = shouldGroup
        ? [...basePipeline, groupStage, sortStage, { $skip: skipCount }, { $limit: limit }]
        : [...basePipeline, { $skip: skipCount }, { $limit: limit }]

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
              totalInvoiceQtySum: {
                $sum: "$invoiceQty"
              },
              totalInvoiceAmountSum: {
                $sum: "$invoiceAmount"
              },
              totalRoyalityAmountSum: {
                $sum: "$royalityAmount"
              },
              totalReturnQty: { $sum: '$returnQty' },
              totalReturnAmount: { $sum: '$returnAmount' },
              totalBalance: { $sum: '$balance' },
              totalNetQty: { $sum: '$netQty' },
              totalNetAmount: { $sum: '$netAmount' },
            },
          },
        ];
      // Executing the pipelines in parallel
      const [royalitydtl, totalResult, summaryResult] = await Promise.all([
        RoyalityModel.aggregate(dataPipeline, { allowDiskUse: true }),
        RoyalityModel.aggregate(countPipeline, { allowDiskUse: true }),
        RoyalityModel.aggregate(summaryPipeline, { allowDiskUse: true }),
      ]);

      // Extracting total records and summary from the results
      const totalRecords = totalResult?.[0]?.totalRecords || 0;
      const summary = summaryResult?.[0] || {
        totalInvoiceQtySum: 0,
        totalInvoiceAmountSum: 0,
        totalReturnQty: 0,
        totalReturnAmount: 0,
        totalBalance: 0,
        totalNetQty: 0,
        totalNetAmount: 0,
        totalRoyalityAmountSum: 0,
      };
      return {
        royalitydtl,
        summary,
        pagination: {
          page: pageno,
          perPage,
          totalRecords,
          totalPages: Math.ceil(totalRecords / perPage),
        },
      };


    }
    else {

      const limit = perPage;
      const skipCount = (pageno - 1) * limit;

      //  Group condition setter
      const groupId: any = {};
      const shouldGroup = productgroup || brandgroup || customergroup;

      if (productgroup) groupId.product = '$product';
      if (brandgroup) groupId.brand = '$brand';
      if (customergroup) groupId.customer = '$customer';


      // royality match stage
      const matchStage: any = { isDeleted: false };


      if (fromDate && toDate) {
        matchStage.saletaxinvoicedate = {
          $gte: new Date(fromDate),
          $lte: new Date(toDate),
        };
      }

      if (product?.length > 0) {
        matchStage.product = {
    $in: product.map(id => new mongoose.Types.ObjectId(id))
  };
      }

      if (brand?.length > 0) {
        matchStage.brand = {
            $in: brand.map(id => new mongoose.Types.ObjectId(id))
          };
      }

      if (customer?.length > 0) {
        matchStage.customer = {
    $in: customer.map(id => new mongoose.Types.ObjectId(id))
  };
      }


      if (Admdenim) matchStage['InHouse'] = true;
      if (otherthanadmdenim) matchStage['InHouse'] = false;



      const scMatchStage: any = { };
      if (royality_approval == 'true')
        scMatchStage['salesContracts.royality_approval'] = true;
      if (royality_approval == 'false')
        scMatchStage['salesContracts.royality_approval'] = false;

      // const scMatchStage2: any = { isDeleted: false };
      if (order_status == 'confirmed')
        scMatchStage['salesContracts.order_status'] = 'confirmed';
      if (order_status == 'forecast')
        scMatchStage['salesContracts.order_status'] = 'forecast';
     if (isDeleted && isDeleted.toString().toLowerCase() === "true") {

  matchStage.isDeleted = true;
}

      const basePipeline: any[] = [
        {
          $match: matchStage
        },
        {
          $lookup: {
            from: "salescontracts",
            localField: "salesContract",
            foreignField: "_id",
            as: "salesContracts"
          }
        },
        {
          $unwind: {
            path: "$salesContracts",
            preserveNullAndEmptyArrays: true
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
            preserveNullAndEmptyArrays: true
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
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: "invoicedtls",
            localField: "invoice",
            foreignField: "invoice",
            as: "invoicedtls"
          }
        },
        {
          $unwind: {
            path: "$invoicedtls",
            preserveNullAndEmptyArrays: true
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
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            contract: "$salesContracts.contract",
            salesTaxInvoiceNo: 1,
            royalityRate: '$royalityrate',
            saleTaxInvoiceDate: "$saletaxinvoicedate",
            customer: "$customers.name",
            product: "$products.name",
            payemntDate: "$paymentDate",
            paid: "$paid",
            brand: "$brands.name",
            invoiceRate: "$invoicedtls.rate",
            invoiceQty: "$invoicedtls.qty",
            invoiceAmount: "$invoicedtls.amount",
            royalityAmount: "$amount"
          }
        },
        {
          $sort: {
            // _id: -1,
            saleTaxInvoiceDate: -1
          }
        }
      ]
      const basePipelineSummary: any[] = [
        {
          $match: matchStage
        },
        {
          $lookup: {
            from: "salescontracts",
            localField: "salesContract",
            foreignField: "_id",
            as: "salesContracts"
          }
        },
        {
          $unwind: {
            path: "$salesContracts",
            preserveNullAndEmptyArrays: true
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
            preserveNullAndEmptyArrays: true
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
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: "invoicedtls",
            localField: "invoice",
            foreignField: "invoice",
            as: "invoicedtls"
          }
        },
        {
          $unwind: {
            path: "$invoicedtls",
            preserveNullAndEmptyArrays: true
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
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            contract: "$salesContracts.contract",
            salesTaxInvoiceNo: 1,
            payemntDate: "$paymentDate",
            paid: "$paid",
            royalityRate: '$royalityrate',
            saleTaxInvoiceDate: "$saletaxinvoicedate",
            customer: "$customers.name",
            product: "$products.name",
            brand: "$brands.name",
            invoiceRate: "$invoicedtls.rate",
            invoiceQty: "$invoicedtls.qty",
            invoiceAmount: "$invoicedtls.amount",
            royalityAmount: "$amount"
          }
        },
        {
          $sort: {
            // _id: -1,
            saleTaxInvoiceDate: -1
          }
        }
      ]
      const sortStage = { $sort: { totalInvoiceQtySum: -1 } };

      const groupStage = {
        $group: {
          _id: groupId,
          product: {
            $first: "$product"
          },

          brand: {
            $first: "$brand"
          },
          customer: {
            $first: "$customer"
          },
          totalInvoiceQtySum: {
            $sum: "$invoiceQty"
          },
          totalInvoiceAmountSum: {
            $sum: "$invoiceAmount"
          },
          totalRoyalityAmountSum: {
            $sum: "$royalityAmount"
          }

        },


      }
      const groupStageSummary = {
        $group: {
          _id: '',
          // product: {
          //   $first: "$product"
          // },

          // brand: {
          //   $first: "$brand"
          // },
          // customer: {
          //   $first: "$customer"
          // },
          totalInvoiceQtySum: {
            $sum: "$invoiceQty"
          },
          totalInvoiceAmountSum: {
            $sum: "$invoiceAmount"
          },
          totalRoyalityAmountSum: {
            $sum: "$royalityAmount"
          }
        },


      }

      // If grouping is not required, we can skip the group stage
      const dataPipeline = shouldGroup
        ? [...basePipeline, groupStage, sortStage, { $skip: skipCount }, { $limit: limit }]
        : [...basePipeline, { $skip: skipCount }, { $limit: limit }]

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
              totalInvoiceQtySum: {
                $sum: "$invoiceQty"
              },
              totalInvoiceAmountSum: {
                $sum: "$invoiceAmount"
              },
              totalRoyalityAmountSum: {
                $sum: "$royalityAmount"
              }
            },
          },
        ];
      // Executing the pipelines in parallel
      const [royalitydtl, totalResult, summaryResult] = await Promise.all([
        RoyalityModel.aggregate(dataPipeline, { allowDiskUse: true }),
        RoyalityModel.aggregate(countPipeline, { allowDiskUse: true }),
        RoyalityModel.aggregate(summaryPipeline, { allowDiskUse: true }),
      ]);

      // Extracting total records and summary from the results
      const totalRecords = totalResult?.[0]?.totalRecords || 0;
      const summary = summaryResult?.[0] || {
        totalInvoiceQtySum: 0,
        totalInvoiceAmountSum: 0,
        totalRoyalityAmountSum: 0,
      };
      return {
        royalitydtl,
        summary,
        pagination: {
          page: pageno,
          perPage,
          totalRecords,
          totalPages: Math.ceil(totalRecords / perPage),
        },
      };
    }
  } catch (e) {
    console.error('Error in findRoyalityDtlsByDate:', e);
    throw e;
  }


}

export const RoyalitydtlReportPrint = async (input: RoyalityReportPrintSchema) => {
  try {

    const {
      otherthanadmdenim,
      Admdenim,
      product,
      brand,
      salesContract,
      customer,
      fromDate,
      royality_return,
      isDeleted,
      toDate,
      order_status,
      royality_approval,
      productgroup,
      customergroup,
      brandgroup,
    } = input


    // const limit = perPage;
    // const skipCount = (pageno - 1) * limit;

    //  Group condition setter

    if (royality_return !== '') {

      console.log("royality return")

      const groupId: any = {};
      const shouldGroup = productgroup || brandgroup || customergroup;

      if (productgroup) groupId.product = '$product';
      if (brandgroup) groupId.brand = '$brand';
      if (customergroup) groupId.customer = '$customer';


      // royality match stage
      const matchStage: any = { isDeleted: false };


      if (fromDate && toDate) {
        matchStage.saletaxinvoicedate = {
          $gte: new Date(fromDate),
          $lte: new Date(toDate),
        };
      }

      if (product?.length > 0) {
        matchStage.product ={
    $in: product.map(id => new mongoose.Types.ObjectId(id))
  };
      }

      if (brand?.length > 0) {
        matchStage.brand = {
    $in: brand.map(id => new mongoose.Types.ObjectId(id))
  };
      }

      if (customer?.length > 0) {
        matchStage.customer = {
    $in: customer.map(id => new mongoose.Types.ObjectId(id))
  };
      }


      if (Admdenim) matchStage['InHouse'] = true;
      if (otherthanadmdenim) matchStage['InHouse'] = false;
      if (royality_return) matchStage['return'] = false;


      const scMatchStage: any = {};
      if (royality_approval == 'true')
        scMatchStage['salesContracts.royality_approval'] = true;
      if (royality_approval == 'false')
        scMatchStage['salesContracts.royality_approval'] = false;

      // const scMatchStage2: any = { isDeleted: false };
      if (order_status == 'confirmed')
        scMatchStage['salesContracts.order_status'] = 'confirmed';
      if (order_status == 'forecast')
        scMatchStage['salesContracts.order_status'] = 'forecast';

     if (isDeleted && isDeleted.toString().toLowerCase() === "true") {

  matchStage.isDeleted = true;
}
      const basePipeline: any[] = [
        {
          $match: matchStage
        },
        {

          $lookup: {
            from: 'returns',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'returns',

          }
        },
        {
          $unwind: {
            path: "$returns",
            preserveNullAndEmptyArrays: true
          }
        },

        {
          $lookup: {
            from: "salescontracts",
            localField: "salesContract",
            foreignField: "_id",
            as: "salesContracts"
          }
        },
        {
          $unwind: {
            path: "$salesContracts",
            preserveNullAndEmptyArrays: true
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
            preserveNullAndEmptyArrays: true
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
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: "invoicedtls",
            localField: "invoice",
            foreignField: "invoice",
            as: "invoicedtls"
          }
        },
        {
          $unwind: {
            path: "$invoicedtls",
            preserveNullAndEmptyArrays: true
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
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {


            contract: "$salesContracts.contract",
            salesTaxInvoiceNo: 1,
            royalityRate: '$royalityrate',
            saleTaxInvoiceDate: "$saletaxinvoicedate",
            customer: "$customers.name",
            product: "$products.name",
            payemntDate: "$paymentDate",
            paid: "$paid",
            brand: "$brands.name",
            invoiceRate: "$invoicedtls.rate",
            invoiceQty: "$invoicedtls.qty",
            invoiceAmount: "$invoicedtls.amount",
            royalityAmount: "$amount",
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
                  $ifNull: ['$invoicedtls.qty', 0],
                },
                {
                  $ifNull: ['$returns.actualQty', 0],
                },
              ],
            },
            netAmount: {
              $subtract: [
                {
                  $ifNull: ['$invoicedtls.amount', 0],
                },
                {
                  $ifNull: ['$returns.actualAmount', 0],
                },
              ],
            },

          }
        },
        {
          $sort: {
            // _id: -1,
            saleTaxInvoiceDate: -1
          }
        }
      ]
      const basePipelineSummary: any[] = [
        {
          $match: matchStage
        },
        {

          $lookup: {
            from: 'returns',
            localField: 'salesContract',
            foreignField: 'salesContract',
            as: 'returns',

          }
        },
        {
          $unwind: {
            path: "$returns",
            preserveNullAndEmptyArrays: true
          }
        },

        {
          $lookup: {
            from: "salescontracts",
            localField: "salesContract",
            foreignField: "_id",
            as: "salesContracts"
          }
        },
        {
          $unwind: {
            path: "$salesContracts",
            preserveNullAndEmptyArrays: true
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
            preserveNullAndEmptyArrays: true
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
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: "invoicedtls",
            localField: "invoice",
            foreignField: "invoice",
            as: "invoicedtls"
          }
        },
        {
          $unwind: {
            path: "$invoicedtls",
            preserveNullAndEmptyArrays: true
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
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {


            contract: "$salesContracts.contract",
            salesTaxInvoiceNo: 1,
            royalityRate: '$royalityrate',
            saleTaxInvoiceDate: "$saletaxinvoicedate",
            customer: "$customers.name",
            product: "$products.name",
            payemntDate: "$paymentDate",
            paid: "$paid",
            brand: "$brands.name",
            invoiceRate: "$invoicedtls.rate",
            invoiceQty: "$invoicedtls.qty",
            invoiceAmount: "$invoicedtls.amount",
            royalityAmount: "$amount",
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
                  $ifNull: ['$invoicedtls.qty', 0],
                },
                {
                  $ifNull: ['$returns.actualQty', 0],
                },
              ],
            },
            netAmount: {
              $subtract: [
                {
                  $ifNull: ['$invoicedtls.amount', 0],
                },
                {
                  $ifNull: ['$returns.actualAmount', 0],
                },
              ],
            },

          }
        },
        {
          $sort: {
            // _id: -1,
            saleTaxInvoiceDate: -1
          }
        }
      ]
      const sortStage = { $sort: { totalInvoiceQtySum: -1 } };
      const groupStage = {
        $group: {
          _id: groupId,
          product: {
            $first: "$product"
          },

          brand: {
            $first: "$brand"
          },
          customer: {
            $first: "$customer"
          },
          totalInvoiceQtySum: {
            $sum: "$invoiceQty"
          },
          totalInvoiceAmountSum: {
            $sum: "$invoiceAmount"
          },
          totalRoyalityAmountSum: {
            $sum: "$royalityAmount"
          },
          totalReturnQty: { $sum: '$returnQty' },
          totalReturnAmount: { $sum: '$returnAmount' },
          totalBalance: { $sum: '$balance' },
          totalNetQty: { $sum: '$netQty' },
          totalNetAmount: { $sum: '$netAmount' },

        },


      }
      const groupStageSummary = {
        $group: {
          _id: '',
          // product: {
          //   $first: "$product"
          // },

          // brand: {
          //   $first: "$brand"
          // },
          // customer: {
          //   $first: "$customer"
          // },
          totalInvoiceQtySum: {
            $sum: "$invoiceQty"
          },
          totalInvoiceAmountSum: {
            $sum: "$invoiceAmount"
          },
          totalRoyalityAmountSum: {
            $sum: "$royalityAmount"
          },
          totalReturnQty: { $sum: '$returnQty' },
          totalReturnAmount: { $sum: '$returnAmount' },
          totalBalance: { $sum: '$balance' },
          totalNetQty: { $sum: '$netQty' },
          totalNetAmount: { $sum: '$netAmount' },
        },


      }

      // If grouping is not required, we can skip the group stage
      const dataPipeline = shouldGroup
        ? [...basePipeline, groupStage, sortStage]
        : [...basePipeline, sortStage]

      // Count pipeline for total records
      // const countPipeline = shouldGroup 
      // ? [...basePipeline, groupStage, { $count: 'totalRecords' }]
      // : [...basePipeline, { $count: 'totalRecords' }];


      // Summary pipeline for total records
      const summaryPipeline = shouldGroup
        ? [...basePipelineSummary, groupStageSummary]
        : [
          ...basePipelineSummary,
          {
            $group: {
              _id: null,
              totalInvoiceQtySum: {
                $sum: "$invoiceQty"
              },
              totalInvoiceAmountSum: {
                $sum: "$invoiceAmount"
              },
              totalRoyalityAmountSum: {
                $sum: "$royalityAmount"
              },
              totalReturnQty: { $sum: '$returnQty' },
              totalReturnAmount: { $sum: '$returnAmount' },
              totalBalance: { $sum: '$balance' },
              totalNetQty: { $sum: '$netQty' },
              totalNetAmount: { $sum: '$netAmount' },
            },
          },
        ];
      // Executing the pipelines in parallel
      const [royalitydtl, summaryResult] = await Promise.all([
        RoyalityModel.aggregate(dataPipeline, { allowDiskUse: true }),
        // RoyalityModel.aggregate(countPipeline, { allowDiskUse: true }),
        RoyalityModel.aggregate(summaryPipeline, { allowDiskUse: true }),
      ]);

      // Extracting total records and summary from the results
      // const totalRecords = totalResult?.[0]?.totalRecords || 0;
      const summary = summaryResult?.[0] || {
        totalInvoiceQtySum: 0,
        totalInvoiceAmountSum: 0,
        totalReturnQty: 0,
        totalReturnAmount: 0,
        totalBalance: 0,
        totalNetQty: 0,
        totalNetAmount: 0,
        totalRoyalityAmountSum: 0,
      };
      return {
        royalitydtl,
        summary,
        // pagination: {
        //   page: pageno,
        //   perPage,
        //   totalRecords,
        //   totalPages: Math.ceil(totalRecords / perPage),
        // },
      };



    }
    else {
      console.log("else")
      const groupId: any = {};
      const shouldGroup = productgroup || brandgroup || customergroup;

      if (productgroup) groupId.product = '$product';
      if (brandgroup) groupId.brand = '$brand';
      if (customergroup) groupId.customer = '$customer';


      // royality match stage
      const matchStage: any = { isDeleted: false };


      if (fromDate && toDate) {
        matchStage.saletaxinvoicedate = {
          $gte: new Date(fromDate),
          $lte: new Date(toDate),
        };
      }

      if (product?.length > 0) {
        matchStage.product = {
    $in: product.map(id => new mongoose.Types.ObjectId(id))
  };
      }

      if (brand?.length > 0) {
        matchStage.brand = {
    $in: brand.map(id => new mongoose.Types.ObjectId(id))
  };
      }

      if (customer?.length > 0) {
        matchStage.customer = {
    $in: customer.map(id => new mongoose.Types.ObjectId(id))
  };
      }


      if (Admdenim) matchStage['InHouse'] = true;
      if (otherthanadmdenim) matchStage['InHouse'] = false;


      const scMatchStage: any = {};
      if (royality_approval == 'true')
        scMatchStage['salesContracts.royality_approval'] = true;
      if (royality_approval == 'false')
        scMatchStage['salesContracts.royality_approval'] = false;

      // const scMatchStage2: any = { isDeleted: false };
      if (order_status == 'confirmed')
        scMatchStage['salesContracts.order_status'] = 'confirmed';
      if (order_status == 'forecast')
        scMatchStage['salesContracts.order_status'] = 'forecast';
      // Check if isDeleted is true and set the matchStage accordingly
     if (isDeleted && isDeleted.toString().toLowerCase() === "true") {

  matchStage.isDeleted = true;
}

      const basePipeline: any[] = [
        {
          $match: matchStage
        },
        {
          $lookup: {
            from: "salescontracts",
            localField: "salesContract",
            foreignField: "_id",
            as: "salesContracts"
          }
        },
        {
          $unwind: {
            path: "$salesContracts",
            preserveNullAndEmptyArrays: true
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
            preserveNullAndEmptyArrays: true
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
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: "invoicedtls",
            localField: "invoice",
            foreignField: "invoice",
            as: "invoicedtls"
          }
        },
        {
          $unwind: {
            path: "$invoicedtls",
            preserveNullAndEmptyArrays: true
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
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            contract: "$salesContracts.contract",
            salesTaxInvoiceNo: 1,
            saleTaxInvoiceDate: "$saletaxinvoicedate",
            customer: "$customers.name",
            product: "$products.name",
            royalityRate: '$royalityrate',
            payemntDate: "$paymentDate",
            paid: "$paid",
            brand: "$brands.name",
            invoiceRate: "$invoicedtls.rate",
            invoiceQty: "$invoicedtls.qty",
            invoiceAmount: "$invoicedtls.amount",
            royalityAmount: "$amount"
          }
        },
        {
          $sort: {
            // _id: -1,
             saleTaxInvoiceDate: -1
          }
        }
      ]
      const basePipelineSummary: any[] = [
        {
          $match: matchStage
        },
        {
          $lookup: {
            from: "salescontracts",
            localField: "salesContract",
            foreignField: "_id",
            as: "salesContracts"
          }
        },
        {
          $unwind: {
            path: "$salesContracts",
            preserveNullAndEmptyArrays: true
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
            preserveNullAndEmptyArrays: true
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
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: "invoicedtls",
            localField: "invoice",
            foreignField: "invoice",
            as: "invoicedtls"
          }
        },
        {
          $unwind: {
            path: "$invoicedtls",
            preserveNullAndEmptyArrays: true
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
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            contract: "$salesContracts.contract",
            salesTaxInvoiceNo: 1,
            payemntDate: "$paymentDate",
            paid: "$paid",
            saleTaxInvoiceDate: "$saletaxinvoicedate",
            customer: "$customers.name",
            royalityRate: '$royalityrate',
            product: "$products.name",
            brand: "$brands.name",
            invoiceRate: "$invoicedtls.rate",
            invoiceQty: "$invoicedtls.qty",
            invoiceAmount: "$invoicedtls.amount",
            royalityAmount: "$amount"
          }
        },
        {
          $sort: {
            // _id: -1,
                saleTaxInvoiceDate: -1
          }
        }
      ]
      const sortStage = { $sort: { totalInvoiceQtySum: -1 } };
      const groupStage = {
        $group: {
          _id: groupId,
          product: {
            $first: "$product"
          },

          brand: {
            $first: "$brand"
          },
          customer: {
            $first: "$customer"
          },
          totalInvoiceQtySum: {
            $sum: "$invoiceQty"
          },
          totalInvoiceAmountSum: {
            $sum: "$invoiceAmount"
          },
          totalRoyalityAmountSum: {
            $sum: "$royalityAmount"
          }

        },


      }
      const groupStageSummary = {
        $group: {
          _id: '',
          // product: {
          //   $first: "$product"
          // },

          // brand: {
          //   $first: "$brand"
          // },
          // customer: {
          //   $first: "$customer"
          // },
          totalInvoiceQtySum: {
            $sum: "$invoiceQty"
          },
          totalInvoiceAmountSum: {
            $sum: "$invoiceAmount"
          },
          totalRoyalityAmountSum: {
            $sum: "$royalityAmount"
          }

        },


      }

      // If grouping is not required, we can skip the group stage
      const dataPipeline = shouldGroup
        ? [...basePipeline, groupStage, sortStage]
        : [...basePipeline, sortStage]

      // Count pipeline for total records
      // const countPipeline = shouldGroup 
      // ? [...basePipeline, groupStage, { $count: 'totalRecords' }]
      // : [...basePipeline, { $count: 'totalRecords' }];


      // Summary pipeline for total records
      const summaryPipeline = shouldGroup
        ? [...basePipelineSummary, groupStageSummary]
        : [
          ...basePipelineSummary,
          {
            $group: {
              _id: null,
              totalInvoiceQtySum: {
                $sum: "$invoiceQty"
              },
              totalInvoiceAmountSum: {
                $sum: "$invoiceAmount"
              },
              totalRoyalityAmountSum: {
                $sum: "$royalityAmount"
              }
            },
          },
        ];
      // Executing the pipelines in parallel
      const [royalitydtl, summaryResult] = await Promise.all([
        RoyalityModel.aggregate(dataPipeline, { allowDiskUse: true }),
        // RoyalityModel.aggregate(countPipeline, { allowDiskUse: true }),
        RoyalityModel.aggregate(summaryPipeline, { allowDiskUse: true }),
      ]);

      // Extracting total records and summary from the results
      // const totalRecords = totalResult?.[0]?.totalRecords || 0;
      const summary = summaryResult?.[0] || {
        totalInvoiceQtySum: 0,
        totalInvoiceAmountSum: 0,
        totalRoyalityAmountSum: 0,
      };
      return {
        royalitydtl,
        summary,
        // pagination: {
        //   page: pageno,
        //   perPage,
        //   totalRecords,
        //   totalPages: Math.ceil(totalRecords / perPage),
        // },
      };
    }
  } catch (e) {
    console.error('Error in findRoyalityDtlsByDate:', e);
    throw e;
  }

}




export const RoyalityReportDtlNetwithAdmDenim = async (input: RoyalityReportSchema) => {
  try {

    const {
      otherthanadmdenim,
      Admdenim,
      product,
      brand,
      salesContract,
      customer,
      pageno = 1,
      perPage = 10,
      fromDate,
      toDate,
      order_status,
      royality_approval,
      productgroup,
      customergroup,
      brandgroup,
    } = input

    const limit = perPage;
    const skipCount = (pageno - 1) * limit;

    //  Group condition setter
    const groupId: any = {};
    const shouldGroup = productgroup || brandgroup || customergroup;

    if (productgroup) groupId.product = '$product';
    if (brandgroup) groupId.brand = '$brand';
    if (customergroup) groupId.customer = '$customer';


    // royality match stage
    const matchStage: any = { isDeleted: false };


    if (fromDate && toDate) {
      matchStage.saletaxinvoicedate = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    }

    if (product?.length > 0) {
      matchStage.product = new mongoose.Types.ObjectId(product[0]);
    }

    if (brand?.length > 0) {
      matchStage.brand = new mongoose.Types.ObjectId(brand[0]);
    }

    if (customer?.length > 0) {
      matchStage.customer = new mongoose.Types.ObjectId(customer[0]);
    }


    if (Admdenim) matchStage['InHouse'] = true;
    if (otherthanadmdenim) matchStage['InHouse'] = false;


    const scMatchStage: any = { isDeleted: false };
    if (royality_approval == 'true')
      scMatchStage['salesContracts.royality_approval'] = true;
    if (royality_approval == 'false')
      scMatchStage['salesContracts.royality_approval'] = false;

    // const scMatchStage2: any = { isDeleted: false };
    if (order_status == 'confirmed')
      scMatchStage['salesContracts.order_status'] = 'confirmed';
    if (order_status == 'forecast')
      scMatchStage['salesContracts.order_status'] = 'forecast';


    const basePipeline: any[] = [
      {
        $match: matchStage
      },
      {

        $lookup: {
          from: 'returns',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'returns',

        }
      },
      {
        $unwind: {
          path: "$returns",
          preserveNullAndEmptyArrays: true
        }
      },

      {
        $lookup: {
          from: "salescontracts",
          localField: "salesContract",
          foreignField: "_id",
          as: "salesContracts"
        }
      },
      {
        $unwind: {
          path: "$salesContracts",
          preserveNullAndEmptyArrays: true
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
          preserveNullAndEmptyArrays: true
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
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "invoicedtls",
          localField: "invoice",
          foreignField: "invoice",
          as: "invoicedtls"
        }
      },
      {
        $unwind: {
          path: "$invoicedtls",
          preserveNullAndEmptyArrays: true
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
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {


          contract: "$salesContracts.contract",
          salesTaxInvoiceNo: 1,
          royalityRate: '$royalityrate',
          saleTaxInvoiceDate: "$saletaxinvoicedate",
          customer: "$customers.name",
          product: "$products.name",
          payemntDate: "$paymentDate",
          paid: "$paid",
          brand: "$brands.name",
          invoiceRate: "$invoicedtls.rate",
          invoiceQty: "$invoicedtls.qty",
          invoiceAmount: "$invoicedtls.amount",
          royalityAmount: "$amount",
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
                $ifNull: ['$invoicedtls.qty', 0],
              },
              {
                $ifNull: ['$returns.actualQty', 0],
              },
            ],
          },
          netAmount: {
            $subtract: [
              {
                $ifNull: ['$invoicedtls.amount', 0],
              },
              {
                $ifNull: ['$returns.actualAmount', 0],
              },
            ],
          },

        }
      },
      {
        $sort: {
          _id: -1,
          saletaxinvoicedate: -1
        }
      }
    ]
    const basePipelineSummary: any[] = [
      {
        $match: matchStage
      },
      {

        $lookup: {
          from: 'returns',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'returns',

        }
      },
      {
        $unwind: {
          path: "$returns",
          preserveNullAndEmptyArrays: true
        }
      },

      {
        $lookup: {
          from: "salescontracts",
          localField: "salesContract",
          foreignField: "_id",
          as: "salesContracts"
        }
      },
      {
        $unwind: {
          path: "$salesContracts",
          preserveNullAndEmptyArrays: true
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
          preserveNullAndEmptyArrays: true
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
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "invoicedtls",
          localField: "invoice",
          foreignField: "invoice",
          as: "invoicedtls"
        }
      },
      {
        $unwind: {
          path: "$invoicedtls",
          preserveNullAndEmptyArrays: true
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
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {


          contract: "$salesContracts.contract",
          salesTaxInvoiceNo: 1,
          royalityRate: '$royalityrate',
          saleTaxInvoiceDate: "$saletaxinvoicedate",
          customer: "$customers.name",
          product: "$products.name",
          payemntDate: "$paymentDate",
          paid: "$paid",
          brand: "$brands.name",
          invoiceRate: "$invoicedtls.rate",
          invoiceQty: "$invoicedtls.qty",
          invoiceAmount: "$invoicedtls.amount",
          royalityAmount: "$amount",
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
                $ifNull: ['$invoicedtls.qty', 0],
              },
              {
                $ifNull: ['$returns.actualQty', 0],
              },
            ],
          },
          netAmount: {
            $subtract: [
              {
                $ifNull: ['$invoicedtls.amount', 0],
              },
              {
                $ifNull: ['$returns.actualAmount', 0],
              },
            ],
          },

        }
      },
      {
        $sort: {
          _id: -1,
          saletaxinvoicedate: -1
        }
      }
    ]
    const sortStage = { $sort: { totalInvoiceQtySum: -1 } };

    const groupStage = {
      $group: {
        _id: groupId,
        product: {
          $first: "$product"
        },

        brand: {
          $first: "$brand"
        },
        customer: {
          $first: "$customer"
        },
        totalInvoiceQtySum: {
          $sum: "$invoiceQty"
        },
        totalInvoiceAmountSum: {
          $sum: "$invoiceAmount"
        },
        totalRoyalityAmountSum: {
          $sum: "$royalityAmount"
        },
        totalReturnQty: { $sum: '$returnQty' },
        totalReturnAmount: { $sum: '$returnAmount' },
        totalBalance: { $sum: '$balance' },
        totalNetQty: { $sum: '$netQty' },
        totalNetAmount: { $sum: '$netAmount' },

      },


    }
    const groupStageSummary = {
      $group: {
        _id: '',
        // product: {
        //   $first: "$product"
        // },

        // brand: {
        //   $first: "$brand"
        // },
        // customer: {
        //   $first: "$customer"
        // },
        totalInvoiceQtySum: {
          $sum: "$invoiceQty"
        },
        totalInvoiceAmountSum: {
          $sum: "$invoiceAmount"
        },
        totalRoyalityAmountSum: {
          $sum: "$royalityAmount"
        },
        totalReturnQty: { $sum: '$returnQty' },
        totalReturnAmount: { $sum: '$returnAmount' },
        totalBalance: { $sum: '$balance' },
        totalNetQty: { $sum: '$netQty' },
        totalNetAmount: { $sum: '$netAmount' },
      },


    }

    // If grouping is not required, we can skip the group stage
    const dataPipeline = shouldGroup
      ? [...basePipeline, groupStage, sortStage, { $skip: skipCount }, { $limit: limit }]
      : [...basePipeline, { $skip: skipCount }, { $limit: limit }]

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
            totalInvoiceQtySum: {
              $sum: "$invoiceQty"
            },
            totalInvoiceAmountSum: {
              $sum: "$invoiceAmount"
            },
            totalRoyalityAmountSum: {
              $sum: "$royalityAmount"
            },
            totalReturnQty: { $sum: '$returnQty' },
            totalReturnAmount: { $sum: '$returnAmount' },
            totalBalance: { $sum: '$balance' },
            totalNetQty: { $sum: '$netQty' },
            totalNetAmount: { $sum: '$netAmount' },
          },
        },
      ];
    // Executing the pipelines in parallel
    const [royalitydtl, totalResult, summaryResult] = await Promise.all([
      RoyalityModel.aggregate(dataPipeline, { allowDiskUse: true }),
      RoyalityModel.aggregate(countPipeline, { allowDiskUse: true }),
      RoyalityModel.aggregate(summaryPipeline, { allowDiskUse: true }),
    ]);

    // Extracting total records and summary from the results
    const totalRecords = totalResult?.[0]?.totalRecords || 0;
    const summary = summaryResult?.[0] || {
      totalInvoiceQtySum: 0,
      totalInvoiceAmountSum: 0,
      totalReturnQty: 0,
      totalReturnAmount: 0,
      totalBalance: 0,
      totalNetQty: 0,
      totalNetAmount: 0,
      totalRoyalityAmountSum: 0,
    };
    return {
      royalitydtl,
      summary,
      pagination: {
        page: pageno,
        perPage,
        totalRecords,
        totalPages: Math.ceil(totalRecords / perPage),
      },
    };
  } catch (e) {
    console.error('Error in findRoyalityDtlsByDate:', e);
    throw e;
  }

}

export const RoyalitydtlNetReportPrint = async (input: RoyalityReportSchema) => {
  try {

    const {
      otherthanadmdenim,
      Admdenim,
      product,
      brand,
      salesContract,
      customer,
      pageno = 1,
      perPage = 10,
      fromDate,
      toDate,
      order_status,
      royality_approval,
      productgroup,
      customergroup,
      brandgroup,
    } = input

    // const limit = perPage;
    // const skipCount = (pageno - 1) * limit;

    //  Group condition setter
    const groupId: any = {};
    const shouldGroup = productgroup || brandgroup || customergroup;

    if (productgroup) groupId.product = '$product';
    if (brandgroup) groupId.brand = '$brand';
    if (customergroup) groupId.customer = '$customer';


    // royality match stage
    const matchStage: any = { isDeleted: false };


    if (fromDate && toDate) {
      matchStage.saletaxinvoicedate = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    }

    if (product?.length > 0) {
      matchStage.product = new mongoose.Types.ObjectId(product[0]);
    }

    if (brand?.length > 0) {
      matchStage.brand = new mongoose.Types.ObjectId(brand[0]);
    }

    if (customer?.length > 0) {
      matchStage.customer = new mongoose.Types.ObjectId(customer[0]);
    }


    if (Admdenim) matchStage['InHouse'] = true;
    if (otherthanadmdenim) matchStage['InHouse'] = false;


    const scMatchStage: any = { isDeleted: false };
    if (royality_approval == 'true')
      scMatchStage['salesContracts.royality_approval'] = true;
    if (royality_approval == 'false')
      scMatchStage['salesContracts.royality_approval'] = false;

    // const scMatchStage2: any = { isDeleted: false };
    if (order_status == 'confirmed')
      scMatchStage['salesContracts.order_status'] = 'confirmed';
    if (order_status == 'forecast')
      scMatchStage['salesContracts.order_status'] = 'forecast';


    const basePipeline: any[] = [
      {
        $match: matchStage
      },
      {

        $lookup: {
          from: 'returns',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'returns',

        }
      },
      {
        $unwind: {
          path: "$returns",
          preserveNullAndEmptyArrays: true
        }
      },

      {
        $lookup: {
          from: "salescontracts",
          localField: "salesContract",
          foreignField: "_id",
          as: "salesContracts"
        }
      },
      {
        $unwind: {
          path: "$salesContracts",
          preserveNullAndEmptyArrays: true
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
          preserveNullAndEmptyArrays: true
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
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "invoicedtls",
          localField: "invoice",
          foreignField: "invoice",
          as: "invoicedtls"
        }
      },
      {
        $unwind: {
          path: "$invoicedtls",
          preserveNullAndEmptyArrays: true
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
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {


          contract: "$salesContracts.contract",
          salesTaxInvoiceNo: 1,
          royalityRate: '$royalityrate',
          saleTaxInvoiceDate: "$saletaxinvoicedate",
          customer: "$customers.name",
          product: "$products.name",
          payemntDate: "$paymentDate",
          paid: "$paid",
          brand: "$brands.name",
          invoiceRate: "$invoicedtls.rate",
          invoiceQty: "$invoicedtls.qty",
          invoiceAmount: "$invoicedtls.amount",
          royalityAmount: "$amount",
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
                $ifNull: ['$invoicedtls.qty', 0],
              },
              {
                $ifNull: ['$returns.actualQty', 0],
              },
            ],
          },
          netAmount: {
            $subtract: [
              {
                $ifNull: ['$invoicedtls.amount', 0],
              },
              {
                $ifNull: ['$returns.actualAmount', 0],
              },
            ],
          },

        }
      },
      {
        $sort: {
          _id: -1,
          saletaxinvoicedate: -1
        }
      }
    ]
    const basePipelineSummary: any[] = [
      {
        $match: matchStage
      },
      {

        $lookup: {
          from: 'returns',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'returns',

        }
      },
      {
        $unwind: {
          path: "$returns",
          preserveNullAndEmptyArrays: true
        }
      },

      {
        $lookup: {
          from: "salescontracts",
          localField: "salesContract",
          foreignField: "_id",
          as: "salesContracts"
        }
      },
      {
        $unwind: {
          path: "$salesContracts",
          preserveNullAndEmptyArrays: true
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
          preserveNullAndEmptyArrays: true
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
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "invoicedtls",
          localField: "invoice",
          foreignField: "invoice",
          as: "invoicedtls"
        }
      },
      {
        $unwind: {
          path: "$invoicedtls",
          preserveNullAndEmptyArrays: true
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
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {


          contract: "$salesContracts.contract",
          salesTaxInvoiceNo: 1,
          royalityRate: '$royalityrate',
          saleTaxInvoiceDate: "$saletaxinvoicedate",
          customer: "$customers.name",
          product: "$products.name",
          payemntDate: "$paymentDate",
          paid: "$paid",
          brand: "$brands.name",
          invoiceRate: "$invoicedtls.rate",
          invoiceQty: "$invoicedtls.qty",
          invoiceAmount: "$invoicedtls.amount",
          royalityAmount: "$amount",
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
                $ifNull: ['$invoicedtls.qty', 0],
              },
              {
                $ifNull: ['$returns.actualQty', 0],
              },
            ],
          },
          netAmount: {
            $subtract: [
              {
                $ifNull: ['$invoicedtls.amount', 0],
              },
              {
                $ifNull: ['$returns.actualAmount', 0],
              },
            ],
          },

        }
      },
      {
        $sort: {
          _id: -1,
          saletaxinvoicedate: -1
        }
      }
    ]
    const sortStage = { $sort: { totalInvoiceQtySum: -1 } };
    const groupStage = {
      $group: {
        _id: groupId,
        product: {
          $first: "$product"
        },

        brand: {
          $first: "$brand"
        },
        customer: {
          $first: "$customer"
        },
        totalInvoiceQtySum: {
          $sum: "$invoiceQty"
        },
        totalInvoiceAmountSum: {
          $sum: "$invoiceAmount"
        },
        totalRoyalityAmountSum: {
          $sum: "$royalityAmount"
        },
        totalReturnQty: { $sum: '$returnQty' },
        totalReturnAmount: { $sum: '$returnAmount' },
        totalBalance: { $sum: '$balance' },
        totalNetQty: { $sum: '$netQty' },
        totalNetAmount: { $sum: '$netAmount' },

      },


    }
    const groupStageSummary = {
      $group: {
        _id: '',
        // product: {
        //   $first: "$product"
        // },

        // brand: {
        //   $first: "$brand"
        // },
        // customer: {
        //   $first: "$customer"
        // },
        totalInvoiceQtySum: {
          $sum: "$invoiceQty"
        },
        totalInvoiceAmountSum: {
          $sum: "$invoiceAmount"
        },
        totalRoyalityAmountSum: {
          $sum: "$royalityAmount"
        },
        totalReturnQty: { $sum: '$returnQty' },
        totalReturnAmount: { $sum: '$returnAmount' },
        totalBalance: { $sum: '$balance' },
        totalNetQty: { $sum: '$netQty' },
        totalNetAmount: { $sum: '$netAmount' },
      },


    }

    // If grouping is not required, we can skip the group stage
    const dataPipeline = shouldGroup
      ? [...basePipeline, groupStage, sortStage]
      : [...basePipeline, sortStage]

    // Count pipeline for total records
    // const countPipeline = shouldGroup 
    // ? [...basePipeline, groupStage, { $count: 'totalRecords' }]
    // : [...basePipeline, { $count: 'totalRecords' }];


    // Summary pipeline for total records
    const summaryPipeline = shouldGroup
      ? [...basePipelineSummary, groupStageSummary]
      : [
        ...basePipelineSummary,
        {
          $group: {
            _id: null,
            totalInvoiceQtySum: {
              $sum: "$invoiceQty"
            },
            totalInvoiceAmountSum: {
              $sum: "$invoiceAmount"
            },
            totalRoyalityAmountSum: {
              $sum: "$royalityAmount"
            },
            totalReturnQty: { $sum: '$returnQty' },
            totalReturnAmount: { $sum: '$returnAmount' },
            totalBalance: { $sum: '$balance' },
            totalNetQty: { $sum: '$netQty' },
            totalNetAmount: { $sum: '$netAmount' },
          },
        },
      ];
    // Executing the pipelines in parallel
    const [royalitydtl, summaryResult] = await Promise.all([
      RoyalityModel.aggregate(dataPipeline, { allowDiskUse: true }),
      // RoyalityModel.aggregate(countPipeline, { allowDiskUse: true }),
      RoyalityModel.aggregate(summaryPipeline, { allowDiskUse: true }),
    ]);

    // Extracting total records and summary from the results
    // const totalRecords = totalResult?.[0]?.totalRecords || 0;
    const summary = summaryResult?.[0] || {
      totalInvoiceQtySum: 0,
      totalInvoiceAmountSum: 0,
      totalReturnQty: 0,
      totalReturnAmount: 0,
      totalBalance: 0,
      totalNetQty: 0,
      totalNetAmount: 0,
      totalRoyalityAmountSum: 0,
    };
    return {
      royalitydtl,
      summary,
      // pagination: {
      //   page: pageno,
      //   perPage,
      //   totalRecords,
      //   totalPages: Math.ceil(totalRecords / perPage),
      // },
    };
  } catch (e) {
    console.error('Error in findRoyalityDtlsByDate:', e);
    throw e;
  }

}