import { getModelForClass, prop, Ref } from '@typegoose/typegoose';
import { InvoiceModel } from '../invoice/invoice.model';

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
    type: Boolean,
    default: false,
  })
  royality: boolean;

  @prop({ ref: () => InvoiceModel })
  invoice: Ref<typeof InvoiceModel>;
}
export const PaymentModel = getModelForClass(Payment, {
  schemaOptions: {
    timestamps: true,
  },
});
