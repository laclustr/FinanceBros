"use client";

import TransactionForm from "./TransactionForm";

export default function PurchaseTab() {
  return (
    <TransactionForm
      formType="purchase"
      apiEndpoint="/api/user/push/purchases"
      title="Record a Purchase"
      description="Track your spending and expenses"
      icon={
        <svg
          className="w-6 h-6 sm:w-8 sm:h-8 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
      }
      buttonText="Add Purchase"
      buttonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
      successMessage="Purchase added successfully!"
    />
  );
}