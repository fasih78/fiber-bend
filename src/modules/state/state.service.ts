import { StateModel } from './state.model';
import { CreateStateSchema, StatePaginationSchema } from './state.schema';

export const createState = async (input: CreateStateSchema) => {

  const name = input.name
  const trimmedName = name.trim();

  console.log(`Searching for state with name: ${trimmedName}`);
  const existingState = await StateModel.findOne({ "name": trimmedName });

console.log(existingState);
  if (existingState) {
    return 'State already exists with this name in a case-sensitive manner.';
  }
  const state = await StateModel.create({
    ...input,
  });

  return state;
};

export const getNewStateId = async () => {
  const state = await StateModel.findOne()
    .sort({ field: 'asc', _id: -1 })
    .limit(1);

  let newId: number = 1;
  if (state != null) {
    newId = state.id + 1;
  }

  return newId;
};

export const findStatesPagination = async (input:StatePaginationSchema) => {
  const limit = input.perPage;
  const skipCount = (input.pageno - 1) * limit;
  const staterecord = await StateModel.countDocuments();
  const searchQuery = new RegExp(`^${input?.name}`, 'i');
  const state_record =  await StateModel.find({name:{$regex:searchQuery}})
  if(input.name !== ''){
  const brand = await StateModel.aggregate([
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
    brand:brand,
    total_records:state_record.length
  }
  
  return result ;
}
else {
  const brand = await StateModel.aggregate([
 
    {$skip:skipCount},
    {$limit:limit},
    {$sort:{id:1}}
  ])
  const result = {
    brand:brand,
    total_records:staterecord
  }
  
  return result;
}
};
export const findStates = async () => {
  const state = await StateModel.find().lean();
  const records = state.length;
  const result = {
    state,
    records,
  };
  return result;
};
export const findStateById = async (id: string) => {
  return await StateModel.findById(id);
};

export const deleteStates = async () => {
  return await StateModel.deleteMany({});
};

export const deleteStateById = async (id: string) => {
  return await StateModel.findByIdAndDelete(id);
};

export const updateStateById = async (id: string, brand: string) => {
  return await StateModel.findByIdAndUpdate(id, { name: brand });
};
