import { getModelForClass, prop } from '@typegoose/typegoose';

export class City {
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

export const CityModel = getModelForClass(City, {
  schemaOptions: {
    timestamps: true,
  },
});
