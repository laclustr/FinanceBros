import { setAllTransactions } from './state.js';

export async function fetchTransactions() {
  try {
    const now = new Date();
    const start = new Date(now);
    start.setMonth(start.getMonth() - 2);

    const body = JSON.stringify({ startDate: start.toISOString(), endDate: now.toISOString() });
    const headers = { "Content-Type": "application/json" };

    const [purchases, deposits] = await Promise.all([
      fetch("/api/user/fetch/purchases", { method: "POST", headers, body }).then(r => r.json()),
      fetch("/api/user/fetch/deposits", { method: "POST", headers, body }).then(r => r.json())
    ]);

    const combinedTransactions = [
      ...purchases.map(x => ({ ...x, type: "purchase", id: x.id })),
      ...deposits.map(x => ({ ...x, type: "deposit", id: x.id }))
    ];
    
    setAllTransactions(combinedTransactions);

  } catch (err) {
    console.error("Failed to fetch transactions:", err);
    throw err;
  }
}

export async function updateTransaction(transactionData) {
  const endpoint = `/api/user/edit/${transactionData.type}`;
  const body = JSON.stringify({
    id: transactionData.id,
    title: transactionData.title,
    amount: transactionData.amount,
    date: transactionData.date,
  });
  
  return fetch(endpoint, { 
    method: "POST", 
    headers: { "Content-Type": "application/json" }, 
    body 
  });
}

export async function deleteTransaction(transaction) {
  const endpoint = `/api/user/delete/${transaction.type}`;
  const body = JSON.stringify({ id: transaction.id });
  
  return fetch(endpoint, { 
    method: "POST", 
    headers: { "Content-Type": "application/json" }, 
    body 
  });
}