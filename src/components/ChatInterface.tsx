"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  time?: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your College Bot. How can I assist you with your academic journey today? I can help with admissions, registration, or navigating campus life.",
      time: "09:15 AM"
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
        body: JSON.stringify({ messages: [...messages, userMessage] }),
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
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar: Fixed height, independent scroll */}
      <aside className="hidden lg:flex flex-col w-80 bg-surface-container-low border-r border-outline-variant/30 shrink-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-10">
          <section>
            <h3 className="text-[12px] font-bold text-on-surface-variant uppercase mb-3 px-3 tracking-wider">Recent Chats</h3>
            <div className="space-y-1">
              <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-white border border-outline-variant shadow-sm text-left">
                <span className="material-symbols-outlined text-primary-container">chat_bubble</span>
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold truncate">Financial Aid Inquiry</p>
                  <p className="text-[10px] text-on-surface-variant">2 hours ago</p>
                </div>
              </button>
            </div>
          </section>

          <section>
            <h3 className="text-[12px] font-bold text-on-surface-variant uppercase mb-3 px-3 tracking-wider">Quick Links</h3>
            <div className="grid grid-cols-1 gap-3">
              <QuickLink icon="account_balance" label="Admissions" />
              <QuickLink icon="payments" label="Financial Aid" />
              <QuickLink icon="map" label="Campus Map" />
            </div>
          </section>

          <div className="relative overflow-hidden rounded-xl bg-primary-container p-6 text-white">
            <div className="relative z-10">
              <p className="text-lg font-bold mb-1">Need human help?</p>
              <p className="text-sm opacity-80 mb-4">Connect with a real advisor during office hours.</p>
              <button className="w-full py-2 bg-secondary text-white rounded-lg font-bold text-sm hover:opacity-90 transition-opacity">Contact Support</button>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <section className="flex-1 flex flex-col relative bg-surface-bright">
        <div className="flex-1 overflow-y-auto px-4 py-10 custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex justify-center items-center gap-6">
              <div className="h-[1px] flex-1 bg-outline-variant/30"></div>
              <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Today</span>
              <div className="h-[1px] flex-1 bg-outline-variant/30"></div>
            </div>

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm overflow-hidden ${
                  msg.role === 'assistant' ? 'bg-primary-container text-white border border-secondary/30' : 'bg-surface-container-highest text-primary-container'
                }`}>
                  {msg.role === 'assistant' ? (
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                  ) : (
                    <span className="material-symbols-outlined text-lg">person</span>
                  )}
                </div>
                <div className={`space-y-1 max-w-[80%] flex flex-col ${msg.role === 'user' ? 'items-end' : ''}`}>
                  <div className={`p-4 rounded-xl shadow-sm border ${
                    msg.role === 'assistant' 
                    ? 'bg-primary-container text-white rounded-tl-none border-l-[3px] border-l-secondary' 
                    : 'bg-[#F1F5F9] text-on-background rounded-tr-none border-outline-variant'
                  }`}>
                    <p className="text-[16px] leading-relaxed">{msg.content}</p>
                  </div>
                  <span className="text-[10px] text-on-surface-variant px-1">
                    {msg.role === 'assistant' ? 'College Bot' : 'You'} • {msg.time}
                  </span>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-primary-container/20 shrink-0" />
                <div className="bg-primary-container/10 w-24 h-12 rounded-xl rounded-tl-none" />
              </div>
            )}
            
            <div ref={scrollRef} className="h-1" />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white/80 backdrop-blur-md border-t border-outline-variant/30 sticky bottom-0">
          <div className="max-w-3xl mx-auto flex items-end gap-3">
          <div className="flex-1 bg-white rounded-xl transition-all p-1 flex flex-col">
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
                className="w-full bg-transparent border-none focus:ring-0 text-sm resize-none py-3 px-4 min-h-[48px] max-h-32 custom-scrollbar" 
                placeholder="Ask anything about campus..."
              />
              <div className="flex justify-between items-center px-3 pb-2">
                <div className="flex gap-1">
                  <IconButton icon="attach_file" title="Attach Document" />
                  <IconButton icon="image" title="Add Image" />
                </div>
                <span className="text-[10px] text-outline-variant">Press Enter to send</span>
              </div>
            </div>
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-4 bg-secondary text-white rounded-xl shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
            >
              <span className="material-symbols-outlined font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function QuickLink({ icon, label }: { icon: string, label: string }) {
  return (
    <a className="group flex items-center gap-3 p-3 bg-white border border-outline-variant rounded-xl hover:border-secondary transition-all" href="#">
      <div className="p-2 rounded-lg bg-primary-container text-white">
        <span className="material-symbols-outlined text-lg">{icon}</span>
      </div>
      <span className="text-sm font-semibold">{label}</span>
    </a>
  );
}

function IconButton({ icon, title }: { icon: string, title: string }) {
  return (
    <button className="p-2 hover:bg-surface-container rounded-lg text-on-surface-variant transition-colors" title={title}>
      <span className="material-symbols-outlined text-lg">{icon}</span>
    </button>
  );
}
