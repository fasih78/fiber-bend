import { MachineModel } from './machine.model';
import { CreateMachineSchema } from './machine.schema';

export const createMachine = async (input: CreateMachineSchema) => {
  const Machine = await MachineModel.create({
    ...input,
  });

  return Machine;
};

export const getNewMachineId = async () => {
  const Machine = await MachineModel.findOne()
    .sort({ field: 'asc', _id: -1 })
    .limit(1);

  let newId: number = 1;
  if (Machine != null) {
    newId = Machine.id + 1;
  }

  return newId;
};

export const findMachines = async () => {
  const machine = await MachineModel.find().lean();
  const records = machine.length;
  const result = {
    machine,
    records,
  }
  return result;
};

export const deleteMachines = async () => {
  return MachineModel.deleteMany({});
};

export const deleteMachineById = async (id: string) => {
  return MachineModel.findByIdAndDelete(id);
};

export const updateMachineById = async (id: string, Machine: string) => {
  return MachineModel.findByIdAndUpdate(id, { name: Machine });
};
