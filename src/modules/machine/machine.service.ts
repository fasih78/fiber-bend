import { MachineModel } from './machine.model';
import { CreateMachineSchema, MachinePaginationSchema } from './machine.schema';

export const createMachine = async (input: CreateMachineSchema) => {

  const name = input.name;
  const trimmedName = name.trim();
  console.log(`Searching for customer with name: ${trimmedName}`);
    const existingMachine = await MachineModel.findOne({ "name": trimmedName });

  if (existingMachine) {
    return 'Machine already exists with this name in a case-sensitive manner.';
  }
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

export const findMachinesPagination = async (input:MachinePaginationSchema) => {
  const limit = input.perPage;
  const skipCount = (input.pageno - 1) * limit;
  const machinerecord = await MachineModel.countDocuments();
  const searchQuery = new RegExp(`^${input?.name}`, 'i');
  const machine_record =  await MachineModel.find({name:{$regex:searchQuery}})
  if(input.name !== ''){
  const machine = await MachineModel.aggregate([
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
    machine:machine,
    total_records:machine_record.length
  }
  
  return result ;
}
else {
  const machine = await MachineModel.aggregate([
 
    {$skip:skipCount},
    {$limit:limit},
    {$sort:{id:1}}
  ])
  const result = {
    machine:machine,
    total_records:machinerecord
  }
  
  return result;
}
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
