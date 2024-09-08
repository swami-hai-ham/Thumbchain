"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userMiddleware = userMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET;
function userMiddleware(req, res, next) {
    var _a;
    try {
        const token = ((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1]) || "";
        console.log(token);
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET); // Type assertion
        if (decoded && typeof decoded === 'object' && decoded.userId) {
            res.locals.userId = Number(decoded.userId);
            console.log(res.locals.userId);
        }
        next();
    }
    catch (e) {
        return res.status(403).json({
            error: e
        });
    }
}
