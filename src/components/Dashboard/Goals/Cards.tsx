"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Car,
  Home,
  Plane,
  Target,
  MoreVertical,
  FolderSearch,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type Goal = {
  id: number;
  userId: number;
  title: string;
  icon: string;
  target: number;
  progress: number;
  deadline: string;
};

type EditGoalState = {
  title: string;
  target: string;
  deadline: string;
};

type Account = {
  id: number | string;
  name: string;
  balance: number | string;
};

const iconMap = {
  car: Car,
  home: Home,
  plane: Plane,
  target: Target,
};

export default function GoalCards() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isCompleteConfirmOpen, setIsCompleteConfirmOpen] = useState(false);

  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);

  const [manageFromAccountId, setManageFromAccountId] = useState<string>("");
  const [deleteReturnAccountId, setDeleteReturnAccountId] =
    useState<string>("");

  const [editGoal, setEditGoal] = useState<EditGoalState>({
    title: "",
    target: "",
    deadline: "",
  });

  const [fundAmount, setFundAmount] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    type: "error" | "success";
    msg: string;
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [goalsRes, acctsRes] = await Promise.all([
          fetch("/api/user/fetch/goals", {
            method: "POST",
            credentials: "include",
          }),
          fetch("/api/user/fetch/accounts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }),
        ]);

        if (!goalsRes.ok) throw new Error("Failed to fetch goals");
        if (!acctsRes.ok) throw new Error("Failed to fetch accounts");

        const [goalsData, acctsData] = await Promise.all([
          goalsRes.json(),
          acctsRes.json(),
        ]);

        setGoals(goalsData);
        setAccounts(acctsData);
      } catch (e: any) {
        setStatusMsg({ type: "error", msg: e?.message || "Load failed." });
      }
    })();
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    const off = date.getTimezoneOffset();
    const local = new Date(date.getTime() - off * 60 * 1000);
    return local.toISOString().split("T")[0];
  };

  const calculateProgress = (progress: number, target: number) =>
    target > 0 ? Math.min((progress / target) * 100, 100) : 0;

  const getDaysRemaining = (targetDate: string) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const selectedGoal = useMemo(
    () => goals.find((g) => g.id === selectedGoalId) || null,
    [goals, selectedGoalId]
  );

  const handleEditGoalSubmit = async () => {
    if (!selectedGoalId) return;
    setIsLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/user/edit/goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedGoalId,
          title: editGoal.title.trim(),
          target: Number(editGoal.target),
          deadline: editGoal.deadline,
        }),
      });

      if (!res.ok) {
        const err = await safeJson(res);
        throw new Error(err?.error || "Failed to update goal");
      }

      setGoals((prev) =>
        prev.map((g) =>
          g.id === selectedGoalId
            ? {
                ...g,
                title: editGoal.title.trim(),
                target: Number(editGoal.target),
                deadline: editGoal.deadline,
              }
            : g
        )
      );
      setIsEditDialogOpen(false);
      setStatusMsg({ type: "success", msg: "Goal updated." });
    } catch (e: any) {
      setStatusMsg({ type: "error", msg: e?.message || "Update failed." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGoal = async () => {
    if (!selectedGoalId || !deleteReturnAccountId) return;

    setIsLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/user/delete/goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedGoalId,
          returnMoney: true,
          returnAccountId: Number(deleteReturnAccountId),
        }),
      });

      if (!res.ok) {
        const err = await safeJson(res);
        throw new Error(err?.error || "Failed to delete goal");
      }

      setGoals((prev) => prev.filter((g) => g.id !== selectedGoalId));
      setIsDeleteConfirmOpen(false);
      setDeleteReturnAccountId("");
      setStatusMsg({
        type: "success",
        msg: "Goal deleted and funds returned.",
      });

      window.dispatchEvent(new CustomEvent("accountsRefresh"));
    } catch (e: any) {
      setStatusMsg({ type: "error", msg: e?.message || "Delete failed." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!selectedGoalId) return;

    setIsLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/user/delete/goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedGoalId,
          returnMoney: false,
          returnAccountId: null,
        }),
      });

      if (!res.ok) {
        const err = await safeJson(res);
        throw new Error(err?.error || "Failed to mark complete");
      }

      setGoals((prev) => prev.filter((g) => g.id !== selectedGoalId));
      setIsCompleteConfirmOpen(false);
      setStatusMsg({ type: "success", msg: "Goal marked complete." });
    } catch (e: any) {
      setStatusMsg({ type: "error", msg: e?.message || "Complete failed." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageFunds = async () => {
    if (!selectedGoalId || !fundAmount || !manageFromAccountId) return;

    const numericFundAmount = Number(fundAmount);
    if (!Number.isFinite(numericFundAmount) || numericFundAmount <= 0) {
      setStatusMsg({ type: "error", msg: "Enter a positive amount." });
      return;
    }

    setIsLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/user/increment/goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedGoalId,
          amount: numericFundAmount,
          fromAccountId: Number(manageFromAccountId),
        }),
      });

      if (!res.ok) {
        const err = await safeJson(res);
        throw new Error(err?.error || "Failed to add funds");
      }

      const data = await res.json();

      setGoals((prev) =>
        prev.map((g) =>
          g.id === selectedGoalId ? { ...g, progress: data.newProgress } : g
        )
      );

      setIsManageDialogOpen(false);
      setFundAmount("");
      setManageFromAccountId("");
      setStatusMsg({ type: "success", msg: "Funds added to goal." });

      window.dispatchEvent(new CustomEvent("accountsRefresh"));
    } catch (e: any) {
      setStatusMsg({ type: "error", msg: e?.message || "Add funds failed." });
    } finally {
      setIsLoading(false);
    }
  };

  async function safeJson(res: Response) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  return (
    <section className="min-h-screen max-w-screen-xl mx-auto p-3 sm:p-6 md:p-8 pt-0">
      {statusMsg && (
        <div
          className={`p-2 mb-4 rounded border ${
            statusMsg.type === "error"
              ? "bg-red-100 text-red-700 border-red-300"
              : "bg-green-100 text-green-700 border-green-300"
          }`}
        >
          {statusMsg.msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {goals.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <FolderSearch className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No Goals Found
            </h3>
          </div>
        ) : (
          goals.map((goal) => {
            const IconComponent =
              iconMap[goal.icon as keyof typeof iconMap] || Target;
            const progressPercent = calculateProgress(
              goal.progress,
              goal.target
            );
            const daysRemaining = getDaysRemaining(goal.deadline);
            const remaining = goal.target - goal.progress;

            return (
              <Card key={goal.id} className="overflow-hidden flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <IconComponent className="h-6 w-6 text-gray-600" />
                      <div>
                        <CardTitle className="text-lg">{goal.title}</CardTitle>
                        <CardDescription>
                          Target: {formatDate(goal.deadline)}
                        </CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isLoading}
                        >
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedGoalId(goal.id);
                            setEditGoal({
                              title: goal.title,
                              target: String(goal.target),
                              deadline: formatDateForInput(goal.deadline),
                            });
                            setIsEditDialogOpen(true);
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedGoalId(goal.id);
                            setIsCompleteConfirmOpen(true);
                          }}
                        >
                          Mark as Complete
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedGoalId(goal.id);
                            setDeleteReturnAccountId("");
                            setIsDeleteConfirmOpen(true);
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 flex-grow">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{progressPercent.toFixed(1)}%</span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Current</p>
                      <p className="font-semibold text-green-600">
                        {formatCurrency(goal.progress)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Target</p>
                      <p className="font-semibold">
                        {formatCurrency(goal.target)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Remaining</p>
                      <p className="font-semibold text-orange-600">
                        {formatCurrency(remaining)}
                      </p>
                    </div>
                    <div>
                      <p
                        className={`font-semibold ${
                          daysRemaining < 30 ? "text-red-600" : "text-gray-900"
                        }`}
                      >
                        {daysRemaining > 0
                          ? `${daysRemaining} days`
                          : "Overdue"}
                      </p>
                    </div>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full bg-black"
                    onClick={() => {
                      setSelectedGoalId(goal.id);
                      setManageFromAccountId("");
                      setFundAmount("");
                      setIsManageDialogOpen(true);
                    }}
                    disabled={isLoading}
                  >
                    Manage Funds
                  </Button>
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>

      {/* Manage Funds Dialog */}
      <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Manage Funds</DialogTitle>
            <DialogDescription>
              Pull from an account and add to the goal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="mf-amount">Amount</Label>
              <Input
                id="mf-amount"
                type="number"
                placeholder="50.00"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>From Account</Label>
              <Select
                value={manageFromAccountId}
                onValueChange={setManageFromAccountId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={String(acc.id)}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsManageDialogOpen(false)}
              className="bg-white"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleManageFunds}
              className="bg-black"
              disabled={
                isLoading ||
                !fundAmount ||
                !manageFromAccountId ||
                !selectedGoal
              }
            >
              {isLoading ? "Adding..." : "Add Funds"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Goal Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
            <DialogDescription>Update goal details.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editGoal.title}
                onChange={(e) =>
                  setEditGoal((s) => ({ ...s, title: e.target.value }))
                }
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-target">Target</Label>
              <Input
                id="edit-target"
                type="number"
                value={editGoal.target}
                onChange={(e) =>
                  setEditGoal((s) => ({ ...s, target: e.target.value }))
                }
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-deadline">Target Date</Label>
              <Input
                id="edit-deadline"
                type="date"
                value={editGoal.deadline}
                onChange={(e) =>
                  setEditGoal((s) => ({ ...s, deadline: e.target.value }))
                }
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="bg-white"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditGoalSubmit}
              className="bg-black"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete (choose return account) */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Delete Goal</DialogTitle>
            <DialogDescription>
              Select an account to return the goal’s current funds to.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Return To Account</Label>
              <Select
                value={deleteReturnAccountId}
                onValueChange={setDeleteReturnAccountId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={String(acc.id)}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="bg-white"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteGoal}
              disabled={isLoading || !deleteReturnAccountId}
            >
              {isLoading ? "Deleting..." : "Delete Goal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Complete (no funds returned) */}
      <Dialog
        open={isCompleteConfirmOpen}
        onOpenChange={setIsCompleteConfirmOpen}
      >
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Mark Goal as Complete?</DialogTitle>
            <DialogDescription>
              This removes the goal without returning its funds to an account.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCompleteConfirmOpen(false)}
              className="bg-white"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMarkComplete}
              className="bg-black"
              disabled={isLoading}
            >
              {isLoading ? "Completing..." : "Yes, Mark as Complete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
