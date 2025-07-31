import { getModelForClass, prop, Ref } from '@typegoose/typegoose';
import { CurrencyModel } from '../currency/currency.model';
import { ProductModel } from '../product/product.model';
import { InvoiceModel } from './invoice.model';
import { CustomerModel } from '../customer/customer.model';
import { SalesContractModel } from '../sales_contract/sales_contract.model';
import { BrandModel } from '../brand/brand.model';
export class InvoiceDtl {
  @prop({
    type: Number,
    default: 0,
  })
  inv: number;

  @prop({
    type: Number,
  })
  qty: number;

  @prop({
    type: Number,
  })
  rate: number;

  @prop({
    type: Number,
  })
  amount: number;

  @prop({
    type: Number,
  })
  exchangeRate: number;

  @prop({
    type: String,
  })
  uom: string;

  @prop({
    type: Boolean,
    default: false,
  })
  isDeleted: boolean;

  @prop({
    type: Number,
  })
  salesTaxRate: number;

  @prop({
    type: Number,
    default: 1,
  })
  salesTaxAmount: number;
  @prop({
    type: Boolean,
    default: false,
  })
  payment: boolean;

  @prop({
    type: Date,
  })
  date: Date;
  @prop({
    type: String,
  })
  contract: string;
  @prop({
    type: Boolean,
    default: false,
  })
  adm_invoice: boolean;

  @prop({ ref: () => ProductModel })
  product: Ref<typeof ProductModel>;

  @prop({ ref: () => CurrencyModel })
  currency: Ref<typeof CurrencyModel>;

  @prop({ ref: () => InvoiceModel })
  invoice: Ref<typeof InvoiceModel>;

  @prop({ ref: () => CustomerModel })
  customer: Ref<typeof CustomerModel>;

  @prop({ ref: () => SalesContractModel })
  salesContract: Ref<typeof SalesContractModel>;
  @prop({ ref: () => BrandModel })
  brand: Ref<typeof BrandModel>;
}

export const InvoiceDtlModel = getModelForClass(InvoiceDtl, {
  schemaOptions: {
    timestamps: true,
  },
});
