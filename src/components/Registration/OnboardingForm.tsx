"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type Account = {
  id: number;
  name: string;
  type: "checking" | "savings";
  balance: string; // formatted string with commas
};

export default function OnboardingForm() {
  const [accounts, setAccounts] = useState<Account[]>([
    { id: 0, name: "", type: "checking", balance: "" },
  ]);
  const [formValues, setFormValues] = useState({
    firstName: "",
    lastName: "",
    age: "",
    employer: "",
    creditScore: "",
    income: "",
  });
  const [error, setError] = useState("");

  // Handle form input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormValues((v) => ({ ...v, [name]: value }));
  };

  // Handle dynamic account input change
  const handleAccountChange = (
    id: number,
    field: keyof Omit<Account, "id">,
    value: string
  ) => {
    setAccounts((accs) =>
      accs.map((acc) =>
        acc.id === id ? { ...acc, [field]: value } : acc
      )
    );
  };

  // Add new account
  const addAccount = () => {
    setAccounts((accs) => [
      ...accs,
      { id: Date.now(), name: "", type: "checking", balance: "" },
    ]);
  };

  // Remove account
  const removeAccount = (id: number) => {
    setAccounts((accs) => accs.filter((acc) => acc.id !== id));
  };

  // Format balance input with commas, limit 2 decimals
  const formatBalance = (raw: string) => {
    let value = raw.replace(/,/g, "");
    if (!value.match(/^\d*\.?\d{0,2}$/)) {
      // invalid decimal format, ignore
      return raw;
    }

    const parts = value.split(".");
    let intPart = parts[0];
    let decPart = parts[1] || "";

    intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    return decPart.length > 0 ? `${intPart}.${decPart}` : intPart;
  };

  // Handle balance input formatting while preserving cursor position
  const handleBalanceInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    id: number
  ) => {
    const input = e.target;
    const raw = input.value;
    const cursorPos = input.selectionStart || 0;

    let formatted = formatBalance(raw);

    // Calculate cursor adjustment
    const oldLeft = raw.slice(0, cursorPos);
    const newLeft = formatted.slice(0, cursorPos);
    const commasBefore = (oldLeft.match(/,/g) || []).length;
    const commasAfter = (newLeft.match(/,/g) || []).length;
    const diff = commasAfter - commasBefore;

    handleAccountChange(id, "balance", formatted);

    // Set cursor after the update (via timeout because React input)
    setTimeout(() => {
      input.selectionStart = input.selectionEnd = cursorPos + diff;
    }, 0);
  };

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const {
      firstName,
      lastName,
      age,
      income,
      employer,
      creditScore,
    } = formValues;

    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your full name");
      return;
    }
    const ageNum = Number(age);
    if (!ageNum || ageNum < 13) {
      setError("Please enter a valid age (13 or older)");
      return;
    }
    if (!income) {
      setError("Please select your income range");
      return;
    }
    const creditNum = Number(creditScore);
    if (!creditNum || creditNum < 300 || creditNum > 850) {
      setError("Credit score must be between 300 and 850");
      return;
    }
    if (accounts.length === 0) {
      setError("Please enter at least one bank account");
      return;
    }

    // Validate accounts
    for (const acc of accounts) {
      if (
        !acc.name.trim() ||
        !acc.type ||
        !acc.balance ||
        Number(acc.balance.replace(/,/g, "")) <= 0
      ) {
        setError(
          "Each account must have a valid name, type, and positive balance"
        );
        return;
      }
    }

    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      age: ageNum,
      income,
      employer: employer.trim(),
      creditScore: creditNum,
      accounts: accounts.map((acc) => ({
        name: acc.name.trim(),
        type: acc.type,
        balance: Number(acc.balance.replace(/,/g, "")),
      })),
    };

    try {
      const res = await fetch("/api/user/push/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Something went wrong during onboarding.");
      }
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message || "Unknown error");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen pt-5 p-4 bg-gray-50">
      <Card className="w-full max-w-2xl shadow-xl border border-gray-200">
        <CardHeader>
          <CardTitle className="text-center text-3xl font-semibold text-blue-900">
            Welcome to FinanceBros
          </CardTitle>
          <p className="text-center text-sm text-gray-600">
            Set up your financial profile to get started
          </p>
        </CardHeader>
        <form
          onSubmit={handleSubmit}
          className="w-full space-y-6"
          noValidate
          id="onboardingForm"
        >
          <CardContent className="space-y-6">
            {[
              {
                id: "firstName",
                label: "First Name",
                required: true,
                placeholder: "e.g. John",
                type: "text",
              },
              {
                id: "lastName",
                label: "Last Name",
                required: true,
                placeholder: "e.g. Doe",
                type: "text",
              },
              {
                id: "age",
                label: "Your Age",
                required: true,
                placeholder: "e.g. 25",
                type: "number",
                inputMode: "numeric",
              },
              {
                id: "employer",
                label: "Employer",
                required: false,
                placeholder: "e.g. Amazon",
                type: "text",
              },
              {
                id: "creditScore",
                label: "Credit Score",
                required: true,
                placeholder: "e.g. 720",
                type: "number",
              },
            ].map(({ id, label, required, placeholder, type, inputMode }) => (
              <div className="flex flex-col gap-1" key={id}>
                <Label htmlFor={id}>
                  {label} {required && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id={id}
                  name={id}
                  placeholder={placeholder}
                  required={required}
                  type={type}
                  inputMode={inputMode}
                  value={(formValues as any)[id]}
                  onChange={handleChange}
                />
              </div>
            ))}

            <div className="flex flex-col gap-1">
              <Label htmlFor="income">
                Estimated Monthly Income{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Select
                onValueChange={(value) =>
                  setFormValues((v) => ({ ...v, income: value }))
                }
                value={formValues.income}
                name="income"
                id="income"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select income range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under-1000">Under $1,000</SelectItem>
                  <SelectItem value="1000-3000">$1,000 - $3,000</SelectItem>
                  <SelectItem value="3000-5000">$3,000 - $5,000</SelectItem>
                  <SelectItem value="over-5000">Over $5,000</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label className="block">
                Bank Accounts <span className="text-red-500">*</span>
              </Label>

              {accounts.map(({ id, name, type, balance }, idx) => (
                <div
                  key={id}
                  className="account-group space-y-2 p-3 bg-white border border-gray-200 rounded-xl relative shadow-sm"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:gap-4">
                    <div className="flex-1">
                      <Label htmlFor={`account-name-${id}`}>
                        Account Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id={`account-name-${id}`}
                        name="accountName[]"
                        value={name}
                        required
                        onChange={(e) =>
                          handleAccountChange(id, "name", e.target.value)
                        }
                      />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor={`account-type-${id}`}>
                        Type <span className="text-red-500">*</span>
                      </Label>
                      <select
                        id={`account-type-${id}`}
                        name="accountType[]"
                        required
                        className="w-full px-2 py-1 border rounded-md"
                        value={type}
                        onChange={(e) =>
                          handleAccountChange(
                            id,
                            "type",
                            e.target.value as "checking" | "savings"
                          )
                        }
                      >
                        <option value="checking">Checking</option>
                        <option value="savings">Savings</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor={`account-balance-${id}`}>
                      Balance ($) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`account-balance-${id}`}
                      name="accountBalance[]"
                      inputMode="decimal"
                      type="text"
                      required
                      className="balance-input appearance-none"
                      value={balance}
                      onChange={(e) => handleBalanceInput(e, id)}
                    />
                  </div>
                  {accounts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAccount(id)}
                      className="absolute top-2 right-2 text-red-500 text-sm hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addAccount}
                className="w-full mt-2"
              >
                + Add Another Account
              </Button>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full">
              Continue
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
