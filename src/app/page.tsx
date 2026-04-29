"use client";

import ChatInterface from "@/components/ChatInterface";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const { data: session, status } = useSession();

  return (
    <div className="bg-white text-slate-900 min-h-screen flex flex-col">
      {/* Refined Header with logo.png */}
      <header className="h-20 bg-white border-b border-slate-100 shadow-sm shrink-0 sticky top-0 z-50">
        <div className="flex justify-between items-center h-20 px-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-12 h-12 overflow-hidden rounded-lg">
                <Image 
                  src="/logo.png" 
                  alt="TUK Logo" 
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-tuk-green leading-tight">TUK Chatbot</span>
                <span className="text-[10px] text-tuk-gray-medium font-medium">Official Student Assistant</span>
              </div>
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-tuk-green font-semibold text-sm transition-colors hover:text-tuk-gold">Chat</Link>
            <Link href="/resources" className="text-slate-500 font-medium text-sm transition-colors hover:text-tuk-green">Resources</Link>
            
            {status === "authenticated" ? (
              <button 
                onClick={() => signOut()}
                className="text-slate-500 font-medium text-sm transition-colors hover:text-tuk-red"
              >
                Sign out
              </button>
            ) : (
              <Link 
                href="/auth/signin"
                className="text-tuk-green font-semibold text-sm transition-colors hover:text-tuk-gold"
              >
                Sign in
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-4">
            {status === "authenticated" ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-semibold text-slate-700">{session.user?.name || 'Student'}</p>
                  <p className="text-[10px] text-slate-400">{session.user?.email}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-tuk-green/10 flex items-center justify-center border border-tuk-green/20">
                  <span className="material-symbols-outlined text-tuk-green text-xl">person</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-semibold text-slate-700">Guest User</p>
                  <p className="text-[10px] text-slate-400">Limited session</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                  <span className="material-symbols-outlined text-slate-400 text-xl">person_outline</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <ChatInterface />
      </main>

    </div>
  );
}
