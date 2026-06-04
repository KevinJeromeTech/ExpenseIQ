import { PrismaClient } from "@prisma/client";
import express, { Request, Response } from "express";
import { randomBytes } from "crypto";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import { authenticate, AuthRequest } from "./middleware/auth";
import authRouter from "./routes/auth";
import usersRouter from "./routes/users";
import Anthropic from "@anthropic-ai/sdk";

// Track which users have had recurring transactions processed today (resets on server restart)
const recurringProcessedOn = new Map<number, string>(); // userId → "YYYY-MM-DD"

const app = express();
const prisma = new PrismaClient();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://expense-iq-lilac.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

app.use("/api/auth", authLimiter);
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);

app.get("/api/health", (_req, res) => {
  res.json({ message: "ExpenseIQ backend is running" });
});

app.get("/api/transactions", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { transactionDate: "desc" },
    });

    // Process recurring transactions — at most once per user per calendar day to prevent
    // deleted transactions from being immediately recreated on the next fetch.
    const todayStr = new Date().toISOString().split("T")[0];
    const alreadyRanToday = recurringProcessedOn.get(userId) === todayStr;
    if (alreadyRanToday) {
      res.json(transactions);
      return;
    }
    recurringProcessedOn.set(userId, todayStr);

    const recurringTransactions = transactions.filter(t => t.isRecurring && t.frequency);
    const now = new Date();
    const newEntries = [];

    for (const recurring of recurringTransactions) {
      // Find the most recent occurrence of this recurring transaction
      const mostRecent = transactions
        .filter(t =>
          t.merchant === recurring.merchant &&
          t.category === recurring.category &&
          t.isRecurring &&
          t.frequency === recurring.frequency
        )
        .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())[0];

      if (!mostRecent) continue;

      const lastDate = new Date(mostRecent.transactionDate);
      let isDue = false;

      const daysSince = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);

      if (recurring.frequency === 'weekly') {
        isDue = daysSince >= 7;
      } else if (recurring.frequency === 'biweekly') {
        isDue = daysSince >= 14;
      } else if (recurring.frequency === 'monthly') {
        isDue = lastDate.getMonth() !== now.getMonth() || lastDate.getFullYear() !== now.getFullYear();
      } else if (recurring.frequency === 'yearly') {
        isDue = lastDate.getFullYear() !== now.getFullYear();
      }

      if (isDue) {
        // Check we haven't already created one this period
        const alreadyCreatedThisPeriod = transactions.some(t => {
          if (t.merchant !== recurring.merchant || t.category !== recurring.category) return false;
          const tDate = new Date(t.transactionDate);
          const daysSinceTx = (now.getTime() - tDate.getTime()) / (1000 * 60 * 60 * 24);
          if (recurring.frequency === 'weekly') return daysSinceTx < 7;
          if (recurring.frequency === 'biweekly') return daysSinceTx < 14;
          if (recurring.frequency === 'monthly') {
            return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
          }
          if (recurring.frequency === 'yearly') return tDate.getFullYear() === now.getFullYear();
          return false;
        });

        if (!alreadyCreatedThisPeriod) {
          newEntries.push({
            merchant: recurring.merchant,
            amount: recurring.amount,
            category: recurring.category,
            isRecurring: true,
            frequency: recurring.frequency,
            userId,
            transactionDate: now,
          });
        }
      }
    }

    if (newEntries.length > 0) {
      await prisma.transaction.createMany({ data: newEntries });
      // Re-fetch after creating new entries
      const updatedTransactions = await prisma.transaction.findMany({
        where: { userId },
        orderBy: { transactionDate: 'desc' },
      });
      res.json(updatedTransactions);
      return;
    }

    res.json(transactions);
    return;
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

app.post("/api/transactions", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { merchant, amount, category, isRecurring, frequency, transactionDate, notes, type } = req.body ?? {};

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!merchant || amount === undefined || !category) {
      res.status(400).json({
        error: "merchant, amount, and category are required",
      });
      return;
    }

    const transaction = await prisma.transaction.create({
      data: {
        merchant,
        amount: Number(amount),
        category,
        userId,
        transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
        isRecurring: isRecurring ?? false,
        frequency: frequency ?? null,
        notes: notes ?? null,
        type: type === "income" ? "income" : "expense",
      },
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error("Failed to create transaction:", error);
    res.status(500).json({ error: "Failed to create transaction" });
  }
});

app.put(
  "/api/transactions/:id",
  authenticate,
  async (req: AuthRequest & Request<{ id: string }>, res: Response) => {
    try {
      const userId = req.user?.userId;
      const id = Number(req.params.id);
      const { merchant, amount, category, isRecurring, frequency, transactionDate, notes, type } = req.body ?? {};

      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      if (!merchant || amount === undefined || !category) {
        res.status(400).json({
          error: "merchant, amount, and category are required",
        });
        return;
      }

      const existingTransaction = await prisma.transaction.findFirst({
        where: { id, userId },
      });

      if (!existingTransaction) {
        res.status(404).json({ error: "Transaction not found" });
        return;
      }

      const updatedTransaction = await prisma.transaction.update({
        where: { id },
        data: {
          merchant,
          amount: Number(amount),
          category,
          isRecurring: isRecurring ?? false,
          frequency: frequency ?? null,
          transactionDate: transactionDate ? new Date(transactionDate) : undefined,
          notes: notes ?? null,
          type: type === "income" ? "income" : "expense",
        },
      });

      res.status(200).json(updatedTransaction);
    } catch (error) {
      console.error("Failed to update transaction:", error);
      res.status(500).json({ error: "Failed to update transaction" });
    }
  }
);

app.delete(
  "/api/transactions/:id",
  authenticate,
  async (req: AuthRequest & Request<{ id: string }>, res: Response) => {
    try {
      const userId = req.user?.userId;
      const id = Number(req.params.id);

      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const existingTransaction = await prisma.transaction.findFirst({
        where: { id, userId },
      });

      if (!existingTransaction) {
        res.status(404).json({ error: "Transaction not found" });
        return;
      }

      await prisma.transaction.delete({
        where: { id },
      });

      res.status(200).json({ message: "Transaction deleted successfully" });
    } catch (error) {
      console.error("Failed to delete transaction:", error);
      res.status(500).json({ error: "Failed to delete transaction" });
    }
  }
);

app.get("/api/budgets", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const budgets = await prisma.budget.findMany({
      where: { userId },
      orderBy: { id: "desc" },
    });

    res.json(budgets);
  } catch (error) {
    console.error("Failed to fetch budgets:", error);
    res.status(500).json({ error: "Failed to fetch budgets" });
  }
});

app.post("/api/budgets", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { category, limit, month } = req.body ?? {};

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!category || limit === undefined || !month) {
      res.status(400).json({
        error: "category, limit, and month are required",
      });
      return;
    }

    const existingBudget = await prisma.budget.findFirst({
      where: {
        category,
        month,
        userId,
      },
    });

    if (existingBudget) {
      const updatedBudget = await prisma.budget.update({
        where: { id: existingBudget.id },
        data: {
          limit: Number(limit),
        },
      });

      res.status(200).json(updatedBudget);
      return;
    }

    const newBudget = await prisma.budget.create({
      data: {
        category,
        limit: Number(limit),
        month,
        userId,
      },
    });

    res.status(201).json(newBudget);
  } catch (error) {
    console.error("Failed to save budget:", error);
    res.status(500).json({ error: "Failed to save budget" });
  }
});

app.get("/api/insights", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

    const currentMonth = new Date().toISOString().slice(0, 7);
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const today = now.getDate();
    const daysLeft = Math.max(daysInMonth - today, 0);

    const [transactions, categoryBudgets] = await Promise.all([
      prisma.transaction.findMany({ where: { userId }, orderBy: { transactionDate: "desc" } }),
      prisma.budget.findMany({ where: { userId, month: currentMonth } }),
    ]);

    if (transactions.length === 0) {
      res.json({ insights: [{ type: "positive", message: "No transactions yet. Add a few expenses to unlock AI-powered insights." }] });
      return;
    }

    const globalBudget = categoryBudgets.find(b => b.category === "Monthly");
    const catBudgets = categoryBudgets.filter(b => b.category !== "Monthly");

    const categoryTotals: Record<string, number> = {};
    for (const t of transactions) {
      categoryTotals[t.category] = (categoryTotals[t.category] ?? 0) + t.amount;
    }

    const totalSpent = Object.values(categoryTotals).reduce((s, v) => s + v, 0);
    const dailyAverage = totalSpent / Math.max(today, 1);
    const projectedSpend = dailyAverage * daysInMonth;
    const largestExpense = transactions.reduce((m, t) => t.amount > m.amount ? t : m);
    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

    const context = [
      `Today: ${now.toDateString()}. Day ${today} of ${daysInMonth} (${daysLeft} days left).`,
      `Total spent this month: $${totalSpent.toFixed(2)} across ${transactions.length} transactions.`,
      `Daily average: $${dailyAverage.toFixed(2)}. Projected month-end total: $${projectedSpend.toFixed(2)}.`,
      globalBudget ? `Monthly budget: $${globalBudget.limit.toFixed(2)} (${((totalSpent / globalBudget.limit) * 100).toFixed(1)}% used, $${Math.max(globalBudget.limit - totalSpent, 0).toFixed(2)} remaining).` : "No monthly budget set.",
      `Spending by category: ${sortedCategories.map(([c, v]) => `${c} $${v.toFixed(2)}`).join(", ")}.`,
      `Largest single purchase: $${largestExpense.amount.toFixed(2)} at ${largestExpense.merchant}.`,
      catBudgets.length > 0
        ? `Category budgets: ${catBudgets.map(b => `${b.category} $${(categoryTotals[b.category] ?? 0).toFixed(2)}/$${b.limit.toFixed(2)} (${(((categoryTotals[b.category] ?? 0) / b.limit) * 100).toFixed(0)}%)`).join(", ")}.`
        : "No per-category budgets set.",
    ].join("\n");

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system: `You are a personal finance advisor. Given a user's monthly spending data, generate exactly 5 concise, actionable insights. Be specific with numbers. Vary the tone — mix encouragement with honest warnings where warranted.

Respond with ONLY a valid JSON array. Each element must have:
- "type": one of "positive", "warning", or "danger"
- "message": one sentence, max 120 characters

Example format:
[{"type":"positive","message":"..."},{"type":"warning","message":"..."}]`,
      messages: [{ role: "user", content: context }],
    });

    const raw = (response.content[0] as { type: string; text: string }).text.trim();
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array in Claude response");

    const parsed = JSON.parse(jsonMatch[0]) as { type: string; message: string }[];
    const valid = parsed
      .filter(i => ["positive", "warning", "danger"].includes(i.type) && typeof i.message === "string")
      .slice(0, 7) as { type: "positive" | "warning" | "danger"; message: string }[];

    res.json({ insights: valid });
  } catch (error) {
    console.error("Failed to generate insights:", error);
    res.status(500).json({ error: "Failed to generate insights" });
  }
});

const DEFAULT_EXPENSE_CATEGORIES = ["Shopping", "Food", "Transport", "Bills", "Entertainment"];
const DEFAULT_INCOME_CATEGORIES = ["Salary", "Freelance", "Investment", "Gift", "Other Income"];
const ALL_DEFAULT_CATEGORIES = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];

app.get("/api/categories", authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    let cats = await prisma.category.findMany({ where: { userId }, orderBy: { name: "asc" } });
    if (cats.length === 0) {
      await prisma.category.createMany({
        data: ALL_DEFAULT_CATEGORIES.map(name => ({ name, userId })),
        skipDuplicates: true,
      });
      cats = await prisma.category.findMany({ where: { userId }, orderBy: { name: "asc" } });
    }
    res.json(cats);
  } catch { res.status(500).json({ error: "Failed to fetch categories" }); }
});

app.post("/api/categories", authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { name } = req.body ?? {};
  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  try {
    const category = await prisma.category.create({ data: { name: name.trim(), userId } });
    res.status(201).json(category);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("Unique constraint")) {
      res.status(409).json({ error: "Category already exists" });
    } else {
      res.status(500).json({ error: "Failed to create category" });
    }
  }
});

app.delete("/api/categories/:id", authenticate, async (req: AuthRequest & Request<{ id: string }>, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = Number(req.params.id);
  try {
    const existing = await prisma.category.findFirst({ where: { id, userId } });
    if (!existing) { res.status(404).json({ error: "Category not found" }); return; }
    await prisma.category.delete({ where: { id } });
    res.json({ message: "Category deleted" });
  } catch {
    res.status(500).json({ error: "Failed to delete category" });
  }
});

app.post("/api/categorize", authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { merchant, notes, type } = req.body ?? {};
  if (!merchant || typeof merchant !== "string" || !merchant.trim()) {
    res.status(400).json({ error: "merchant is required" });
    return;
  }

  try {
    let cats = await prisma.category.findMany({ where: { userId }, orderBy: { name: "asc" } });
    if (cats.length === 0) cats = ALL_DEFAULT_CATEGORIES.map((name, id) => ({ id, name, userId }));

    const isIncome = type === "income";
    const expenseDefaults = new Set(DEFAULT_EXPENSE_CATEGORIES);
    const incomeDefaults = new Set(DEFAULT_INCOME_CATEGORIES);
    const relevant = cats.filter(c =>
      isIncome ? incomeDefaults.has(c.name) || !expenseDefaults.has(c.name)
               : expenseDefaults.has(c.name) || !incomeDefaults.has(c.name)
    );
    const categoryList = relevant.map(c => c.name).join(", ");

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 32,
      system: `You are a financial transaction categorizer. Given a merchant name and optional notes, reply with exactly one category name from the provided list. Reply with only the category name — no punctuation, no explanation.`,
      messages: [{
        role: "user",
        content: `Merchant: ${merchant.trim()}${notes ? `\nNotes: ${notes}` : ""}\nCategories: ${categoryList}`,
      }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text.trim();
    const matched = relevant.find(c => c.name.toLowerCase() === raw.toLowerCase());
    const category = matched?.name ?? relevant[0]?.name ?? "Shopping";
    res.json({ category });
  } catch {
    res.status(500).json({ error: "Categorization failed" });
  }
});

app.post("/api/share/generate", authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const token = randomBytes(16).toString("hex");
    await prisma.user.update({ where: { id: userId }, data: { shareToken: token } });
    res.json({ token });
  } catch { res.status(500).json({ error: "Failed to generate share link" }); }
});

app.get("/api/share/:token", async (req: Request<{ token: string }>, res: Response) => {
  const { token } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { shareToken: token } });
    if (!user) { res.status(404).json({ error: "Share link not found" }); return; }
    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { transactionDate: "desc" },
      take: 100,
    });
    const budgets = await prisma.budget.findMany({ where: { userId: user.id } });
    const expenseTxns = transactions.filter(t => t.type === "expense");
    const totalExpenses = expenseTxns.reduce((s, t) => s + t.amount, 0);
    const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const catTotals: Record<string, number> = {};
    for (const t of expenseTxns) catTotals[t.category] = (catTotals[t.category] ?? 0) + t.amount;
    const categoryBreakdown = Object.entries(catTotals)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
    res.json({
      totalExpenses,
      totalIncome,
      netIncome: totalIncome - totalExpenses,
      transactionCount: transactions.length,
      budgets,
      categoryBreakdown,
      recentTransactions: transactions.slice(0, 10),
    });
  } catch { res.status(500).json({ error: "Failed to load share data" }); }
});

app.delete("/api/share", authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    await prisma.user.update({ where: { id: userId }, data: { shareToken: null } });
    res.json({ message: "Share link revoked" });
  } catch { res.status(500).json({ error: "Failed to revoke share link" }); }
});

app.post(
  "/api/transactions/bulk-delete",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

    const ids: number[] = Array.isArray(req.body?.ids)
      ? (req.body.ids as unknown[]).map(Number).filter((n) => !isNaN(n))
      : [];

    if (ids.length === 0) {
      res.status(400).json({ error: "ids array is required" });
      return;
    }

    try {
      const result = await prisma.transaction.deleteMany({
        where: { id: { in: ids }, userId },
      });
      res.json({ message: `${result.count} transaction(s) deleted` });
    } catch {
      res.status(500).json({ error: "Failed to delete transactions" });
    }
  }
);

export default app;
