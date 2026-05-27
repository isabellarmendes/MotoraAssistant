import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { Save, RefreshCw, AlertCircle, FileText } from "lucide-react";
import { motion } from "motion/react";

export default function KnowledgeBase() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    fetchKB();
  }, []);

  const fetchKB = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/knowledge", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setContent(data.content || "");
    } catch (err: any) {
      setError("Falha ao carregar Knowledge Base");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch("/api/knowledge", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(errorData.error || "Erro ao salvar alterações");
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <RefreshCw className="w-8 h-8 text-slate-300 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">🧠 Cérebro da Inteligência</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Atualize aqui as diretrizes, regras de atendimento e conhecimentos técnicos que a IA deve seguir permanentemente.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchKB}
            className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            title="Recarregar"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-brand text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-brand-hover transition-all shadow-lg shadow-brand/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 p-4 rounded-xl text-rose-600 dark:text-rose-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 p-4 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          Alterações salvas com sucesso! A IA já está usando a nova base.
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col h-[70vh] transition-colors">
        <div className="bg-slate-50 dark:bg-slate-950 px-6 py-3 border-bottom border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">KNOWLEDGE_BASE.MD</span>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          spellCheck={false}
          className="flex-1 p-8 font-mono text-sm leading-relaxed text-slate-700 dark:text-slate-300 bg-transparent outline-none resize-none"
          placeholder="Insira as instruções técnicas aqui..."
        />
        <div className="bg-slate-50 dark:bg-slate-950 px-6 py-2 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
          {content.length} caracteres | Linguagem: Markdown Suportada
        </div>
      </div>
    </div>
  );
}
