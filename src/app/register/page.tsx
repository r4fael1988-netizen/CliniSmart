"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Activity, Building, User, Mail, Lock } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    clinicName: "",
    userName: "",
    email: "",
    password: "",
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // 1. Criar a conta na API
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ocorreu um erro inesperado.");
        setIsLoading(false);
        return;
      }

      // 2. Fazer Login Automático via NextAuth
      const loginRes = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (loginRes?.error) {
        // Se falhar o auto-login por algum motivo, mandamos pro manual
        router.push("/login?registered=true");
      } else {
        router.push("/dashboard");
      }

    } catch (err) {
      setError("Falha na conexão com o servidor.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-light to-white p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-900/5">
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Nova Clínica
          </h2>
          <p className="text-sm text-gray-500 text-center">
            Cadastre seu espaço de saúde no CliniSmart e revolucione o atendimento.
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-500 border border-red-100">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="clinicName" className="block text-sm font-medium text-gray-700">
                Nome da Clínica
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="clinicName"
                  name="clinicName"
                  type="text"
                  required
                  value={formData.clinicName}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 placeholder-gray-400 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                  placeholder="Clínica Exemplo Médicos"
                />
              </div>
            </div>

            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-gray-700">
                Seu Nome (Administrador)
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="userName"
                  name="userName"
                  type="text"
                  required
                  value={formData.userName}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 placeholder-gray-400 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                  placeholder="Dr. João Silva"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-mail Corporativo
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 placeholder-gray-400 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                  placeholder="contato@clinica.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Definir Senha
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 pl-10 pr-10 py-2 placeholder-gray-400 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {isLoading ? "Criando espaço..." : "Finalizar Cadastro"}
            </button>
          </div>
        </form>

        <div className="mt-6 border-t border-gray-100 pt-6 text-center">
          <p className="text-sm text-gray-600">
            Já possui uma clínica ativa?{" "}
            <Link href="/login" className="font-semibold text-primary hover:text-primary-dark transition-colors">
              Fazer Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
