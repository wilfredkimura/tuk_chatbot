"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import { useRouter, useSearchParams } from "next/navigation";

interface Message {
  role: "user" | "assistant";
  content: string;
  time?: string;
}

interface Convo {
  _id: string;
  content: string;
  createdAt: string;
}

const VISIBLE_LIMIT = 6;
const MODAL_PAGE_SIZE = 15;

export default function ChatInterface() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // All convos + sidebar visibility
  const [pastConvos, setPastConvos] = useState<Convo[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConvos, setModalConvos] = useState<Convo[]>([]);
  const [modalPage, setModalPage] = useState(1);
  const [modalHasMore, setModalHasMore] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const modalScrollRef = useRef<HTMLDivElement>(null);
  const modalSentinelRef = useRef<HTMLDivElement>(null);

  const loadConvo = useCallback(async (id: string | null) => {
    if (!id) return;
    setIsLoading(true);
    setSidebarOpen(false);
    setModalOpen(false);
    try {
      const currentUserId = session?.user?.email || guestId;
      const res = await fetch(`/api/history?sessionId=${id}${id === "legacy" ? `&userId=${currentUserId}` : ""}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages.map((m: any) => ({
          role: m.role,
          content: m.content,
          time: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        })));
        setSessionId(id);
        document.cookie = `lastSessionId=${id}; path=/; max-age=${60 * 60 * 24 * 7}`;
        if (id && id !== "legacy") router.push(`/?s=${id}`);
      }
    } catch (e) {
      console.error("Failed to load convo:", e);
    } finally {
      setIsLoading(false);
    }
  }, [session, guestId, router]);

  // Guest ID initialization
  useEffect(() => {
    const fetchHistory = async (id: string) => {
      try {
        const res = await fetch(`/api/history?userId=${id}`);
        const data = await res.json();
        if (data.convos) setPastConvos(data.convos);
      } catch (e) {
        console.error("Failed to fetch history:", e);
      }
    };

    let id = guestId;
    if (!session) {
      if (!id) {
        id = document.cookie
          .split("; ")
          .find((row) => row.startsWith("guestId="))
          ?.split("=")[1] || null;
        if (!id) {
          id = "guest_" + Math.random().toString(36).substring(2, 15);
          document.cookie = `guestId=${id}; path=/; max-age=${60 * 60 * 24 * 30}`;
        }
        setGuestId(id);
      }
      fetchHistory(id);
    } else if (session?.user?.email) {
      fetchHistory(session.user.email);
    }

    // Handle initial sessionId from URL or Cookie
    const urlSessionId = searchParams.get("s");
    const cookieSessionId = document.cookie
      .split("; ")
      .find((row) => row.startsWith("lastSessionId="))
      ?.split("=")[1] || null;

    const initialSessionId = urlSessionId || cookieSessionId;

    if (initialSessionId && !sessionId) {
      loadConvo(initialSessionId);
    }
  }, [session, searchParams, loadConvo, guestId, sessionId]);

  // Close sidebar on outside click (mobile)
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      const sidebar = document.getElementById("mobile-sidebar");
      const btn = document.getElementById("sidebar-toggle-btn");
      if (
        sidebarOpen &&
        sidebar &&
        !sidebar.contains(e.target as Node) &&
        btn &&
        !btn.contains(e.target as Node)
      ) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [sidebarOpen]);

  // Lock body scroll when sidebar open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  // Modal infinite scroll — load more convos
  const loadMoreModalConvos = useCallback(() => {
    if (modalLoading || !modalHasMore) return;
    setModalLoading(true);
    // Simulate paginating through pastConvos (replace with real API if paginated)
    setTimeout(() => {
      const start = modalPage * MODAL_PAGE_SIZE;
      const slice = pastConvos.slice(start, start + MODAL_PAGE_SIZE);
      if (slice.length === 0) {
        setModalHasMore(false);
      } else {
        setModalConvos((prev) => [...prev, ...slice]);
        setModalPage((p) => p + 1);
      }
      setModalLoading(false);
    }, 600);
  }, [modalLoading, modalHasMore, modalPage, pastConvos]);

  // Setup IntersectionObserver for modal infinite scroll
  useEffect(() => {
    if (!modalOpen || !modalSentinelRef.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMoreModalConvos();
      },
      { threshold: 0.1 }
    );
    obs.observe(modalSentinelRef.current);
    return () => obs.disconnect();
  }, [modalOpen, loadMoreModalConvos]);

  const openModal = () => {
    // Initialize modal with convos beyond the first 6
    const rest = pastConvos.slice(VISIBLE_LIMIT, VISIBLE_LIMIT + MODAL_PAGE_SIZE);
    setModalConvos(rest);
    setModalPage(2);
    setModalHasMore(pastConvos.length > VISIBLE_LIMIT + MODAL_PAGE_SIZE);
    setModalOpen(true);
  };

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

  const startNewChat = () => {
    setMessages([]);
    setSessionId(null);
    setInput("");
    setSidebarOpen(false);
    document.cookie = "lastSessionId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/");
  };


  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
          userId: session?.user?.email || guestId,
          sessionId: sessionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `⚠️ Error: ${data.error || "Failed to get response"}. ${response.status === 429 ? "API Quota Exceeded. Please try again later." : ""}`,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        return;
      }

      if (data.sessionId) {
        setSessionId(data.sessionId);
        document.cookie = `lastSessionId=${data.sessionId}; path=/; max-age=${60 * 60 * 24 * 7}`;
        router.push(`/?s=${data.sessionId}`);
      }

      if (data.content) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.content,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const visibleConvos = pastConvos.slice(0, VISIBLE_LIMIT);
  const hasMore = pastConvos.length > VISIBLE_LIMIT;

  return (
    <>
      {/* ─── Mobile Sidebar Overlay ─── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" aria-hidden="true" />
      )}

      {/* ─── All Convos Modal ─── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden"
            style={{ maxHeight: "85vh", minHeight: "60vh" }}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-base font-black text-slate-800">All Conversations</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{pastConvos.length} total sessions</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            {/* Modal Scrollable Content */}
            <div ref={modalScrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
              {/* First 6 always shown */}
              {visibleConvos.map((convo) => (
                <ConvoCard key={convo._id} convo={convo} onClick={() => loadConvo(convo._id)} />
              ))}
              {/* Extra convos loaded via infinite scroll */}
              {modalConvos.map((convo) => (
                <ConvoCard key={convo._id} convo={convo} onClick={() => loadConvo(convo._id)} />
              ))}
              {/* Sentinel for infinite scroll */}
              <div ref={modalSentinelRef} className="h-4" />
              {modalLoading && (
                <div className="flex justify-center py-3">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-tuk-green animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              {!modalHasMore && modalConvos.length > 0 && (
                <p className="text-center text-xs text-slate-400 py-3 font-medium">
                  You've reached the beginning ✓
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Main Layout ─── */}
      <div className="flex h-screen overflow-hidden bg-white relative">

        {/* ─── Sidebar (Desktop always visible / Mobile slide-in) ─── */}
        <aside
          id="mobile-sidebar"
          className={`
            fixed lg:relative inset-y-0 left-0 z-40
            w-72 bg-white border-r-2 border-slate-100 shrink-0
            flex flex-col
            transition-transform duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            lg:translate-x-0 lg:flex
            top-0 bottom-0
          `}
        >
          {/* Mobile sidebar header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 lg:hidden shrink-0">
            <span className="text-sm font-black text-tuk-green uppercase tracking-wider">Menu</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          <div className="p-4 border-b border-slate-100 shrink-0">
            <button 
              onClick={startNewChat}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-tuk-green text-white font-bold text-sm hover:brightness-110 transition-all shadow-md group"
            >
              <span className="material-symbols-outlined text-lg group-hover:rotate-90 transition-transform">add</span>
              New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
            {/* Past Conversations */}
            <section>
              <h3 className="text-xs font-black uppercase tracking-wider text-tuk-green/60 mb-4 px-1">
                Past Conversations
              </h3>
              <div className="space-y-3">
                {pastConvos.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium px-1">No past conversations</p>
                ) : (
                  <>
                    {visibleConvos.map((convo) => (
                      <ConvoCard 
                        key={convo._id} 
                        convo={convo} 
                        active={sessionId === convo._id}
                        onClick={() => loadConvo(convo._id)} 
                      />
                    ))}

                    {hasMore && (
                      <button
                        onClick={openModal}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 border-dashed border-tuk-green/30 text-tuk-green text-xs font-bold hover:bg-tuk-green/5 hover:border-tuk-green/60 transition-all group"
                      >
                        <span className="material-symbols-outlined text-sm group-hover:rotate-90 transition-transform">
                          expand_more
                        </span>
                        Read More ({pastConvos.length - VISIBLE_LIMIT} more)
                      </button>
                    )}
                  </>
                )}
              </div>
            </section>

            {/* Quick Links */}
            <section>
              <h3 className="text-xs font-black uppercase tracking-wider text-tuk-green/60 mb-4 px-1">
                Quick links
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <QuickLink icon="school" label="Admissions" href="https://admission.tukenya.ac.ke/" />
                <QuickLink icon="library_books" label="Library" href="http://library.tukenya.ac.ke/" />
              </div>
            </section>

            {/* Support Card */}
            <div className="p-5 rounded-2xl bg-tuk-green text-white shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-sm font-bold mb-2">Need human help?</p>
                <p className="text-xs text-green-50/80 mb-4 leading-relaxed">
                  Connect with an advisor for specialized support during office hours.
                </p>
                <button className="w-full py-2.5 bg-tuk-gold text-tuk-text rounded-lg font-bold text-xs hover:brightness-110 transition-all shadow-sm">
                  Contact Support
                </button>
              </div>
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-tuk-gold/20 rounded-full blur-2xl" />
            </div>
          </div>
        </aside>

        {/* ─── Main Chat Area ─── */}
        <section className="flex-1 flex flex-col relative bg-white min-w-0">

          {/* Mobile top bar (inside chat area, replaces header on mobile) */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 lg:hidden shrink-0 bg-white">
            <button
              id="sidebar-toggle-btn"
              onClick={() => setSidebarOpen(true)}
              className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-all active:scale-95"
              aria-label="Open sidebar"
            >
              <span className="material-symbols-outlined text-xl">menu</span>
            </button>
            <div className="flex-1 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-tuk-green/10 flex items-center justify-center text-tuk-green">
                <span className="material-symbols-outlined text-base">smart_toy</span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 leading-tight">TUK Chatbot</p>
                <p className="text-[10px] text-tuk-green font-medium">● Online</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 sm:py-8 custom-scrollbar">
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Empty State Greeting */}
              {messages.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in">
                  <div className="w-20 h-20 rounded-3xl bg-tuk-green/10 flex items-center justify-center text-tuk-green mb-6 shadow-sm border-2 border-tuk-green/5">
                    <span className="material-symbols-outlined text-4xl">smart_toy</span>
                  </div>
                  <h1 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">
                    How can I help you today?
                  </h1>
                  <p className="text-sm text-slate-500 max-w-sm leading-relaxed font-medium">
                    I'm your TUK Academic Assistant. Ask me anything about admissions, faculties, 
                    programmes, or student life at the university.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-10 w-full max-w-md">
                    <button 
                      onClick={() => setInput("What are the requirements for Engineering?")}
                      className="p-4 text-left rounded-2xl border-2 border-slate-50 hover:border-tuk-green/30 hover:bg-slate-50 transition-all group"
                    >
                      <p className="text-xs font-black text-tuk-green uppercase tracking-wider mb-1">Admissions</p>
                      <p className="text-sm text-slate-600 font-medium line-clamp-1">Engineering requirements?</p>
                    </button>
                    <button 
                      onClick={() => setInput("How do I access the student portal?")}
                      className="p-4 text-left rounded-2xl border-2 border-slate-50 hover:border-tuk-green/30 hover:bg-slate-50 transition-all group"
                    >
                      <p className="text-xs font-black text-tuk-gold uppercase tracking-wider mb-1">Portals</p>
                      <p className="text-sm text-slate-600 font-medium line-clamp-1">Access student portal?</p>
                    </button>
                  </div>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div key={idx} className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 border-2 rounded-xl flex items-center justify-center shrink-0 ${
                      msg.role === "assistant"
                        ? "bg-tuk-green/10 border-tuk-green/20 text-tuk-green"
                        : "bg-tuk-gold/10 border-tuk-gold/20 text-tuk-gold"
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg sm:text-xl">
                      {msg.role === "assistant" ? "smart_toy" : "person"}
                    </span>
                  </div>
                  <div className={`space-y-1.5 max-w-[85%] flex flex-col ${msg.role === "user" ? "items-end" : ""}`}>
                      <div
                        className={`p-3 sm:p-4 rounded-2xl markdown-content ${
                          msg.role === "assistant"
                            ? "bg-slate-50 text-slate-800 rounded-tl-none"
                            : "bg-tuk-green text-white rounded-tr-none shadow-sm"
                        }`}
                      >
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    <span className="text-[10px] text-slate-400 px-1 font-black uppercase tracking-wider">
                      {msg.role === "assistant" ? "TUK Chatbot" : "You"} • {msg.time}
                    </span>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl shimmer shrink-0" />
                  <div className="flex-1 max-w-[240px] space-y-2 pt-1">
                    <div className="h-4 w-full rounded-md shimmer" />
                    <div className="h-4 w-[80%] rounded-md shimmer" />
                  </div>
                </div>
              )}

              <div ref={scrollRef} className="h-1" />
            </div>
          </div>

          {/* Input Area */}
          <div className="p-3 sm:p-6 bg-white border-t-2 border-slate-100 shrink-0">
            <div className="max-w-3xl mx-auto flex items-end gap-3 bg-white p-2 rounded-2xl border-2 border-slate-200 focus-within:border-tuk-green/50 transition-all group">
              <div className="flex-1 flex flex-col">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="w-full bg-transparent border-none focus:ring-0 outline-none text-sm resize-none py-3 px-3 min-h-[44px] max-h-32 custom-scrollbar text-slate-800 placeholder:text-slate-400 placeholder:font-medium"
                  placeholder="Ask your question here..."
                />
                <div className="flex items-center gap-1 px-2 pb-1">
                  <IconButton icon="attach_file" title="Attach file" />
                </div>
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="w-11 h-11 sm:w-12 sm:h-12 bg-tuk-gold text-tuk-text rounded-xl border-2 border-tuk-gold flex items-center justify-center hover:bg-tuk-gold/90 active:scale-95 transition-all disabled:opacity-30 disabled:hover:bg-tuk-gold disabled:scale-100"
              >
                <span className="material-symbols-outlined text-xl font-bold">send</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

/* ─── ConvoCard ─── */
function ConvoCard({ convo, active, onClick }: { convo: Convo; active?: boolean; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between py-2 px-3 border-b border-slate-50 transition-all text-left group ${
        active ? "bg-tuk-green/5 border-tuk-green/20" : "hover:bg-slate-50"
      }`}
    >
      <span className={`text-xs truncate font-medium flex-1 pr-4 ${active ? "text-tuk-green" : "text-slate-600"}`}>
        {convo.content}
      </span>
      <div className="flex flex-col text-[9px] font-bold shrink-0 items-end text-slate-300 group-hover:text-tuk-green/60 transition-colors">
        <span>{new Date(convo.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
        <span>{new Date(convo.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </button>
  );
}

/* ─── QuickLink ─── */
function QuickLink({ icon, label, href }: { icon: string; label: string; href: string }) {
  return (
    <a
      className="group flex flex-col items-center justify-center text-center p-3 bg-white border-2 border-slate-100 rounded-xl hover:bg-slate-50 hover:border-tuk-green/20 transition-all"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="w-10 h-10 mb-2 rounded-lg bg-tuk-green/10 flex items-center justify-center text-tuk-green transition-all">
        <span className="material-symbols-outlined text-xl">{icon}</span>
      </div>
      <span className="text-xs font-bold text-slate-700 transition-colors">{label}</span>
    </a>
  );
}

/* ─── IconButton ─── */
function IconButton({ icon, title }: { icon: string; title: string }) {
  return (
    <button className="p-1.5 text-slate-400 hover:text-tuk-green hover:bg-white rounded-lg transition-all" title={title}>
      <span className="material-symbols-outlined text-lg">{icon}</span>
    </button>
  );
}
