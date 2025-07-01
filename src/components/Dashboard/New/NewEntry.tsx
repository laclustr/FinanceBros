"use client";

import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import PurchaseTab from "./PurchaseTab";
import DepositTab from "./DepositTab";
import GoalTab from "./GoalTab";

type TabKey = "purchase" | "deposit" | "goal";

export default function TabCard() {
  const [activeTab, setActiveTab] = useState<TabKey>("purchase");

  const tabClass = (tab: TabKey) =>
    `tab-button flex-1 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-center border-b-2 transition-all duration-200 ${
      activeTab === tab
        ? "border-blue-600 text-blue-600 hover:text-blue-700"
        : "border-transparent text-gray-500 hover:text-blue-600 hover:border-blue-300"
    }`;

  return (
    <Card className="flex-1 flex flex-col shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-0">
        <div className="flex border-b border-gray-200 -mx-6 px-6">
          {(["purchase", "deposit", "goal"] as TabKey[]).map((tab) => (
            <button
              key={tab}
              className={tabClass(tab)}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                {tab === "purchase" && (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                )}
                {tab === "deposit" && (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                )}
                {tab === "goal" && (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                )}
                <span className="hidden sm:inline capitalize">{tab}</span>
                <span className="sm:hidden">
                  {tab === "purchase" ? "Buy" : tab === "deposit" ? "Add" : "Goal"}
                </span>
              </div>
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-4 sm:p-6 lg:p-8">
        {activeTab === "purchase" && <PurchaseTab />}
        {activeTab === "deposit" && <DepositTab />}
        {activeTab === "goal" && <GoalTab />}
      </CardContent>
    </Card>
  );
}
