import { Router, type Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authenticate, type AuthRequest } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, birthday: true, createdAt: true },
    });
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json(user);
  } catch {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

router.put("/me", authenticate, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    name: z.string().max(80).optional(),
    birthday: z.string().optional().nullable(),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }

  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { name, birthday } = result.data;
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name !== undefined ? (name.trim() || null) : undefined,
        birthday: birthday !== undefined ? (birthday ? new Date(birthday) : null) : undefined,
      },
      select: { id: true, email: true, name: true, birthday: true, createdAt: true },
    });
    res.json(user);
  } catch {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.put("/password", authenticate, async (req: AuthRequest, res: Response) => {
  const schema = z
    .object({
      currentPassword: z.string().min(1, "Current password is required"),
      newPassword: z.string().min(8, "New password must be at least 8 characters"),
      confirmPassword: z.string(),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }

  const { currentPassword, newPassword } = result.data;
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) { res.status(400).json({ error: "Current password is incorrect" }); return; }

    if (currentPassword === newPassword) {
      res.status(400).json({ error: "New password must be different from current password" });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    res.json({ message: "Password updated successfully" });
  } catch {
    res.status(500).json({ error: "Failed to update password" });
  }
});

router.delete("/account", authenticate, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    password: z.string().min(1, "Password is required"),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }

  const { password } = result.data;
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) { res.status(400).json({ error: "Password is incorrect" }); return; }

    await prisma.user.delete({ where: { id: userId } });

    res.json({ message: "Account deleted successfully" });
  } catch {
    res.status(500).json({ error: "Failed to delete account" });
  }
});

export default router;
