import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middleware";
import { createTaskInput } from "../types";

const userRouter = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET as string;
const DEFAULT_TITLE = "Select the most clickable thumbnail."

// signin with wallet
userRouter.post("/signin", async (req, res) => {
    // Todo: add sign verification logic here
    const hardCodedWalletAddress = "obysaKv1D81BDkrobysaKv1D81BDkr"
    try{
    const user = await prisma.user.upsert({
        where:{
            address: hardCodedWalletAddress
        },
        update:{},
        create:{
            address: hardCodedWalletAddress
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

userRouter.post('/task', authMiddleware, async (req, res) => {
    const body = req.body;
    const id = res.locals.userId;

    const parsedData = createTaskInput.safeParse(body);

    if(!parsedData.success){
        return res.status(411).json({
            messgae: "You've sent wrong inputs"
        })
    }

    // TASK : PARSE AND VERIFY SIGNATURE
    let response = await prisma.$transaction(async tx => {
        const response = await tx.task.create({
            data: {
                title: parsedData.data.title,
                amount: "1",
                signature: parsedData.data.signature,
                user_id: id
            }
        })

        await tx.option.createMany({
            data: parsedData.data.options.map(x => ({
                image_url: x.imageUrl,
                task_id: response.id
            }))
        })

        return response;
    })

    return res.json({
        id: response.id
    })
})


userRouter.get('/task/:taskId', authMiddleware, async (req, res) => {
    const userId = res.locals.userId;
    const taskId = req.params.taskId;

    const taskDetails = await prisma.task.findFirst({
        where: {
            id: Number(taskId),
            user_id: userId
        }
    })

    if(!taskDetails){
        return res.status(411).json({
            message: "You do not have access to this task"
        })
    }

    const submissionCounts = await prisma.submission.groupBy({
        by: ['option_id'],
        where: {
            task_id: Number(taskId)
        },
        _count: {
            id: true, // Count the number of submissions per option
        }
    });
    
    const results = await prisma.option.findMany({
        where: {
            task_id: Number(taskId)
        },
        include: {
            _count: {
                select: {
                    submissions: true
                }
            }
        }
    });
    
    return res.status(200).json(results);
    
})

export default userRouter;