import { FastifyReply, FastifyRequest } from 'fastify';

import { permissionSchemas } from './permission.schema';

import {
  createPermission,
  findPermission,
  deletePermission,
  updatePermissionById,
} from './permission.service';
