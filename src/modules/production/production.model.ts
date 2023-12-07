import { getModelForClass, prop, Ref } from '@typegoose/typegoose';
import { MachineModel } from '../machine/machine.model';

export class Production {
  @prop({
    type: Number,
    default: 1,
  })
  tran: number;

  @prop({
    type: Date,
  })
  date: Date;

  @prop({
    type: String,
  })
  productionType: string;

  @prop({
    type: Boolean,
    default: false,
  })
  isDeleted: boolean;

  @prop({ ref: () => MachineModel })
  machine: Ref<typeof MachineModel>;

  @prop({
    type: String,
  })
  specialInstruction: string;
}

export const ProductionModel = getModelForClass(Production, {
  schemaOptions: {
    timestamps: true,
  },
});
