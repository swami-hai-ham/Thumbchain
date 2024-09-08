import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from 'jsonwebtoken';
const JWT_SECRET = process.env.WORKER_JWT_SECRET as string;

export function workerMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const token = req.headers.authorization?.split(" ")[1] || "";
        console.log(token);
        
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;  // Type assertion
        console.log(decoded)
        
        if (decoded && typeof decoded === 'object' && decoded.workerId) {
            res.locals.workerId = Number(decoded.workerId);
            console.log(Number(decoded.workerId))
        }
        next();
    } catch (e) {
        return res.status(403).json({
            error: e
        });
    }
}
