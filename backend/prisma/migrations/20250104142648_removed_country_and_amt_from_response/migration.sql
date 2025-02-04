/*
  Warnings:

  - You are about to drop the column `amount` on the `Response` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `Survey` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Response" DROP COLUMN "amount";

-- AlterTable
ALTER TABLE "Survey" DROP COLUMN "country";
