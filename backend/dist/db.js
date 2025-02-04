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
exports.getNextQuestion = exports.getNextTask = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getNextTask = (_a) => __awaiter(void 0, [_a], void 0, function* ({ workerId, country }) {
    console.log("Fetching next task for workerId:", workerId, "and country:", country);
    const whereCondition = {
        country: null,
        done: false,
        submission: {
            none: {
                worker_id: workerId,
            },
        },
    };
    if (country) {
        whereCondition.country = country;
    }
    else {
        whereCondition.country = null;
    }
    const task = yield prisma.task.findFirst({
        where: whereCondition,
        select: {
            title: true,
            options: true,
            id: true,
            amount: true,
        },
    });
    console.log("Found task:", task);
    return task;
});
exports.getNextTask = getNextTask;
const getNextQuestion = (_a) => __awaiter(void 0, [_a], void 0, function* ({ workerId }) {
    console.log("Fetching next survey for workerId:", workerId);
    const surveyWithPartialResponses = yield prisma.survey.findFirst({
        where: {
            NOT: {
                questions: {
                    every: {
                        responses: {
                            some: {
                                worker_id: workerId,
                            },
                        },
                    },
                },
            },
        },
    });
    // console.log(surveyWithPartialResponses);
    if (surveyWithPartialResponses == null) {
        const surveyWithNoResponses = yield prisma.survey.findFirst({
            where: {
                responses: {
                    none: {
                        worker_id: workerId,
                    },
                },
            },
            include: {
                questions: true,
            },
        });
        // console.log(surveyWithNoResponses);
        return surveyWithNoResponses === null || surveyWithNoResponses === void 0 ? void 0 : surveyWithNoResponses.questions[0];
    }
    else {
        const nextQuestion = yield prisma.question.findFirst({
            where: {
                formId: surveyWithPartialResponses === null || surveyWithPartialResponses === void 0 ? void 0 : surveyWithPartialResponses.id,
                responses: {
                    none: {
                        worker_id: workerId,
                    },
                },
            },
        });
        // console.log(nextQuestion);
        return nextQuestion;
    }
});
exports.getNextQuestion = getNextQuestion;
