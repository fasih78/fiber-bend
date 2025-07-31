import { getModelForClass, prop } from '@typegoose/typegoose';

export class Country {
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

export const CountryModel = getModelForClass(Country, {
  schemaOptions: {
    timestamps: true,
  },
});
