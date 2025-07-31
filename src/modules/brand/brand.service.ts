import { BrandModel } from './brand.model';
import { BrandPaginationSchema, Brand_drop_down_Schema, CreateBrandSchema, brandSchemas } from './brand.schema';



export const createBrand = async (input: CreateBrandSchema) => {

  const name = input.name;
  const trimmedName = name.trim();

  console.log(`Searching for brand with name: ${trimmedName}`);
  const existingBrand = await BrandModel.findOne({ "name": trimmedName });



    if (existingBrand) {
      return 'Brand already exists with this name in a case-sensitive manner.';
    } 
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

export const findBrandsPagnation = async (input: BrandPaginationSchema) => {
  const limit = input.perPage;
  const skipCount = (input.pageno - 1) * limit;
  const brandrecord = await BrandModel.countDocuments();
  const searchQuery = new RegExp(`^${input?.name}`, 'i');
  const brand_record = await BrandModel.find({ name: { $regex: searchQuery } })
  if (input.name !== '') {
    const brand = await BrandModel.aggregate([
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
      brand: brand,
      total_records: brand_record.length
    }

    return result;
  }
  else {
    const brand = await BrandModel.aggregate([

      { $skip: skipCount },
      { $limit: limit },
      { $sort: { id: 1 } }
    ])
    const result = {
      brand: brand,
      total_records: brandrecord
    }

    return result;
  }
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

export const Brand_drop_down = async (input: Brand_drop_down_Schema) => {
  const limit = input?.limit;
  const searchQuery = new RegExp(`^${input?.name}`, 'i');
  if (input.name !== '' && input.record == false) {
    const brand = await BrandModel.aggregate([
      {
        $match: {
          name: { $regex: searchQuery },
        }
      },
      { $limit: limit },
      { $sort: { name: 1 } }
    ]).exec()

    return brand
  }
  else if (input.record == true) {
    const brand = await BrandModel.aggregate([{ $sort: { name: 1 } }]).exec()
    return brand
  }
  else if (input.record == false) {
    const brand = await BrandModel.aggregate([
      { $sort: { name: 1 } },
      { $limit: limit }
    ]).exec()
    return brand
  }
}