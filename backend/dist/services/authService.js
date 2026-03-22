"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../models/prisma"));
const auth_1 = require("../middleware/auth");
const registerUser = async (input) => {
    const existingUser = await prisma_1.default.user.findFirst({
        where: {
            OR: [{ email: input.email }, { username: input.username }],
        },
    });
    if (existingUser) {
        throw new Error(existingUser.email === input.email ? 'Email already registered' : 'Username already taken');
    }
    const passwordHash = await bcryptjs_1.default.hash(input.password, 10);
    const user = await prisma_1.default.user.create({
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
    const payload = {
        userId: user.id,
        username: user.username,
        email: user.email,
        isCreator: user.isCreator,
    };
    const { accessToken, refreshToken } = (0, auth_1.generateTokens)(payload);
    return {
        user,
        accessToken,
        refreshToken,
    };
};
exports.registerUser = registerUser;
const loginUser = async (input) => {
    const user = await prisma_1.default.user.findUnique({
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
    const isValidPassword = await bcryptjs_1.default.compare(input.password, user.passwordHash);
    if (!isValidPassword) {
        throw new Error('Invalid credentials');
    }
    // Update last login
    await prisma_1.default.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
    });
    const { passwordHash: _, ...userWithoutPassword } = user;
    const payload = {
        userId: user.id,
        username: user.username,
        email: user.email,
        isCreator: user.isCreator,
    };
    const { accessToken, refreshToken } = (0, auth_1.generateTokens)(payload);
    return {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
    };
};
exports.loginUser = loginUser;
//# sourceMappingURL=authService.js.map