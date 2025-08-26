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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  XCircle,
  Mail,
  Lock,
  UserX,
  Plus,
  CreditCard,
  Shield,
  Settings,
} from "lucide-react";

type Account = {
  id: number | string;
  name: string;
  balance: number;
  type: "checking" | "savings";
};

type User = {
  email: string;
  isEmailVerified: boolean;
};

export default function AccountManagement() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState<string>("");

  // Add Account States
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountBalance, setNewAccountBalance] = useState("");
  const [newAccountType, setNewAccountType] = useState<"checking" | "savings">(
    "checking"
  );

  // Email Verification States
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  // Change Email States
  const [showChangeEmailForm, setShowChangeEmailForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailVerificationCode, setEmailVerificationCode] = useState("");

  // Change Password States
  const [showChangePasswordForm, setShowChangePasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Delete Account States
  const [showDeleteAccountForm, setShowDeleteAccountForm] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState("");
  const [deletePassword, setDeletePassword] = useState("");

  const [statusMsg, setStatusMsg] = useState<{
    type: "error" | "success";
    msg: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  // Fetch user data and accounts
  useEffect(() => {
    (async () => {
      try {
        const [accountsRes, userRes] = await Promise.all([
          fetch("/api/user/fetch/accounts", {
            method: "POST",
            credentials: "include",
          }),
          fetch("/api/user/profile", {
            method: "GET",
            credentials: "include",
          }),
        ]);

        if (!accountsRes.ok) throw new Error("Failed to fetch accounts");
        if (!userRes.ok) throw new Error("Failed to fetch user profile");

        const accountsData = await accountsRes.json();
        const userData = await userRes.json();

        setAccounts(accountsData);
        setUser(userData);
      } catch (e: any) {
        setStatusMsg({
          type: "error",
          msg: e?.message || "Failed to load data",
        });
      }
    })();
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);

  const resetAllForms = () => {
    setShowVerificationForm(false);
    setShowChangeEmailForm(false);
    setShowChangePasswordForm(false);
    setShowDeleteAccountForm(false);
    setVerificationCode("");
    setNewEmail("");
    setEmailVerificationCode("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setDeleteEmail("");
    setDeletePassword("");
  };

  const handleAddAccount = async () => {
    if (!newAccountName || !newAccountBalance) return;
    setIsLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/user/account/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAccountName,
          balance: Number(newAccountBalance),
          type: newAccountType,
        }),
      });
      if (!res.ok) throw new Error("Failed to add account");

      const account = await res.json();
      setAccounts((prev) => [...prev, account]);
      setIsAddAccountOpen(false);
      setNewAccountName("");
      setNewAccountBalance("");
      setNewAccountType("checking");
      setStatusMsg({ type: "success", msg: "Account added successfully!" });
    } catch (e: any) {
      setStatusMsg({
        type: "error",
        msg: e?.message || "Failed to add account",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBankAccount = async () => {
    if (!selectedDeleteId) return;
    setIsLoading(true);
    setStatusMsg(null);

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
      setStatusMsg({ type: "success", msg: "Account deleted successfully." });
    } catch (e: any) {
      setStatusMsg({
        type: "error",
        msg: e?.message || "Failed to delete account",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendVerification = async () => {
    setIsLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/user/send-verification", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to send verification");
      setShowVerificationForm(true);
      setStatusMsg({
        type: "success",
        msg: "Verification code sent to your email!",
      });
    } catch (e: any) {
      setStatusMsg({
        type: "error",
        msg: e?.message || "Failed to send verification",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) return;
    setIsLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/user/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verificationCode }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Invalid verification code");

      setUser((prev) => (prev ? { ...prev, isEmailVerified: true } : null));
      setShowVerificationForm(false);
      setVerificationCode("");
      setStatusMsg({ type: "success", msg: "Email verified successfully!" });
    } catch (e: any) {
      setStatusMsg({ type: "error", msg: e?.message || "Verification failed" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestEmailChange = async () => {
    if (!newEmail.trim()) return;
    setIsLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/user/request-email-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to request email change");
      setStatusMsg({
        type: "success",
        msg: "Verification code sent to new email!",
      });
    } catch (e: any) {
      setStatusMsg({
        type: "error",
        msg: e?.message || "Failed to request email change",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmEmailChange = async () => {
    if (!emailVerificationCode.trim()) return;
    setIsLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/user/confirm-email-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: emailVerificationCode }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Invalid verification code");

      setUser((prev) =>
        prev ? { ...prev, email: newEmail, isEmailVerified: true } : null
      );
      setShowChangeEmailForm(false);
      setNewEmail("");
      setEmailVerificationCode("");
      setStatusMsg({ type: "success", msg: "Email updated successfully!" });
    } catch (e: any) {
      setStatusMsg({ type: "error", msg: e?.message || "Email change failed" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: "error", msg: "New passwords don't match" });
      return;
    }
    if (newPassword.length < 8) {
      setStatusMsg({
        type: "error",
        msg: "Password must be at least 8 characters",
      });
      return;
    }

    setIsLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to change password");

      setShowChangePasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setStatusMsg({ type: "success", msg: "Password updated successfully!" });
    } catch (e: any) {
      setStatusMsg({
        type: "error",
        msg: e?.message || "Password change failed",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      window.location.href = "/login/sign-in";
    } catch (e: any) {
      setStatusMsg({ type: "error", msg: "Logout failed" });
      setIsLoading(false);
    }
  };

  const handleDeleteUserAccount = async () => {
    if (!deleteEmail || !deletePassword) return;
    if (deleteEmail !== user?.email) {
      setStatusMsg({ type: "error", msg: "Email doesn't match your account" });
      return;
    }

    setIsLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/user/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: deleteEmail,
          password: deletePassword,
        }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete account");

      window.location.href = "/goodbye";
    } catch (e: any) {
      setStatusMsg({
        type: "error",
        msg: e?.message || "Account deletion failed",
      });
      setIsLoading(false);
    }
  };

  return (
    <section className="min-h-screen max-w-screen-xl mx-auto p-3 sm:p-6 md:p-8 pt-0">
      {statusMsg && (
        <div
          className={`p-4 mb-6 rounded-lg border flex items-center gap-3 ${
            statusMsg.type === "error"
              ? "bg-red-50 text-red-800 border-red-200"
              : "bg-green-50 text-green-800 border-green-200"
          }`}
        >
          {statusMsg.type === "error" ? (
            <XCircle className="h-5 w-5" />
          ) : (
            <CheckCircle className="h-5 w-5" />
          )}
          {statusMsg.msg}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Bank Accounts - Takes 2 columns on xl screens */}
        <div className="xl:col-span-2">
          <Card className="overflow-hidden flex flex-col h-full bg-gradient-to-br from-slate-50 to-white border-slate-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-900 rounded-lg">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-slate-900">
                    Bank Accounts
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Manage your linked financial accounts
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-grow p-6">
              {accounts.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <CreditCard className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                  <p className="text-lg font-medium text-slate-900 mb-2">
                    No accounts yet
                  </p>
                  <p className="text-sm text-slate-600">
                    Add your first account to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex justify-between items-center border border-slate-200 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          {account.type === "savings" ? (
                            <CreditCard className="h-5 w-5 text-slate-600" />
                          ) : (
                            <CreditCard className="h-5 w-5 text-slate-600" />
                          )}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900">
                            {account.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-green-600">
                              {formatCurrency(account.balance)}
                            </span>
                            <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full capitalize">
                              {account.type}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedDeleteId(String(account.id));
                          setIsDeleteAccountOpen(true);
                        }}
                        disabled={isLoading}
                        className="hover:bg-red-600"
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="p-6 bg-slate-50 border-t border-slate-200">
              <Button
                onClick={() => setIsAddAccountOpen(true)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5"
                disabled={isLoading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Account
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Account Settings - Takes 1 column on xl screens */}
        <div>
          <Card className="overflow-hidden flex flex-col h-full bg-gradient-to-br from-blue-50 to-white border-blue-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-50 border-b border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-900 rounded-lg">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-blue-900">
                    Account Settings
                  </CardTitle>
                  <CardDescription className="text-blue-700">
                    Manage your account preferences
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 flex-grow p-6">
              {/* Email Status */}
              {user && (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">
                      Email Status
                    </span>
                    {user.isEmailVerified ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">Verified</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-amber-600">
                        <XCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">Unverified</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 truncate">
                    {user.email}
                  </p>
                </div>
              )}

              {/* Email Verification Form */}
              {showVerificationForm && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="font-medium text-amber-900 mb-3">
                    Enter Verification Code
                  </h4>
                  <div className="space-y-3">
                    <Input
                      placeholder="Enter 6-digit code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      disabled={isLoading}
                      maxLength={6}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleVerifyCode}
                        disabled={isLoading || !verificationCode}
                        size="sm"
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        Verify
                      </Button>
                      <Button
                        onClick={() => setShowVerificationForm(false)}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Change Email Form */}
              {showChangeEmailForm && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-3">
                    Change Email Address
                  </h4>
                  <div className="space-y-3">
                    <Input
                      type="email"
                      placeholder="Enter new email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      disabled={isLoading}
                    />
                    {newEmail && (
                      <>
                        <Button
                          onClick={handleRequestEmailChange}
                          disabled={isLoading}
                          size="sm"
                          className="w-full"
                        >
                          Send Verification Code
                        </Button>
                        <Input
                          placeholder="Enter verification code"
                          value={emailVerificationCode}
                          onChange={(e) =>
                            setEmailVerificationCode(e.target.value)
                          }
                          disabled={isLoading}
                          maxLength={6}
                        />
                      </>
                    )}
                    <div className="flex gap-2">
                      <Button
                        onClick={handleConfirmEmailChange}
                        disabled={isLoading || !emailVerificationCode}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Confirm Change
                      </Button>
                      <Button
                        onClick={() => {
                          setShowChangeEmailForm(false);
                          setNewEmail("");
                          setEmailVerificationCode("");
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Change Password Form */}
              {showChangePasswordForm && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-3">
                    Change Password
                  </h4>
                  <div className="space-y-3">
                    <Input
                      type="password"
                      placeholder="Current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    <Input
                      type="password"
                      placeholder="New password (min 8 chars)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    <Input
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleChangePassword}
                        disabled={
                          isLoading ||
                          !currentPassword ||
                          !newPassword ||
                          !confirmPassword
                        }
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Update Password
                      </Button>
                      <Button
                        onClick={() => {
                          setShowChangePasswordForm(false);
                          setCurrentPassword("");
                          setNewPassword("");
                          setConfirmPassword("");
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Delete Account Form */}
              {showDeleteAccountForm && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-900 mb-3">
                    Confirm Account Deletion
                  </h4>
                  <p className="text-xs text-red-700 mb-3">
                    This action cannot be undone. Please confirm your
                    credentials.
                  </p>
                  <div className="space-y-3">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={deleteEmail}
                      onChange={(e) => setDeleteEmail(e.target.value)}
                      disabled={isLoading}
                    />
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      disabled={isLoading}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleDeleteUserAccount}
                        disabled={isLoading || !deleteEmail || !deletePassword}
                        variant="destructive"
                        size="sm"
                      >
                        Delete Account
                      </Button>
                      <Button
                        onClick={() => {
                          setShowDeleteAccountForm(false);
                          setDeleteEmail("");
                          setDeletePassword("");
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {!showVerificationForm &&
                !showChangeEmailForm &&
                !showChangePasswordForm &&
                !showDeleteAccountForm && (
                  <div className="space-y-3">
                    <Button
                      onClick={handleSendVerification}
                      className="w-full justify-start"
                      variant="outline"
                      disabled={isLoading || user?.isEmailVerified}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      {user?.isEmailVerified
                        ? "Email Verified"
                        : "Verify Email"}
                    </Button>

                    <Button
                      onClick={() => {
                        resetAllForms();
                        setShowChangeEmailForm(true);
                      }}
                      className="w-full justify-start"
                      variant="outline"
                      disabled={isLoading}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Change Email
                    </Button>

                    <Button
                      onClick={() => {
                        resetAllForms();
                        setShowChangePasswordForm(true);
                      }}
                      className="w-full justify-start"
                      variant="outline"
                      disabled={isLoading}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>

                    <Button
                      onClick={handleLogout}
                      className="w-full justify-start bg-slate-100 hover:bg-slate-200 text-slate-700"
                      disabled={isLoading}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      {isLoading ? "Logging out..." : "Logout"}
                    </Button>

                    <Button
                      onClick={() => {
                        resetAllForms();
                        setShowDeleteAccountForm(true);
                      }}
                      variant="destructive"
                      className="w-full justify-start"
                      disabled={isLoading}
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Account Dialog */}
      <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Bank Account
            </DialogTitle>
            <DialogDescription>
              Add a new checking or savings account to your portfolio.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="account-name">Account Name</Label>
              <Input
                id="account-name"
                placeholder="My Checking Account"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-type">Account Type</Label>
              <Select
                value={newAccountType}
                onValueChange={(value: "checking" | "savings") =>
                  setNewAccountType(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Checking
                    </div>
                  </SelectItem>
                  <SelectItem value="savings">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Savings
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="starting-balance">Starting Balance</Label>
              <Input
                id="starting-balance"
                type="number"
                step="0.01"
                placeholder="1000.00"
                value={newAccountBalance}
                onChange={(e) => setNewAccountBalance(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddAccountOpen(false)}
              className="bg-white"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddAccount}
              className="bg-slate-900 hover:bg-slate-800"
              disabled={isLoading || !newAccountName || !newAccountBalance}
            >
              {isLoading ? "Adding..." : "Add Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Bank Account Dialog */}
      <Dialog open={isDeleteAccountOpen} onOpenChange={setIsDeleteAccountOpen}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <UserX className="h-5 w-5" />
              Delete Bank Account
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this bank account? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteAccountOpen(false)}
              className="bg-white"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteBankAccount}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
