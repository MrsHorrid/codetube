import bcrypt from 'bcryptjs';
import prisma from '../models/prisma';
import { generateTokens } from '../middleware/auth';
import { TokenPayload } from '../types';

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
    displayName: string | null;
    isCreator: boolean;
    isVerified: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

export const registerUser = async (input: RegisterInput): Promise<AuthResponse> => {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: input.email }, { username: input.username }],
    },
  });

  if (existingUser) {
    throw new Error(existingUser.email === input.email ? 'Email already registered' : 'Username already taken');
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      username: input.username,
      email: input.email,
      passwordHash,
      displayName: input.displayName,
    },
    select: {
      id: true,
      username: true,
      email: true,
      displayName: true,
      isCreator: true,
      isVerified: true,
    },
  });

  const payload: TokenPayload = {
    userId: user.id,
    username: user.username,
    email: user.email,
    isCreator: user.isCreator,
  };

  const { accessToken, refreshToken } = generateTokens(payload);

  return {
    user,
    accessToken,
    refreshToken,
  };
};

export const loginUser = async (input: LoginInput): Promise<AuthResponse> => {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      username: true,
      email: true,
      displayName: true,
      passwordHash: true,
      isCreator: true,
      isVerified: true,
    },
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);

  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const { passwordHash: _, ...userWithoutPassword } = user;

  const payload: TokenPayload = {
    userId: user.id,
    username: user.username,
    email: user.email,
    isCreator: user.isCreator,
  };

  const { accessToken, refreshToken } = generateTokens(payload);

  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
  };
};
