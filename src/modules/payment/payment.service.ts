import mongoose from 'mongoose';
import { Payment, PaymentModel } from './payment.model';
import {
  CreatePaymentSchema,
  ExtraPaymentDropDownSchema,
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
import { ShipmentDtlModel } from '../shipment/shipment_dtls.model';
import { ProductModel } from '../product/product.model';
//import { customerSchemas } from '../customer/customer.schema';
//import dayjs = require('dayjs');
//import dayjs from 'dayjs';

export const createPayment = async (input: CreatePaymentSchema) => {
  const { id, paymentRecieveDate, cheaqueNo, invoice, specialInstruction } =input

  const Invoice = await InvoiceModel.findOne({ _id: invoice });
  const salecontract = await SalesContractModel.findOne({
    _id: Invoice?.salesContract,
  });
  const customer_find = await SalesContractModel.find({_id:Invoice?.salesContract})
const customerobjectid = customer_find[0].customer;

  if (customerobjectid instanceof mongoose.Types.ObjectId) {

    if (customerobjectid.equals( new mongoose.Types.ObjectId('648d7c960cee8c1de3294415'))) {
      const payment = await PaymentModel.create({
        id,
        paymentRecieveDate,
        cheaqueNo,
        invoice: new mongoose.Types.ObjectId(invoice),
        salesContract: new mongoose.Types.ObjectId(Invoice?.salesContract),
        contract: salecontract?.contract,
        specialInstruction,
        adm_payment:true
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
      const invoiceDetails = await InvoiceDtlModel.updateOne(
        { invoice: invoice },
        {
          payment: true,
        }
      );
    
      return payment;
    }
    else {
      console.log("Customer is non-ADM");
      const payment = await PaymentModel.create({
        id,
        paymentRecieveDate,
        cheaqueNo,
        invoice: new mongoose.Types.ObjectId(invoice),
        salesContract: new mongoose.Types.ObjectId(Invoice?.salesContract),
        contract: salecontract?.contract,
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
      const invoiceDetails = await InvoiceDtlModel.updateOne(
        { invoice: invoice },
        {
          payment: true,
        }
      );
      
      return payment;
    }
  }
  else{
    console.log("customerobjectid is not an ObjectId");
    return ("customerobjectid is not an ObjectId")
  
  }
};

export const updatePaymentById = async (
  id: string,
  input: CreatePaymentSchema
) => {
  const { paymentRecieveDate, cheaqueNo, invoice, specialInstruction } = input;

  const payment = await PaymentModel.findOne({ _id: id });
  return PaymentModel.findByIdAndUpdate(id, {
    paymentRecieveDate,
    cheaqueNo,
    invoice: new mongoose.Types.ObjectId(invoice),
    specialInstruction,
    adm_payment:payment?.adm_payment
  
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

  const searchQuery = new RegExp(`^${input?.contract}`, 'i');

  const paymentrecord = await PaymentModel.find({
    contract: searchQuery,
    isDeleted: false,
  });

  if (input.contract !== '') {
    const payment = await PaymentModel.aggregate([
      {
        $match: {
          isDeleted: false,
          contract: searchQuery,
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
          as: 'salesContract',
        },
      },
      { $skip: skipCount },
      { $limit: limit },
      { $sort: { id: 1 } },
    ]);
    const result = {
      payment: payment,
      total_records: paymentrecord.length,
    };
    return result;
  } else {
    const payment = await PaymentModel.aggregate([
      {
        $match: {
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
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContract',
        },
      },
      { $skip: skipCount },
      { $limit: limit },
      { $sort: { id: 1 } },
    ]);
    const result = {
      payment: payment,
      total_records: paymentrecords,
    };
    return result;
  }
  // const payement = await PaymentModel.find({ isDeleted: false })
  //   .populate({
  //     path: 'invoice',
  //     model: InvoiceModel,
  //     populate: [{ path: 'salesContract', model: SalesContractModel }],
  //   })
  //   .limit(limit)
  //   .skip(skipCount)
  //   .sort({ id: 1 });

  // const result = {
  //   payment_dtl: payement,
  //   total_Records: paymentrecords,
  // };
  // return result;
};

export const findextraPayement = async (input:ExtraPaymentDropDownSchema) => {
  const limit = input?.limit;
  const searchQuery = new RegExp(`^${input?.salesTaxInvoiceNo}`, 'i');
 
  if(input.record == true){
    console.log("true condition");
const payment = await PaymentModel.aggregate([
  {
    $match: {
      isDeleted: false,
      royality: false,
       
    }
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
      from: "salescontractdtls",
      localField: "salesContract",
      foreignField: "salesContract",
      as: "salesContractDetailData",
      pipeline: [
        {
          $match: {
            // invoice: true,
            // shipment: true
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
            from: "brands",
            localField: "brand",
            foreignField: "_id",
            as: "brandData"
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
            from: "shipmentdtls",
            localField: "salesContract",
            foreignField: "salesContract",
            as: "shipmentDetailData"
          }
        }
      ]
    }
  },
  {
    $lookup: {
      from: "invoices",
      localField: "invoice",
      foreignField: "_id",
      as: "invoice",
      pipeline: [
        {
          $match: {
            payment: true
          }
        }
      ]
    }
  },
  {
    $project: {
      paymentRecieveDate: 1,
      salesContractData: 1,
      invoice: 1,
      customer: {
        $first:
          "$salesContractDetailData.customerData"
      },
      brand: {
        $first:
          "$salesContractDetailData.brandData"
      },
      royalityRate: {
        $first:
          "$salesContractDetailData.shipmentDetailData.royaltyRate"
      },
      saleTaxInvoiceNumber: {
        $first: "$invoice.salesTaxInvoiceNo"
      },
      saleTaxInvoiceDate: {
        $first: "$invoice.date"
      }
    }
  }
]

)
const result={
  payment: payment,
  total_recordds:payment.length
  }
  return result
 }
 else if(input.salesTaxInvoiceNo == ''){
  console.log("without name");
  const limit = input?.limit;
  const payment = await PaymentModel.aggregate([
    {
      $match: {
        isDeleted: false,
        royality: false
      }
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
        from: "salescontractdtls",
        localField: "salesContract",
        foreignField: "salesContract",
        as: "salesContractDetailData",
        pipeline: [
          {
            $match: {
              invoice: true,
              // shipment: true
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
              from: "brands",
              localField: "brand",
              foreignField: "_id",
              as: "brandData"
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
              from: "shipmentdtls",
              localField: "salesContract",
              foreignField: "salesContract",
              as: "shipmentDetailData"
            }
          }
        ]
      }
    },
    {
      $lookup: {
        from: "invoices",
        localField: "invoice",
        foreignField: "_id",
        as: "invoice",
        pipeline: [
          {
            $match: {
              payment: true
            }
          }
        ]
      }
    },
    {
      $project: {
        paymentRecieveDate: 1,
        salesContractData: 1,
        invoice: 1,
        customer: {
          $first:
            "$salesContractDetailData.customerData"
        },
        brand: {
          $first:
            "$salesContractDetailData.brandData"
        },
        royalityRate: {
          $first:
            "$salesContractDetailData.shipmentDetailData.royaltyRate"
        },
        saleTaxInvoiceNumber: {
          $first: "$invoice.salesTaxInvoiceNo"
        },
        saleTaxInvoiceDate: {
          $first: "$invoice.date"
        }
      }
    },
    {$limit:limit}
  ]
  
  )
const result={
payment: payment,
total_recordds:payment.length
}
return result
 }
 else if(input.salesTaxInvoiceNo !== ''){
  console.log("saletax invoice");
  const payment = await PaymentModel.aggregate([
    {
      $match: {
        isDeleted: false,
        royality: false
      }
    },
    {
      $lookup: {
        from: "invoices",
        let: { invoiceId: "$invoice" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$_id", "$$invoiceId"] },
                  { $eq: ["$payment", true] },
                  {
                    $regexMatch: {
                      input: "$salesTaxInvoiceNo",
                      regex: "398"
                    }
                  }
                ]
              }
            }
          }
        ],
        as: "invoice"
      }
    },
    {
      $match: {
        "invoice.0": { $exists: true }
      }
    },
    {
      $unwind: {
        path: "$invoice",
        preserveNullAndEmptyArrays: false
      }
    },
    {
      $lookup: {
        from: "salescontractdtls",
        localField: "salesContract",
        foreignField: "salesContract",
        as: "salesContractDetailData",
        pipeline: [
          {
            $match: {
              invoice: true,
              // shipment: true
            }
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
              from: "customers",
              localField: "customer",
              foreignField: "_id",
              as: "customerData"
            }
          },
          {
            $lookup: {
              from: "brands",
              localField: "brand",
              foreignField: "_id",
              as: "brandData"
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
              from: "shipmentdtls",
              localField: "salesContract",
              foreignField: "salesContract",
              as: "shipmentDetailData"
            }
          }
        ]
      }
    },
    {
      $project: {
        paymentRecieveDate: 1,
        invoice: 1,
        customer: { $arrayElemAt: ["$salesContractDetailData.customerData", 0] },
        brand: { $arrayElemAt: ["$salesContractDetailData.brandData", 0] },
        shipmentData: { $arrayElemAt: ["$salesContractDetailData.shipmentDetailData", 0] },
        salesContractData: { $arrayElemAt: ["$salesContractDetailData.salesContractData", 0] }
      }
    },
    { $limit: limit }
  ]);
  
  
  const result={
    payment: payment,
    total_recordds:payment.length
    }
    return result
  
  
  
 }
 else{
  console.log("else");
const payment =await PaymentModel.aggregate([
  {
    $match: {
      isDeleted: false,
      royality: false
    }
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
      from: "salescontractdtls",
      localField: "salesContract",
      foreignField: "salesContract",
      as: "salesContractDetailData",
      pipeline: [
        {
          $match: {
            invoice: true,
            // shipment: true
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
            from: "brands",
            localField: "brand",
            foreignField: "_id",
            as: "brandData"
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
            from: "shipmentdtls",
            localField: "salesContract",
            foreignField: "salesContract",
            as: "shipmentDetailData"
          }
        }
      ]
    }
  },
  {
    $lookup: {
      from: "invoices",
      localField: "invoice",
      foreignField: "_id",
      as: "invoice",
      pipeline: [
        {
          $match: {
            payment: true
          }
        }
      ]
    }
  },
  {
    $project: {
      paymentRecieveDate: 1,
      salesContractData: 1,
      invoice: 1,
      customer: {
        $first:
          "$salesContractDetailData.customerData"
      },
      brand: {
        $first:
          "$salesContractDetailData.brandData"
      },
      royalityRate: {
        $first:
          "$salesContractDetailData.shipmentDetailData.royaltyRate"
      },
      saleTaxInvoiceNumber: {
        $first: "$invoice.salesTaxInvoiceNo"
      },
      saleTaxInvoiceDate: {
        $first: "$invoice.date"
      }
    }
  }
])
const result={
  payment: payment,
  total_recordds:payment.length
  }
  return result
 }
 
  // const payement = await PaymentModel.find({
  //   isDeleted: false,
  //   royality: false,
  // }).populate({
  //   path: 'invoice',
  //   model: InvoiceModel,
  //   populate: {
  //     path: 'salesContract',
  //     model: SalesContractModel,
  //     populate: [
  //       {
  //         path: 'customer',
  //         model: CustomerModel,
  //       },
  //       {
  //         path: 'product',
  //         model: ProductModel,
  //       },
  //       {
  //         path:'shipmentdtls',
  //         model: ShipmentDtlModel,
  //       },
  //       {
  //         path: 'brand',
  //         model: BrandModel,
  //       },
  //       {
  //         path: 'paymentTerm',
  //         model: PaymentTermModel,
  //       },
  //     ],
  //   },
  // });


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
export const findPayementbyId =async(id:string)=>{
  const payment = await PaymentModel.aggregate([
    {
      $match:{
        _id:new mongoose.Types.ObjectId(id),
        isDeleted:false
      }
    },
    {
      $lookup:{
        from:'salescontracts',
        localField:'salesContract',
        foreignField:'_id',
        as:'salescontract',
        pipeline:[
          {
            $lookup:{
              from:'salescontractdtls',
              localField:'_id',
              foreignField:'salesContract',
              as:'salesContract_Detalis'
            }
          }
        ]
      }
    },
    {
      $lookup:{
        from:'invoices',
        localField:'invoice',
        foreignField:'_id',
        as:'invoice',
        pipeline:[
          {
            $lookup:{
              from:'invoicedtls',
              localField:'_id',
              foreignField:'invoice',
              as:'invoice_Detalis'
            }
          }

        ]
      }
    },
  ])
  console.log(payment , 'payment details');
return payment


}

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
