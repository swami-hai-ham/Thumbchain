"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkTxnSchema = exports.signinBodySchema = exports.bufferSchema = exports.createSubmissionInput = exports.createTaskInput = void 0;
const zod_1 = __importDefault(require("zod"));
exports.createTaskInput = zod_1.default.object({
    options: zod_1.default.array(zod_1.default.object({
        imageUrl: zod_1.default.string()
    })),
    title: zod_1.default.string().optional(),
    signature: zod_1.default.string(),
    country: zod_1.default.string().optional().nullable(),
    responsesNeeded: zod_1.default.number().min(100).max(1000)
});
exports.createSubmissionInput = zod_1.default.object({
    taskId: zod_1.default.string(),
    selection: zod_1.default.string()
});
exports.bufferSchema = zod_1.default.object({
    type: zod_1.default.literal('Buffer'),
    data: zod_1.default.array(zod_1.default.number().int().min(0).max(255))
});
exports.signinBodySchema = zod_1.default.object({
    signature: exports.bufferSchema,
    publicKey: zod_1.default
        .string()
        .min(44, 'Public key must be at least 44 characters long')
        .max(44, 'Public key must be at most 44 characters long')
        .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, 'Invalid base58 string'),
    message: zod_1.default
        .string()
        .min(1, 'Message cannot be empty')
        .max(500, 'Message is too long')
});
exports.checkTxnSchema = zod_1.default.object({
    signature: zod_1.default.string()
});
