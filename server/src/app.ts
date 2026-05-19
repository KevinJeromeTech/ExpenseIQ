import { PrismaClient } from "@prisma/client";
import express, { Request, Response } from "express";
import { randomBytes } from "crypto";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import { authenticate, AuthRequest } from "./middleware/auth";
import authRouter from "./routes/auth";
import usersRouter from "./routes/users";

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

    // Process recurring transactions
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

      if (recurring.frequency === 'weekly') {
        const daysSince = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
        isDue = daysSince >= 7;
      } else if (recurring.frequency === 'monthly') {
        isDue = lastDate.getMonth() !== now.getMonth() || lastDate.getFullYear() !== now.getFullYear();
      }

      if (isDue) {
        // Check we haven't already created one this period
        const alreadyCreatedThisPeriod = transactions.some(t => {
          if (t.merchant !== recurring.merchant || t.category !== recurring.category) return false;
          const tDate = new Date(t.transactionDate);
          if (recurring.frequency === 'weekly') {
            const daysSince = (now.getTime() - tDate.getTime()) / (1000 * 60 * 60 * 24);
            return daysSince < 7;
          }
          if (recurring.frequency === 'monthly') {
            return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
          }
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

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const currentMonth = new Date().toISOString().slice(0, 7);

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { transactionDate: "desc" },
    });

    const categoryBudgets = await prisma.budget.findMany({
      where: { userId, month: currentMonth },
    });
    const globalBudget = categoryBudgets.find(b => b.category === 'Monthly');

    type Insight = {
      type: "positive" | "warning" | "danger";
      message: string;
    };

    const insights: Insight[] = [];

    if (transactions.length === 0) {
      res.json({
        insights: [
          {
            type: "positive",
            message:
              "No transactions yet. Add a few expenses to unlock smarter insights.",
          },
        ],
      });
      return;
    }

    const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);

    const categoryTotals: Record<string, number> = {};

    for (const transaction of transactions) {
      categoryTotals[transaction.category] =
        (categoryTotals[transaction.category] || 0) + transaction.amount;
    }

    const sortedCategories = Object.entries(categoryTotals).sort(
      (a, b) => b[1] - a[1]
    );

    const [topCategoryName, topCategoryAmount] = sortedCategories[0];

    const largestExpense = transactions.reduce((max, transaction) =>
      transaction.amount > max.amount ? transaction : max
    );

    const now = new Date();
    const today = now.getDate();

    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate();

    const daysLeft = Math.max(daysInMonth - today, 0);
    const dailyAverage = totalSpent / Math.max(today, 1);
    const projectedSpend = dailyAverage * daysInMonth;

    if (globalBudget && globalBudget.limit > 0) {
      const percentUsed = (totalSpent / globalBudget.limit) * 100;

      insights.push({
        type:
          percentUsed < 50
            ? "positive"
            : percentUsed < 80
            ? "warning"
            : "danger",
        message: `You've spent $${totalSpent.toFixed(
          2
        )} this month, which is ${percentUsed.toFixed(1)}% of your budget.`,
      });
    } else {
      insights.push({
        type: "warning",
        message: `You've spent $${totalSpent.toFixed(
          2
        )} this month. Set a monthly budget to unlock better insights.`,
      });
    }

    const topCategoryPercent = (topCategoryAmount / totalSpent) * 100;

    insights.push({
      type: "warning",
      message: `${topCategoryName} is your largest spending category at $${topCategoryAmount.toFixed(
        2
      )} (${topCategoryPercent.toFixed(1)}% of total spending).`,
    });

    insights.push({
      type: "positive",
      message: `Your largest purchase was $${largestExpense.amount.toFixed(
        2
      )} at ${largestExpense.merchant}.`,
    });

    let projectionType: "positive" | "warning" | "danger" = "positive";

    if (globalBudget && globalBudget.limit > 0) {
      const projectedPercent = (projectedSpend / globalBudget.limit) * 100;

      if (projectedPercent > 100) {
        projectionType = "danger";
      } else if (projectedPercent >= 80) {
        projectionType = "warning";
      }
    }

    insights.push({
      type: projectionType,
      message: `At your current pace, you're projected to spend $${projectedSpend.toFixed(
        2
      )} by month-end.`,
    });

    if (globalBudget && globalBudget.limit > 0) {
      if (projectedSpend > globalBudget.limit) {
        insights.push({
          type: "danger",
          message: `You are trending over budget by $${(
            projectedSpend - globalBudget.limit
          ).toFixed(2)} this month.`,
        });
      } else {
        insights.push({
          type: "positive",
          message: `You are currently on pace to stay $${(
            globalBudget.limit - projectedSpend
          ).toFixed(2)} under budget.`,
        });
      }

      const remaining = globalBudget.limit - totalSpent;

      if (daysLeft > 0) {
        const rawDailySpend = remaining / daysLeft;
        const safeDailySpend = Math.max(rawDailySpend, 0);
        const percentUsed = (totalSpent / globalBudget.limit) * 100;

        if (percentUsed >= 60) {
          insights.push({
            type: percentUsed >= 80 ? "danger" : "warning",
            message: `To stay on budget, keep daily spending around $${safeDailySpend.toFixed(
              2
            )} for the rest of the month.`,
          });
        } else {
          insights.push({
            type: "positive",
            message:
              "You still have plenty of room in your budget this month.",
          });
        }
      }
    }

    // Per-category budget insights
    const categoriesWithBudget = categoryBudgets.filter(b => b.category !== 'Monthly');
    for (const catBudget of categoriesWithBudget) {
      const catSpent = categoryTotals[catBudget.category] ?? 0;
      const catPercent = (catSpent / catBudget.limit) * 100;
      if (catPercent >= 100) {
        insights.push({
          type: 'danger',
          message: `You've exceeded your ${catBudget.category} budget ($${catSpent.toFixed(2)} / $${catBudget.limit.toFixed(2)}).`,
        });
      } else if (catPercent >= 75) {
        insights.push({
          type: 'warning',
          message: `You're at ${catPercent.toFixed(0)}% of your ${catBudget.category} budget ($${catSpent.toFixed(2)} / $${catBudget.limit.toFixed(2)}).`,
        });
      }
    }

    res.json({ insights: insights.slice(0, 7) });
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
    const totalExpenses = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    res.json({
      totalExpenses,
      totalIncome,
      netIncome: totalIncome - totalExpenses,
      transactionCount: transactions.length,
      budgets,
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
