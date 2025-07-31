import { getModelForClass, prop, Ref } from '@typegoose/typegoose';
import { CityModel } from '../city/city.model';
import { CountryModel } from '../country/country.model';
import { StateModel } from '../state/state.model';

export class Customer {
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

  @prop({
    type: String,
  })
  title: string;

  @prop({
    type: String,
  })
  contact: string;

  @prop({
    type: String,
  })
  phone: string;

  @prop({
    type: String,
  })
  email: string;

  @prop({
    type: String,
  })
  address1: string;

  @prop({
    type: String,
  })
  address2: string;

  @prop({
    type: String,
  })
  zipCode: string;

  @prop({
    type: String,
  })
  salesTaxReg: string;

  @prop({
    type: String,
  })
  ntn: string;

  @prop({ ref: () => CityModel })
  city: Ref<typeof CityModel>;

  @prop({ ref: () => StateModel })
  state: Ref<typeof StateModel>;

  @prop({ ref: () => CountryModel })
  country: Ref<typeof CountryModel>;
}

export const CustomerModel = getModelForClass(Customer, {
  schemaOptions: {
    timestamps: true,
  },
});
