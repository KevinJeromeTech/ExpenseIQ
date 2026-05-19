ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'expense';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "shareToken" TEXT;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'User_shareToken_key'
  ) THEN
    CREATE UNIQUE INDEX "User_shareToken_key" ON "User"("shareToken");
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Category" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "userId" INTEGER NOT NULL,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Category_userId_fkey'
  ) THEN
    ALTER TABLE "Category" ADD CONSTRAINT "Category_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'Category_userId_name_key'
  ) THEN
    CREATE UNIQUE INDEX "Category_userId_name_key" ON "Category"("userId", "name");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'Category_userId_idx'
  ) THEN
    CREATE INDEX "Category_userId_idx" ON "Category"("userId");
  END IF;
END $$;
