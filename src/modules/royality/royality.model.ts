import { getModelForClass, prop, Ref } from '@typegoose/typegoose';
import { PaymentModel } from '../payment/payment.model';
import { InvoiceModel } from '../invoice/invoice.model';
import moment from 'moment';
import { SalesContractModel } from '../sales_contract/sales_contract.model';
import { CustomerModel } from '../customer/customer.model';
import { ProductModel } from '../product/product.model';
export class Royality {
  @prop({
    type: Number,
    default: 1,
  })
  id: number;

  @prop({
    type: Boolean,
  })
  paid: boolean;

  @prop({
    type: Date,
  })
  paymentDate: Date;

  @prop({
    type: String,
  })
  paymentDate1: string;

  @prop({
    type: Number,
  })
  amount: number;
  @prop({
    type: Date,
  })
  saletaxinvoicedate: Date;

  @prop({
    type: Boolean,
    default: false,
  })
  isDeleted: boolean;
  @prop({
    type: String,
  })
  salesTaxInvoiceNo: string;

  @prop({
    type: Number,
    default: false,
  })
  royalityrate: number;

  @prop({
    type: Boolean,
    default: false,
  })
  InHouse : boolean;


  @prop({ ref: () => PaymentModel })
  payment: Ref<typeof PaymentModel>;

  @prop({ ref: () => InvoiceModel })
  invoice: Ref<typeof InvoiceModel>;

  @prop({ ref: () => CustomerModel })
  customer: Ref<typeof CustomerModel>;

  @prop({ ref: () => SalesContractModel })
  salesContract: Ref<typeof SalesContractModel>;

  @prop({ ref: () => ProductModel })
  product: Ref<typeof ProductModel>;
}

export const RoyalityModel = getModelForClass(Royality, {
  schemaOptions: {
    timestamps: true,
  },
});
