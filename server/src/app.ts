import { PrismaClient } from "@prisma/client";
import express, { Request, Response } from "express";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import { authenticate, AuthRequest } from "./middleware/auth";

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
      orderBy: { createdAt: "desc" },
    });

    res.json(transactions);
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

app.post("/api/transactions", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { merchant, amount, category, createdAt } = req.body ?? {};

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
        createdAt: createdAt ? new Date(createdAt) : new Date(),
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
      const { merchant, amount, category } = req.body ?? {};

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
      orderBy: { createdAt: "desc" },
    });

    const budget = await prisma.budget.findFirst({
      where: {
        userId,
        month: currentMonth,
        category: "Monthly",
      },
      orderBy: { id: "desc" },
    });

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

    if (budget && budget.limit > 0) {
      const percentUsed = (totalSpent / budget.limit) * 100;

      insights.push({
        type:
          percentUsed < 50
            ? "positive"
            : percentUsed < 80
            ? "warning"
            : "danger",
        message: `You’ve spent $${totalSpent.toFixed(
          2
        )} this month, which is ${percentUsed.toFixed(1)}% of your budget.`,
      });
    } else {
      insights.push({
        type: "warning",
        message: `You’ve spent $${totalSpent.toFixed(
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

    if (budget && budget.limit > 0) {
      const projectedPercent = (projectedSpend / budget.limit) * 100;

      if (projectedPercent > 100) {
        projectionType = "danger";
      } else if (projectedPercent >= 80) {
        projectionType = "warning";
      }
    }

    insights.push({
      type: projectionType,
      message: `At your current pace, you’re projected to spend $${projectedSpend.toFixed(
        2
      )} by month-end.`,
    });

    if (budget && budget.limit > 0) {
      if (projectedSpend > budget.limit) {
        insights.push({
          type: "danger",
          message: `You are trending over budget by $${(
            projectedSpend - budget.limit
          ).toFixed(2)} this month.`,
        });
      } else {
        insights.push({
          type: "positive",
          message: `You are currently on pace to stay $${(
            budget.limit - projectedSpend
          ).toFixed(2)} under budget.`,
        });
      }

      const remaining = budget.limit - totalSpent;

      if (daysLeft > 0) {
        const rawDailySpend = remaining / daysLeft;
        const safeDailySpend = Math.max(rawDailySpend, 0);
        const percentUsed = (totalSpent / budget.limit) * 100;

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

    res.json({ insights: insights.slice(0, 7) });
  } catch (error) {
    console.error("Failed to generate insights:", error);
    res.status(500).json({ error: "Failed to generate insights" });
  }
});

export default app; 