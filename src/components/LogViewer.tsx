import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { MessageSquare, Clock, User, Hash, ChevronRight, FileText } from "lucide-react";

export default function LogViewer() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const [selectedLog, setSelectedLog] = useState<any>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/logs", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error("Logs fetch fail");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-8">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Histórico de Interações</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Audite as conversas e diagnósticos realizados pela IA.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Logs List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm h-[70vh] flex flex-col transition-colors">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Registros Recentes</span>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400 font-mono">Limit 200</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {logs.map(log => (
              <button
                key={log.id}
                onClick={() => setSelectedLog(log)}
                className={`w-full p-6 text-left border-b border-slate-50 dark:border-slate-800 transition-all flex items-center gap-4 group ${
                  selectedLog?.id === log.id 
                    ? "bg-slate-900 dark:bg-black text-white" 
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                  selectedLog?.id === log.id ? "bg-brand text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                }`}>
                  ID{log.id}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      selectedLog?.id === log.id ? "text-brand" : "text-slate-400 dark:text-slate-500"
                    }`}>
                      {log.username}
                    </span>
                    <span className="text-[10px] opacity-40 font-mono text-slate-500 dark:text-slate-400">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className={`text-xs font-medium truncate italic ${
                    selectedLog?.id === log.id ? "text-slate-200" : "text-slate-600 dark:text-slate-400"
                  }`}>
                    "{log.user_message}"
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${
                  selectedLog?.id === log.id ? "text-brand" : "text-slate-300 dark:text-slate-600"
                }`} />
              </button>
            ))}
          </div>
        </div>

        {/* Detail View */}
        <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl h-[70vh] flex flex-col transition-colors">
          {selectedLog ? (
            <>
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-brand" />
                    <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Audit_ID_{selectedLog.id}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    <Clock className="w-3 h-3" />
                    {new Date(selectedLog.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-500 dark:text-slate-300" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Operador</div>
                    <div className="font-bold text-slate-700 dark:text-slate-100">{selectedLog.username}</div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-brand">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Pergunta do Técnico</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl text-sm leading-relaxed border border-slate-200 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-200">
                    {selectedLog.user_message}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Resposta Motora AI</span>
                  </div>
                  <div className="bg-white dark:bg-slate-800/50 p-5 rounded-2xl text-sm leading-relaxed border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 italic whitespace-pre-wrap">
                    {selectedLog.bot_message}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
              <div className="relative">
                <div className="absolute -inset-4 bg-brand/10 dark:bg-brand/5 rounded-full blur-xl animate-pulse" />
                <div className="relative w-20 h-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center shadow-xl">
                  <FileText className="w-10 h-10 text-brand" />
                </div>
              </div>
              <div className="max-w-xs space-y-2">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest">Aguardando Seleção</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  Selecione uma interação no painel lateral para visualizar os metadados e o log completo do diagnóstico.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
