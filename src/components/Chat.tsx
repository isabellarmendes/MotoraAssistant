import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { LogOut, Send, Bot, User, Settings, Terminal, ShieldAlert, Cpu, RotateCcw, Sun, Moon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { getGeminiResponse } from "../services/geminiService";
import { useTheme } from "./ThemeContext";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Terminal Motora AI pronto. Como posso ajudar no diagnóstico hoje?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [kb, setKb] = useState("");
  const [deviceStatus, setDeviceStatus] = useState({
    gps: "---",
    lte: "---",
    storage: "---",
    cam_ext: "---",
    cam_int: "---",
    sync: "---",
    power: "---",
    access: "---",
    id: "---",
    company: "---"
  });
  const { user, token, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch KB once for the session
    fetch("/api/chat/kb", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setKb(data.content))
      .catch(console.error);
  }, [token]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Find the last session break to isolate context
      const lastBreakIndex = [...messages].reverse().findIndex(m => m.content === "--- SESSION_BREAK ---");
      const contextualMessages = lastBreakIndex === -1 
        ? [...messages, userMsg] 
        : [...messages.slice(messages.length - lastBreakIndex), userMsg];

      const reply = await getGeminiResponse(contextualMessages, kb);
      
      // Parse status updates
      const statusRegex = /\[UPDATE_STATUS:\s*(GPS|LTE|STORAGE|CAM_EXT|CAM_INT|SYNC|POWER|ACCESS|ID|COMPANY)=(.*?)\]/gi;
      let match;
      const newStatus = { ...deviceStatus };
      let hasUpdate = false;

      while ((match = statusRegex.exec(reply)) !== null) {
        const component = match[1].toLowerCase();
        const value = match[2].trim();
        if (component === "gps") newStatus.gps = value;
        if (component === "lte") newStatus.lte = value;
        if (component === "storage") newStatus.storage = value;
        if (component === "cam_ext") newStatus.cam_ext = value;
        if (component === "cam_int") newStatus.cam_int = value;
        if (component === "sync") newStatus.sync = value;
        if (component === "power") newStatus.power = value;
        if (component === "access") newStatus.access = value;
        if (component === "id") newStatus.id = value;
        if (component === "company") newStatus.company = value;
        hasUpdate = true;
      }

      if (hasUpdate) setDeviceStatus(newStatus);

      // Clean the reply from tags for display
      const cleanReply = reply.replace(/\[UPDATE_STATUS:.*?\]/gi, "").trim();
      setMessages(prev => [...prev, { role: "assistant", content: cleanReply }]);

      // Log the interaction
      fetch("/api/chat/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ user_message: userMsg.content, bot_message: cleanReply })
      }).catch(console.error);

    } catch (err: any) {
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Erro crítico na conexão AI: " + err.message }]);
    } finally {
      setLoading(false);
    }
  };

  const resetSession = () => {
    if (confirm("Deseja iniciar um novo atendimento? Isso resetará os status e o histórico atual.")) {
      setDeviceStatus({
        gps: "---",
        lte: "---",
        storage: "---",
        cam_ext: "---",
        cam_int: "---",
        sync: "---",
        power: "---",
        access: "---",
        id: "---",
        company: "---"
      });
      setMessages(prev => [
        ...prev, 
        { role: "assistant", content: "--- SESSION_BREAK ---" },
        { role: "assistant", content: "Novo atendimento iniciado. Por favor, informe o ID ou placa do equipamento para começar o diagnóstico." }
      ]);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 px-6 py-3 flex items-center justify-between shrink-0 z-10 transition-colors">
        <div className="flex items-center gap-4">
          <div className="bg-brand p-1.5 rounded-lg shadow-sm">
            <Terminal className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-brand">MOTORA AI <span className="text-slate-400 dark:text-slate-500 font-normal">SUPPORT TERMINAL</span></h1>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Sistema Online | Conectado
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 dark:text-slate-400 hover:text-brand dark:hover:text-brand"
            title="Alternar Tema"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          {user?.is_admin && (
            <Link 
              to="/admin" 
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 dark:text-slate-400 hover:text-brand dark:hover:text-brand"
              title="Painel Admin"
            >
              <Settings className="w-5 h-5" />
            </Link>
          )}
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>
          <div className="flex items-center gap-3 pl-2">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{user?.username}</div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{user?.is_admin ? "Administrador" : "Técnico"}</div>
            </div>
            <button 
              onClick={logout}
              className="p-2 hover:bg-brand/10 hover:text-brand rounded-lg transition-all text-slate-400 dark:text-slate-500"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar (Desktop) */}
        <aside className="w-64 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden lg:flex flex-col p-4 transition-all">
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between px-2 pt-2">
              <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status do Equipamento</h3>
            </div>
            <div className="space-y-1.5 overflow-y-auto pr-1 max-h-[calc(100vh-200px)]">
              {[
                { label: "Empresa", status: deviceStatus.company, icon: Settings },
                { label: "ID Equipamento", status: deviceStatus.id, icon: Terminal },
                { label: "Módulo GPS", status: deviceStatus.gps, icon: Cpu },
                { label: "Modem LTE", status: deviceStatus.lte, icon: Cpu },
                { label: "Armazenamento", status: deviceStatus.storage, icon: Cpu },
                { label: "Câm. Externa", status: deviceStatus.cam_ext, icon: Cpu },
                { label: "Câm. Interna", status: deviceStatus.cam_int, icon: Cpu },
                { label: "Sincronia", status: deviceStatus.sync, icon: Cpu },
                { label: "Energia", status: deviceStatus.power, icon: Cpu },
                { label: "Modo Acesso", status: deviceStatus.access, icon: Terminal },
              ].map(item => {
                const isError = item.status.toLowerCase().includes("off") || item.status.toLowerCase().includes("error") || item.status.toLowerCase().includes("no") || item.status.toLowerCase().includes("fail") || item.status.toLowerCase().includes("none");
                const isWarning = item.status.toLowerCase().includes("warn");
                const isOk = item.status.toLowerCase().includes("ok") || item.status.toLowerCase().includes("active") || item.status.toLowerCase().includes("conn");
                
                return (
                  <div key={item.label} className="bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-3 shadow-sm transition-colors">
                    <item.icon className={`w-3.5 h-3.5 ${isError ? "text-rose-500" : isWarning ? "text-amber-500" : isOk ? "text-emerald-500" : "text-slate-400"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">{item.label}</div>
                      <div className={`text-[9px] font-mono tracking-tighter truncate ${
                        isError ? "text-rose-600" : isWarning ? "text-amber-600" : isOk ? "text-emerald-600" : "text-slate-400 dark:text-slate-500"
                      }`}>{item.status}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 transition-colors">
            <button 
              onClick={resetSession}
              className="w-full bg-brand hover:bg-brand-hover text-white rounded-lg py-3 px-3 flex items-center justify-center gap-2 text-[10px] font-bold transition-all shadow-md active:scale-95 group"
              title="Finalizar e Iniciar Novo Atendimento"
            >
              <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              NOVO ATENDIMENTO
            </button>
          </div>
        </aside>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col relative bg-slate-50 dark:bg-slate-950 transition-colors">
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth technical-grid"
          >
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full"
                >
                  {msg.content === "--- SESSION_BREAK ---" ? (
                    <div className="w-full py-8 flex items-center gap-4">
                      <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800"></div>
                      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-800">
                        <RotateCcw className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Novo Atendimento Iniciado</span>
                      </div>
                      <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800"></div>
                    </div>
                  ) : (
                    <div className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                      <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                        msg.role === "user" ? "bg-slate-800 dark:bg-slate-700 text-white" : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-brand"
                      }`}>
                        {msg.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                      </div>
                      
                      <div className={`max-w-[85%] lg:max-w-2xl px-5 py-4 rounded-2xl shadow-sm border ${
                        msg.role === "user" 
                          ? "bg-slate-800 dark:bg-slate-900 text-slate-100 border-slate-700 dark:border-slate-800" 
                          : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                      }`}>
                        <div className="markdown-body dark:prose-invert">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-4"
                >
                  <div className="shrink-0 w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-brand flex items-center justify-center shadow-sm">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-5 py-4 rounded-2xl shadow-sm flex items-center gap-2 transition-colors">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce"></div>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-mono italic">Processando diagnóstico...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Input Area */}
          <div className="p-4 md:p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-up shrink-0 transition-colors">
            <form 
              onSubmit={handleSubmit}
              className="max-w-4xl mx-auto relative group"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-6 pr-16 py-4 focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-700 dark:text-slate-200"
                placeholder="Descreva o problema (ex: Câmera offline, Erro de sincronização...)"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand hover:bg-brand-hover disabled:opacity-20 text-white p-2.5 rounded-xl transition-all shadow-lg"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
            <div className="text-center mt-3">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] font-mono">Secure Diagnostic Node AI-1.5-FLASH</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
