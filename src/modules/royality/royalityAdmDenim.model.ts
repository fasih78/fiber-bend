import { getModelForClass, prop, Ref } from '@typegoose/typegoose';
import { SalesContractModel } from '../sales_contract/sales_contract.model';
import { CustomerModel } from '../customer/customer.model';

export class RoyalityAdm {
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
    type: Number,
  })
  salesTaxInvoiceNo: number;

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
    type: Number,
    default: false,
  })
  royalityrate: number;

  @prop({ ref: () => CustomerModel })
  customer: Ref<typeof CustomerModel>;

  @prop({ ref: () => SalesContractModel })
  salesContract: Ref<typeof SalesContractModel>;
}

export const RoyalityAdmModel = getModelForClass(RoyalityAdm, {
  schemaOptions: {
    timestamps: true,
  },
});
