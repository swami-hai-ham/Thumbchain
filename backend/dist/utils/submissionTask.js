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
Object.defineProperty(exports, "__esModule", { value: true });
exports.submissionTask = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const TOTAL_DECIMALS = Number(process.env.TOTAL_DECIMALS) || 1000000; //lamports
const submissionTask = (selection, taskId, workerId, amountPerResponse, validId, validAmount) => __awaiter(void 0, void 0, void 0, function* () {
    const submission = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        // Create the submission
        const newSubmission = yield tx.submission.create({
            data: {
                option_id: Number(selection),
                worker_id: workerId,
                task_id: Number(taskId),
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
            where: { task_id: validId },
        });
        // Calculate the required responses based on the original task amount
        const responsesNeeded = (validAmount / TOTAL_DECIMALS) * 1000; // Responses needed
        // Update the task's done status if it meets the requirements
        if (totalSubmissions >= responsesNeeded) {
            yield tx.task.update({
                where: { id: validId },
                data: { done: true },
            });
        }
        return newSubmission;
    }));
    return submission;
});
exports.submissionTask = submissionTask;
