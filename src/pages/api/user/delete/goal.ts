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
    const returnMoney = Boolean(body?.returnMoney);
    const returnAccountId =
      body?.returnAccountId === null || body?.returnAccountId === undefined
        ? null
        : Number(body.returnAccountId);

    if (!id) {
      return new Response(
        JSON.stringify({ error: "Valid goal ID required." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    await prisma.$transaction(async (tx) => {
      const goal = await tx.goal.findUnique({ where: { id } });

      if (!goal || goal.userId !== user.id) {
        throw new Response(
          JSON.stringify({ error: "Goal not found or unauthorized." }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      if (goal.progress >= goal.target) {
        if (!returnAccountId) {
          throw new Response(
            JSON.stringify({
              error:
                "returnAccountId is required to deduct funds when completing a goal.",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        const account = await tx.bankAccount.findFirst({
          where: { id: returnAccountId, userId: user.id },
        });

        if (!account) {
          throw new Response(
            JSON.stringify({ error: "Account not found or unauthorized." }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }

        const newBalance = Number(account.balance) - Number(goal.target);
        if (newBalance < 0) {
          throw new Response(
            JSON.stringify({ error: "Insufficient funds to complete goal." }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        await tx.purchase.create({
          data: {
            userId: user.id,
            bankAccountId: account.id,
            title: `Completed Goal: ${goal.title}`,
            amount: goal.target,
          },
        });

        await tx.bankAccount.update({
          where: { id: account.id },
          data: { balance: newBalance },
        });

        await tx.goal.delete({ where: { id: goal.id } });
      } else if (returnMoney) {
        if (!returnAccountId) {
          throw new Response(
            JSON.stringify({
              error: "returnAccountId is required when returning funds.",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        const account = await tx.bankAccount.findFirst({
          where: { id: returnAccountId, userId: user.id },
        });

        if (!account) {
          throw new Response(
            JSON.stringify({ error: "Account not found or unauthorized." }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }

        const amountToReturn = Number(goal.progress || 0);
        const current = Number(account.balance || 0);

        await tx.bankAccount.update({
          where: { id: account.id },
          data: { balance: current + amountToReturn },
        });

        await tx.goal.delete({ where: { id: goal.id } });
      } else {
        await tx.goal.delete({ where: { id: goal.id } });
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Goal completed/removed successfully.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    if (error instanceof Response) return error;

    console.error("Error handling goal completion/deletion:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  } finally {
    await prisma.$disconnect();
  }
}
