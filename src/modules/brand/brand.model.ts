import { getModelForClass, prop } from '@typegoose/typegoose';

export class Brand {
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

export const BrandModel = getModelForClass(Brand, {
  schemaOptions: {
    timestamps: true,
  },
});
