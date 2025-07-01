"use client";

import TransactionForm from "./TransactionForm";

export default function DepositTab() {
  return (
    <TransactionForm
      formType="deposit"
      apiEndpoint="/api/user/push/deposits"
      title="Add a Deposit"
      description="Fund your accounts and track income"
      icon={
        <svg
          className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      }
      buttonText="Add Deposit"
      buttonClass="bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
      successMessage="Deposit added successfully!"
    />
  );
}