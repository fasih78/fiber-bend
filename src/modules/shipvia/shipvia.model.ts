import { getModelForClass, prop } from '@typegoose/typegoose';

export class ShipVia {
  @prop({
    type: Number,
    default: 1,
  })
  id: number;

  @prop({
    type: String,
  })
  ship_via: string;

  // @prop({
  //   type: Boolean,
  //   default: false,
  // })
  // is_Deleted: boolean;
}
export const ShipViaModel = getModelForClass(ShipVia, {
  schemaOptions: {
    timestamps: true,
  },
});
