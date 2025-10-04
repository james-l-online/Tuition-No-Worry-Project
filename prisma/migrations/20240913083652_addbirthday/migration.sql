/*
  Warnings:

  - Added the required column `birthday` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `birthday` to the `Teacher` table without a default value. This is not possible if the table is not empty.

*/
ALTER TABLE "Class" DROP CONSTRAINT "Class_supervisorId_fkey";

ALTER TABLE "Class" ALTER COLUMN "supervisorId" DROP NOT NULL;

-- REMOVED: prisma migration SQL (archived). Use sql/seed-full.sql and sql/patch-*.sql
-- This file is an archived migration kept for history; use sql/seed-full.sql for current dev flows.

ALTER TABLE "Teacher" ADD COLUMN     "birthday" TIMESTAMP(3) NOT NULL;

ALTER TABLE "Class" ADD CONSTRAINT "Class_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
