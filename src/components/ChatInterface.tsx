"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Message {
  role: "user" | "assistant";
  content: string;
  time?: string;
}

export default function ChatInterface() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! Welcome to the TUK Chatbot. I'm here to help you with any academic or administrative questions you might have. How can I assist you today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [guestId, setGuestId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Guest ID initialization
  useEffect(() => {
    if (!session) {
      let id = document.cookie.split('; ').find(row => row.startsWith('guestId='))?.split('=')[1];
      if (!id) {
        id = 'guest_' + Math.random().toString(36).substring(2, 15);
        document.cookie = `guestId=${id}; path=/; max-age=${60 * 60 * 24 * 30}`; // 30 days
      }
      setGuestId(id);
    }
  }, [session]);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [input]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessage: Message = { role: "user", content: input, time: now };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [...messages, userMessage],
          userId: session?.user?.email || guestId 
        }),
      });

      const data = await response.json();
      if (data.content) {
        setMessages((prev) => [...prev, { 
          role: "assistant", 
          content: data.content,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-white">
      {/* Modern Sidebar with Green/Gold Theme */}
      <aside className="hidden lg:flex flex-col w-72 bg-slate-50 border-r border-slate-100 shrink-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          <section>
            <h3 className="text-xs font-bold text-tuk-green/60 mb-4 px-1">Recent activity</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:border-tuk-gold transition-all text-left shadow-sm group">
                <div className="w-8 h-8 rounded-lg bg-tuk-green/5 flex items-center justify-center text-tuk-green group-hover:bg-tuk-gold group-hover:text-white transition-all">
                  <span className="material-symbols-outlined text-lg">chat_bubble</span>
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold text-slate-700 truncate">Course registration</p>
                  <p className="text-[10px] text-slate-400">Past session</p>
                </div>
              </button>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold text-tuk-green/60 mb-4 px-1">Quick links</h3>
            <div className="grid grid-cols-1 gap-2">
              <QuickLink icon="school" label="Admissions" />
              <QuickLink icon="payments" label="Student finance" />
              <QuickLink icon="library_books" label="Library" />
            </div>
          </section>

          <div className="p-5 rounded-2xl bg-tuk-green text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-sm font-bold mb-2">Need human help?</p>
              <p className="text-xs text-green-50/80 mb-4 leading-relaxed">Connect with an advisor for specialized support during office hours.</p>
              <button className="w-full py-2.5 bg-tuk-gold text-tuk-text rounded-lg font-bold text-xs hover:brightness-110 transition-all shadow-sm">Contact Support</button>
            </div>
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-tuk-gold/20 rounded-full blur-2xl" />
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <section className="flex-1 flex flex-col relative bg-white">
        <div className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex justify-center items-center gap-4 py-4">
              <div className="h-[1px] flex-1 bg-slate-100"></div>
              <span className="text-[10px] text-slate-400 font-bold tracking-widest">SESSION START</span>
              <div className="h-[1px] flex-1 bg-slate-100"></div>
            </div>

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                  msg.role === 'assistant' 
                  ? 'bg-tuk-green text-white' 
                  : 'bg-tuk-gold text-tuk-text'
                }`}>
                  <span className="material-symbols-outlined text-lg">
                    {msg.role === 'assistant' ? 'smart_toy' : 'person'}
                  </span>
                </div>
                <div className={`space-y-1.5 max-w-[85%] flex flex-col ${msg.role === 'user' ? 'items-end' : ''}`}>
                  <div className={`p-4 rounded-2xl ${
                    msg.role === 'assistant' 
                    ? 'bg-white border border-slate-100 shadow-sm text-slate-700 rounded-tl-none' 
                    : 'bg-tuk-green text-white rounded-tr-none shadow-md'
                  }`}>
                    <p className="text-[15px] leading-relaxed font-medium">{msg.content}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 px-1 font-bold">
                    {msg.role === 'assistant' ? 'TUK Chatbot' : 'You'} • {msg.time}
                  </span>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start gap-4 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-slate-100 shrink-0" />
                <div className="bg-slate-50 w-32 h-14 rounded-2xl rounded-tl-none border border-slate-100" />
              </div>
            )}
            
            <div ref={scrollRef} className="h-1" />
          </div>
        </div>

        {/* Input Area with Gold Button */}
        <div className="p-6 bg-white border-t border-slate-100">
          <div className="max-w-3xl mx-auto flex items-end gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200 shadow-sm transition-all">
            <div className="flex-1 flex flex-col">
              <textarea 
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="w-full bg-transparent border-none focus:ring-0 outline-none text-sm resize-none py-3 px-3 min-h-[44px] max-h-32 custom-scrollbar text-slate-700 font-medium" 
                placeholder="Ask your question here..."
              />
              <div className="flex items-center gap-1 px-2 pb-1">
                 <IconButton icon="attach_file" title="Attach file" />
                 <IconButton icon="image" title="Send image" />
              </div>
            </div>
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="w-12 h-12 bg-tuk-gold text-tuk-text rounded-xl flex items-center justify-center shadow-lg hover:brightness-105 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100"
            >
              <span className="material-symbols-outlined text-xl font-bold">send</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function QuickLink({ icon, label }: { icon: string, label: string }) {
  return (
    <a className="group flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:border-tuk-green hover:shadow-sm transition-all" href="#">
      <div className="w-8 h-8 rounded-lg bg-tuk-green/5 flex items-center justify-center text-tuk-green group-hover:bg-tuk-green group-hover:text-white transition-all">
        <span className="material-symbols-outlined text-lg">{icon}</span>
      </div>
      <span className="text-sm font-semibold text-slate-600 group-hover:text-tuk-green transition-colors">{label}</span>
    </a>
  );
}

function IconButton({ icon, title }: { icon: string, title: string }) {
  return (
    <button className="p-1.5 text-slate-400 hover:text-tuk-green hover:bg-white rounded-lg transition-all" title={title}>
      <span className="material-symbols-outlined text-lg">{icon}</span>
    </button>
  );
}
