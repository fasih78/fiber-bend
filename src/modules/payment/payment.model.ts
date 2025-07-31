import { getModelForClass, prop, Ref } from '@typegoose/typegoose';
import { InvoiceModel } from '../invoice/invoice.model';
import { SalesContractModel } from '../sales_contract/sales_contract.model';

export class Payment {
  @prop({
    type: Number,
    default: 1,
  })
  id: number;
  @prop({
    type: Date,
  })
  paymentRecieveDate: Date;

  @prop({
    type: String,
    default: 1,
  })
  cheaqueNo: string;

  @prop({
    type: Boolean,
    default: false,
  })
  isDeleted: boolean;
  @prop({
    type: String,
  })
  specialInstruction: string;

  @prop({
    type: String,
  })
  contract: string;

  @prop({
    type: Boolean,
    default: false,
  })
  royality: boolean;

  @prop({
    type: Boolean,
    default: false,
  })
  adm_payment: boolean;

  @prop({ ref: () => InvoiceModel })
  invoice: Ref<typeof InvoiceModel>;
  @prop({ ref: () => SalesContractModel })
  salesContract: Ref<typeof SalesContractModel>;
}
export const PaymentModel = getModelForClass(Payment, {
  schemaOptions: {
    timestamps: true,
  },
});
