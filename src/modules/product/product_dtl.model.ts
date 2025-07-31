import { getModelForClass, prop, Ref } from '@typegoose/typegoose';
import { CurrencyModel } from '../currency/currency.model';
import { ProductModel } from './product.model';

export class ProductDtl {
    @prop({
        type: Number,
        default: 1,
      })
      product_id: number;


      @prop({
        type: Boolean,
        default: false
      })
      isDeleted: boolean;
      @prop({
        type: Number,
      })
      royaltyRate: number;

      @prop({
        type:String
      })
      suppliercode:string

      @prop({
        type:String
      })
      producttype:string
      @prop({
        type: Date,
      })
      date: Date;

      // @prop({ ref: () => CurrencyModel })
      // currency: Ref<typeof CurrencyModel>;
      @prop({ ref: () => ProductModel })
      product: Ref<typeof ProductModel>;

}
export const ProductDtlModel = getModelForClass(ProductDtl, {
    schemaOptions: {
      timestamps: true,
    },
  });