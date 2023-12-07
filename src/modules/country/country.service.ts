import { CountryModel } from './country.model';
import { CreateCountrySchema } from './country.schema';

export const createCountry = async (input: CreateCountrySchema) => {
  const country = await CountryModel.create({
    ...input,
  });

  return country;
};

export const getNewCountryId = async () => {
  const country = await CountryModel.findOne()
    .sort({ field: 'asc', _id: -1 })
    .limit(1);

  let newId: number = 1;
  if (country != null) {
    newId = country.id + 1;
  }

  return newId;
};

export const findCountries = async () => {
  const country =  await CountryModel.find()
  const records = country.length
const result={
  country,
  records
}
return result
};

export const findCountryById = async (id: string) => {
  return await CountryModel.findById(id);
};

export const deleteCountries = async () => {
  return await CountryModel.deleteMany({});
};

export const deleteCountryById = async (id: string) => {
  return await CountryModel.findByIdAndDelete(id);
};

export const updateCountryById = async (id: string, brand: string) => {
  return await CountryModel.findByIdAndUpdate(id, { name: brand });
};
