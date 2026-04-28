"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid email or password");
      setIsLoading(false);
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl border border-outline-variant">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container text-white">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-primary-container">
            Sign in to College Bot
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Enter your student credentials to continue
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100">
              {error}
            </div>
          )}
          <div className="space-y-4 rounded-md">
            <div>
              <label className="text-sm font-medium text-slate-700">Email address</label>
              <input
                type="email"
                required
                className="mt-1 block w-full rounded-lg border border-outline-variant px-3 py-2 shadow-sm focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none"
                placeholder="student@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                required
                className="mt-1 block w-full rounded-lg border border-outline-variant px-3 py-2 shadow-sm focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full justify-center rounded-lg bg-primary-container px-4 py-3 text-sm font-semibold text-white shadow-md hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>

          <p className="text-center text-sm text-slate-600">
            Don't have an account?{" "}
            <Link href="/auth/register" className="font-semibold text-primary-container hover:underline">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
