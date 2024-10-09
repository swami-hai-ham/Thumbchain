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
const workerMiddleware_1 = require("../middlewares/workerMiddleware");
const db_1 = require("../db");
const types_1 = require("../types");
const workerRouter = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.WORKER_JWT_SECRET;
const TOTAL_SUBMISSIONS = 100;
const TOTAL_DECIMALS = Number(process.env.TOTAL_DECIMALS) || 1000000;
workerRouter.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Todo: add sign verification logic here
    const hardCodedWalletAddress = "obysaKv1D81BDkrobysaKv1D81BDkr" + `${Math.random()}`;
    try {
        const worker = yield prisma.worker.upsert({
            where: {
                address: hardCodedWalletAddress
            },
            update: {},
            create: {
                address: hardCodedWalletAddress,
                pending_amt: 0,
                locked_amt: 0
            }
        });
        const token = jsonwebtoken_1.default.sign({ workerId: worker.id }, JWT_SECRET);
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
workerRouter.get('/nexttask', workerMiddleware_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const workerId = Number(res.locals.workerId);
        const country = req.query.country ? String(req.query.country) : undefined;
        console.log(workerId);
        const task = yield (0, db_1.getNextTask)({ workerId, country });
        if (!task) {
            return res.status(404).json({
                msg: "There are no tasks left for you to review"
            });
        }
        else {
            return res.status(200).json({
                task
            });
        }
    }
    catch (e) {
        return res.status(500).json({
            e
        });
    }
}));
workerRouter.post('/submission', workerMiddleware_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const workerId = Number(res.locals.workerId);
        const body = req.body;
        const parsedBody = types_1.createSubmissionInput.safeParse(body);
        const country = req.query.country ? String(req.query.country) : undefined;
        if (parsedBody.success) {
            console.log(workerId);
            const task = yield (0, db_1.getNextTask)({ workerId, country });
            console.log(task);
            if (!task || (task === null || task === void 0 ? void 0 : task.id) !== Number(parsedBody.data.taskId)) {
                console.log(task, parsedBody.data);
                return res.status(400).json({
                    msg: "Incorrect Task Id"
                });
            }
            const amount = task.amount / TOTAL_SUBMISSIONS;
            console.log(amount);
            const submission = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
                const submission = yield tx.submission.create({
                    data: {
                        option_id: Number(parsedBody.data.selection),
                        worker_id: workerId,
                        task_id: Number(parsedBody.data.taskId),
                        amount: amount
                    }
                });
                yield tx.worker.update({
                    where: {
                        id: workerId
                    },
                    data: {
                        pending_amt: {
                            increment: Number(amount)
                        }
                    }
                });
                return submission;
            }));
            const nextTask = yield (0, db_1.getNextTask)({ workerId, country });
            if (!nextTask) {
                return res.status(200).json({
                    msg: "There are no tasks left for you to review"
                });
            }
            else {
                return res.status(200).json({
                    nextTask
                });
            }
        }
        else {
            return res.status(400).json({
                error: "Incorrect inputs"
            });
        }
    }
    catch (e) {
        return res.status(500).json({
            e
        });
    }
}));
workerRouter.get('/balance', workerMiddleware_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const workerId = res.locals.workerId;
    const worker = yield prisma.worker.findFirst({
        where: {
            id: workerId
        },
        select: {
            locked_amt: true,
            pending_amt: true
        }
    });
    if (!worker) {
        return res.status(498).json({
            msg: "Invalid token"
        });
    }
    else {
        return res.status(200).json({
            lockedAmount: worker === null || worker === void 0 ? void 0 : worker.locked_amt,
            pendingAmount: worker === null || worker === void 0 ? void 0 : worker.pending_amt
        });
    }
}));
workerRouter.get('/payout', workerMiddleware_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const workerId = res.locals.workerId;
    const worker = yield prisma.worker.findFirst({
        where: {
            id: workerId
        },
    });
    if (!worker) {
        res.status(404).json({
            msg: "worker not found"
        });
    }
    else if (worker.pending_amt == 0) {
        return res.json({
            msg: "not enought amount to payout"
        });
    }
    const address = worker === null || worker === void 0 ? void 0 : worker.address;
    console.log(worker);
    const txnId = "0x2323422312";
    prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        yield tx.worker.update({
            where: {
                id: workerId
            },
            data: {
                pending_amt: {
                    decrement: worker === null || worker === void 0 ? void 0 : worker.pending_amt
                },
                locked_amt: {
                    increment: worker === null || worker === void 0 ? void 0 : worker.pending_amt
                }
            }
        });
        console.log("here");
        yield tx.payouts.create({
            data: {
                worker_id: workerId,
                amount: (_a = worker === null || worker === void 0 ? void 0 : worker.pending_amt) !== null && _a !== void 0 ? _a : 0,
                status: "Processing",
                signature: txnId
            }
        });
        console.log("here");
    }));
    //Send the txn to blockchain
    return res.status(200).json({
        message: "processing request",
        amount: worker === null || worker === void 0 ? void 0 : worker.pending_amt
    });
}));
exports.default = workerRouter;
