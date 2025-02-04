/*
  Warnings:

  - Added the required column `amount` to the `Response` table without a default value. This is not possible if the table is not empty.
  - Added the required column `amount` to the `Survey` table without a default value. This is not possible if the table is not empty.
  - Added the required column `signature` to the `Survey` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Response" ADD COLUMN     "amount" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Survey" ADD COLUMN     "amount" INTEGER NOT NULL,
ADD COLUMN     "done" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "signature" TEXT NOT NULL;
