"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REDIS_CONFIG = exports.SERVER_CONFIG = exports.JWT_CONFIG = void 0;
exports.JWT_CONFIG = {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};
exports.SERVER_CONFIG = {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
};
exports.REDIS_CONFIG = {
    url: process.env.REDIS_URL || '',
    enabled: !!process.env.REDIS_URL,
};
//# sourceMappingURL=config.js.map