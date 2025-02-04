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
const web3_js_1 = require("@solana/web3.js");
const tweetnacl_1 = __importDefault(require("tweetnacl"));
const bs58_1 = __importDefault(require("bs58"));
const types_2 = require("../types");
const userRouter = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;
const TOTAL_DECIMALS = Number(process.env.TOTAL_DECIMALS) || 1000000; // lamports
const connection = new web3_js_1.Connection((0, web3_js_1.clusterApiUrl)("devnet"), "confirmed");
const PARENT_WALLET_ADDRESS = "EobSbVfVHF4CEFurp2QDJjrbRRCowLRrr1EVWPDh89Ju";
const RETRY_DELAY = 500;
function getTransactionStatus(signature_1) {
    return __awaiter(this, arguments, void 0, function* (signature, retryCount = 30) {
        const status = yield connection.getSignatureStatus(signature);
        if (status.value === null) {
            if (retryCount < 10) {
                console.log(`Transaction status not available. Retrying in ${RETRY_DELAY}ms...`);
                yield new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
                return getTransactionStatus(signature, retryCount + 1);
            }
            else {
                throw new Error("Transaction status not available after maximum retries");
            }
        }
        return status;
    });
}
// signin with wallet
userRouter.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    const parsedData = types_1.signinBodySchema.safeParse(body);
    if (!parsedData.success) {
        return res.status(400).json({
            message: "You've sent wrong inputs",
        });
    }
    const { publicKey, signature, message } = parsedData.data || {};
    try {
        const publicKeyUint8 = bs58_1.default.decode(publicKey);
        const messageUint8 = new TextEncoder().encode(message);
        // Verify the signature
        const isValidSignature = tweetnacl_1.default.sign.detached.verify(messageUint8, new Uint8Array(signature.data), // Assuming signature is sent as Buffer-like object
        publicKeyUint8);
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
            return res.status(200).json({
                token,
            });
        }
        else {
            return res.status(400).json({
                message: "InvalidSignature",
            });
        }
    }
    catch (e) {
        return res.status(500).json({
            error: e,
        });
    }
}));
// In userRouter
userRouter.post("/task", userMiddleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
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
        const user = yield prisma.user.findFirst({
            where: {
                id: userId,
            },
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const transaction = yield connection.getTransaction(signature, {
            maxSupportedTransactionVersion: 1,
        });
        console.log("transaction: ", transaction);
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }
        const status = yield getTransactionStatus(signature);
        console.log("status: ", status);
        //check if txnValid
        // const isValid = await connection.confirmTransaction(signature, "confirmed");
        //     if (!isValid) {
        //         return res.status(411).json({ message: "Invalid transaction signature" });
        // }
        // console.log(isValid)
        const currentTime = new Date().getTime() / 1000;
        if ((transaction === null || transaction === void 0 ? void 0 : transaction.blockTime) && currentTime - (transaction === null || transaction === void 0 ? void 0 : transaction.blockTime) > 300) {
            return res.status(411).json({ message: "Transaction is too old" });
        }
        console.log("currentTime:", currentTime);
        const transferAmount = transaction.meta.postBalances[1] - transaction.meta.preBalances[1];
        if (transferAmount !== (responsesNeeded / 1000) * web3_js_1.LAMPORTS_PER_SOL) {
            return res.status(411).json({ message: "Incorrect transaction amount" });
        }
        console.log("transferAmount: ", transferAmount);
        const senderAddress = (_a = transaction === null || transaction === void 0 ? void 0 : transaction.transaction.message.getAccountKeys().get(0)) === null || _a === void 0 ? void 0 : _a.toString();
        const recipientAddress = (_b = transaction === null || transaction === void 0 ? void 0 : transaction.transaction.message.getAccountKeys().get(1)) === null || _b === void 0 ? void 0 : _b.toString();
        console.log(senderAddress, recipientAddress, "address");
        if (senderAddress !== user.address) {
            return res
                .status(411)
                .json({ message: "Transaction not sent from user's address" });
        }
        if (recipientAddress !== PARENT_WALLET_ADDRESS) {
            return res
                .status(411)
                .json({ message: "Transaction not sent to correct address" });
        }
        const existingTask = yield prisma.task.findFirst({
            where: { signature: signature },
        });
        if (existingTask) {
            return res
                .status(409)
                .json({ message: "This transaction has already been used" });
        }
        console.log("Transfer amount:", transferAmount);
        console.log("Expected amount:", (responsesNeeded / 1000) * web3_js_1.LAMPORTS_PER_SOL);
        console.log("Sender address:", senderAddress);
        console.log("Recipient address:", recipientAddress);
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
    var _a, _b;
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
        const user = yield prisma.user.findFirst({
            where: {
                id: userId,
            },
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        try {
            const transaction = yield connection.getTransaction(signature, {
                maxSupportedTransactionVersion: 1,
            });
            // If the transaction is null or undefined, return 400 response
            if (!transaction) {
                return res.status(400).json({
                    error: "Transaction not found",
                });
            }
            console.log("transaction: ", transaction);
            if (!transaction) {
                return res.status(404).json({ message: "Transaction not found" });
            }
            const status = yield getTransactionStatus(signature);
            console.log("status: ", status);
            //check if txnValid
            // const isValid = await connection.confirmTransaction(signature, "confirmed");
            //     if (!isValid) {
            //         return res.status(411).json({ message: "Invalid transaction signature" });
            // }
            // console.log(isValid)
            const currentTime = new Date().getTime() / 1000;
            if ((transaction === null || transaction === void 0 ? void 0 : transaction.blockTime) &&
                currentTime - (transaction === null || transaction === void 0 ? void 0 : transaction.blockTime) > 300) {
                return res.status(411).json({ message: "Transaction is too old" });
            }
            console.log("currentTime:", currentTime);
            const transferAmount = transaction.meta.postBalances[1] - transaction.meta.preBalances[1];
            if (transferAmount !== (responsesNeeded / 1000) * web3_js_1.LAMPORTS_PER_SOL) {
                return res
                    .status(411)
                    .json({ message: "Incorrect transaction amount" });
            }
            console.log("transferAmount: ", transferAmount);
            const senderAddress = (_a = transaction === null || transaction === void 0 ? void 0 : transaction.transaction.message.getAccountKeys().get(0)) === null || _a === void 0 ? void 0 : _a.toString();
            const recipientAddress = (_b = transaction === null || transaction === void 0 ? void 0 : transaction.transaction.message.getAccountKeys().get(1)) === null || _b === void 0 ? void 0 : _b.toString();
            console.log(senderAddress, recipientAddress, "address");
            if (senderAddress !== user.address) {
                return res
                    .status(411)
                    .json({ message: "Transaction not sent from user's address" });
            }
            if (recipientAddress !== PARENT_WALLET_ADDRESS) {
                return res
                    .status(411)
                    .json({ message: "Transaction not sent to correct address" });
            }
            const existingTask = yield prisma.task.findFirst({
                where: { signature: signature },
            });
            if (existingTask) {
                return res
                    .status(409)
                    .json({ message: "This transaction has already been used" });
            }
            console.log("Transfer amount:", transferAmount);
            console.log("Expected amount:", (responsesNeeded / 1000) * web3_js_1.LAMPORTS_PER_SOL);
            console.log("Sender address:", senderAddress);
            console.log("Recipient address:", recipientAddress);
        }
        catch (error) {
            console.error("Error fetching transaction:", error);
            return res.status(400).json({
                error: "invalid transaction signature",
            });
        }
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
exports.default = userRouter;
