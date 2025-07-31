import { CountryModel } from './country.model';
import { CountryPaginationSchema, CreateCountrySchema } from './country.schema';

export const createCountry = async (input: CreateCountrySchema) => {
const name = input.name;
const trimmedName = name.trim();

console.log(`Searching for country with name: ${trimmedName}`);
const existingCountry = await CountryModel.findOne({ "name": trimmedName });
  if (existingCountry) {
    return 'Country already exists with this name in a case-sensitive manner.';
  }
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

export const findCountriesPagination = async (input:CountryPaginationSchema) => {
  const limit = input.perPage;
  const skipCount = (input.pageno - 1) * limit;
  const countryrecord = await CountryModel.countDocuments();
  const searchQuery = new RegExp(`^${input?.name}`, 'i');
  const country_record =  await CountryModel.find({name:{$regex:searchQuery}})
  if(input.name !== ''){
  const country = await CountryModel.aggregate([
    {
      $match:{
        name:{$regex:searchQuery}
      }
    },
    {$skip:skipCount},
    {$limit:limit},
    {$sort:{id:1}}
  ])
  const result = {
    country:country,
    total_records:country_record.length
  }
  
  return result ;
}
else {
  const country = await CountryModel.aggregate([
 
    {$skip:skipCount},
    {$limit:limit},
    {$sort:{id:1}}
  ])
  const result = {
    country:country,
    total_records:countryrecord
  }
  
  return result;
}
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
