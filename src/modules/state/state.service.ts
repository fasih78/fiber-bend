import { StateModel } from './state.model';
import { CreateStateSchema } from './state.schema';

export const createState = async (input: CreateStateSchema) => {
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
