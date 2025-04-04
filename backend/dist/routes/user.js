"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userMiddleware_1 = require("../middlewares/userMiddleware");
const types_1 = require("../types");
const tweetnacl_1 = __importDefault(require("tweetnacl"));
const bs58_1 = __importDefault(require("bs58"));
const types_2 = require("../types");
const VerifyTransaction_1 = require("../utils/VerifyTransaction");
const sigUsage_1 = require("../utils/sigUsage");
const userRouter = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;
const TOTAL_DECIMALS = Number(process.env.TOTAL_DECIMALS) || 1000000; // lamports
// signin with wallet
userRouter.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Parsing
    const body = req.body;
    const parsedData = types_1.signinBodySchema.safeParse(body);
    if (!parsedData.success) {
        return res.status(400).json({
            message: "You've sent wrong inputs",
        });
    }
    const { publicKey, signature, message } = parsedData.data || {};
    // Verification
    try {
        const publicKeyUint8 = bs58_1.default.decode(publicKey);
        const messageUint8 = new TextEncoder().encode(message);
        const isValidSignature = tweetnacl_1.default.sign.detached.verify(messageUint8, new Uint8Array(signature.data), publicKeyUint8);
        console.log(isValidSignature);
        if (isValidSignature) {
            const user = yield prisma.user.upsert({
                where: {
                    address: publicKey,
                },
                update: {},
                create: {
                    address: publicKey,
                },
            });
            const token = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET);
            // Success
            return res.status(200).json({
                token,
            });
        }
        else {
            // Failure
            return res.status(400).json({
                message: "InvalidSignature",
            });
        }
        // Try Catch Err
    }
    catch (e) {
        return res.status(500).json({
            error: e,
        });
    }
}));
userRouter.post("/task", userMiddleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Parsing
    const body = req.body;
    const userId = res.locals.userId;
    try {
        const parsedData = types_1.createTaskInput.safeParse(body);
        if (!parsedData.success) {
            return res.status(400).json({
                message: "You've sent wrong inputs",
            });
        }
        console.log("parsedData: ", parsedData);
        const { responsesNeeded, signature } = parsedData.data;
        // User Existence and signature usage test
        try {
            const user = yield (0, sigUsage_1.sigUsage)(signature, userId);
            // transaction verification
            yield (0, VerifyTransaction_1.verifyTransaction)(signature, res, responsesNeeded, user.address);
        }
        catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ message: error.message });
            }
            else {
                res.status(400).json({ message: "An unknown error occurred" });
            }
        }
        // task creation
        let response = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield tx.task.create({
                data: {
                    title: parsedData.data.title,
                    amount: (responsesNeeded / 1000) * TOTAL_DECIMALS, // Calculate amount based on responses needed
                    signature: parsedData.data.signature,
                    user_id: userId,
                    country: parsedData.data.country ? parsedData.data.country : null,
                },
            });
            yield tx.option.createMany({
                data: parsedData.data.options.map((x) => ({
                    image_url: x.imageUrl,
                    task_id: response.id,
                })),
            });
            return response;
        }));
        return res.status(200).json({
            id: response.id,
        });
    }
    catch (error) {
        console.error("Error processing task:", error);
        return res.status(500).json({
            message: "An error occurred while processing the task",
            error: error,
        });
    }
}));
userRouter.post("/survey", userMiddleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    console.log(body);
    const userId = res.locals.userId;
    try {
        const parsedData = types_2.SurveyFormSchema.safeParse(body);
        if (!parsedData.success) {
            return res.status(400).json({
                message: "You've sent wrong inputs",
            });
        }
        console.log("parsedData: ", parsedData);
        const { survey, questions, signature, responsesNeeded, country } = parsedData.data;
        // User Existence and signature usage test
        try {
            const user = yield (0, sigUsage_1.sigUsage)(signature, userId);
            // transaction verification
            yield (0, VerifyTransaction_1.verifyTransaction)(signature, res, responsesNeeded, user.address);
        }
        catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ message: error.message });
            }
            else {
                res.status(400).json({ message: "An unknown error occurred" });
            }
        }
        // task creation
        const createdSurvey = yield prisma.survey.create({
            data: {
                user_id: userId,
                title: survey.title,
                signature: signature,
                description: survey.description,
                amount: (responsesNeeded / 1000) * TOTAL_DECIMALS,
                questions: {
                    create: questions
                        .map((question, index) => {
                        if (question.type === "multichoice" ||
                            question.type === "checkbox") {
                            return {
                                type: question.type === "multichoice"
                                    ? client_1.QuestionType.MULTIPLE_CHOICE
                                    : client_1.QuestionType.CHECKBOXES,
                                question: question.question,
                                options: question.options || [], // Ensure options exist
                                description: null, // `description` is not needed for these question types
                                orderId: index + 1, // Adding orderId based on the iteration number (1-based)
                            };
                        }
                        else if (question.type === "user_input") {
                            return {
                                type: client_1.QuestionType.TEXT,
                                question: question.question,
                                options: [], // `options` is not needed for user_input type
                                description: question.description || null, // Handle description for user_input
                                orderId: index + 1, // Adding orderId based on the iteration number (1-based)
                            };
                        }
                        else if (question.type === "date") {
                            return {
                                type: client_1.QuestionType.DATE,
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
    }
    catch (error) {
        console.error("Error processing task:", error);
        return res.status(500).json({
            message: "An error occurred while processing the task",
            error: error,
        });
    }
}));
// to get tasks in bulk
userRouter.get("/task/bulk", userMiddleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = res.locals.userId;
    try {
        // Fetch all tasks for the user
        const allTasks = yield prisma.task.findMany({
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
    }
    catch (e) {
        return res.status(500).json({
            error: e,
        });
    }
}));
// Handler for fetching a single task by taskId
userRouter.get("/task/:taskId", userMiddleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = res.locals.userId;
    const taskId = req.params.taskId;
    // Check if taskId is a valid number
    if (isNaN(Number(taskId))) {
        return res.status(400).json({
            message: "Invalid taskId provided",
        });
    }
    try {
        const taskDetails = yield prisma.task.findFirst({
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
        const results = yield prisma.option.findMany({
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
    }
    catch (e) {
        return res.status(500).json({
            error: e,
        });
    }
}));
userRouter.get("/survey/csvdata/:surveyId", userMiddleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const surveyId = req.params.surveyId;
    const responses = yield prisma.response.findMany({
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
}));
userRouter.get("/survey/bulk", userMiddleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = res.locals.userId;
    const responses = yield prisma.survey.findMany({
        where: {
            user_id: userId,
        },
    });
    return res.status(200).json({ responses });
}));
exports.default = userRouter;
