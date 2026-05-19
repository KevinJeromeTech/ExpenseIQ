ALTER TABLE "Transaction" ADD COLUMN "notes" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'expense';
ALTER TABLE "User" ADD COLUMN "shareToken" TEXT;
CREATE UNIQUE INDEX "User_shareToken_key" ON "User"("shareToken");

CREATE TABLE "Category" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "userId" INTEGER NOT NULL,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "Category" ADD CONSTRAINT "Category_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "Category_userId_name_key" ON "Category"("userId", "name");
CREATE INDEX "Category_userId_idx" ON "Category"("userId");
