import { getModelForClass, prop, Ref } from '@typegoose/typegoose';
import { PermissionModel } from './permission.model';
import { UserModel } from '../user/user.model';

export class UserPermission {
  @prop({
    type: Number,
    default: 1,
  })
  id: number;

  @prop({ ref: () => UserModel })
  user: Ref<typeof UserModel>;

  @prop({ ref: () => PermissionModel })
  permission: Ref<typeof PermissionModel>;
}
export const UserPermissionModel = getModelForClass(UserPermission, {
  schemaOptions: {
    timestamps: true,
  },
});
