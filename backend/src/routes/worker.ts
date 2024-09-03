import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import jwt from "jsonwebtoken";

const workerRouter = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET as string;

workerRouter.post("/signin", async (req, res) => {
    // Todo: add sign verification logic here
    const hardCodedWalletAddress = "obysaKv1D81BDkrobysaKv1D81BDkr"
    try{
    const user = await prisma.worker.upsert({
        where:{
            address: hardCodedWalletAddress
        },
        update:{},
        create:{
            address: hardCodedWalletAddress,
            balance_id: 0,
            pending_amt: 0,
            locked_amt: 0
        }
    })
    const token = jwt.sign({userId: user.id}, JWT_SECRET)
    return res.json({
        token
    })
    }catch(e){
        return res.json({
            error: e
        })
    }
})


export default workerRouter;