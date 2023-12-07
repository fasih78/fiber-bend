import { getModelForClass, prop, Ref } from '@typegoose/typegoose';
import { SalesContractModel } from '../sales_contract/sales_contract.model';
import { SalesContractDtlModel } from '../sales_contract/sales_contract_dtl.model';
export class Invoice {
  @prop({
    type: Number,
    default: 1,
  })
  inv: number;

  @prop({
    type: Date,
  })
  date: Date;

  @prop({ ref: () => SalesContractModel })
  salesContract: Ref<typeof SalesContractModel>;

  @prop({
    type: String,
  })
  specialInstruction: string;

  @prop({
    type: Boolean,
    default: false,
  })
  isDeleted: boolean;

  @prop({
    type: Boolean,
    default: false,
  })
  payment: boolean;

  @prop({
    type: String,
    default: 1,
  })
  salesTaxInvoiceNo: string;
}

export const InvoiceModel = getModelForClass(Invoice, {
  schemaOptions: {
    timestamps: true,
  },
});
