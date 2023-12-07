import mongoose from 'mongoose';
import { Payment, PaymentModel } from './payment.model';
import {
  CreatePaymentSchema,
  PaymentPaginationSchema,
  PaymentReportSchema,
  payementSchema,
} from './payement.schema';
import { Invoice, InvoiceModel } from '../invoice/invoice.model';
import { SalesContractModel } from '../sales_contract/sales_contract.model';
import { CustomerModel } from '../customer/customer.model';
import { BrandModel } from '../brand/brand.model';
import { PaymentTermModel } from '../payment_term/payment_term.model';
import { SalesContractDtlModel } from '../sales_contract/sales_contract_dtl.model';
import { RoyalityModel } from '../royality/royality.model';
import momentTimezone = require('moment-timezone');
import { InvoiceDtlModel } from '../invoice/invoice_dtl.model';
momentTimezone.tz.setDefault('Asia/Karachi');
import moment = require('moment');
//import { customerSchemas } from '../customer/customer.schema';
//import dayjs = require('dayjs');
//import dayjs from 'dayjs';

export const createPayment = async (input: CreatePaymentSchema) => {
  const { id, paymentRecieveDate, cheaqueNo, invoice, specialInstruction } =
    input;

  const payment = await PaymentModel.create({
    id,
    paymentRecieveDate,
    cheaqueNo,
    invoice: new mongoose.Types.ObjectId(invoice),
    specialInstruction,
  });
  console.log(paymentRecieveDate);
  const payement1 = await PaymentModel.find({
    invoice: invoice,
    isDeleted: false,
  });
  // const payment2= await InvoiceModel.findByIdAndUpdate(invoice,{
  //   payment:true,
  // });

  for (let payment of payement1) {
    const dtl = await PaymentModel.find({ invoice: payment._id });
    if (dtl) {
      const payment = await InvoiceModel.findByIdAndUpdate(invoice, {
        payment: true,
      });
    }
  }
  const invoiceDetails = await InvoiceDtlModel.updateMany(
    { invoice: invoice },
    {
      payment: true,
    }
  );

  return payment;
};

export const updatePaymentById = async (
  id: string,
  input: CreatePaymentSchema
) => {
  const { paymentRecieveDate, cheaqueNo, invoice, specialInstruction } = input;

  return PaymentModel.findByIdAndUpdate(id, {
    paymentRecieveDate,
    cheaqueNo,
    invoice: new mongoose.Types.ObjectId(invoice),
    specialInstruction,
  });
};

export const deletePayment = async () => {
  await PaymentModel.deleteMany({});
  return await PaymentModel.deleteMany({});
};

export const deletePaymentById = async (id: string) => {
  //await PaymentModel.deleteMany({payement:id})

  const payment = await PaymentModel.findById(id);

  const sales = await InvoiceModel.findByIdAndUpdate(payment?.invoice, {
    payment: false,
  });
  const salesdtl = await InvoiceDtlModel.updateOne(
    { invoice: payment?.invoice },
    {
      payment: false,
    }
  );
  const delete1 = await PaymentModel.findByIdAndUpdate(id, { isDeleted: true });

  return payment;
};
export const findPayement = async (input: PaymentPaginationSchema) => {
  const limit = input.perPage;
  const skipCount = (input.pageno - 1) * limit;

  const paymentrecords = await PaymentModel.countDocuments();
  const payement = await PaymentModel.find({ isDeleted: false })
    .populate({
      path: 'invoice',
      model: InvoiceModel,
      populate: [{ path: 'salesContract', model: SalesContractModel }],
    })
    .limit(limit)
    .skip(skipCount)
    .sort({ id: 1 });

  const result = {
    payment_dtl: payement,
    total_Records: paymentrecords,
  };
  return result;
};

export const findextraPayement = async () => {
  const payement = await PaymentModel.find({
    isDeleted: false,
    royality: false,
  }).populate({
    path: 'invoice',
    model: InvoiceModel,
    populate: {
      path: 'salesContract',
      model: SalesContractModel,
      populate: [
        {
          path: 'customer',
          model: CustomerModel,
        },
        {
          path: 'brand',
          model: BrandModel,
        },
        {
          path: 'paymentTerm',
          model: PaymentTermModel,
        },
      ],
    },
  });

  return payement;
};

export const findPayementDtlsByDate = async (input: PaymentReportSchema) => {
  if (input.invoice == '') {
    return await PaymentModel.find({
      paymentRecieveDate: {
        $gte: moment(input.fromDate).startOf('date').format('YYYY-MM-DD'),
        $lte: moment(input.toDate).endOf('date').format('YYYY-MM-DD'),
      },
      isDeleted: false,
    }).populate({
      path: 'invoice',
      model: InvoiceModel,
      populate: [{ path: 'salesContract', model: SalesContractModel }],
    });
  } else {
    console.log({
      invoice: input.invoice,
    });
    return await PaymentModel.find({
      invoice: input.invoice,
      isDeleted: false,
      paymentRecieveDate: {
        $gte: moment(input.fromDate).startOf('date').format('YYYY-MM-DD'),
        $lte: moment(input.toDate).endOf('date').format('YYYY-MM-DD'),
      },
    }).populate({
      path: 'invoice',
      model: InvoiceModel,
      populate: [{ path: 'salesContract', model: SalesContractModel }],
    });
  }

  // let where: any = {
  //   paymentRecieveDate: {
  //     $gte: moment(input.fromDate).startOf('date').format('YYYY-MM-DD'),
  //     $lte: moment(input.toDate).endOf('date').format('YYYY-MM-DD'),
  //   },
  // };
  // let datoo = { where };
  // if (input?.invoice != '') {
  //   where.invoice = input.invoice;
  // }
  // console.log(datoo);
  // const payment = await PaymentModel.find({ where, isDeleted: false });
  // console.log('paymnent', payment);
  // const payement1 = await PaymentModel.find({
  //   isDeleted: false,
  //   datoo,
  // }).populate({
  //   path: 'invoice',
  //   model: InvoiceModel,
  //   populate: [{ path: 'salesContract', model: SalesContractModel }],
  // });
  // console.log('payment', payement1);
  // return payement1;
};

export const getNewPaymentId = async () => {
  const payment = await PaymentModel.findOne()
    .sort({ field: 'asc', _id: -1 })
    .limit(1);

  let newId: number = 1;
  if (payment != null) {
    newId = payment.id + 1;
  }

  return newId;
};

// export const royalitynotpayment = async () => {
//   const royality = await RoyalityModel.find({
//     isDeleted: false,
//     paid: true,
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

//   return royality;
// };
