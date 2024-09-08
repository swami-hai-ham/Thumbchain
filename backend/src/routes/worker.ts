import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { workerMiddleware } from "../middlewares/workerMiddleware";
import { getNextTask } from "../db";
import { createSubmissionInput } from "../types";

const workerRouter = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.WORKER_JWT_SECRET as string;
const TOTAL_SUBMISSIONS = 100;
const TOTAL_DECIMALS = Number(process.env.TOTAL_DECIMALS) || 1000_000;

workerRouter.post("/signin", async (req, res) => {
    // Todo: add sign verification logic here
    const hardCodedWalletAddress = "obysaKv1D81BDkrobysaKv1D81BDkr" + `${Math.random()}`
    try{
    const worker = await prisma.worker.upsert({
        where:{
            address: hardCodedWalletAddress
        },
        update:{},
        create:{
            address: hardCodedWalletAddress,
            pending_amt: 0,
            locked_amt: 0
        }
    })
    const token = jwt.sign({workerId: worker.id}, JWT_SECRET)
    return res.json({
        token
    })
    }catch(e){
        return res.json({
            error: e
        })
    }
})

workerRouter.get('/nexttask', workerMiddleware, async (req, res) => {
    const workerId = res.locals.workerId;
    console.log(workerId)
    const task = await getNextTask(Number(workerId))

    if(!task){
        return res.status(200).json({
            msg: "There are no tasks left for you to review"
        })
    }else{
        return res.status(200).json({
            task
        })
    }
})

workerRouter.post('/submission', workerMiddleware, async (req, res) => {
    const workerId = res.locals.workerId;
    const body = req.body;
    const parsedBody = createSubmissionInput.safeParse(body);

    if(parsedBody.success){
        const task = await getNextTask(Number(workerId));
        if(!task || task?.id !== Number(parsedBody.data.taskId)){
            return res.json({
                msg: "Incorrect Task Id"
            })
        }
        const amount = task.amount/ TOTAL_SUBMISSIONS;
        console.log(amount)

        const submission = await prisma.$transaction(async tx => {
            const submission = await tx.submission.create({
                data: {
                    option_id: Number(parsedBody.data.selection),
                    worker_id: workerId,
                    task_id: Number(parsedBody.data.taskId),
                    amount: amount
                }
            })

            await tx.worker.update({
                where: {
                    id: workerId
                },
                data: {
                    pending_amt : {
                        increment: Number(amount)
                    }
                }
            })

            return submission;
        })
        

        const nextTask = await getNextTask(workerId);
        return res.json({
            nextTask,
            amount
        })
    }else{

    }
})

workerRouter.get('/balance', workerMiddleware, async (req, res) => {
    const workerId = res.locals.workerId;
    const worker = await prisma.worker.findFirst({
        where: {
            id: workerId
        },
        select: {
            locked_amt: true, 
            pending_amt: true
        }
    })

    if(!worker){
        return res.status(498).json({
            msg: "Invalid token"
        })
    }else{
        return res.status(200).json({
            lockedAmount: worker?.locked_amt,
            pendingAmount: worker?.pending_amt
        })
    }
})


workerRouter.get('/payout', workerMiddleware, async (req, res) => {
    const workerId = res.locals.workerId;
    const worker = await prisma.worker.findFirst({
        where: {
            id: workerId
        },
    })

    if(!worker){
        res.status(404).json({
            msg: "worker not found"
        })
    }else if(worker.pending_amt == 0){
        return res.json({
            msg: "not enought amount to payout"
        })
    }

    const address = worker?.address;
    console.log(worker)
    const txnId = "0x2323422312";

    prisma.$transaction(async tx => {
        await tx.worker.update({
            where: {
                id: workerId
            }, 
            data: {
                pending_amt: {
                    decrement: worker?.pending_amt
                }, 
                locked_amt: {
                    increment: worker?.pending_amt
                }
            }
        })
        console.log("here")
        await tx.payouts.create({
            data: {
                worker_id: workerId,
                amount: worker?.pending_amt ?? 0,
                status: "Processing",
                signature: txnId
            }
        })
        console.log("here")
    })

    //Send the txn to blockchain

    return res.status(200).json({
        message: "processing request",
        amount: worker?.pending_amt
    })
})
export default workerRouter;