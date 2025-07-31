import { FastifyReply, FastifyRequest } from 'fastify';
import { verifyPassword } from '../../utils/hash';
import {
  CreateUserInput,
  LoginInput,
  UpdatePasswordInput,
} from './user.schema';
import {
  createUser,
  findUserByEmail,
  findUsers,
  updatePassword,
} from './user.service';
const fastify = require('fastify')();
import { config } from '../../utils/config';

import * as fastifySession from 'fastify-session';
import { userLog } from '../../user_histroy/userhistroy.service';
import fastifyJwt, { JWT } from '@fastify/jwt';
import jwt from '@fastify/jwt';
import base64url from 'base64url';
import { ObjectId } from 'mongoose';
interface DecodedPayload {
  _doc: {
    email: string;
    name: string;
    _id: ObjectId;

  };
}


export const registerUserHandler = async (
  request: FastifyRequest<{
    Body: CreateUserInput;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;

  try {
    const findUser = await findUserByEmail(body.email);

    if (findUser != null) {
      return reply.code(401).send({
        message: 'User already registered with this email',
      });
    }

    const user = await createUser(body);

    return reply.code(201).send(user);
  } catch (e) {
    return reply.code(400).send(e);
  }
};

// @desc    Authenticate a user
// @route   POST /user/login
// @access  Public
export const loginHandler = async (
  request: FastifyRequest<{
    Body: LoginInput;
  }>,
  reply: FastifyReply
) => {
  const body = request.body;

  // find a user by email
  const user = await findUserByEmail(body.email);

  if (!user) {
    return reply.code(401).send({
      message: 'Invalid email or password',
    });
  }

  // verify password
  const correctPassword = verifyPassword({
    candidatePassword: body.password,
    salt: user.salt,
    hash: user.password,
  });

  if (correctPassword) {
    const { password, salt, ...rest } = user;
    const publicIP = request.headers['public_ip']
    type publicIP = string | undefined;
    const ipAddress: IpAddress = publicIP;



    /////////// user log ////////////
    await userLog(request, true, user.email, user._id, user.name, ipAddress,body)
    //////////// user log //////////
    return {
      accessToken: request.jwt.sign(rest),
      email: user.email,
      name: user.name,
    };
  }
  else {
    const publicIP = request.headers['public_ip']
    type publicIP = string | undefined;
    const ipAddress: IpAddress = publicIP;
    //////////// user log //////////  
    await userLog(request, false, user.email, user._id, user.name, ipAddress,body)
    //////////// user log //////////
    return reply.code(401).send({
      message: 'Invalid email or password',
    });
  }
};
// @desc    Get all userss
// @route   GET /user/
// @access  Private
export const getUsersHandler = async (request: FastifyRequest) => {
  const users = await findUsers();

  if (!users) {


    /////////// user log ////////////
    // await userLog(request, false)
  } else {
    const token = request.headers.authorization;

    if (token) {

      const decoded = request.jwt.decode(token.split(" ")[1]) as DecodedPayload

      console.log(decoded);
      const { email, name, _id } = decoded._doc;
      ////////user log///////////
      // await userLog(request, true, email, _id, name)

    } else {
      console.error('Authorization header is missing');
    }

    // await userLog(request, true)
  }
  //////////// user log //////////
  return users;
};

// @desc    update password
// @route   PUT /user/update-password
// @access  Private

export const updatePasswordHandler = async (
  request: FastifyRequest<{
    Body: UpdatePasswordInput;
  }>,
  reply: FastifyReply
) => {
  try {
    const body = request.body;

    const user = await updatePassword(body.id, body.password);

    return reply.code(200).send(user);
  } catch (e) {
    return reply.code(400).send(e);
  }
};
