import { PrismaClient, QuestionType } from "@prisma/client";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { userMiddleware } from "../middlewares/userMiddleware";
import { createTaskInput, signinBodySchema } from "../types";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { SurveyFormSchema } from "../types";
import { verifyTransaction } from "../utils/VerifyTransaction";
import { sigUsage } from "../utils/sigUsage";

const userRouter = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET as string;
const TOTAL_DECIMALS = Number(process.env.TOTAL_DECIMALS) || 1000_000; // lamports

// signin with wallet
userRouter.post("/signin", async (req, res) => {
  // Parsing
  const body = req.body;
  const parsedData = signinBodySchema.safeParse(body);
  if (!parsedData.success) {
    return res.status(400).json({
      message: "You've sent wrong inputs",
    });
  }
  const { publicKey, signature, message } = parsedData.data || {};

  // Verification
  try {
    const publicKeyUint8 = bs58.decode(publicKey);
    const messageUint8 = new TextEncoder().encode(message);
    const isValidSignature = nacl.sign.detached.verify(
      messageUint8,
      new Uint8Array(signature.data),
      publicKeyUint8
    );
    console.log(isValidSignature);
    if (isValidSignature) {
      const user = await prisma.user.upsert({
        where: {
          address: publicKey,
        },
        update: {},
        create: {
          address: publicKey,
        },
      });
      const token = jwt.sign({ userId: user.id }, JWT_SECRET);

      // Success
      return res.status(200).json({
        token,
      });
    } else {
      // Failure
      return res.status(400).json({
        message: "InvalidSignature",
      });
    }

    // Try Catch Err
  } catch (e) {
    return res.status(500).json({
      error: e,
    });
  }
});

userRouter.post("/task", userMiddleware, async (req, res) => {
  // Parsing
  const body = req.body;
  const userId = res.locals.userId;
  try {
    const parsedData = createTaskInput.safeParse(body);
    if (!parsedData.success) {
      return res.status(400).json({
        message: "You've sent wrong inputs",
      });
    }
    console.log("parsedData: ", parsedData);
    const { responsesNeeded, signature } = parsedData.data;

    // User Existence and signature usage test
    try {
      const user = await sigUsage(signature, userId);

      // transaction verification
      await verifyTransaction(signature, res, responsesNeeded, user.address);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(400).json({ message: "An unknown error occurred" });
      }
    }

    // task creation
    let response = await prisma.$transaction(async (tx) => {
      const response = await tx.task.create({
        data: {
          title: parsedData.data.title,
          amount: (responsesNeeded / 1000) * TOTAL_DECIMALS, // Calculate amount based on responses needed
          signature: parsedData.data.signature,
          user_id: userId,
          country: parsedData.data.country ? parsedData.data.country : null,
        },
      });

      await tx.option.createMany({
        data: parsedData.data.options.map((x) => ({
          image_url: x.imageUrl,
          task_id: response.id,
        })),
      });

      return response;
    });

    return res.status(200).json({
      id: response.id,
    });
  } catch (error) {
    console.error("Error processing task:", error);
    return res.status(500).json({
      message: "An error occurred while processing the task",
      error: error,
    });
  }
});

userRouter.post("/survey", userMiddleware, async (req, res) => {
  const body = req.body;
  console.log(body);
  const userId = res.locals.userId;
  try {
    const parsedData = SurveyFormSchema.safeParse(body);

    if (!parsedData.success) {
      return res.status(400).json({
        message: "You've sent wrong inputs",
      });
    }
    console.log("parsedData: ", parsedData);
    const { survey, questions, signature, responsesNeeded, country } =
      parsedData.data;

    // User Existence and signature usage test
    try {
      const user = await sigUsage(signature, userId);

      // transaction verification
      await verifyTransaction(signature, res, responsesNeeded, user.address);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(400).json({ message: "An unknown error occurred" });
      }
    }

    // task creation
    const createdSurvey = await prisma.survey.create({
      data: {
        user_id: userId,
        title: survey.title,
        signature: signature,
        description: survey.description,
        amount: (responsesNeeded / 1000) * TOTAL_DECIMALS,
        questions: {
          create: questions
            .map((question, index) => {
              if (
                question.type === "multichoice" ||
                question.type === "checkbox"
              ) {
                return {
                  type:
                    question.type === "multichoice"
                      ? QuestionType.MULTIPLE_CHOICE
                      : QuestionType.CHECKBOXES,
                  question: question.question,
                  options: question.options || [], // Ensure options exist
                  description: null, // `description` is not needed for these question types
                  orderId: index + 1, // Adding orderId based on the iteration number (1-based)
                };
              } else if (question.type === "user_input") {
                return {
                  type: QuestionType.TEXT,
                  question: question.question,
                  options: [], // `options` is not needed for user_input type
                  description: question.description || null, // Handle description for user_input
                  orderId: index + 1, // Adding orderId based on the iteration number (1-based)
                };
              } else if (question.type === "date") {
                return {
                  type: QuestionType.DATE,
                  question: question.question,
                  options: [], // `options` is not needed for date type
                  description: null, // `description` is not needed for date type
                  orderId: index + 1, // Adding orderId based on the iteration number (1-based)
                };
              }
              return undefined; // Return undefined for unsupported question types
            })
            .filter((question) => question !== undefined), // Filter out undefined values
        },
      },
    });

    return res.status(200).json({
      id: createdSurvey.id,
    });
  } catch (error) {
    console.error("Error processing task:", error);
    return res.status(500).json({
      message: "An error occurred while processing the task",
      error: error,
    });
  }
});

// to get tasks in bulk
userRouter.get("/task/bulk", userMiddleware, async (req, res) => {
  const userId = res.locals.userId;

  try {
    // Fetch all tasks for the user
    const allTasks = await prisma.task.findMany({
      where: {
        user_id: userId,
      },
      include: {
        options: {
          include: {
            _count: {
              select: {
                submissions: true,
              },
            },
          },
        },
      },
    });

    return res.status(200).json(allTasks);
  } catch (e) {
    return res.status(500).json({
      error: e,
    });
  }
});

// Handler for fetching a single task by taskId
userRouter.get("/task/:taskId", userMiddleware, async (req, res) => {
  const userId = res.locals.userId;
  const taskId = req.params.taskId;

  // Check if taskId is a valid number
  if (isNaN(Number(taskId))) {
    return res.status(400).json({
      message: "Invalid taskId provided",
    });
  }

  try {
    const taskDetails = await prisma.task.findFirst({
      where: {
        id: Number(taskId),
        user_id: userId,
      },
    });

    if (!taskDetails) {
      return res.status(403).json({
        message: "You do not have access to this task",
      });
    }

    const results = await prisma.option.findMany({
      where: {
        task_id: Number(taskId),
      },
      include: {
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    return res.status(200).json(results);
  } catch (e) {
    return res.status(500).json({
      error: e,
    });
  }
});

userRouter.get(
  "/survey/csvdata/:surveyId",
  userMiddleware,
  async (req, res) => {
    const surveyId = req.params.surveyId;
    const responses = await prisma.response.findMany({
      where: { formId: surveyId },
      include: {
        survey: true,
        question: true,
        worker: true,
      },
    });
    console.log(responses);
    // Transform data for CSV
    const csvData = responses.map((res) => ({
      SurveyID: res.formId,
      QuestionID: res.questionId,
      WorkerID: res.worker_id,
      Qtype: res.question.type,
      Question: res.question.question,
      Answer: Array.isArray(res.answer) ? res.answer.join(", ") : res.answer,
    }));
    return res.status(200).json({ csvData });
  }
);

userRouter.get("/survey/bulk", userMiddleware, async (req, res) => {
  const userId = res.locals.userId;
  const responses = await prisma.survey.findMany({
    where: {
      user_id: userId,
    },
  });

  return res.status(200).json({ responses });
});
export default userRouter;
