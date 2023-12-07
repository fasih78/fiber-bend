import { BrandModel } from './brand.model';
import { CreateBrandSchema } from './brand.schema';

export const createBrand = async (input: CreateBrandSchema) => {
  const brand = await BrandModel.create({
    ...input,
  });

  return brand;
};

export const getNewBrandId = async () => {
  const brand = await BrandModel.findOne()
    .sort({ field: 'asc', _id: -1 })
    .limit(1);

  let newId: number = 1;
  if (brand != null) {
    newId = brand.id + 1;
  }

  return newId;
};

export const findBrands = async () => {
  const brand = await BrandModel.find().lean()
  const records = brand.length
  const result = {
    brand,
    records,
  };
  return result;
};

export const deleteBrands = async () => {
  return BrandModel.deleteMany({});
};

export const deleteBrandById = async (id: string) => {
  return BrandModel.findByIdAndDelete(id);
};

export const updateBrandById = async (id: string, brand: string) => {
  return BrandModel.findByIdAndUpdate(id, { name: brand });
};
