import { getModelForClass, prop } from '@typegoose/typegoose';

export class User {
  @prop({
    type: String,
    required: true,
  })
  email: string;

  @prop({
    type: String,
  })
  name: string;

  @prop({
    type: String,
    required: true,
  })
  password: string;

  @prop({
    type: String,
    required: true,
  })
  salt: string;

  @prop({
    type: Boolean,
    default: false,
  })
  isDeleted: boolean;
}

export const UserModel = getModelForClass(User, {
  schemaOptions: {
    timestamps: true,
  },
});
