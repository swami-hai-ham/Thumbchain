import { PrismaClient } from "@prisma/client";

interface getNextTaskType{
    workerId: number,
    country?: string | undefined
}

interface whereCondition{
    country: string | null;
    done: boolean;
    submission: {
        none: {
            worker_id: number;
        };
    };
}

const prisma = new PrismaClient();
export const getNextTask = async ({ workerId, country }: getNextTaskType) => {
    console.log('Fetching next task for workerId:', workerId, 'and country:', country);
    
    const whereCondition: whereCondition = {
        country: null,
        done: false,
        submission: {
            none: {
                worker_id: workerId
            }
        }
    };

    if (country) {
        whereCondition.country = country;
    } else {
        whereCondition.country = null; // Ensure you're looking for null if no country is provided
    }

    const task = await prisma.task.findFirst({
        where: whereCondition,
        select: {
            title: true,
            options: true,
            id: true,
            amount: true
        }
    });

    console.log('Found task:', task);
    return task;
}
