import { record } from 'zod';
import { CurrencyModel } from './currency.model';
import { CreateCurrencySchema } from './currency.schema';

export const createCurrency = async (input: CreateCurrencySchema) => {
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
