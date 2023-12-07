import mongoose from 'mongoose';
import { CurrencyModel } from '../currency/currency.model';
import { findCurrencyById } from '../currency/currency.service';
import { ProductModel } from './product.model';
import { CreateProductSchema, Productdrop_downSchema } from './product.schema';

export const createProduct = async (input: CreateProductSchema) => {
  const { id, name, currency, price } = input;

  const product = await ProductModel.create({
    id,
    name,
    price,
    currency: new mongoose.Types.ObjectId(currency),
  });

  return product;
};

export const getNewProductId = async () => {
  const product = await ProductModel.findOne()
    .sort({ field: 'asc', _id: -1 })
    .limit(1);

  let newId: number = 1;
  if (product != null) {
    newId = product.id + 1;
  }

  return newId;
};

export const findProducts = async () => {
  const product = await ProductModel.find().lean().populate({
    path: 'currency',
    model: CurrencyModel,
  });
  const records = product.length;
  const result = {
    product,
    records,
  };
  return result;
};

export const deleteProducts = async () => {
  return ProductModel.deleteMany({});
};

export const deleteProductById = async (id: string) => {
  return ProductModel.findByIdAndDelete(id);
};

export const updateProductById = async (
  id: string,
  body: CreateProductSchema
) => {
  return ProductModel.findByIdAndUpdate(id, {
    id: body.id,
    name: body.name,
    price: body.price,
    currency: new mongoose.Types.ObjectId(body.currency),
  });
};

export const Productdrop_down = async (input: Productdrop_downSchema) => {
  const limit = input?.limit;
  const searchQuery = new RegExp(`^${input?.name}`, 'i');

  if (input.record == true) {
    const product = await ProductModel.aggregate([
      {
        $project: {
          name: 1,
        },
      },
    ]).exec();

    return product;
  } else if (input.name !== '') {
    const product = await ProductModel.aggregate([
      {
        $match: {
          name: { $regex: searchQuery },
        },
      },
      { $limit: limit },
    ]).exec();

    return product;
  } else {
    const product = await ProductModel.aggregate([{ $limit: limit }]).exec();

    return product;
  }
};
