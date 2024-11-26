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
const zod_1 = __importDefault(require("zod"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const workerMiddleware_1 = require("../middlewares/workerMiddleware");
const db_1 = require("../db");
const types_1 = require("../types");
const web3_js_1 = require("@solana/web3.js");
const bs58_1 = __importDefault(require("bs58"));
const tweetnacl_1 = __importDefault(require("tweetnacl"));
const types_2 = require("../types");
const workerRouter = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.WORKER_JWT_SECRET;
const TOTAL_DECIMALS = Number(process.env.TOTAL_DECIMALS) || 1000000; //lamports
// Solana connection (replace with your RPC endpoint)
const connection = new web3_js_1.Connection("https://api.devnet.solana.com", "confirmed");
// Server's keypair (replace with your actual secret key)
const payerSecretKey = bs58_1.default.decode(process.env.SECRET_KEY);
const payerKeypair = web3_js_1.Keypair.fromSecretKey(payerSecretKey);
workerRouter.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    const parsedData = types_2.signinBodySchema.safeParse(body);
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
            const worker = yield prisma.worker.upsert({
                where: {
                    address: publicKey,
                },
                update: {},
                create: {
                    address: publicKey,
                    pending_amt: 0,
                    locked_amt: 0,
                },
            });
            const token = jsonwebtoken_1.default.sign({ workerId: worker.id }, JWT_SECRET);
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
workerRouter.post("/checkredir", workerMiddleware_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const workerId = Number(res.locals.workerId);
        const body = req.body;
        const checkInput = zod_1.default.object({
            taskId: zod_1.default.string(),
        });
        const parsedBody = checkInput.safeParse(body);
        if (parsedBody.success) {
            const validtask = yield prisma.task.findFirst({
                where: {
                    id: Number(parsedBody.data.taskId),
                    done: false,
                    submission: {
                        none: {
                            worker_id: workerId,
                        },
                    },
                },
            });
            if (!validtask) {
                return res.status(400).json({
                    msg: "Incorrect Task Id",
                });
            }
            else {
                return res.status(200).json({
                    msg: "Correct task id",
                });
            }
        }
    }
    catch (e) {
        return res.status(500).json({
            e,
        });
    }
}));
workerRouter.post("/redirsub", workerMiddleware_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const workerId = Number(res.locals.workerId);
        const body = req.body;
        const parsedBody = types_1.createSubmissionInput.safeParse(body);
        if (parsedBody.success) {
            const validtask = yield prisma.task.findFirst({
                where: {
                    id: Number(parsedBody.data.taskId),
                    done: false,
                    submission: {
                        none: {
                            worker_id: workerId,
                        },
                    },
                },
            });
            if (!validtask) {
                return res.status(400).json({
                    msg: "Incorrect Task Id",
                });
            }
            const responsesNeeded = (validtask.amount / TOTAL_DECIMALS) * 1000;
            console.log(responsesNeeded); // Convert total lamports to SOL and calculate responses needed
            const amountPerResponse = validtask.amount / responsesNeeded; // Amount per response in SOL
            console.log(amountPerResponse);
            const submission = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
                // Create the submission
                const newSubmission = yield tx.submission.create({
                    data: {
                        option_id: Number(parsedBody.data.selection),
                        worker_id: workerId,
                        task_id: Number(parsedBody.data.taskId),
                        amount: amountPerResponse,
                    },
                });
                // Update the worker's pending amount
                yield tx.worker.update({
                    where: {
                        id: workerId,
                    },
                    data: {
                        pending_amt: {
                            increment: Number(amountPerResponse),
                        },
                    },
                });
                // Check the number of submissions for this task
                const totalSubmissions = yield tx.submission.count({
                    where: { task_id: validtask.id },
                });
                // Calculate the required responses based on the original task amount
                const responsesNeeded = (validtask.amount / TOTAL_DECIMALS) * 1000; // Responses needed
                // Update the task's done status if it meets the requirements
                if (totalSubmissions >= responsesNeeded) {
                    yield tx.task.update({
                        where: { id: validtask.id },
                        data: { done: true },
                    });
                }
                return newSubmission;
            }));
            return res.status(200).json({
                submission,
            });
        }
        else {
            return res.status(400).json({
                error: "Incorrect inputs",
            });
        }
    }
    catch (e) {
        return res.status(500).json({
            e,
        });
    }
}));
workerRouter.get("/nexttask", workerMiddleware_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const workerId = Number(res.locals.workerId);
        const country = req.query.country ? String(req.query.country) : undefined;
        console.log(workerId);
        const task = yield (0, db_1.getNextTask)({ workerId, country });
        if (!task) {
            return res.status(404).json({
                msg: "There are no tasks left for you to review",
            });
        }
        else {
            return res.status(200).json({
                task,
            });
        }
    }
    catch (e) {
        return res.status(500).json({
            e,
        });
    }
}));
workerRouter.post("/submission", workerMiddleware_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const workerId = Number(res.locals.workerId);
        const body = req.body;
        const parsedBody = types_1.createSubmissionInput.safeParse(body);
        const country = req.query.country ? String(req.query.country) : undefined;
        if (parsedBody.success) {
            const task = yield (0, db_1.getNextTask)({ workerId, country });
            if (!task || (task === null || task === void 0 ? void 0 : task.id) !== Number(parsedBody.data.taskId)) {
                return res.status(400).json({
                    msg: "Incorrect Task Id",
                });
            }
            // Assuming task.amount is in SOL
            const responsesNeeded = (task.amount / TOTAL_DECIMALS) * 1000;
            console.log(responsesNeeded); // Convert total lamports to SOL and calculate responses needed
            const amountPerResponse = task.amount / responsesNeeded; // Amount per response in SOL
            console.log(amountPerResponse);
            const submission = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
                // Create the submission
                const newSubmission = yield tx.submission.create({
                    data: {
                        option_id: Number(parsedBody.data.selection),
                        worker_id: workerId,
                        task_id: Number(parsedBody.data.taskId),
                        amount: amountPerResponse,
                    },
                });
                // Update the worker's pending amount
                yield tx.worker.update({
                    where: {
                        id: workerId,
                    },
                    data: {
                        pending_amt: {
                            increment: Number(amountPerResponse),
                        },
                    },
                });
                // Check the number of submissions for this task
                const totalSubmissions = yield tx.submission.count({
                    where: { task_id: task.id },
                });
                // Calculate the required responses based on the original task amount
                const responsesNeeded = (task.amount / TOTAL_DECIMALS) * 1000; // Responses needed
                // Update the task's done status if it meets the requirements
                if (totalSubmissions >= responsesNeeded) {
                    yield tx.task.update({
                        where: { id: task.id },
                        data: { done: true },
                    });
                }
                return newSubmission;
            }));
            const nextTask = yield (0, db_1.getNextTask)({ workerId, country });
            if (!nextTask) {
                return res.status(200).json({
                    msg: "There are no tasks left for you to review",
                });
            }
            else {
                return res.status(200).json({
                    nextTask,
                });
            }
        }
        else {
            return res.status(400).json({
                error: "Incorrect inputs",
            });
        }
    }
    catch (e) {
        return res.status(500).json({
            e,
        });
    }
}));
workerRouter.get("/balance", workerMiddleware_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const workerId = res.locals.workerId;
    const worker = yield prisma.worker.findFirst({
        where: {
            id: workerId,
        },
        select: {
            locked_amt: true,
            pending_amt: true,
        },
    });
    if (!worker) {
        return res.status(498).json({
            msg: "Invalid token",
        });
    }
    else {
        return res.status(200).json({
            lockedAmount: worker === null || worker === void 0 ? void 0 : worker.locked_amt,
            pendingAmount: worker === null || worker === void 0 ? void 0 : worker.pending_amt,
        });
    }
}));
workerRouter.get("/payout", workerMiddleware_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const workerId = res.locals.workerId;
    const worker = yield prisma.worker.findFirst({
        where: {
            id: workerId,
        },
    });
    if (!worker) {
        res.status(404).json({
            msg: "worker not found",
        });
    }
    else if (worker.pending_amt == 0) {
        return res.status(400).json({
            msg: "not enough amount to payout",
        });
    }
    const address = worker === null || worker === void 0 ? void 0 : worker.address;
    console.log(worker);
    const workerPublicKey = new web3_js_1.PublicKey(address);
    try {
        const transaction = new web3_js_1.Transaction().add(web3_js_1.SystemProgram.transfer({
            fromPubkey: payerKeypair.publicKey,
            toPubkey: workerPublicKey,
            lamports: ((worker === null || worker === void 0 ? void 0 : worker.pending_amt) / TOTAL_DECIMALS) * web3_js_1.LAMPORTS_PER_SOL,
        }));
        const { context: { slot: minContextSlot }, value: { blockhash, lastValidBlockHeight }, } = yield connection.getLatestBlockhashAndContext();
        const signature = yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [
            payerKeypair,
        ]);
        yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            yield tx.worker.update({
                where: {
                    id: workerId,
                },
                data: {
                    pending_amt: {
                        decrement: worker === null || worker === void 0 ? void 0 : worker.pending_amt,
                    },
                    locked_amt: {
                        increment: worker === null || worker === void 0 ? void 0 : worker.pending_amt,
                    },
                },
            });
            console.log("here");
            yield tx.payouts.create({
                data: {
                    worker_id: workerId,
                    amount: (_a = worker === null || worker === void 0 ? void 0 : worker.pending_amt) !== null && _a !== void 0 ? _a : 0,
                    signature: signature,
                },
            });
            console.log("here");
        }));
        return res.status(200).json({
            message: "Payment done",
            amount: worker === null || worker === void 0 ? void 0 : worker.pending_amt,
        });
    }
    catch (e) {
        res.status(500).json({
            message: "transaction failed",
        });
    }
}));
workerRouter.get('/payout/bulk', workerMiddleware_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const workerId = res.locals.workerId;
    try {
        const payoutTableData = yield prisma.payouts.findMany({
            where: {
                worker_id: workerId
            }
        });
        if (payoutTableData.length == 0) {
            return res.status(200).json({
                msg: "Not any data"
            });
        }
        else {
            return res.status(200).json({
                payoutTableData
            });
        }
    }
    catch (e) {
        return res.status(500).json({
            message: "Internal server error",
        });
    }
}));
exports.default = workerRouter;
