"use client";

import { useState } from "react";
import { Save, Bot, Key, CreditCard, Users, Clock, Globe, ClipboardList } from "lucide-react";
import { WhatsAppConnection } from "@/components/settings/WhatsAppConnection";
import { ServicesList } from "@/components/settings/ServicesList";

export default function SettingsPage() {
  const [activeMenu, setActiveMenu] = useState("ia");

  const menuItems = [
    { id: "ia", name: "Inteligência Artificial", icon: Bot },
    { id: "services", name: "Serviços e Valores", icon: ClipboardList },
    { id: "integrations", name: "Integrações (API)", icon: Key },
    { id: "team", name: "Equipe e Médicos", icon: Users },
    { id: "hours", name: "Horários de Atendimento", icon: Clock },
    { id: "billing", name: "Plano e Faturamento", icon: CreditCard },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Configurações Gerais</h1>
        <p className="text-sm text-muted-foreground">Gerencie a IA, integrações, faturamento e acessos da sua clínica.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Menu de Configurações */}
        <div className="w-full md:w-64 flex-shrink-0">
          <nav className="flex md:flex-col gap-2 overflow-x-auto pb-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                  activeMenu === item.id
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-transparent hover:border-gray-200"
                }`}
              >
                <item.icon className={`h-4 w-4 ${activeMenu === item.id ? "text-blue-100" : "text-gray-400"}`} />
                {item.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-xl border border-border shadow-sm min-h-[500px]">
          {activeMenu === "ia" && (
            <div className="p-6 space-y-8">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1 border-b border-gray-100 pb-2">Comportamento do Agente Virtual</h2>
                <div className="mt-4 grid gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Agente Virtual</label>
                    <input type="text" defaultValue="Sofia" className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prompt Mestre (Contexto Base)</label>
                    <textarea 
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm h-32 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                      defaultValue="Você é a Sofia, a assistente virtual da Clínica Master. Seu tom é empático, profissional e acolhedor. Seu objetivo principal é confirmar se o paciente deseja marcar uma consulta e direcioná-lo para a fila do Kanban em caso positivo..."
                    />
                    <p className="text-xs text-gray-500 mt-1">Essa diretriz molda a personalidade da IA do WhatsApp.</p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <input type="checkbox" id="ai-active" defaultChecked className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4" />
                    <label htmlFor="ai-active" className="text-sm text-gray-700">Ativar respostas automáticas 24/7</label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeMenu === "integrations" && (
            <div className="p-6 space-y-8">
              <WhatsAppConnection />
              
              <div className="pt-6 border-t border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-1 pb-2 flex items-center justify-between">
                  Configurações Avançadas da API
                </h2>
                <div className="mt-4 grid gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chave da API Global</label>
                    <input type="password" defaultValue="ZP2Vfc24UP1BtNZ6QlbISCVz0N9GW9BE" readOnly className="w-full max-w-md bg-gray-50 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL de Destino (Recebimento para n8n)</label>
                    <input type="text" defaultValue="https://lostbaskingshark-n8n.cloudfy.live/webhook" className="w-full max-w-xl rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeMenu === "services" && <ServicesList />}

          {activeMenu === "team" && (
            <div className="p-6 flex flex-col items-center justify-center h-full text-center min-h-[400px]">
              <Users className="h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-900">Gestão de Equipe</h3>
              <p className="text-sm text-gray-500 max-w-sm mt-1">Interface para cadastrar médicos, recepcionistas e liberar acessos ao sistema.</p>
              <button className="mt-4 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Adicionar Membro
              </button>
            </div>
          )}

          {activeMenu === "billing" && (
            <div className="p-6 space-y-6">
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-blue-200 text-sm font-medium uppercase tracking-wider mb-1">Plano Atual</p>
                    <h2 className="text-3xl font-bold">CliniSmart Pro</h2>
                    <p className="text-gray-300 mt-2 text-sm">Acesso total a IA, Kanban e multi-atendentes.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">R$ 289<span className="text-sm text-gray-400 font-normal">/mês</span></p>
                    <span className="inline-block mt-2 px-2 py-1 bg-green-500/20 text-green-300 text-xs font-semibold rounded-md border border-green-500/30">Ativo</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 border-b border-gray-100 pb-2">Histórico de Faturas</h3>
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                  {[
                    { id: '#INV-0012', desc: 'Mensalidade Abril', val: 'R$ 289,00', status: 'Pago' },
                    { id: '#INV-0011', desc: 'Mensalidade Março', val: 'R$ 289,00', status: 'Pago' }
                  ].map((inv, i) => (
                    <div key={i} className="flex justify-between items-center p-3 text-sm">
                      <div>
                        <p className="font-medium text-gray-900">{inv.id}</p>
                        <p className="text-gray-500 text-xs">{inv.desc}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-medium">{inv.val}</span>
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600">{inv.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="border-t border-gray-100 p-4 bg-gray-50/50 rounded-b-xl flex justify-end">
            <button className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark transition-colors">
              <Save className="h-4 w-4" />
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
