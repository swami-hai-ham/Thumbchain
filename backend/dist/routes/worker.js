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
const workerRouter = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;
workerRouter.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Todo: add sign verification logic here
    const hardCodedWalletAddress = "obysaKv1D81BDkrobysaKv1D81BDkr";
    try {
        const user = yield prisma.worker.upsert({
            where: {
                address: hardCodedWalletAddress
            },
            update: {},
            create: {
                address: hardCodedWalletAddress,
                balance_id: 0,
                pending_amt: 0,
                locked_amt: 0
            }
        });
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET);
        return res.json({
            token
        });
    }
    catch (e) {
        return res.json({
            error: e
        });
    }
}));
exports.default = workerRouter;
