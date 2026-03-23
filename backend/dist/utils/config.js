"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DB_CONFIG = exports.REDIS_CONFIG = exports.SERVER_CONFIG = exports.JWT_CONFIG = void 0;
// Validate required environment variables
const NODE_ENV = process.env.NODE_ENV || 'development';
if (NODE_ENV === 'production') {
    const required = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
        process.exit(1);
    }
}
else {
    // Warn in development if using weak defaults
    if (!process.env.DATABASE_URL) {
        console.warn('⚠️  DATABASE_URL not set – falling back to SQLite dev.db');
    }
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key-change-in-production') {
        console.warn('⚠️  JWT_SECRET is using insecure default – set a strong secret for production');
    }
}
exports.JWT_CONFIG = {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};
exports.SERVER_CONFIG = {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: NODE_ENV,
};
exports.REDIS_CONFIG = {
    url: process.env.REDIS_URL || '',
    enabled: !!process.env.REDIS_URL,
};
exports.DB_CONFIG = {
    url: process.env.DATABASE_URL || 'file:./dev.db',
};
//# sourceMappingURL=config.js.map