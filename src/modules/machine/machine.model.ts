import { getModelForClass, prop } from '@typegoose/typegoose';

export class Machine {
  @prop({
    type: Number,
    default: 1,
  })
  id: number;

  @prop({
    type: String,
    unique:true
  })
  name: string;
}

export const MachineModel = getModelForClass(Machine, {
  schemaOptions: {
    timestamps: true,
  },
});
