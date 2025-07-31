import { hashPassword } from '../../utils/hash';
import { UserModel } from './user.model';
import { CreateUserInput } from './user.schema';

export const createUser = async (input: CreateUserInput) => {

  const { password, ...rest } = input;

  const { hash, salt } = hashPassword(password);

  const user = await UserModel.create({
    ...rest,
    salt,
    password: hash,
  });

  return user;
};

export const findUserByEmail = async (email: string) => {
  return UserModel.findOne({
    email,
  });
};

export const findUsers = async () => {
  return UserModel.find().select({
    _id: 1,
    name: 1,
    email: 1,
  });
};

export const updatePassword = async (id: string, password: string) => {
  const { hash, salt } = hashPassword(password);
  const user = await UserModel.findByIdAndUpdate(id, { password: hash, salt });
  return user;
};
