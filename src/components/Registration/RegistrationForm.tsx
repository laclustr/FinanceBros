"use client";

import React, { useState } from "react";
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

export default function AuthForm({ type }: { type: "login" | "register" }) {
  const isRegister = type === "register";
  const apiPath = isRegister ? "/api/register" : "/api/login";
  const title = isRegister ? "Register" : "Login";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) =>
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

  const validatePassword = (password: string) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);

  const loginUser = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || "Login failed");
      }

      setErrorMessage("");
      setTimeout(() => {
        window.location.href = "/login/onboarding";
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || "Login failed");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim()) return setErrorMessage("Please enter your email address");
    if (!validateEmail(email))
      return setErrorMessage("Please enter a valid email address");

    if (!password.trim()) return setErrorMessage("Please enter your password");
    if (isRegister && !validatePassword(password))
      return setErrorMessage(
        "Password must be at least 8 characters long and include uppercase, lowercase, and a number"
      );

    setLoading(true);

    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || "Authentication failed");
      }

      if (isRegister) {
        await loginUser(email, password);
      } else {
        setTimeout(() => {
          window.location.href = "/login/onboarding";
        }, 500);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">{title}</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage("");
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage("");
                }}
              />
            </div>
            {errorMessage && (
              <p className="text-red-500 text-sm">{errorMessage}</p>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? isRegister
                  ? "Registering..."
                  : "Logging in..."
                : title}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
