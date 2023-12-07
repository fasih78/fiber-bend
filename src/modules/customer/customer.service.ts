import mongoose from 'mongoose';
import { CityModel } from '../city/city.model';
import { findCityById } from '../city/city.service';
import { CountryModel } from '../country/country.model';
import { StateModel } from '../state/state.model';
import { CustomerModel } from './customer.model';
import {
  CreateCustomerSchema,
  CustomerPaginationSchema,
  Customerdrop_downSchema,
} from './customer.schema';

export const createCustomer = async (input: CreateCustomerSchema) => {
  const {
    id,
    name,
    title,
    contact,
    phone,
    email,
    address1,
    address2,
    zipCode,
    city,
    state,
    country,
    salesTaxReg,
    ntn,
  } = input;

  const customer = await CustomerModel.create({
    id,
    name,
    title,
    contact,
    phone,
    email,
    address1,
    address2,
    zipCode,
    city: new mongoose.Types.ObjectId(city),
    state: new mongoose.Types.ObjectId(state),
    country: new mongoose.Types.ObjectId(country),
    salesTaxReg,
    ntn,
  });

  return customer;
};

export const getNewCustomerId = async () => {
  const customer = await CustomerModel.findOne()
    .sort({ field: 'asc', _id: -1 })
    .limit(1);

  let newId: number = 1;
  if (customer != null) {
    newId = customer.id + 1;
  }

  return newId;
};

export const findCustomer = async () => {
  return await CustomerModel.find();
};

export const Customer_drop_down = async (input: Customerdrop_downSchema) => {
  const limit = input?.limit;
  const searchQuery = new RegExp(`^${input?.name}`, 'i');
  if (input.record == true) {
    const customer = await CustomerModel.aggregate([
      {
        $project: {
          name: 1,
        },
      },
    ]).exec();

    return customer;
  } else if (input.name !== '') {
    const customer = await CustomerModel.aggregate([
      {
        $match: {
          name: { $regex: searchQuery },
        },
      },
      { $limit: limit },
    ]).exec();

    return customer;
  } else {
    const customer = await CustomerModel.aggregate([{ $limit: limit }]).exec();

    return customer;
  }
};

export const findCustomers = async (input: CustomerPaginationSchema) => {
  const limit = input.perPage;
  const skipCount = (input.pageno - 1) * limit;
  const customerrecords = await CustomerModel.countDocuments();
  const customerdtl = await CustomerModel.find()
    .populate({
      path: 'city',
      model: CityModel,
    })
    .populate({
      path: 'state',
      model: StateModel,
    })
    .populate({
      path: 'country',
      model: CountryModel,
    })
    .limit(limit)
    .skip(skipCount)
    .sort({ id: 1 });

  const result = {
    customerdtl: customerdtl,
    total_Records: customerrecords,
  };
  return result;
};

export const deleteCustomers = async () => {
  return CustomerModel.deleteMany({});
};

export const deleteCustomerById = async (id: string) => {
  return CustomerModel.findByIdAndDelete(id);
};

export const updateCustomerById = async (
  _id: string,
  body: CreateCustomerSchema
) => {
  const {
    id,
    name,
    title,
    contact,
    phone,
    email,
    address1,
    address2,
    zipCode,
    city,
    state,
    country,
    salesTaxReg,
    ntn,
  } = body;

  return CustomerModel.findByIdAndUpdate(_id, {
    id,
    name,
    title,
    contact,
    phone,
    email,
    address1,
    address2,
    zipCode,
    city: new mongoose.Types.ObjectId(city),
    state: new mongoose.Types.ObjectId(state),
    country: new mongoose.Types.ObjectId(country),
    salesTaxReg,
    ntn,
  });
};
