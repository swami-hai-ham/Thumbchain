/*
  Warnings:

  - A unique constraint covering the columns `[worker_id,questionId]` on the table `Response` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `worker_id` to the `Response` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `Survey` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Response" ADD COLUMN     "worker_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Survey" ADD COLUMN     "user_id" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Response_worker_id_questionId_key" ON "Response"("worker_id", "questionId");

-- AddForeignKey
ALTER TABLE "Survey" ADD CONSTRAINT "Survey_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
