import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const getNextTask = async (workerId: number) => {
    const task = await prisma.task.findFirst({
        where: {
            done: false,
            submission:{
                none: {
                    worker_id: workerId
                }
            }
        },
        select: {
            title: true,
            options: true,
            id: true,
            amount: true
        }
    })

    return task;
}