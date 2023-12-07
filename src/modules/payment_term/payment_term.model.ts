import { getModelForClass, prop } from '@typegoose/typegoose';

export class PaymentTerm {
  @prop({
    type: Number,
    default: 1,
  })
  id: number;

  @prop({
    type: String,
  })
  name: string;
}

export const PaymentTermModel = getModelForClass(PaymentTerm, {
  schemaOptions: {
    timestamps: true,
  },
});
