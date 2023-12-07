import { getModelForClass, prop } from '@typegoose/typegoose';
import { number } from 'zod';

export class Permission {
  @prop({
    type: Number,
    default: 1,
  })
  id: number;

  @prop({
    type: String,
  })
  name: string;
}
export const PermissionModel = getModelForClass(Permission, {
  schemaOptions: {
    timestamps: true,
  },
});
