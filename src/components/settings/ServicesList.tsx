"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, DollarSign } from "lucide-react";
import { getServices, addService, deleteService } from "@/app/dashboard/settings/services/actions";

interface ServiceItem {
  id: string;
  name: string;
  price: number;
}

export function ServicesList() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");

  const loadServices = async () => {
    setIsLoading(true);
    const data = await getServices();
    setServices(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPrice) return;

    setIsSubmitting(true);
    const result = await addService({ name: newName, price: parseFloat(newPrice) });
    
    if (result.success) {
      setNewName("");
      setNewPrice("");
      await loadServices();
    } else {
      alert(result.error);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja apagar este serviço? Agendamentos atrelados a ele perderão o link.")) return;
    
    const result = await deleteService(id);
    if (result.success) {
      await loadServices();
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1 border-b border-gray-100 pb-2">
          Catálogo de Procedimentos
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Cadastre os serviços ofericidos pela sua clínica. A Inteligência Artificial usará os valores daqui para calcular a sua Receita Estimada em tempo real.
        </p>
      </div>

      <form onSubmit={handleAdd} className="flex gap-4 items-end bg-gray-50 p-4 rounded-xl border border-gray-200">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-700 mb-1">Nome do Serviço</label>
          <input 
            type="text" 
            placeholder="Ex: Consulta Cardiológica" 
            required 
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" 
          />
        </div>
        <div className="w-48">
          <label className="block text-xs font-medium text-gray-700 mb-1">Valor (R$)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-4 w-4 text-gray-400" />
            </div>
            <input 
              type="number" 
              placeholder="150" 
              required
              min="0"
              step="0.01"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="w-full rounded-md border border-gray-300 pl-8 pr-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" 
            />
          </div>
        </div>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="h-9 px-4 flex items-center gap-2 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Adicionar
        </button>
      </form>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-semibold text-gray-500">
            <tr>
              <th className="px-4 py-3">Procedimento/Serviço</th>
              <th className="px-4 py-3">Valor Cadastrado</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Carregando serviços...
                </td>
              </tr>
            ) : services.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                  Nenhum serviço cadastrado ainda. Sua Receita aparecerá zerada no painel.
                </td>
              </tr>
            ) : (
              services.map((svc) => (
                <tr key={svc.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">{svc.name}</td>
                  <td className="px-4 py-3 text-green-700 font-medium">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(svc.price)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button 
                      onClick={() => handleDelete(svc.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      title="Excluir Serviço"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
