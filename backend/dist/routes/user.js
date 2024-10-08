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
const userRouter = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;
const TOTAL_DECIMALS = Number(process.env.TOTAL_DECIMALS) || 1000000;
// signin with wallet
userRouter.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Todo: add sign verification logic here
    const hardCodedWalletAddress = "obysaKv1D81BDkrobysaKv1D81BDkr";
    try {
        const user = yield prisma.user.upsert({
            where: {
                address: hardCodedWalletAddress
            },
            update: {},
            create: {
                address: hardCodedWalletAddress
            }
        });
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET);
        return res.status(200).json({
            token
        });
    }
    catch (e) {
        return res.status(500).json({
            error: e
        });
    }
}));
userRouter.post('/task', userMiddleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    const id = res.locals.userId;
    const parsedData = types_1.createTaskInput.safeParse(body);
    if (!parsedData.success) {
        return res.status(400).json({
            message: "You've sent wrong inputs"
        });
    }
    try {
        // TASK : PARSE AND VERIFY SIGNATURE
        let response = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield tx.task.create({
                data: {
                    title: parsedData.data.title,
                    amount: 1 * TOTAL_DECIMALS, // lamports
                    signature: parsedData.data.signature,
                    user_id: id
                }
            });
            yield tx.option.createMany({
                data: parsedData.data.options.map(x => ({
                    image_url: x.imageUrl,
                    task_id: response.id
                }))
            });
            return response;
        }));
        return res.status(200).json({
            id: response.id
        });
    }
    catch (e) {
        return res.status(500).json({
            error: e
        });
    }
}));
userRouter.get('/task/bulk', userMiddleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = res.locals.userId;
    try {
        // Fetch all tasks for the user
        const allTasks = yield prisma.task.findMany({
            where: {
                user_id: userId
            },
            include: {
                options: {
                    include: {
                        _count: {
                            select: {
                                submissions: true
                            }
                        }
                    }
                }
            }
        });
        return res.status(200).json(allTasks);
    }
    catch (e) {
        return res.status(500).json({
            error: e
        });
    }
}));
// Handler for fetching a single task by taskId
userRouter.get('/task/:taskId', userMiddleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = res.locals.userId;
    const taskId = req.params.taskId;
    // Check if taskId is a valid number
    if (isNaN(Number(taskId))) {
        return res.status(400).json({
            message: "Invalid taskId provided"
        });
    }
    try {
        const taskDetails = yield prisma.task.findFirst({
            where: {
                id: Number(taskId),
                user_id: userId
            }
        });
        if (!taskDetails) {
            return res.status(403).json({
                message: "You do not have access to this task"
            });
        }
        const results = yield prisma.option.findMany({
            where: {
                task_id: Number(taskId)
            },
            include: {
                _count: {
                    select: {
                        submissions: true
                    }
                }
            }
        });
        return res.status(200).json(results);
    }
    catch (e) {
        return res.status(500).json({
            error: e
        });
    }
}));
exports.default = userRouter;
