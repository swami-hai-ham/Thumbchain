import { PrismaClient } from "@prisma/client";
import { Response } from "express";
const prisma = new PrismaClient();

export const sigUsage = async (signature: string, userId: number) => {
  // User existence check
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
    },
  });
  if (!user) {
    throw new Error("User not found");
  }

  // Signature usage check
  const signatureAlreadyUsed = await prisma.user.findFirst({
    where: {
      id: userId,
      OR: [
        {
          tasks: {
            some: {
              signature: signature,
            },
          },
        },
        {
          surveys: {
            some: {
              signature: signature,
            },
          },
        },
      ],
    },
  });
  if (signatureAlreadyUsed) {
    throw new Error("Signature already used");
  }
  return user;
};
