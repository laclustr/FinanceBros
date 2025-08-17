"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { formatCurrency, parseCurrency } from "@/lib/utilities/currencyFormat";

interface TransactionFormProps {
  formType: "purchase" | "deposit";
  apiEndpoint: string;
  svgBackgroundColor: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  buttonText: string;
  buttonClass: string;
  successMessage: string;
}

export default function TransactionForm({
  formType,
  apiEndpoint,
  svgBackgroundColor,
  title,
  description,
  icon,
  buttonText,
  buttonClass,
  successMessage,
}: TransactionFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [transactionTitle, setTransactionTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetch("/api/user/fetch/accounts", {
      method: "POST",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAccounts(data.map((a) => a.name));
        } else {
          throw new Error("Invalid response");
        }
      })
      .catch((err) => {
        console.error("Failed to load accounts:", err);
        setAccounts([]);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!transactionTitle.trim()) {
      setErrorMsg(`Please enter a ${formType} title.`);
      return;
    }

    if (!selectedAccount) {
      setErrorMsg("Please select a valid account.");
      return;
    }

    if (!amount.trim()) {
      setErrorMsg("Please enter an amount.");
      return;
    }

    const numericAmount = parseFloat(parseCurrency(amount));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMsg("Please enter a valid amount greater than $0.00");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.set("title", transactionTitle.trim());
      formData.set("account", selectedAccount);
      formData.set("amount", parseCurrency(amount));

      const response = await fetch(apiEndpoint, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await response.json().catch(() => ({
        error: "Invalid server response",
      }));

      if (!response.ok) {
        setErrorMsg(data.message || data.error || "Submission failed");
      } else {
        setSuccessMsg(data.message || successMessage);
        setTransactionTitle("");
        setSelectedAccount("");
        setAmount("");
      }
    } catch (err) {
      setErrorMsg("Network error - please try again");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const formatted = formatCurrency(input);
    setAmount(formatted);
  };

  return (
    <div className="tab-content h-full flex flex-col">
      <form
        ref={formRef}
        className="flex-1 flex flex-col"
        noValidate
        onSubmit={handleSubmit}
      >
        <div className="text-center mb-6 sm:mb-8">
          <div
            className={`inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full mb-4 ${svgBackgroundColor}`}
          >
            {icon}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            {title}
          </h2>
          <p className="text-sm sm:text-base text-gray-600">{description}</p>
        </div>

        <div className="max-w-md mx-auto w-full mb-4 space-y-4">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {successMsg}
            </div>
          )}
        </div>

        <div className="flex-1 space-y-4 sm:space-y-6 max-w-md mx-auto w-full">
          <div className="space-y-2">
            <Label htmlFor={`${formType}-title`}>
              {formType.charAt(0).toUpperCase() + formType.slice(1)} Title
            </Label>
            <Input
              id={`${formType}-title`}
              name="title"
              type="text"
              placeholder={`e.g., ${
                formType === "deposit" ? "Paycheck, Refund" : "Groceries, Gas"
              }`}
              required
              value={transactionTitle}
              onChange={(e) => setTransactionTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${formType}-account`}>Account</Label>
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger id={`${formType}-account`} className="w-full">
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.length > 0 ? (
                  accounts.map((account) => (
                    <SelectItem key={account} value={account}>
                      {account}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-accounts" disabled>
                    Failed to load
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${formType}-amount`}>Amount ($)</Label>
            <Input
              id={`${formType}-amount`}
              name="amount"
              type="text"
              placeholder="0.00"
              required
              value={amount}
              onChange={handleAmountChange}
            />
          </div>
        </div>

        <div className="mt-6 sm:mt-8 max-w-md mx-auto w-full">
          <Button
            type="submit"
            className={`w-full text-white font-medium py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed ${buttonClass}`}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : buttonText}
          </Button>
        </div>
      </form>
    </div>
  );
}
