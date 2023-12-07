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

// @desc    Register new user
// @route   POST /user/signup
// @access  Private
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
    // generate access token
    return {
      accessToken: request.jwt.sign(rest),
      email: user.email,
      name: user.name,
    };
  }

  return reply.code(401).send({
    message: 'Invalid email or password',
  });
};

// @desc    Get all userss
// @route   GET /user/
// @access  Private
export const getUsersHandler = async () => {
  const users = await findUsers();

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
