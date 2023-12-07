import { CityModel } from './city.model';
import { CreateCitySchema } from './city.schema';

export const createCity = async (input: CreateCitySchema) => {
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

export const findCities = async () => {
  const citys = await CityModel.find().lean();
  const records = citys.length;
  const result = {
    citys,
    records,
  };

  return result;
};


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
