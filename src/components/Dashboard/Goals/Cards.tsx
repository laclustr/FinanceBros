"use client";

import { useEffect, useState } from "react";
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

// --- Types ---
interface Goal {
  id: number;
  userId: number;
  title: string;
  icon: string;
  target: number;
  progress: number;
  deadline: string;
}

interface EditGoalState {
  title: string;
  target: string;
  deadline: string;
}

// --- Icons ---
const iconMap = {
  car: Car,
  home: Home,
  plane: Plane,
  target: Target,
};

export default function GoalCards() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isCompleteConfirmOpen, setIsCompleteConfirmOpen] = useState(false);

  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [editGoal, setEditGoal] = useState<EditGoalState>({
    title: "",
    target: "",
    deadline: "",
  });
  const [fundAmount, setFundAmount] = useState("");

  // --- Fetch goals ---
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const res = await fetch("/api/user/fetch/goals", {
          method: "POST",
          credentials: "include",
        });

        if (res.redirected) {
          window.location.href = res.url;
          return;
        }

        if (!res.ok) throw new Error("Failed to fetch goals");

        const data = await res.json();
        setGoals(data);
      } catch (error) {
        console.error("Error fetching goals:", error);
      }
    };

    fetchGoals();
  }, []);

  // --- Helpers ---
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  const calculateProgress = (progress: number, target: number) =>
    Math.min((progress / target) * 100, 100);

  const getDaysRemaining = (targetDate: string) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // --- Handlers ---
  const handleEditGoalSubmit = async () => {
    if (!selectedGoalId) return;

    setGoals(
      goals.map((g) =>
        g.id === selectedGoalId
          ? {
              ...g,
              title: editGoal.title,
              target: Number(editGoal.target),
              deadline: editGoal.deadline,
            }
          : g
      )
    );

    await fetch("/api/user/edit/goal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: selectedGoalId,
        title: editGoal.title,
        target: Number(editGoal.target),
        deadline: editGoal.deadline,
      }),
    });

    setIsEditDialogOpen(false);
  };

  const handleDeleteGoal = async () => {
    if (!selectedGoalId) return;

    await fetch("/api/user/delete/goal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        returnMoney: true,
        id: selectedGoalId,
      }),
    });

    setGoals(goals.filter((g) => g.id !== selectedGoalId));
    setIsDeleteConfirmOpen(false);
  };

  const handleManageFunds = async () => {
    if (!selectedGoalId || !fundAmount) return;

    const numericFundAmount = Number(fundAmount);

    await fetch("/api/user/edit/goal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: selectedGoalId,
        progress:
          goals.find((g) => g.id === selectedGoalId)!.progress +
          numericFundAmount,
      }),
    });

    setGoals(
      goals.map((g) =>
        g.id === selectedGoalId
          ? { ...g, progress: g.progress + numericFundAmount }
          : g
      )
    );

    setIsManageDialogOpen(false);
    setFundAmount("");
  };

  const handleMarkComplete = async () => {
    if (!selectedGoalId) return;

    const goalToComplete = goals.find((g) => g.id === selectedGoalId);
    if (!goalToComplete) return;

    setGoals(
      goals.map((g) =>
        g.id === selectedGoalId ? { ...g, progress: g.target } : g
      )
    );

    await fetch("/api/user/delete/goal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        returnMoney: false,
        id: selectedGoalId,
        progress: goalToComplete.target,
      }),
    });

    setIsCompleteConfirmOpen(false);
  };

  const EmptyState = () => (
    <div className="text-center py-16 text-gray-500">
      <FolderSearch className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">No Goals Found</h3>
    </div>
  );

  // --- Render ---
  return (
    <section
      id="goal-section"
      className="min-h-screen max-w-screen-xl mx-auto p-3 sm:p-6 md:p-8 pt-0 transition-all duration-300"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {goals.length === 0 ? (
          <EmptyState />
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
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
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
                      setIsManageDialogOpen(true);
                    }}
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
              Enter an amount to add to your goal&apos;s progress.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Label htmlFor="fund-amount">Amount</Label>
            <Input
              id="fund-amount"
              type="number"
              placeholder="$50.00"
              value={fundAmount}
              onChange={(e) => setFundAmount(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsManageDialogOpen(false)}
              className="bg-white"
            >
              Cancel
            </Button>
            <Button onClick={handleManageFunds} className="bg-black">
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Goal Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
            <DialogDescription>
              Update your goal&apos;s details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={editGoal.title}
              onChange={(e) =>
                setEditGoal({ ...editGoal, title: e.target.value })
              }
            />
            <Label htmlFor="edit-target">Target</Label>
            <Input
              id="edit-target"
              type="number"
              value={editGoal.target}
              onChange={(e) =>
                setEditGoal({ ...editGoal, target: e.target.value })
              }
            />
            <Label htmlFor="edit-deadline">Target Date</Label>
            <Input
              id="edit-deadline"
              type="date"
              value={editGoal.deadline}
              onChange={(e) =>
                setEditGoal({ ...editGoal, deadline: e.target.value })
              }
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="bg-white"
            >
              Cancel
            </Button>
            <Button onClick={handleEditGoalSubmit} className="bg-black">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your
              goal.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="bg-white"
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteGoal}>
              Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Complete Confirmation */}
      <Dialog
        open={isCompleteConfirmOpen}
        onOpenChange={setIsCompleteConfirmOpen}
      >
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Mark Goal as Complete?</DialogTitle>
            <DialogDescription>
              This will set your current progress equal to your target amount,
              marking the goal as 100% complete. Are you sure?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCompleteConfirmOpen(false)}
              className="bg-white"
            >
              Cancel
            </Button>
            <Button onClick={handleMarkComplete} className="bg-black">
              Yes, Mark as Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
