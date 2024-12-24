import { z } from 'zod';


const SurveySchema = z.object({
  title: z.string().min(1, { message: 'Survey title is required' }),
  description: z.string().optional(),
});

const MultichoiceQuestionSchema = z.object({
  type: z.literal('multichoice'),
  question: z.string().min(1, { message: 'Question is required' }),
  options: z.array(z.string().min(1, { message: 'Option cannot be empty' })).min(2, { message: 'At least two options are required' }),
});


const CheckboxQuestionSchema = z.object({
  type: z.literal('checkbox'),
  question: z.string().min(1, { message: 'Question is required' }),
  options: z.array(z.string().min(1, { message: 'Option cannot be empty' })).min(2, { message: 'At least two options are required' }),
});


const UserInputQuestionSchema = z.object({
  type: z.literal('user_input'),
  question: z.string().min(1, { message: 'Question is required' }),
  description: z.string().optional(),
});


const DateQuestionSchema = z.object({
  type: z.literal('date'),
  question: z.string().min(1, { message: 'Question is required' }),
});


const QuestionSchema = z.union([
  MultichoiceQuestionSchema,
  CheckboxQuestionSchema,
  UserInputQuestionSchema,
  DateQuestionSchema,
]);

const SurveyFormSchema = z.object({
  survey: SurveySchema,
  questions: z.array(QuestionSchema).min(1, { message: 'At least one question is required' }),
});

export { SurveyFormSchema };
