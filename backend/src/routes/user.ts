import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { userMiddleware } from "../middlewares/userMiddleware";
import { checkTxnSchema, createTaskInput, signinBodySchema } from "../types";
import { AddressLookupTableAccount, clusterApiUrl, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import nacl from 'tweetnacl';
import bs58 from 'bs58';

const userRouter = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET as string;
const TOTAL_DECIMALS = Number(process.env.TOTAL_DECIMALS) || 1000_000; // lamports
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
const PARENT_WALLET_ADDRESS = "Hgw9qhAZoRCH3AR97qa8tNd6r3bUwih1jqYNw4sjhH1m"
const RETRY_DELAY = 500

async function getTransactionStatus(signature:string, retryCount = 30) {
    const status = await connection.getSignatureStatus(signature);
  
    if (status.value === null) {
      if (retryCount < 10) {
        console.log(`Transaction status not available. Retrying in ${RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return getTransactionStatus(signature, retryCount + 1);
      } else {
        throw new Error('Transaction status not available after maximum retries');
      }
    }
  
    return status;
  }

// signin with wallet
userRouter.post("/signin", async (req, res) => {
    const body = req.body;
    const parsedData = signinBodySchema.safeParse(body);
    if(!parsedData.success){
        return res.status(400).json({
            message: "You've sent wrong inputs"
        });
    }
    const { publicKey, signature, message} = parsedData.data || {};

    
    try{
        const publicKeyUint8 = bs58.decode(publicKey);
        const messageUint8 = new TextEncoder().encode(message);

        // Verify the signature
        const isValidSignature = nacl.sign.detached.verify(
        messageUint8,
        new Uint8Array(signature.data), // Assuming signature is sent as Buffer-like object
        publicKeyUint8
        );
        console.log(isValidSignature)

        if(isValidSignature){
            const user = await prisma.user.upsert({
                where:{
                    address: publicKey
                },
                update:{},
                create:{
                    address: publicKey
                }
            })
            const token = jwt.sign({userId: user.id}, JWT_SECRET)
            return res.status(200).json({
                token
            })
        }
        else{
            return res.status(400).json({
                message: "InvalidSignature"
            })
        }
    }catch(e){
        return res.status(500).json({
            error: e
        })
    }


})

// In userRouter
userRouter.post('/task', userMiddleware, async (req, res) => {
    const body = req.body;
    const userId = res.locals.userId;
    try {
    const parsedData = createTaskInput.safeParse(body);

    if (!parsedData.success) {
        return res.status(400).json({
            message: "You've sent wrong inputs"
        });
    }
    console.log("parsedData: ",parsedData)

    const { responsesNeeded, signature } = parsedData.data;

    const user = await prisma.user.findFirst({
        where: {
            id: userId
        }
    })
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    const transaction = await connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 1
    });
    console.log("transaction: ",transaction)
    if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
    }
    const status = await getTransactionStatus(signature);
    console.log("status: ",status)
    

    //check if txnValid
    // const isValid = await connection.confirmTransaction(signature, "confirmed");
    //     if (!isValid) {
    //         return res.status(411).json({ message: "Invalid transaction signature" });
    // }
    // console.log(isValid)
    const currentTime = new Date().getTime() / 1000;
    if (transaction?.blockTime && (currentTime - transaction?.blockTime > 300)) {
            return res.status(411).json({ message: "Transaction is too old" });
    }
    console.log("currentTime:",currentTime)
    const transferAmount = transaction!.meta!.postBalances[1] - transaction!.meta!.preBalances[1];
        if (transferAmount !== responsesNeeded/1000*LAMPORTS_PER_SOL) {
            return res.status(411).json({ message: "Incorrect transaction amount" });
    }
    
    console.log("transferAmount: ",transferAmount)
    const senderAddress = transaction?.transaction.message.getAccountKeys().get(0)?.toString();
    const recipientAddress = transaction?.transaction.message.getAccountKeys().get(1)?.toString();
    console.log(senderAddress, recipientAddress, "address")
    if (senderAddress !== user.address) {
        return res.status(411).json({ message: "Transaction not sent from user's address" });
    }

    if (recipientAddress !== PARENT_WALLET_ADDRESS) {
        return res.status(411).json({ message: "Transaction not sent to correct address" });
    }

    const existingTask = await prisma.task.findFirst({
        where: { signature: signature }
    });

    if (existingTask) {
        return res.status(409).json({ message: "This transaction has already been used" });
    }
    console.log('Transfer amount:', transferAmount);
    console.log('Expected amount:', responsesNeeded/1000*LAMPORTS_PER_SOL);
    console.log('Sender address:', senderAddress);
    console.log('Recipient address:', recipientAddress);
    
    let response = await prisma.$transaction(async tx => {
            const response = await tx.task.create({
                data: {
                    title: parsedData.data.title,
                    amount: responsesNeeded / 1000 * TOTAL_DECIMALS, // Calculate amount based on responses needed
                    signature: parsedData.data.signature,
                    user_id: userId,
                    country: parsedData.data.country ? parsedData.data.country : null
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
    } catch (error) {
        console.error('Error processing task:', error);
            return res.status(500).json({
                message: "An error occurred while processing the task",
                error: error
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