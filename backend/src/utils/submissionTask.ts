import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const TOTAL_DECIMALS = Number(process.env.TOTAL_DECIMALS) || 1000_000; //lamports

export const submissionTask = async (
  selection: string,
  taskId: string,
  workerId: number,
  amountPerResponse: number,
  validId: number,
  validAmount: number
) => {
  const submission = await prisma.$transaction(async (tx) => {
    // Create the submission
    const newSubmission = await tx.submission.create({
      data: {
        option_id: Number(selection),
        worker_id: workerId,
        task_id: Number(taskId),
        amount: amountPerResponse,
      },
    });

    // Update the worker's pending amount
    await tx.worker.update({
      where: {
        id: workerId,
      },
      data: {
        pending_amt: {
          increment: Number(amountPerResponse),
        },
      },
    });

    // Check the number of submissions for this task
    const totalSubmissions = await tx.submission.count({
      where: { task_id: validId },
    });

    // Calculate the required responses based on the original task amount
    const responsesNeeded = (validAmount / TOTAL_DECIMALS) * 1000; // Responses needed

    // Update the task's done status if it meets the requirements
    if (totalSubmissions >= responsesNeeded) {
      await tx.task.update({
        where: { id: validId },
        data: { done: true },
      });
    }

    return newSubmission;
  });

  return submission;
};
