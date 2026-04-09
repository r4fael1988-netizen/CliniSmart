"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Shield, Mail, Trash2, Power, Loader2, CheckCircle2, UserPlus } from "lucide-react";
import { getClinicUsers, createClinicUser, toggleUserStatus } from "@/app/dashboard/settings/users-actions";

export function UsersList() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "receptionist",
    password: ""
  });

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setIsLoading(true);
    const data = await getClinicUsers();
    setUsers(data);
    setIsLoading(false);
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const result = await createClinicUser(newUser);
    if (result.success) {
      setNewUser({ name: "", email: "", role: "receptionist", password: "" });
      setIsAdding(false);
      await loadUsers();
    } else {
      alert(result.error);
    }
    setIsSaving(false);
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    const result = await toggleUserStatus(userId, !currentStatus);
    if (result.success) {
      await loadUsers();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Gestão de Acessos
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Gerencie os colaboradores que podem acessar o sistema da clínica.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/30 hover:scale-[1.02] transition-all active:scale-95 border-2 border-white/20"
        >
          <UserPlus className="h-4 w-4" />
          Cadastrar Novo Colaborador
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-4 animate-in zoom-in-95 duration-200">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nome</label>
              <input 
                type="text" 
                required
                value={newUser.name}
                onChange={(e) => setNewUser(p => ({ ...p, name: e.target.value }))}
                placeholder="Ex: Maria Souza" 
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">E-mail</label>
              <input 
                type="email" 
                required
                value={newUser.email}
                onChange={(e) => setNewUser(p => ({ ...p, email: e.target.value }))}
                placeholder="maria@clinica.com" 
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Cargo / Permissão</label>
              <select 
                value={newUser.role}
                onChange={(e) => setNewUser(p => ({ ...p, role: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white"
              >
                <option value="receptionist">Recepcionista</option>
                <option value="doctor">Médico / Especialista</option>
                <option value="admin">Administrador Geral</option>
              </select>
            </div>
          </div>
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-1 flex-1 max-w-xs">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Senha Provisória</label>
              <input 
                type="password" 
                required
                value={newUser.password}
                onChange={(e) => setNewUser(p => ({ ...p, password: e.target.value }))}
                placeholder="••••••••" 
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
              />
            </div>
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-white rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={isSaving}
                className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-bold shadow-md shadow-primary/20 flex items-center gap-2 hover:bg-primary-dark transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Confirmar Cadastro
              </button>
            </div>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p className="text-sm font-medium">Carregando usuários...</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-white hover:shadow-sm transition-all group">
              <div className="flex items-center gap-4">
                <div className={`h-11 w-11 rounded-full flex items-center justify-center ${user.isActive ? 'bg-primary/5 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900">{user.name}</p>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      user.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.role === 'admin' ? 'Administrador' : 'Equipe'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </span>
                    {user.lastLoginAt && (
                      <span className="text-[10px] text-gray-400 italic">
                        Acesso em: {new Date(user.lastLoginAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleToggleStatus(user.id, user.isActive)}
                  className={`p-2 rounded-lg transition-colors ${
                    user.isActive ? 'text-gray-400 hover:bg-red-50 hover:text-red-500' : 'text-green-500 hover:bg-green-50'
                  }`}
                  title={user.isActive ? "Desativar acesso" : "Ativar acesso"}
                >
                  <Power className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
