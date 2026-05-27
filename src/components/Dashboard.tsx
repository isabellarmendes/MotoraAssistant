import React from "react";
import { Link, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { LayoutDashboard, BookOpen, Users, FileText, ArrowLeft, Terminal, Shield } from "lucide-react";
import KnowledgeBase from "./KnowledgeBase";
import UserManager from "./UserManager";
import LogViewer from "./LogViewer";

export default function Dashboard() {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: "Visão Geral", path: "/admin", icon: LayoutDashboard },
    { label: "Base de Conhecimento", path: "/admin/kb", icon: BookOpen },
    { label: "Gestão de Usuários", path: "/admin/users", icon: Users },
    { label: "Logs de Interação", path: "/admin/logs", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row overflow-hidden transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 dark:bg-black text-white flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <Shield className="w-6 h-6 text-brand" />
          <h1 className="font-bold tracking-tight uppercase text-sm">Painel Diretor</h1>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${
                  isActive 
                    ? "bg-brand text-white shadow-lg shadow-brand/20" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => navigate("/")}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl transition-all text-xs font-bold uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Terminal
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-10">
        <Routes>
          <Route path="/" element={<Summary />} />
          <Route path="/kb" element={<KnowledgeBase />} />
          <Route path="/users" element={<UserManager />} />
          <Route path="/logs" element={<LogViewer />} />
        </Routes>
      </main>
    </div>
  );
}

function Summary() {
  return (
    <div className="max-w-4xl space-y-8">
      <header>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Visão Geral do Admin</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Bem-vindo ao centro de operações da Motora AI.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: "Status da Memória IA", value: "Memória Ativa", desc: "Regras permanentes aplicadas", color: "border-emerald-500" },
          { title: "Papéis do Sistema", value: "RBAC Ativo", desc: "Divisão Admin/Técnico", color: "border-brand" },
          { title: "Status da Rede", value: "Gateways FRP", desc: "Acesso remoto pronto", color: "border-blue-400" }
        ].map(stat => (
          <div key={stat.title} className={`bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border-l-4 ${stat.color} transition-colors`}>
            <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{stat.title}</h4>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{stat.desc}</p>
          </div>
        ))}
      </div>

      <div className="p-8 bg-slate-900 rounded-3xl text-white overflow-hidden relative shadow-2xl">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2 text-brand">
            <Terminal className="w-6 h-6" />
            <span className="font-mono text-xs font-bold tracking-[0.3em] uppercase">Cérebro Central</span>
          </div>
          <h3 className="text-2xl font-bold max-w-md leading-tight">Configurações globais de inteligência.</h3>
          <p className="text-slate-400 max-w-lg text-sm">
            Toda a inteligência do Motora Bot é baseada na sua Base de Conhecimento. 
            Mantenha-a atualizada para garantir diagnósticos precisos em campo.
          </p>
          <div className="pt-2">
            <Link to="/admin/kb" className="inline-flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all">
              Editar Knowledge Base <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </div>
        </div>
        <div className="absolute top-1/2 right-[-10%] -translate-y-1/2 opacity-10">
          <Terminal size={400} />
        </div>
      </div>
    </div>
  );
}
