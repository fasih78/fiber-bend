import { getModelForClass, prop } from '@typegoose/typegoose';

export class Currency {
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

export const CurrencyModel = getModelForClass(Currency, {
  schemaOptions: {
    timestamps: true,
  },
});
