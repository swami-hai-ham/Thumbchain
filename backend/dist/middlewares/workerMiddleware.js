"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.workerMiddleware = workerMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.WORKER_JWT_SECRET;
function workerMiddleware(req, res, next) {
    var _a;
    try {
        const token = ((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1]) || "";
        console.log(token);
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET); // Type assertion
        console.log(decoded);
        if (decoded && typeof decoded === 'object' && decoded.workerId) {
            res.locals.workerId = Number(decoded.workerId);
            console.log(Number(decoded.workerId));
        }
        next();
    }
    catch (e) {
        return res.status(403).json({
            error: e
        });
    }
}
