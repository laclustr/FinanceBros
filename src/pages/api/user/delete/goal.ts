import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/pages/api/verify-token.ts";

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

    const { id: goalId } = await request.json();

    if (!goalId) {
      return new Response(JSON.stringify({ error: "Goal ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId: user.id },
    });

    if (!goal) {
      return new Response(
        JSON.stringify({ error: "Goal not found or unauthorized." }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Transaction
    await prisma.$transaction(async (tx) => {
      await tx.goal.delete({
        where: { id: goal.id },
      });

      if (returnMoney) {
        await tx.bankAccount.update({
          where: { id: goal.bankAccountId },
          data: {
            balance: {
              increment: goal.progress, // return the saved progress
            },
          },
        });
      }
    });

    return new Response(
      JSON.stringify({ success: true, message: "Goal deleted successfully." }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error deleting goal:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  } finally {
    await prisma.$disconnect();
  }
}
