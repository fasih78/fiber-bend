import { getModelForClass, prop, Ref } from '@typegoose/typegoose';
import { CurrencyModel } from '../currency/currency.model';
import { ProductModel } from '../product/product.model';
import { SalesContractModel } from './sales_contract.model';
import { CustomerModel } from '../customer/customer.model';
import { BrandModel } from '../brand/brand.model';
import { boolean } from 'zod';

export class SalesContractDtl {
  @prop({
    type: Number,
    default: 1,
  })
  tran: number;
  @prop({
    type: Date,
  })
  contractDate: Date;

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
    type: String,
  })
  uom: string;

  @prop({
    type: Boolean,
    default: false,
  })
  isDeleted: boolean;

  @prop({
    type: Date,
  })
  shipmentDate: Date;

  @prop({
    type: Number,
  })
  exchangeRate: number;
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
  invoice: boolean;
  @prop({
    type: String,
  })
  order_status: string;
  @prop({
    type: Boolean,
  })
  royality_nonadm: boolean;
  
  @prop({
    type:Boolean
  })
  royality_approval:boolean
 

  // royality for other than adm denim but only for group qty purpose of adm denim"
  @prop({ ref: () => ProductModel })
  product: Ref<typeof ProductModel>;

  @prop({ ref: () => CurrencyModel })
  currency: Ref<typeof CurrencyModel>;

  @prop({ ref: () => CustomerModel })
  customer: Ref<typeof CustomerModel>;

  @prop({ ref: () => SalesContractModel })
  salesContract: Ref<typeof SalesContractModel>;

  @prop({ ref: () => BrandModel })
  brand: Ref<typeof BrandModel>;
}

export const SalesContractDtlModel = getModelForClass(SalesContractDtl, {
  schemaOptions: {
    timestamps: true,
  },
});
