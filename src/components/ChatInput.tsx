"use client";

import { useState } from "react";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export default function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="sticky bottom-8 mx-auto w-full max-w-3xl px-4"
    >
      <div className="glass flex items-center gap-2 rounded-full p-2 pl-6 pr-2 shadow-2xl transition-all focus-within:ring-2 focus-within:ring-primary/50">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything about the college..."
          className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-zinc-500 dark:text-white"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="btn-primary flex h-10 w-10 items-center justify-center rounded-full p-0 transition-all disabled:grayscale"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </form>
  );
}
