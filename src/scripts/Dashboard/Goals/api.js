import { createGoalCard } from "./cards.js";

export async function fetchTransactions() {
  try {
    const body = JSON.stringify({});
    const headers = { "Content-Type": "application/json" };

    const goals = await fetch("/api/user/fetch/goals", { method: "POST", headers, body })

    createGoalCard(goals);

  } catch (err) {
    console.error("Failed to fetch transactions:", err);
    throw err;
  }
}