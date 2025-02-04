import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import z from "zod";
import jwt from "jsonwebtoken";
import { workerMiddleware } from "../middlewares/workerMiddleware";
import { getNextQuestion, getNextTask } from "../db";
import { createResponseInput, createSubmissionInput } from "../types";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import nacl from "tweetnacl";
import { signinBodySchema } from "../types";
import { submissionTask } from "../utils/submissionTask";

const workerRouter = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.WORKER_JWT_SECRET as string;
const TOTAL_DECIMALS = Number(process.env.TOTAL_DECIMALS) || 1000_000; //lamports
// Solana connection (replace with your RPC endpoint)
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

// Server's keypair (replace with your actual secret key)
const payerSecretKey = bs58.decode(process.env.SECRET_KEY!);
const payerKeypair = Keypair.fromSecretKey(payerSecretKey);

// Auth
workerRouter.post("/signin", async (req, res) => {
  const body = req.body;
  const parsedData = signinBodySchema.safeParse(body);
  if (!parsedData.success) {
    return res.status(400).json({
      message: "You've sent wrong inputs",
    });
  }
  const { publicKey, signature, message } = parsedData.data || {};
  try {
    const publicKeyUint8 = bs58.decode(publicKey);
    const messageUint8 = new TextEncoder().encode(message);

    // Verify the signature
    const isValidSignature = nacl.sign.detached.verify(
      messageUint8,
      new Uint8Array(signature.data), // Assuming signature is sent as Buffer-like object
      publicKeyUint8
    );
    console.log(isValidSignature);

    if (isValidSignature) {
      const worker = await prisma.worker.upsert({
        where: {
          address: publicKey,
        },
        update: {},
        create: {
          address: publicKey,
          pending_amt: 0,
          locked_amt: 0,
        },
      });
      const token = jwt.sign({ workerId: worker.id }, JWT_SECRET);
      return res.status(200).json({
        token,
      });
    } else {
      return res.status(400).json({
        message: "InvalidSignature",
      });
    }
  } catch (e) {
    return res.status(500).json({
      error: e,
    });
  }
});

// Task
workerRouter.post("/checkredir", workerMiddleware, async (req, res) => {
  try {
    const workerId = Number(res.locals.workerId);
    const body = req.body;
    const checkInput = z.object({
      taskId: z.string(),
    });
    const parsedBody = checkInput.safeParse(body);

    if (parsedBody.success) {
      const validtask = await prisma.task.findFirst({
        where: {
          id: Number(parsedBody.data.taskId),
          done: false,
          submission: {
            none: {
              worker_id: workerId,
            },
          },
        },
      });
      if (!validtask) {
        return res.status(400).json({
          msg: "Incorrect Task Id",
        });
      } else {
        return res.status(200).json({
          msg: "Correct task id",
        });
      }
    }
  } catch (e) {
    return res.status(500).json({
      e,
    });
  }
});

workerRouter.post("/redirsub", workerMiddleware, async (req, res) => {
  try {
    const workerId = Number(res.locals.workerId);
    const body = req.body;
    const parsedBody = createSubmissionInput.safeParse(body);

    if (parsedBody.success) {
      const validtask = await prisma.task.findFirst({
        where: {
          id: Number(parsedBody.data.taskId),
          done: false,
          submission: {
            none: {
              worker_id: workerId,
            },
          },
        },
        select: {
          id: true,
          amount: true,
        },
      });
      if (!validtask) {
        return res.status(400).json({
          msg: "Incorrect Task Id",
        });
      }

      const responsesNeeded = (validtask.amount / TOTAL_DECIMALS) * 1000;
      console.log(responsesNeeded); // Convert total lamports to SOL and calculate responses needed
      const amountPerResponse = validtask.amount / responsesNeeded; // Amount per response in SOL
      console.log(amountPerResponse);

      const submission = await submissionTask(
        parsedBody.data.selection,
        parsedBody.data.taskId,
        workerId,
        amountPerResponse,
        validtask.id,
        validtask.amount
      );
      return res.status(200).json({
        submission,
      });
    } else {
      return res.status(400).json({
        error: "Incorrect inputs",
      });
    }
  } catch (e) {
    return res.status(500).json({
      e,
    });
  }
});

workerRouter.get("/nexttask", workerMiddleware, async (req, res) => {
  try {
    const workerId = Number(res.locals.workerId);
    const country = req.query.country ? String(req.query.country) : undefined;

    console.log(workerId);
    const task = await getNextTask({ workerId, country });

    if (!task) {
      return res.status(404).json({
        msg: "There are no tasks left for you to review",
      });
    } else {
      return res.status(200).json({
        task,
      });
    }
  } catch (e) {
    return res.status(500).json({
      e,
    });
  }
});

workerRouter.post("/submission", workerMiddleware, async (req, res) => {
  try {
    const workerId = Number(res.locals.workerId);
    const body = req.body;
    const parsedBody = createSubmissionInput.safeParse(body);
    const country = req.query.country ? String(req.query.country) : undefined;

    if (parsedBody.success) {
      const task = await getNextTask({ workerId, country });
      if (!task || task?.id !== Number(parsedBody.data.taskId)) {
        return res.status(400).json({
          msg: "Incorrect Task Id",
        });
      }

      // Assuming task.amount is in SOL
      const responsesNeeded = (task.amount / TOTAL_DECIMALS) * 1000;
      console.log(responsesNeeded); // Convert total lamports to SOL and calculate responses needed
      const amountPerResponse = task.amount / responsesNeeded; // Amount per response in SOL
      console.log(amountPerResponse);

      const submission = await submissionTask(
        parsedBody.data.selection,
        parsedBody.data.taskId,
        workerId,
        amountPerResponse,
        task.id,
        task.amount
      );
      const nextTask = await getNextTask({ workerId, country });
      if (!nextTask) {
        return res.status(200).json({
          msg: "There are no tasks left for you to review",
        });
      } else {
        return res.status(200).json({
          nextTask,
        });
      }
    } else {
      return res.status(400).json({
        error: "Incorrect inputs",
      });
    }
  } catch (e) {
    return res.status(500).json({
      e,
    });
  }
});

// Survey

workerRouter.get("/checksurvey", workerMiddleware, async (req, res) => {
  const workerId = Number(res.locals.workerId);

  const surveyWithPartialResponses = await prisma.survey.findFirst({
    where: {
      NOT: {
        questions: {
          every: {
            responses: {
              some: {
                worker_id: workerId,
              },
            },
          },
        },
      },
    },
    select: {
      id: true,
      title: true,
      description: true,
      _count: {
        select: {
          questions: true,
        },
      },
      questions: {
        where: {
          responses: {
            none: {
              worker_id: workerId,
            },
          },
        },
        select: {
          id: true, // Select the question ID to count them
        },
      },
    },
  });

  if (surveyWithPartialResponses == null) {
    const surveyWithNoResponses = await prisma.survey.findFirst({
      where: {
        responses: {
          none: {
            worker_id: workerId, // Replace workerId with the actual worker's ID
          },
        },
      },
      select: {
        title: true,
        description: true,
        id: true,
        _count: {
          select: {
            questions: true,
          },
        },
        questions: {
          where: {
            responses: {
              none: {
                worker_id: workerId,
              },
            },
          },
          select: {
            id: true, // Select the question ID to count them
          },
        },
      },
    });
    return res.status(200).json({
      surveyWithNoResponses,
    });
  }

  if (!surveyWithPartialResponses) {
    return res.status(404).json({
      msg: "No survey found",
    });
  }

  return res.status(200).json({
    surveyWithPartialResponses,
  });
});

workerRouter.get("/nextquestion", workerMiddleware, async (req, res) => {
  try {
    const workerId = Number(res.locals.workerId);
    const country = req.query.country ? String(req.query.country) : undefined;

    console.log(workerId);
    const question = await getNextQuestion({ workerId });
    console.log(question);
    if (!question) {
      return res.status(404).json({
        msg: "There are no tasks left for you to review",
      });
    } else {
      return res.status(200).json({
        question,
      });
    }
  } catch (e) {
    return res.status(500).json({
      e,
    });
  }
});

workerRouter.post("/response", workerMiddleware, async (req, res) => {
  const workerId = Number(res.locals.workerId);
  const body = req.body;
  const parsedBody = createResponseInput.safeParse(body);

  if (!parsedBody.success) {
    return res.status(400).json({
      msg: parsedBody.error,
    });
  }
  const currentQuestion = await getNextQuestion({ workerId });

  if (!(currentQuestion?.id == parsedBody.data?.questionId)) {
    return res.status(404).json({
      msg: "No Such Question found",
    });
  }

  try {
    const response = await prisma.$transaction(async (prisma) => {
      const response = prisma.response.create({
        data: {
          questionId: parsedBody.data?.questionId!,
          formId: parsedBody.data?.formId!,
          worker_id: workerId,
          answer: parsedBody.data?.answer!,
        },
      });

      const questionCount = await prisma.question.count({
        where: { formId: currentQuestion.formId },
      });
      const responsesCount = await console.log(
        currentQuestion.orderId,
        questionCount
      );
      if (currentQuestion.orderId == questionCount) {
        const amount = await prisma.survey.findFirst({
          where: { id: currentQuestion.formId },
          select: { amount: true },
        });
        const responsesNeeded = (amount!.amount / TOTAL_DECIMALS) * 1000;
        const amountPerResponse = amount!.amount / responsesNeeded;
        await prisma.worker.update({
          where: {
            id: workerId,
          },
          data: {
            pending_amt: {
              increment: Number(amountPerResponse),
            },
          },
        });
        const responsesCount = await prisma.response.count({
          where: {
            formId: parsedBody.data?.formId,
          },
        });
        if (questionCount * responsesNeeded == responsesCount) {
          await prisma.survey.update({
            where: {
              id: parsedBody.data.formId,
            },
            data: {
              done: true,
            },
          });
        }
      }

      return response;
    });

    return res.status(200).json({ response });
  } catch (e) {
    return res.status(500).json({
      msg: "Internal server error",
    });
  }
});

// User
workerRouter.get("/balance", workerMiddleware, async (req, res) => {
  const workerId = res.locals.workerId;
  const worker = await prisma.worker.findFirst({
    where: {
      id: workerId,
    },
    select: {
      locked_amt: true,
      pending_amt: true,
    },
  });

  if (!worker) {
    return res.status(498).json({
      msg: "Invalid token",
    });
  } else {
    return res.status(200).json({
      lockedAmount: worker?.locked_amt,
      pendingAmount: worker?.pending_amt,
    });
  }
});

workerRouter.get("/payout", workerMiddleware, async (req, res) => {
  const workerId = res.locals.workerId;
  const worker = await prisma.worker.findFirst({
    where: {
      id: workerId,
    },
  });

  if (!worker) {
    res.status(404).json({
      msg: "worker not found",
    });
  } else if (worker.pending_amt == 0) {
    return res.status(400).json({
      msg: "not enough amount to payout",
    });
  }

  const address = worker?.address;
  console.log(worker);
  const workerPublicKey = new PublicKey(address!);

  try {
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: payerKeypair.publicKey,
        toPubkey: workerPublicKey,
        lamports: (worker?.pending_amt! / TOTAL_DECIMALS) * LAMPORTS_PER_SOL,
      })
    );
    const {
      context: { slot: minContextSlot },
      value: { blockhash, lastValidBlockHeight },
    } = await connection.getLatestBlockhashAndContext();

    const signature = await sendAndConfirmTransaction(connection, transaction, [
      payerKeypair,
    ]);
    await prisma.$transaction(async (tx) => {
      await tx.worker.update({
        where: {
          id: workerId,
        },
        data: {
          pending_amt: {
            decrement: worker?.pending_amt,
          },
          locked_amt: {
            increment: worker?.pending_amt,
          },
        },
      });
      console.log("here");
      await tx.payouts.create({
        data: {
          worker_id: workerId,
          amount: worker?.pending_amt ?? 0,
          signature: signature,
        },
      });
      console.log("here");
    });

    return res.status(200).json({
      message: "Payment done",
      amount: worker?.pending_amt,
    });
  } catch (e) {
    res.status(500).json({
      message: "transaction failed",
    });
  }
});

workerRouter.get("/payout/bulk", workerMiddleware, async (req, res) => {
  const workerId = res.locals.workerId;

  try {
    const payoutTableData = await prisma.payouts.findMany({
      where: {
        worker_id: workerId,
      },
    });

    if (payoutTableData.length == 0) {
      return res.status(200).json({
        msg: "Not any data",
      });
    } else {
      return res.status(200).json({
        payoutTableData,
      });
    }
  } catch (e) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});
export default workerRouter;
