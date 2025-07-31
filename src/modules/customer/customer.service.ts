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
  try {
    const trimmedName = name.trim();

    console.log(`Searching for customer with name: ${trimmedName}`);
    const existingCustomer = await CustomerModel.findOne({ "name": trimmedName });

console.log(existingCustomer);
    if (existingCustomer) {
      return 'Customer already exists with this name in a case-sensitive manner.';
    }
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
  } catch (error) {
    console.log(error);
  }
 
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
  return await  CustomerModel.find();
};

export const Customer_drop_down = async (input: Customerdrop_downSchema) => {
  const limit = input?.limit;
  const searchQuery = new RegExp(`^${input?.name}`, 'i');
  if (input.record == true) {
    console.log("all");
    const customer = await CustomerModel.aggregate([
      
        {
          $lookup: {
            from: 'cities', 
            localField: 'city', 
            foreignField: '_id', 
            as: 'city'
          }
        }, {
          $lookup: {
            from: 'states', 
            localField: 'state', 
            foreignField: '_id', 
            as: 'states'
          }
        }, {
          $lookup: {
            from: 'countries', 
            localField: 'country', 
            foreignField: '_id', 
            as: 'country'
          }
        }, {
          $project: {
            name: 1, 
            address1: 1, 
            address2: 1, 
            zipCode: 1, 
            city: {
              $first: '$city.name'
            }, 
            country: {
              $first: '$country.name'
            }, 
            state: {
              $first: '$states.name'
            }
          }
        },
        {$sort:{name:1}}
      
    ]).exec();

    return customer;
  } 
  else if(input.name == ''){

    const customer = await CustomerModel.aggregate([
      
      {
        $lookup: {
          from: 'cities', 
          localField: 'city', 
          foreignField: '_id', 
          as: 'city'
        }
      }, {
        $lookup: {
          from: 'states', 
          localField: 'state', 
          foreignField: '_id', 
          as: 'states'
        }
      }, {
        $lookup: {
          from: 'countries', 
          localField: 'country', 
          foreignField: '_id', 
          as: 'country'
        }
      }, {
        $project: {
          name: 1, 
          address1: 1, 
          address2: 1, 
          zipCode: 1, 
          city: {
            $first: '$city.name'
          }, 
          country: {
            $first: '$country.name'
          }, 
          state: {
            $first: '$states.name'
          }
        }
      },
       {$limit:limit},
       {$sort:{name:1}}
    
  ]).exec();

  return customer;
  }
  else if (input.name !== '') {
    const customer = await CustomerModel.aggregate([
      {
        $match: {
          name: { $regex: searchQuery },
        },
      },
      {
        $lookup: {
          from: 'cities', 
          localField: 'city', 
          foreignField: '_id', 
          as: 'city'
        }
      }, {
        $lookup: {
          from: 'states', 
          localField: 'state', 
          foreignField: '_id', 
          as: 'states'
        }
      }, {
        $lookup: {
          from: 'countries', 
          localField: 'country', 
          foreignField: '_id', 
          as: 'country'
        }
      }, {
        $project: {
          name: 1, 
          address1: 1, 
          address2: 1, 
          zipCode: 1, 
          city: {
            $first: '$city.name'
          }, 
          country: {
            $first: '$country.name'
          }, 
          state: {
            $first: '$states.name'
          }
        }
      },
      { $limit: limit },
    ]).exec();

    return customer;
  } else {

    const customer = await CustomerModel.aggregate([{ $limit: limit },{$sort:{name:1}}]).exec();

    return customer;
  }
};

export const findCustomers = async (input: CustomerPaginationSchema) => {
  const limit = input.perPage;
  const skipCount = (input.pageno - 1) * limit;
  const searchQuery = new RegExp(`^${input?.name}`, 'i');
  const customerrecords = await CustomerModel.countDocuments();
  const customer_record  = await CustomerModel.find({name:searchQuery})

  if(input.name !== ''){
  const customerdtl = await CustomerModel.find({name: { $regex: searchQuery }})
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
    total_Records: customer_record.length,
  };
  return result;
}
else{
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
}
}

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
