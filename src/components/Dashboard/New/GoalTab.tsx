"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatCurrency, parseCurrency } from "@/lib/utilities/currencyFormat";

export default function GoalTab() {
  const formRef = useRef<HTMLFormElement>(null);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!title.trim()) {
      setErrorMsg("Please enter a goal title.");
      return;
    }

    if (!target.trim()) {
      setErrorMsg("Please enter a target amount.");
      return;
    }

    const numericTarget = parseFloat(parseCurrency(target));
    if (isNaN(numericTarget) || numericTarget <= 0) {
      setErrorMsg("Please enter a valid target amount greater than $0.00");
      return;
    }

    if (!deadline) {
      setErrorMsg("Please select a target date.");
      return;
    }

    const selectedDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate <= today) {
      setErrorMsg("Please select a future date for your goal.");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.set("title", title.trim());
      formData.set("target", parseCurrency(target));
      formData.set("deadline", selectedDate.toISOString());

      const response = await fetch("/api/user/push/goals", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await response.json().catch(() => ({ error: "Invalid server response" }));

      if (!response.ok) {
        setErrorMsg(data.message || data.error || "Submission failed");
      } else {
        setSuccessMsg(data.message || "Goal created successfully!");
        setTitle("");
        setTarget("");
        setDeadline(undefined);
      }
    } catch (err) {
      setErrorMsg("Network error - please try again");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
  
    const isValid = /^(\d{1,3}(,\d{3})*|\d+)?(\.\d{0,2})?$/.test(input.replace(/,/g, ""));
    if (!isValid) return;

    const endsWithDot = input.endsWith(".");
    const endsWithZeroAfterDot = /\.\d?0?$/.test(input);
  
    const numericPart = parseCurrency(input);
    const formatted = formatCurrency(numericPart);
  
    if (endsWithDot || endsWithZeroAfterDot) {
      setTarget(input);
    } else {
      setTarget(formatted);
    }
  };
  

  return (
    <div id="goal-tab" className="tab-content h-full flex flex-col">
      <form ref={formRef} className="flex-1 flex flex-col" noValidate onSubmit={handleSubmit}>
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full mb-4">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Set a Goal</h2>
          <p className="text-sm sm:text-base text-gray-600">Define your savings targets and deadlines</p>
        </div>

        <div className="max-w-md mx-auto w-full mb-4 space-y-4">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{errorMsg}</div>
          )}
          {successMsg && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{successMsg}</div>
          )}
        </div>

        <div className="flex-1 space-y-4 sm:space-y-6 max-w-md mx-auto w-full">
          <div className="space-y-2">
            <Label htmlFor="goal-title">Goal Title</Label>
            <Input
              id="goal-title"
              name="title"
              type="text"
              placeholder="e.g., Emergency Fund, Vacation, New Car"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-target">Target Amount ($)</Label>
            <Input
              id="goal-target"
              name="target"
              type="text"
              placeholder="0.00"
              required
              value={target}
              onChange={handleTargetChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-deadline">Target Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  data-empty={!deadline}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !deadline && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deadline ? format(deadline, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={deadline} onSelect={setDeadline} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 max-w-md mx-auto w-full">
          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Create Goal"}
          </Button>
        </div>
      </form>
    </div>
  );
}
