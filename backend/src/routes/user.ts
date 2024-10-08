import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { userMiddleware } from "../middlewares/userMiddleware";
import { createTaskInput } from "../types";

const userRouter = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET as string;
const TOTAL_DECIMALS = Number(process.env.TOTAL_DECIMALS) || 1000_000;

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
    return res.status(200).json({
        token
    })
    }catch(e){
        return res.status(500).json({
            error: e
        })
    }


})

userRouter.post('/task', userMiddleware, async (req, res) => {
    const body = req.body;
    const id = res.locals.userId;

    const parsedData = createTaskInput.safeParse(body);

    if (!parsedData.success) {
        return res.status(400).json({
            message: "You've sent wrong inputs"
        });
    }

    try {
        // TASK : PARSE AND VERIFY SIGNATURE
        let response = await prisma.$transaction(async tx => {
            const response = await tx.task.create({
                data: {
                    title: parsedData.data.title,
                    amount: 1 * TOTAL_DECIMALS, // lamports
                    signature: parsedData.data.signature,
                    user_id: id
                }
            });

            await tx.option.createMany({
                data: parsedData.data.options.map(x => ({
                    image_url: x.imageUrl,
                    task_id: response.id
                }))
            });

            return response;
        });

        return res.status(200).json({
            id: response.id
        });
    } catch (e) {
        return res.status(500).json({
            error: e
        });
    }
});


userRouter.get('/task/bulk', userMiddleware, async (req, res) => {
    const userId = res.locals.userId;

    try {
        // Fetch all tasks for the user
        const allTasks = await prisma.task.findMany({
            where: {
                user_id: userId
            },
            include: {
                options: {
                    include: {
                        _count: {
                            select: {
                                submissions: true
                            }
                        }
                    }
                }
            }
        });

        return res.status(200).json(allTasks);
    } catch (e) {
        return res.status(500).json({
            error: e
        });
    }
});

// Handler for fetching a single task by taskId
userRouter.get('/task/:taskId', userMiddleware, async (req, res) => {
    const userId = res.locals.userId;
    const taskId = req.params.taskId;

    // Check if taskId is a valid number
    if (isNaN(Number(taskId))) {
        return res.status(400).json({
            message: "Invalid taskId provided"
        });
    }

    try {
        const taskDetails = await prisma.task.findFirst({
            where: {
                id: Number(taskId),
                user_id: userId
            }
        });

        if (!taskDetails) {
            return res.status(403).json({
                message: "You do not have access to this task"
            });
        }

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
    } catch (e) {
        return res.status(500).json({
            error: e
        });
    }
});


export default userRouter;