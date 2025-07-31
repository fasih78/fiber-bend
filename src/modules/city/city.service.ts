import { CountryPaginationSchema } from '../country/country.schema';
import { CityModel } from './city.model';
import { CityPaginationSchema, CreateCitySchema } from './city.schema';

// export const createCity = async (input: CreateCitySchema) => {
//   const city = await CityModel.create({
//     ...input,
//   });

//   return city;
// };
export const createCity = async (input: CreateCitySchema) => {
  // Check if the city already exists with case-sensitive collation
  const existingCity = await CityModel.findOne({ name: input.name }).collation({ locale: 'en', strength: 1 });

  if (existingCity) {
    return 'City already exists with this name in a case-sensitive manner.';
  }

  // Create the city since it does not exist
  const city = await CityModel.create({
    ...input,
  });

  return city;
};
export const getNewCityId = async () => {
  const city = await CityModel.findOne()
    .sort({ field: 'asc', _id: -1 })
    .limit(1);

  let newId: number = 1;
  if (city != null) {
    newId = city.id + 1;
  }

  return newId;
};

export const findCitiesPagination = async (input: CityPaginationSchema) => {
  const limit = input.perPage;
  const skipCount = (input.pageno - 1) * limit;
  const cityrecord = await CityModel.countDocuments();
  const searchQuery = new RegExp(`^${input?.name}`, 'i');
  const city_record = await CityModel.find({ name: { $regex: searchQuery } })
  if (input.name !== '') {
    const city = await CityModel.aggregate([
      {
        $match: {
          name: { $regex: searchQuery }
        }
      },
      { $skip: skipCount },
      { $limit: limit },
      { $sort: { id: 1 } }
    ])
    const result = {
      city: city,
      total_records: city_record.length
    }

    return result;
  }
  else {
    const city = await CityModel.aggregate([

      { $skip: skipCount },
      { $limit: limit },
      { $sort: { id: 1 } }
    ])
    const result = {
      city: city,
      total_records: cityrecord
    }

    return result;
  }
};
export const findCities = async () => {
  const citys = await CityModel.find().lean();
  const records = citys.length;
  const result = {
    citys,
    records,
  };

  return result;
}

export const findCityById = async (id: string) => {
  return await CityModel.findById(id);
};

export const deleteCities = async () => {
  return await CityModel.deleteMany({});
};

export const deleteCityById = async (id: string) => {
  return await CityModel.findByIdAndDelete(id);
};

export const updateCityById = async (id: string, brand: string) => {
  return await CityModel.findByIdAndUpdate(id, { name: brand });
};
