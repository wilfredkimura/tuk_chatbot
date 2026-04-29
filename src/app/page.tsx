"use client";

import ChatInterface from "@/components/ChatInterface";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const { data: session, status } = useSession();

  return (
    <div className="bg-white text-slate-900 min-h-screen flex flex-col overflow-hidden">
      {/* Refined Header with logo.png */}
      {/* Removed Global Header */}

      <main className="flex-1 flex flex-col overflow-hidden">
        <ChatInterface />
      </main>

    </div>
  );
}
