"use client";

import ChatInterface from "@/components/ChatInterface";
import { useSession, signOut } from "next-auth/react";
import { redirect } from "next/navigation";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;
  if (!session) redirect("/auth/signin");

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      {/* TopAppBar */}
      <header className="h-16 bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm shrink-0">
        <div className="flex justify-between items-center h-16 px-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-[#002147] tracking-tight">College Bot</span>
          </div>
          <nav className="hidden md:flex items-center gap-10">
            <a className="text-[#002147] font-semibold border-b-2 border-[#002147] pb-1 tracking-tight" href="#">Chat</a>
            <a className="text-slate-500 hover:text-slate-800 transition-colors tracking-tight" href="#">Departments</a>
            <button 
              onClick={() => signOut()}
              className="text-slate-500 hover:text-red-600 transition-colors tracking-tight"
            >
              Sign Out
            </button>
          </nav>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-primary-container truncate max-w-[120px]">
                {session.user?.email}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full border border-slate-200 bg-slate-200 overflow-hidden">
              <span className="material-symbols-outlined text-slate-400 w-full h-full flex items-center justify-center">person</span>
            </div>
          </div>
        </div>
      </header>

      <ChatInterface />

      {/* Footer */}
      <footer className="w-full py-8 mt-auto bg-slate-50 border-t border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-center px-8 max-w-7xl mx-auto gap-4">
          <span className="font-semibold text-slate-900">College Bot</span>
          <div className="flex gap-6">
            <a className="text-sm text-slate-500 hover:text-[#002147] transition-colors" href="#">Privacy Policy</a>
            <a className="text-sm text-slate-500 hover:text-[#002147] transition-colors" href="#">Terms of Service</a>
            <a className="text-sm text-slate-500 hover:text-[#002147] transition-colors" href="#">Contact Support</a>
          </div>
          <p className="text-sm text-slate-600">© 2026 University College Bot. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
