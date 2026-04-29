"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        window.location.href = "/auth/signin";
      } else {
        const data = await res.json();
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-8 bg-white p-10 border border-slate-100 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-tuk-green" />

        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center bg-white rounded-2xl shadow-md p-3 mb-6">
            <Image src="/logo.png" alt="TUK Logo" width={64} height={64} className="object-contain" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-tuk-green">
            Join the platform
          </h2>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            Create your TUK assistant account
          </p>
        </div>

        <form className="mt-10 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 p-4 text-xs font-semibold text-red-600 rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2 px-1">Full name</label>
              <input
                type="text"
                required
                className="block w-full border border-slate-200 bg-slate-50/50 rounded-xl px-4 py-3.5 text-sm focus:border-tuk-green focus:ring-4 focus:ring-tuk-green/5 outline-none transition-all"
                placeholder="Jane Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2 px-1">Student email</label>
              <input
                type="email"
                required
                className="block w-full border border-slate-200 bg-slate-50/50 rounded-xl px-4 py-3.5 text-sm focus:border-tuk-green focus:ring-4 focus:ring-tuk-green/5 outline-none transition-all"
                placeholder="jdoe@students.tukenya.ac.ke"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2 px-1">Password</label>
              <input
                type="password"
                required
                className="block w-full border border-slate-200 bg-slate-50/50 rounded-xl px-4 py-3.5 text-sm focus:border-tuk-green focus:ring-4 focus:ring-tuk-green/5 outline-none transition-all"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2 px-1">Confirm password</label>
              <input
                type="password"
                required
                className="block w-full border border-slate-200 bg-slate-50/50 rounded-xl px-4 py-3.5 text-sm focus:border-tuk-green focus:ring-4 focus:ring-tuk-green/5 outline-none transition-all"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full justify-center bg-tuk-gold px-6 py-4 rounded-xl text-sm font-bold text-tuk-text shadow-lg shadow-tuk-gold/20 hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-50 mt-4"
          >
            {isLoading ? "Processing..." : "Initialize account"}
          </button>

          <div className="pt-6 text-center">
            <p className="text-sm font-medium text-slate-500">
              Already joined?{" "}
              <Link href="/auth/signin" className="text-tuk-green font-bold hover:text-tuk-gold transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
