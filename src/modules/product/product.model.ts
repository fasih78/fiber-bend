import { getModelForClass, prop, Ref } from '@typegoose/typegoose';
import { CurrencyModel } from '../currency/currency.model';

export class Product {
  @prop({
    type: Number,
    default: 1,
  })
  id: number;

  @prop({
    type: String,
  })
  name: string;

  @prop({
    type: String,
  })
  price: string;

  @prop({ ref: () => CurrencyModel })
  currency: Ref<typeof CurrencyModel>;
}

export const ProductModel = getModelForClass(Product, {
  schemaOptions: {
    timestamps: true,
  },
});
