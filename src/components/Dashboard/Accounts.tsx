"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Account = {
  id: number | string;
  name: string;
  balance: number;
};

export default function AccountManagement() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState<string>("");

  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountBalance, setNewAccountBalance] = useState("");

  const [statusMsg, setStatusMsg] = useState<{
    type: "error" | "success";
    msg: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  // Fetch user accounts
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user/fetch/accounts", {
          method: "POST",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch accounts");
        setAccounts(await res.json());
      } catch (e: any) {
        setStatusMsg({ type: "error", msg: e?.message || "Failed to load" });
      }
    })();
  }, []);

  const handleAddAccount = async () => {
    if (!newAccountName || !newAccountBalance) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/user/account/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAccountName,
          balance: Number(newAccountBalance),
        }),
      });
      if (!res.ok) throw new Error("Failed to add account");

      const account = await res.json();
      setAccounts((prev) => [...prev, account]);
      setIsAddAccountOpen(false);
      setNewAccountName("");
      setNewAccountBalance("");
      setStatusMsg({ type: "success", msg: "Account added!" });
    } catch (e: any) {
      setStatusMsg({ type: "error", msg: e?.message || "Add failed" });
    } finally {
      setIsLoading(false);
    }
  };

  // delete BANK account
  const handleDeleteBankAccount = async () => {
    if (!selectedDeleteId) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/user/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: Number(selectedDeleteId) }),
      });
      if (!res.ok) throw new Error("Failed to delete account");

      setAccounts((prev) =>
        prev.filter((a) => String(a.id) !== selectedDeleteId)
      );
      setIsDeleteAccountOpen(false);
      setSelectedDeleteId("");
      setStatusMsg({ type: "success", msg: "Bank account deleted." });
    } catch (e: any) {
      setStatusMsg({ type: "error", msg: e?.message || "Delete failed" });
    } finally {
      setIsLoading(false);
    }
  };

  // send email verification
  const handleSendVerification = async () => {
    await fetch("/api/user/send-verification", { method: "POST" });
    setStatusMsg({ type: "success", msg: "Verification email sent." });
  };

  const handleChangeEmail = async (newEmail: string) => {
    await fetch("/api/user/change-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail }),
    });
    setStatusMsg({ type: "success", msg: "Email updated." });
  };

  const handleChangePassword = async (newPassword: string) => {
    await fetch("/api/user/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPassword }),
    });
    setStatusMsg({ type: "success", msg: "Password updated." });
  };

  const handleLogout = async () => {
    await fetch("/api/user/logout", { method: "POST" });
    window.location.href = "/login";
  };

  // delete USER account
  const handleDeleteUserAccount = async () => {
    await fetch("/api/user/delete-account", { method: "POST" });
    window.location.href = "/goodbye";
  };

  return (
    <section className="max-w-2xl mx-auto p-6 space-y-6">
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

      {/* Bank Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Bank Accounts</CardTitle>
          <CardDescription>Manage your linked accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <p className="text-sm text-gray-500">No accounts yet</p>
          ) : (
            <ul className="space-y-2">
              {accounts.map((a) => (
                <li
                  key={a.id}
                  className="flex justify-between items-center border rounded p-2"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{a.name}</span>
                    <span className="text-sm text-gray-600">
                      ${a.balance.toFixed(2)}
                    </span>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setSelectedDeleteId(String(a.id));
                      setIsDeleteAccountOpen(true);
                    }}
                  >
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={() => setIsAddAccountOpen(true)}>Add Account</Button>
        </CardFooter>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button onClick={handleSendVerification} className="w-full">
            Send Email Verification
          </Button>
          <Button
            onClick={() => handleChangeEmail(prompt("Enter new email") || "")}
            className="w-full"
          >
            Change Email
          </Button>
          <Button
            onClick={() =>
              handleChangePassword(prompt("Enter new password") || "")
            }
            className="w-full"
          >
            Change Password
          </Button>
          <Button onClick={handleLogout} className="w-full">
            Logout
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteUserAccount}
            className="w-full"
          >
            Delete Account
          </Button>
        </CardContent>
      </Card>

      {/* Add Account Dialog */}
      <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Bank Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Account Name</Label>
              <Input
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
              />
            </div>
            <div>
              <Label>Starting Balance</Label>
              <Input
                type="number"
                value={newAccountBalance}
                onChange={(e) => setNewAccountBalance(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddAccountOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddAccount} disabled={isLoading}>
              {isLoading ? "Adding..." : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Bank Account Dialog */}
      <Dialog open={isDeleteAccountOpen} onOpenChange={setIsDeleteAccountOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Bank Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this bank account?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteAccountOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteBankAccount}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
