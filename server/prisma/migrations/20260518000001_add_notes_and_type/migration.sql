-- AlterTable: add notes and type columns to Transaction
ALTER TABLE "Transaction" ADD COLUMN "notes" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'expense';
