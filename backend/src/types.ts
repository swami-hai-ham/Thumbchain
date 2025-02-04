import z from "zod";
import { QuestionType } from "@prisma/client";

export const createTaskInput = z.object({
  options: z.array(
    z.object({
      imageUrl: z.string(),
    })
  ),
  title: z.string().optional(),
  signature: z.string(),
  country: z.string().optional().nullable(),
  responsesNeeded: z.number().min(100).max(1000),
});

export const createSubmissionInput = z.object({
  taskId: z.string(),
  selection: z.string(),
});

export const createResponseInput = z
  .object({
    questionId: z.string(),
    formId: z.string(),
    type: z.enum([
      QuestionType.MULTIPLE_CHOICE,
      QuestionType.CHECKBOXES,
      QuestionType.TEXT,
      QuestionType.DATE,
    ]), // Validate against enum
    answer: z.any(), // Temporary placeholder for conditional validation
  })
  .refine(
    (data) => {
      switch (data.type) {
        case QuestionType.MULTIPLE_CHOICE:
          return typeof data.answer === "string"; // Answer must be a single string (selected option)
        case QuestionType.CHECKBOXES:
          return (
            Array.isArray(data.answer) &&
            data.answer.every((item) => typeof item === "string")
          ); // Answer must be an array of strings (selected options)
        case QuestionType.TEXT:
          return typeof data.answer === "string"; // Answer must be a string (written response)
        case QuestionType.DATE:
          return (
            typeof data.answer === "string" && !isNaN(Date.parse(data.answer))
          ); // Answer must be a valid ISO string
        default:
          return false; // Invalid type
      }
    },
    {
      message: "Answer type is not compatible with question type",
      path: ["answer"],
    }
  );

export const bufferSchema = z.object({
  type: z.literal("Buffer"),
  data: z.array(z.number().int().min(0).max(255)),
});

export const signinBodySchema = z.object({
  signature: bufferSchema,
  publicKey: z
    .string()
    .min(44, "Public key must be at least 44 characters long")
    .max(44, "Public key must be at most 44 characters long")
    .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, "Invalid base58 string"),
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(500, "Message is too long"),
});

export const checkTxnSchema = z.object({
  signature: z.string(),
});

const SurveySchema = z.object({
  title: z.string().min(1, { message: "Survey title is required" }),
  description: z.string().optional(),
});

const MultichoiceQuestionSchema = z.object({
  type: z.literal("multichoice"),
  question: z.string().min(1, { message: "Question is required" }),
  options: z
    .array(z.string().min(1, { message: "Option cannot be empty" }))
    .min(2, { message: "At least two options are required" }),
});

const CheckboxQuestionSchema = z.object({
  type: z.literal("checkbox"),
  question: z.string().min(1, { message: "Question is required" }),
  options: z
    .array(z.string().min(1, { message: "Option cannot be empty" }))
    .min(2, { message: "At least two options are required" }),
});

const UserInputQuestionSchema = z.object({
  type: z.literal("user_input"),
  question: z.string().min(1, { message: "Question is required" }),
  description: z.string().optional(),
});

const DateQuestionSchema = z.object({
  type: z.literal("date"),
  question: z.string().min(1, { message: "Question is required" }),
});

const QuestionSchema = z.union([
  MultichoiceQuestionSchema,
  CheckboxQuestionSchema,
  UserInputQuestionSchema,
  DateQuestionSchema,
]);

const SurveyFormSchema = z.object({
  survey: SurveySchema,
  questions: z
    .array(QuestionSchema)
    .min(1, { message: "At least one question is required" }),
  signature: z.string(),
  country: z.string().optional(),
  responsesNeeded: z.number().min(100).max(1000),
});

export { SurveyFormSchema };
