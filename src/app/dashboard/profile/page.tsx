"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { User, Mail, Shield, Camera, Lock, Save, Loader2, Phone, Briefcase } from "lucide-react";
import { updateUserProfile } from "./actions";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: session?.user?.name || "",
    email: session?.user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      alert("As senhas não coincidem!");
      return;
    }

    setIsSaving(true);
    const result = await updateUserProfile({
      name: formData.name,
      email: formData.email,
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword
    });

    if (result.success) {
      alert("Perfil atualizado com sucesso!");
      await update(); // Atualiza a sessão do cliente
      setFormData(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
    } else {
      alert(result.error);
    }
    setIsSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Meu Perfil</h1>
          <p className="text-gray-500 mt-1">Gerencie suas informações pessoais e segurança da conta.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col items-center text-center">
            <div className="relative group">
              <div className="h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center border-4 border-white shadow-md overflow-hidden ring-1 ring-gray-100">
                {session?.user?.image ? (
                  <img src={session.user.image} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-16 w-16 text-primary" />
                )}
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-gray-100 text-gray-500 hover:text-primary transition-all hover:scale-110 active:scale-95 group-hover:bg-primary group-hover:text-white">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            
            <h2 className="mt-4 text-xl font-bold text-gray-900">{session?.user?.name || "Usuário"}</h2>
            <p className="text-sm font-medium text-primary uppercase tracking-widest mt-1">{session?.user?.role === 'admin' ? 'Administrador' : 'Equipe'}</p>
            
            <div className="w-full mt-6 pt-6 border-t border-gray-50 space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <Mail className="h-4 w-4" />
                <span>{session?.user?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <Briefcase className="h-4 w-4" />
                <span>{session?.user?.clinicName || "Clínica Master"}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-2xl p-4 flex gap-3 text-blue-700">
            <Shield className="h-5 w-5 shrink-0" />
            <div className="text-xs space-y-1">
              <p className="font-bold uppercase tracking-tight">Sua conta está segura</p>
              <p className="leading-relaxed opacity-80">Recomendamos trocar sua senha a cada 90 dias para manter o acesso aos dados da clínica protegido.</p>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Informações Pessoais
                </h3>
              </div>
              <div className="p-6 grid gap-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Nome Completo</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">E-mail Corporativo</label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Segurança e Senha
                </h3>
              </div>
              <div className="p-6 space-y-5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Senha Atual (para validar mudanças)</label>
                  <input 
                    type="password" 
                    value={formData.currentPassword}
                    onChange={(e) => setFormData(p => ({ ...p, currentPassword: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Nova Senha</label>
                    <input 
                      type="password" 
                      value={formData.newPassword}
                      onChange={(e) => setFormData(p => ({ ...p, newPassword: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Confirmar Nova Senha</label>
                    <input 
                      type="password" 
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(p => ({ ...p, confirmPassword: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-primary/30 hover:bg-primary-dark transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
