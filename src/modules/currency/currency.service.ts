import { record } from 'zod';
import { CurrencyModel } from './currency.model';
import { CreateCurrencySchema, CurrencyPaginationSchema } from './currency.schema';

export const createCurrency = async (input: CreateCurrencySchema) => {

  const existingCurrency = await CurrencyModel.find({ name: input.name }).collation({ locale: 'en', strength: 1 });
console.log(existingCurrency, "kkkk");
  if (existingCurrency) {
    return 'Currency already exists with this name in a case-sensitive manner.';
  }
  const currency = await CurrencyModel.create({
    ...input,
  });

  return currency;
};

export const getNewCurrencyId = async () => {
  const currency = await CurrencyModel.findOne()
    .sort({ field: 'asc', _id: -1 })
    .limit(1);

  let newId: number = 1;
  if (currency != null) {
    newId = currency.id + 1;
  }

  return newId;
};

export const findCurrenciesPagination = async (input:CurrencyPaginationSchema) => {
  const limit = input.perPage;
  const skipCount = (input.pageno - 1) * limit;
  const currencyrecord = await CurrencyModel.countDocuments();
  const searchQuery = new RegExp(`^${input?.name}`, 'i');
  const currency_record =  await CurrencyModel.find({name:{$regex:searchQuery}})
  if(input.name !== ''){
  const currency = await CurrencyModel.aggregate([
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
    currency:currency,
    total_records:currency_record.length
  }
  
  return result ;
}
else {
  const currency = await CurrencyModel.aggregate([
 
    {$skip:skipCount},
    {$limit:limit},
    {$sort:{id:1}}
  ])
  const result = {
    currency:currency,
    total_records:currencyrecord
  }
  
  return result;
}
};
export const findCurrencies = async () => {
  const currency = await CurrencyModel.find().lean();
  const record = currency.length;
  const result = {
    currency,
    record,
  };
  return result;
};

export const findCurrencyById = async (id: string) => {
  return CurrencyModel.findById(id);
};

export const deleteCurrencies = async () => {
  return CurrencyModel.deleteMany({});
};

export const deleteCurrencyById = async (id: string) => {
  return CurrencyModel.findByIdAndDelete(id);
};

export const updateCurrencyById = async (id: string, brand: string) => {
  return CurrencyModel.findByIdAndUpdate(id, { name: brand });
};
