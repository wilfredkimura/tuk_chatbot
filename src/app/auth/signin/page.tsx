"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

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
      setError("Invalid credentials. Please check your email and password.");
      setIsLoading(false);
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-8 bg-white p-10 border border-slate-100 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-tuk-gold" />
        
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center bg-white rounded-2xl shadow-md p-3 mb-6">
            <Image src="/logo.png" alt="TUK Logo" width={64} height={64} className="object-contain" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-tuk-green">
            Portal access
          </h2>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            Sign in to your TUK account
          </p>
        </div>
        
        <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 p-4 text-xs font-semibold text-red-600 rounded-xl border border-red-100">
              {error}
            </div>
          )}
          
          <div className="space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2 px-1">Email address</label>
              <input
                type="email"
                required
                className="block w-full border border-slate-200 bg-slate-50/50 rounded-xl px-4 py-3.5 text-sm focus:border-tuk-green focus:ring-4 focus:ring-tuk-green/5 outline-none transition-all"
                placeholder="student@tukenya.ac.ke"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2 px-1">
                <label className="text-xs font-bold text-slate-700">Password</label>
                <a href="#" className="text-[10px] font-bold text-tuk-green hover:text-tuk-gold transition-colors">Forgot?</a>
              </div>
              <input
                type="password"
                required
                className="block w-full border border-slate-200 bg-slate-50/50 rounded-xl px-4 py-3.5 text-sm focus:border-tuk-green focus:ring-4 focus:ring-tuk-green/5 outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full justify-center bg-tuk-gold px-6 py-4 rounded-xl text-sm font-bold text-tuk-text shadow-lg shadow-tuk-gold/20 hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isLoading ? "Authenticating..." : "Sign in to account"}
          </button>

          <div className="pt-6 text-center">
            <p className="text-sm font-medium text-slate-500">
              New student?{" "}
              <Link href="/auth/register" className="text-tuk-green font-bold hover:text-tuk-gold transition-colors">
                Initialize account
              </Link>
            </p>
            <div className="mt-8 flex justify-center items-center gap-4">
               <Link href="/" className="text-xs font-bold text-slate-400 hover:text-tuk-green transition-colors flex items-center gap-1">
                 <span className="material-symbols-outlined text-sm">arrow_back</span>
                 Continue as guest
               </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
