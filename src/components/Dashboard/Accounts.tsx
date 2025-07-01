"use client";

import React, { useEffect, useState, useRef } from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

type Account = {
  id: number | string;
  name: string;
  balance: number | string;
};

export default function BalanceSection() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const [balance, setBalance] = useState(0);
  const balanceRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    fetch("/api/user/fetch/accounts", { method: "POST", headers: { "Content-Type": "application/json" } })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch accounts");
        return res.json();
      })
      .then((data: Account[]) => {
        setAccounts(data);
        setSelectedAccountId("all");
        updateBalance("all", data);
      })
      .catch(() => {
        if (balanceRef.current) {
          balanceRef.current.textContent = "Error loading balance";
          balanceRef.current.className = "font-bold text-2xl text-red-600";
        }
      });
  }, []);

  function updateBalance(accountId: string, accts = accounts) {
    let total = 0;
    if (accountId === "all") {
      total = accts.reduce((sum, a) => sum + Number(a.balance || 0), 0);
    } else {
      const acc = accts.find((a) => String(a.id) === accountId);
      total = acc ? Number(acc.balance || 0) : 0;
    }
    setBalance(total);
    window.currentBalance = total;
    window.dispatchEvent(new CustomEvent("accountChanged", { detail: { accountId } }));

    if (balanceRef.current) {
      balanceRef.current.animate([{ transform: "scale(1.05)" }, { transform: "scale(1)" }], { duration: 200 });
    }
  }

  const formatCurrency = (amount: number) =>
    amount.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

  function onSelect(value: string) {
    setSelectedAccountId(value);
    updateBalance(value);
  }

  return (
    <section className="bg-gray-50 p-4 sm:p-6 md:p-8 pb-0 max-w-screen-xl mx-auto">
      <div className="flex justify-between items-center gap-2">
        <div className="leading-tight">
          <p className="text-gray-500 text-xs mb-0.5">Current Balance</p>
          <p ref={balanceRef} className="font-bold text-2xl text-gray-800">
            {formatCurrency(balance)}
          </p>
        </div>

        <Select value={selectedAccountId} onValueChange={onSelect}>
          <SelectTrigger className="w-40 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Accounts</SelectItem>
            {accounts.map((acc) => (
              <SelectItem key={acc.id} value={String(acc.id)}>
                {acc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </section>
  );
}
