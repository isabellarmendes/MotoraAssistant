import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { UserPlus, Trash2, Calendar, Shield, User, X } from "lucide-react";

export default function UserManager() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const { token, user: currentUser } = useAuth();

  // Form State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Fetch users fail");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ username, password, is_admin: isAdmin })
      });
      if (!res.ok) throw new Error("Fail");
      
      setUsername("");
      setPassword("");
      setIsAdmin(false);
      setShowAdd(false);
      fetchUsers();
    } catch (err) {
      alert("Erro ao criar usuário");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Deletar este usuário permanentemente?")) return;
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      alert("Erro ao deletar");
    }
  };

  return (
    <div className="max-w-5xl space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Gerenciamento de Usuários</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Controle quem tem acesso ao terminal Motora AI.</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-brand text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-brand-hover transition-all shadow-lg shadow-brand/20"
        >
          <UserPlus className="w-4 h-4" />
          Novo Usuário
        </button>
      </header>

      {showAdd && (
        <div className="bg-white dark:bg-slate-900 border-2 border-brand p-8 rounded-3xl relative shadow-2xl transition-colors">
          <button onClick={() => setShowAdd(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
            <X className="w-6 h-6" />
          </button>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="md:col-span-1 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Nome de Usuário</label>
              <input 
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand outline-none transition-all text-sm dark:text-slate-200"
                placeholder="Ex: joao.suporte"
              />
            </div>
            <div className="md:col-span-1 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Senha</label>
              <input 
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand outline-none transition-all text-sm dark:text-slate-200"
                placeholder="Mín. 6 chars"
              />
            </div>
            <div className="md:col-span-1 flex items-center gap-2 pb-3">
              <input 
                type="checkbox" 
                id="isAdmin"
                checked={isAdmin}
                onChange={e => setIsAdmin(e.target.checked)}
                className="w-4 h-4 accent-brand"
              />
              <label htmlFor="isAdmin" className="text-xs font-bold text-slate-700 dark:text-slate-300">Administrador</label>
            </div>
            <div className="md:col-span-1">
              <button className="w-full bg-brand text-white font-bold py-2.5 rounded-xl hover:bg-brand-hover transition-all text-sm">
                Criar Conta
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-colors">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Identidade</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Cargo</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Criado em</th>
              <th className="px-6 py-4 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center font-mono font-bold text-xs">
                      {u.username.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">{u.username}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    u.is_admin ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}>
                    {u.is_admin ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    {u.is_admin ? "Admin" : "Técnico"}
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-slate-400 dark:text-slate-500 font-mono">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  {u.id !== currentUser?.id && (
                    <button 
                      onClick={() => handleDelete(u.id)}
                      className="p-2 text-slate-300 dark:text-slate-600 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
