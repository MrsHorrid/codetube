"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.validateRequest = void 0;
const zod_1 = require("zod");
const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            if (schema.body) {
                req.body = schema.body.parse(req.body);
            }
            if (schema.query) {
                req.query = schema.query.parse(req.query);
            }
            if (schema.params) {
                const parsedParams = schema.params.parse(req.params);
                req.params = parsedParams;
            }
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid request data',
                        details: error.issues.map((e) => ({
                            field: e.path.join('.'),
                            message: e.message,
                        })),
                    },
                });
                return;
            }
            next(error);
        }
    };
};
exports.validateRequest = validateRequest;
const errorHandler = (err, _req, res, _next) => {
    // Handle Zod validation errors with a 400
    if (err instanceof zod_1.ZodError) {
        res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid request data',
                details: err.issues.map((e) => ({
                    field: e.path.join('.'),
                    message: e.message,
                })),
            },
        });
        return;
    }
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
        },
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=validation.js.map