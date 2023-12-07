import { PermissionModel } from './permission.model';
import { UserPermissionModel } from './user_permission.model';
import { CreatePermissionSchema } from './permission.schema';

export const createPermission = async (input: CreatePermissionSchema) => {
  const permission = await PermissionModel.create({
    ...input,
  });
  return permission;
};

export const findPermission = async () => {
  return PermissionModel.find();
};

export const deletePermission = async () => {
  return PermissionModel.deleteMany({});
};

export const deletePermissionById = async (id: string) => {
  return PermissionModel.findByIdAndDelete(id);
};

export const updatePermissionById = async (id: string, permission: string) => {
  return PermissionModel.findByIdAndUpdate(id, { name: permission });
};
