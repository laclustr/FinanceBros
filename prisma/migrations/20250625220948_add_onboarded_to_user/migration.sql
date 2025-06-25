/*
  Warnings:

  - You are about to drop the column `balance` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "balance",
ADD COLUMN     "income" TEXT NOT NULL DEFAULT 'under-1000';
