import { getModelForClass, prop, Ref } from '@typegoose/typegoose';
import { SalesContractModel } from '../sales_contract/sales_contract.model';
import { boolean, date, string } from 'zod';

export class Shipment {
  @prop({
    type: Number,
    default: 1,
   
  })
  shipment: number;

  @prop({
    type: String,
  })
  gpNumber: string;

  @prop({
    type: Date,
  })
  gpDate: Date;

  @prop({
    type: String,
  })
  dcNumber: string;

  @prop({
    type: Date,
  })
  dcDate: Date;

  @prop({
    type: Boolean,
    default: false,
  })
  isDeleted: boolean;
  // @prop({
  //   type: Date,
  // })
  // strgp: Date;
  // @prop({
  //   type: Date,
  // })
  // strdc: Date;
  @prop({
    type: String,
  })
  contract: string;

  @prop({ ref: () => SalesContractModel })
  salesContract: Ref<typeof SalesContractModel>;

  @prop({
    type: String,
  })
  specialInstruction: string;

  @prop({
    type: Number,
  })
  shippedQty: number;

  @prop({
    type: Boolean,
    default:false
  })
  adm_ship: boolean;

  @prop({
    type: Boolean,
    default:false
  })
  return: boolean;

}

export const ShipmentModel = getModelForClass(Shipment, {
  schemaOptions: {
    timestamps: true,
  },
});
