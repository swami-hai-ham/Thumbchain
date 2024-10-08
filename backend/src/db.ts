import { PrismaClient } from "@prisma/client";

interface getNextTaskType{
    workerId: number,
    country?: string | undefined
}

const prisma = new PrismaClient();
export const getNextTask= async ({workerId, country}: getNextTaskType) => {
    console.log(workerId, country);
    console.log(country)
    if(country != undefined && country != ""){
        console.log("here")
        const task = await prisma.task.findFirst({
            where: {
                done: false,
                country: country,
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
    }else{
        console.log("Here")
        const task = await prisma.task.findFirst({
            where: {
                country: null,
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

    
}