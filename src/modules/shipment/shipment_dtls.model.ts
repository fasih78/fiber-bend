import { getModelForClass, prop, Ref } from '@typegoose/typegoose';
import { ShipmentModel } from './shipment.model';
import { ProductModel } from '../product/product.model';
import { CurrencyModel } from '../currency/currency.model';
import { CustomerModel } from '../customer/customer.model';
import { SalesContractModel } from '../sales_contract/sales_contract.model';
import { BrandModel } from '../brand/brand.model';

export class ShipmentDtl {
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
  gpNumber: string;
  @prop({
    type: String,
  })
  dcNumber: string;

  // @prop({
  //   type: Number,
  // })
  // exchangeRate: number;

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
  })
  shipment_no: number;
  @prop({
    type: Date,
  })
  gpDate: Date;
  @prop({
    type: Boolean,
    default:false
  })
  adm_ship: boolean;

  @prop({
    type: String,
  })
  supplierCode: string;
  
  @prop({
    type: Number,
  })
  royaltyRate: number;

  @prop({
    type: Boolean,
    default:false
  })
  return: boolean;

  @prop({ ref: () => CustomerModel })
  customer: Ref<typeof CustomerModel>;

  @prop({ ref: () => ProductModel })
  product: Ref<typeof ProductModel>;

  @prop({ ref: () => CurrencyModel })
  currency: Ref<typeof CurrencyModel>;

  @prop({ ref: () => ShipmentModel })
  shipment: Ref<typeof ShipmentModel>;
  
  @prop({ ref: () => BrandModel })
  brand: Ref<typeof BrandModel>;
  
  @prop({ ref: () => SalesContractModel })
  salesContract: Ref<typeof SalesContractModel>;
}

export const ShipmentDtlModel = getModelForClass(ShipmentDtl, {
  schemaOptions: {
    timestamps: true,
  },
});
