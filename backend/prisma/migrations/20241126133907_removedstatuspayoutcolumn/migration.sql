/*
  Warnings:

  - You are about to drop the column `status` on the `Payouts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Payouts" DROP COLUMN "status";

-- DropEnum
DROP TYPE "TxnStatus";
