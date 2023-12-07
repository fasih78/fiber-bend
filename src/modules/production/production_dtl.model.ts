import { getModelForClass, prop, Ref } from '@typegoose/typegoose';
import { ProductModel } from '../product/product.model';
import { ProductionModel } from './production.model';
import { MachineModel } from '../machine/machine.model';

export class ProductionDtl {
  @prop({
    type: Date,
  })
  date: Date;

  @prop({
    type: String,
  })
  lot: string;

  @prop({
    type: String,
  })
  bales: string;

  @prop({
    type: Number,
  })
  qty: number;

  @prop({
    type: String,
  })
  uom: string;
  @prop({
    type: Boolean,
    default: false,
  })
  isDeleted: boolean;

  @prop({ ref: () => ProductModel })
  product: Ref<typeof ProductModel>;

  @prop({ ref: () => ProductionModel })
  production: Ref<typeof ProductionModel>;
  @prop({ ref: () => MachineModel })
  machine: Ref<typeof MachineModel>;
}

export const ProductionDtlModel = getModelForClass(ProductionDtl, {
  schemaOptions: {
    timestamps: true,
  },
});
