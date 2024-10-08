import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET as string;

export function userMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const token = req.headers.authorization?.split(" ")[1] || "";
        // console.log(token);
        
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;  // Type assertion
        
        if (decoded && typeof decoded === 'object' && decoded.userId) {
            res.locals.userId = Number(decoded.userId);
            console.log(res.locals.userId)
        }
        next();
    } catch (e) {
        return res.status(403).json({
            error: e
        });
    }
}
