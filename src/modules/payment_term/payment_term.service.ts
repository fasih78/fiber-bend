import { PaymentTermModel } from './payment_term.model';
import { CreatePaymentTermSchema } from './payment_term.schema';

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

export const updatePaymentTermById = async (
  id: string,
  paymentTerm: string
) => {
  return PaymentTermModel.findByIdAndUpdate(id, { name: paymentTerm });
};
