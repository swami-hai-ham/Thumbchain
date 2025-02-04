import { PrismaClient } from "@prisma/client";

interface getNextTaskType {
  workerId: number;
  country?: string | undefined;
}

interface whereConditionTask {
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
  console.log(
    "Fetching next task for workerId:",
    workerId,
    "and country:",
    country
  );

  const whereCondition: whereConditionTask = {
    country: null,
    done: false,
    submission: {
      none: {
        worker_id: workerId,
      },
    },
  };

  if (country) {
    whereCondition.country = country;
  } else {
    whereCondition.country = null;
  }

  const task = await prisma.task.findFirst({
    where: whereCondition,
    select: {
      title: true,
      options: true,
      id: true,
      amount: true,
    },
  });

  console.log("Found task:", task);
  return task;
};

export const getNextQuestion = async ({ workerId }: { workerId: number }) => {
  console.log("Fetching next survey for workerId:", workerId);

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
  });
  // console.log(surveyWithPartialResponses);
  if (surveyWithPartialResponses == null) {
    const surveyWithNoResponses = await prisma.survey.findFirst({
      where: {
        responses: {
          none: {
            worker_id: workerId,
          },
        },
      },
      include: {
        questions: true,
      },
    });
    // console.log(surveyWithNoResponses);
    return surveyWithNoResponses?.questions[0];
  } else {
    const nextQuestion = await prisma.question.findFirst({
      where: {
        formId: surveyWithPartialResponses?.id,
        responses: {
          none: {
            worker_id: workerId,
          },
        },
      },
    });
    // console.log(nextQuestion);
    return nextQuestion;
  }
};
