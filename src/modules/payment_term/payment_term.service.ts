import { PaymentTermModel } from './payment_term.model';
import { CreatePaymentTermSchema, Payment_Term_drop_down_Schema, Payment_termPaginationSchema } from './payment_term.schema';

export const createPaymentTerm = async (input: CreatePaymentTermSchema) => {
  const paymentTerm = await PaymentTermModel.create({
    ...input,
  });

  return paymentTerm;
};

export const getNewPaymentTermId = async () => {
  const paymentTerm = await PaymentTermModel.findOne()
    .sort({ field: 'asc', _id: -1 })
    .limit(1);

  let newId: number = 1;
  if (paymentTerm != null) {
    newId = paymentTerm.id + 1;
  }

  return newId;
};

export const findPaymentTermsPagination = async (input:Payment_termPaginationSchema) => {
  const limit = input.perPage;
  const skipCount = (input.pageno - 1) * limit;
  const paymenttermrecord = await PaymentTermModel.countDocuments();
  const searchQuery = new RegExp(`^${input?.name}`, 'i');
  const paymentterm_record =  await PaymentTermModel.find({name:{$regex:searchQuery}})
  if(input.name !== ''){
  const paymentterm = await PaymentTermModel.aggregate([
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
    paymentterm:paymentterm,
    total_records:paymentterm_record.length
  }
  
  return result ;
}
else {
  const paymentterm = await PaymentTermModel.aggregate([
 
    {$skip:skipCount},
    {$limit:limit},
    {$sort:{id:1}}
  ])
  const result = {
    paymentterm:paymentterm,
    total_records:paymenttermrecord
  }
  
  return result;
}
};
export const findPaymentTerms = async () => {
  const paymentterm =await PaymentTermModel.find().lean()
  const records = paymentterm.length
  const result = {
    paymentterm,
    records,
  };
  return result;
};

export const deletePaymentTerms = async () => {
  return PaymentTermModel.deleteMany({});
};

export const deletePaymentTermById = async (id: string) => {
  return PaymentTermModel.findByIdAndDelete(id);
};

export const updatePaymentTermById = async ( id: string,paymentTerm: string) => {
  return PaymentTermModel.findByIdAndUpdate(id, { name: paymentTerm });
};


export const Payment_Term__drop_down =async(input:Payment_Term_drop_down_Schema)=>{
  const limit = input?.limit;
  const searchQuery = new RegExp(`^${input?.name}`, 'i');
if(input.name !== '' && input.record == false){
const brand = await PaymentTermModel.aggregate([
  {
    $match:{
      name: { $regex: searchQuery },
    }
  },
  { $limit: limit },
]).exec()

return brand
}
else if(input.record == true){
const brand = await PaymentTermModel.find().exec()
return brand
}
else if(input.record == false ){
  const brand = await PaymentTermModel.aggregate([
{$limit:limit}
  ]).exec()
  return brand
}
}