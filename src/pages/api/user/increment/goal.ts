import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../../verify-token.ts";

const prisma = new PrismaClient();

export async function POST({ request, cookies }) {
  try {
    const token = cookies.get("token")?.value;
    const user = await verifyToken(token);

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Authentication required." }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await request.json().catch(() => ({}));
    const id = Number(body?.id);
    const amount = Number(body?.amount);
    const fromAccountId = Number(body?.fromAccountId);

    if (!id || !Number.isFinite(amount) || amount <= 0 || !fromAccountId) {
      return new Response(
        JSON.stringify({
          error:
            "Valid goal ID, positive amount, and fromAccountId are required.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const goal = await tx.Goal.findUnique({ where: { id } });
      if (!goal || goal.userId !== user.id) {
        throw new Response(
          JSON.stringify({ error: "Goal not found or unauthorized." }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      const account = await tx.BankAccount.findFirst({
        where: { id: fromAccountId, userId: user.id },
      });
      if (!account) {
        throw new Response(
          JSON.stringify({ error: "Account not found or unauthorized." }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      const currBalance = Number(account.balance || 0);
      if (currBalance < amount) {
        throw new Response(
          JSON.stringify({ error: "Insufficient account balance." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const newProgress = Math.min(goal.progress + amount, goal.target);

      await tx.BankAccount.update({
        where: { id: account.id },
        data: { balance: currBalance - amount },
      });

      const updatedGoal = await tx.Goal.update({
        where: { id: goal.id },
        data: { progress: newProgress },
      });

      return {
        newProgress: updatedGoal.progress,
        isComplete: updatedGoal.progress >= updatedGoal.target,
      };
    });

    return new Response(JSON.stringify({ success: true, ...result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    if (error instanceof Response) return error;

    console.error("Error incrementing goal progress:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  } finally {
    await prisma.$disconnect();
  }
}
