"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SurveyFormSchema = exports.checkTxnSchema = exports.signinBodySchema = exports.bufferSchema = exports.createResponseInput = exports.createSubmissionInput = exports.createTaskInput = void 0;
const zod_1 = __importDefault(require("zod"));
const client_1 = require("@prisma/client");
exports.createTaskInput = zod_1.default.object({
    options: zod_1.default.array(zod_1.default.object({
        imageUrl: zod_1.default.string(),
    })),
    title: zod_1.default.string().optional(),
    signature: zod_1.default.string(),
    country: zod_1.default.string().optional().nullable(),
    responsesNeeded: zod_1.default.number().min(100).max(1000),
});
exports.createSubmissionInput = zod_1.default.object({
    taskId: zod_1.default.string(),
    selection: zod_1.default.string(),
});
exports.createResponseInput = zod_1.default
    .object({
    questionId: zod_1.default.string(),
    formId: zod_1.default.string(),
    type: zod_1.default.enum([
        client_1.QuestionType.MULTIPLE_CHOICE,
        client_1.QuestionType.CHECKBOXES,
        client_1.QuestionType.TEXT,
        client_1.QuestionType.DATE,
    ]), // Validate against enum
    answer: zod_1.default.any(), // Temporary placeholder for conditional validation
})
    .refine((data) => {
    switch (data.type) {
        case client_1.QuestionType.MULTIPLE_CHOICE:
            return typeof data.answer === "string"; // Answer must be a single string (selected option)
        case client_1.QuestionType.CHECKBOXES:
            return (Array.isArray(data.answer) &&
                data.answer.every((item) => typeof item === "string")); // Answer must be an array of strings (selected options)
        case client_1.QuestionType.TEXT:
            return typeof data.answer === "string"; // Answer must be a string (written response)
        case client_1.QuestionType.DATE:
            return (typeof data.answer === "string" && !isNaN(Date.parse(data.answer))); // Answer must be a valid ISO string
        default:
            return false; // Invalid type
    }
}, {
    message: "Answer type is not compatible with question type",
    path: ["answer"],
});
exports.bufferSchema = zod_1.default.object({
    type: zod_1.default.literal("Buffer"),
    data: zod_1.default.array(zod_1.default.number().int().min(0).max(255)),
});
exports.signinBodySchema = zod_1.default.object({
    signature: exports.bufferSchema,
    publicKey: zod_1.default
        .string()
        .min(44, "Public key must be at least 44 characters long")
        .max(44, "Public key must be at most 44 characters long")
        .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, "Invalid base58 string"),
    message: zod_1.default
        .string()
        .min(1, "Message cannot be empty")
        .max(500, "Message is too long"),
});
exports.checkTxnSchema = zod_1.default.object({
    signature: zod_1.default.string(),
});
const SurveySchema = zod_1.default.object({
    title: zod_1.default.string().min(1, { message: "Survey title is required" }),
    description: zod_1.default.string().optional(),
});
const MultichoiceQuestionSchema = zod_1.default.object({
    type: zod_1.default.literal("multichoice"),
    question: zod_1.default.string().min(1, { message: "Question is required" }),
    options: zod_1.default
        .array(zod_1.default.string().min(1, { message: "Option cannot be empty" }))
        .min(2, { message: "At least two options are required" }),
});
const CheckboxQuestionSchema = zod_1.default.object({
    type: zod_1.default.literal("checkbox"),
    question: zod_1.default.string().min(1, { message: "Question is required" }),
    options: zod_1.default
        .array(zod_1.default.string().min(1, { message: "Option cannot be empty" }))
        .min(2, { message: "At least two options are required" }),
});
const UserInputQuestionSchema = zod_1.default.object({
    type: zod_1.default.literal("user_input"),
    question: zod_1.default.string().min(1, { message: "Question is required" }),
    description: zod_1.default.string().optional(),
});
const DateQuestionSchema = zod_1.default.object({
    type: zod_1.default.literal("date"),
    question: zod_1.default.string().min(1, { message: "Question is required" }),
});
const QuestionSchema = zod_1.default.union([
    MultichoiceQuestionSchema,
    CheckboxQuestionSchema,
    UserInputQuestionSchema,
    DateQuestionSchema,
]);
const SurveyFormSchema = zod_1.default.object({
    survey: SurveySchema,
    questions: zod_1.default
        .array(QuestionSchema)
        .min(1, { message: "At least one question is required" }),
    signature: zod_1.default.string(),
    country: zod_1.default.string().optional(),
    responsesNeeded: zod_1.default.number().min(100).max(1000),
});
exports.SurveyFormSchema = SurveyFormSchema;
