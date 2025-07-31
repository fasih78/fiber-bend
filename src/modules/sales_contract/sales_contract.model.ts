import { getModelForClass, prop, Ref, pre } from '@typegoose/typegoose';
import { BrandModel } from '../brand/brand.model';
import { CurrencyModel } from '../currency/currency.model';
import { CustomerModel } from '../customer/customer.model';
import { PaymentTermModel } from '../payment_term/payment_term.model';
import { ProductModel } from '../product/product.model';
import { SalesContractDtlModel } from './sales_contract_dtl.model';
import { ShipViaModel } from '../shipvia/shipvia.model';
import { boolean } from 'zod';
//import { InvoiceModel } from '../invoice/invoice.model';
// @pre<SalesContract>('findOneAndDelete', async function () {
//   const instance = (await this) as SalesContract;

//   for (const id of instance.salesContractDtl)
//     await SalesContractDtlModel.findByIdAndDelete(id);
// })
// @pre<SalesContract>('deleteMany', async function () {
//   const instance = (await this) as SalesContract;

//   for (const id of instance.salesContractDtl)
//     await SalesContractDtlModel.findByIdAndDelete(id);
// })
export class SalesContract {
  @prop({
    type: Number,
    default: 1,
  })
  tran: number;
  @prop({
    type: Number,
  })
  salesTaxInvoiceNo: number;
  @prop({
    type: Date,
  })
  date: Date;

  @prop({
    type: String,
  })
  po: string;

  @prop({
    type: String,
    unique: true,
  })
  contract: string;

  @prop({
    type: String,
  })
  specialInstruction: string;

  @prop({
    type: Boolean,
  })
  invoice: boolean;
  

  @prop({
    type: Boolean,
    default: false,
  })
  isDeleted: boolean;

  @prop({
    type: Date,
  })
  poDate: Date;

  @prop({
    type: Date,
  })
  contractDate: Date;
  @prop({
    type: String,
  })
  tc_no: string;
  @prop({
    type: String,
  })
  vendorgarment: string;

  @prop({
    type: Boolean,
  })
  shipment: boolean;
  @prop({
    type: Boolean,
  })
  royality: boolean;

  @prop({
    type: Boolean,
    default: false,
  })
  InHouse: boolean;

  @prop({
    type: Boolean,
  })
  royality_nonadm: boolean;
  
  @prop({
    type: String,
  })
  order_status: string;

  @prop({
    type:Boolean
  })
  royality_approval:boolean
  // royality for other than adm denim but only for group qty purpose of adm denim"
  @prop({ ref: () => CustomerModel })
  customer: Ref<typeof CustomerModel>;

  @prop({ ref: () => BrandModel })
  brand: Ref<typeof BrandModel>;

  @prop({ ref: () => PaymentTermModel })
  paymentTerm: Ref<typeof PaymentTermModel>;

  @prop({ ref: () => ShipViaModel })
  shipvia: Ref<typeof ShipViaModel>;
}

export const SalesContractModel = getModelForClass(SalesContract, {
  schemaOptions: {
    timestamps: true,
  },
});
