import { getModelForClass, prop, Ref } from '@typegoose/typegoose';
import { CurrencyModel } from '../currency/currency.model';

export class Product {
  @prop({
    type: Number,
    default: 1,
  })
  id: number;

  @prop({ type: String, unique: true})
  name: string;

  @prop({
    type: Boolean,
    default: false
  })
  isDeleted: boolean;

  @prop({
    type: String,
  })
  price: string;
  @prop({
    type: Number,
  })
  royaltyRate: number;
  @prop({
    type: Date,
  })
  date: Date;

  // @prop({ type: () => [Supplier], _id: false }) // Define it as an array of embedded Supplier objects
  // suppliercode: Supplier[];

  // @prop({ ref: () => CurrencyModel })
  // currency: Ref<typeof CurrencyModel>;
}

export const ProductModel = getModelForClass(Product, {
  schemaOptions: {
    timestamps: true,
  },
});
