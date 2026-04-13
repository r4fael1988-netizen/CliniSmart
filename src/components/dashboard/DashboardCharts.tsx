"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, Calendar, TrendingUp, Clock, Bot, DollarSign 
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';

interface DashboardProps {
  kpis: {
    leadsToday: number;
    appointmentsWeek: number;
    aiHandledRaw: number;
    aiPercentage: string;
    totalRevenue: number;
  };
  leadsData: { time: string; leads: number }[];
  specialtyData: { name: string; value: number; color: string }[];
  messageVolume: { day: string; msgs: number }[];
  latestInteractions: { name: string; action: string; time: string }[];
}

export function DashboardCharts({ kpis, leadsData, specialtyData, messageVolume, latestInteractions }: DashboardProps) {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 30000); // Atualiza a cada 30 segundos
    return () => clearInterval(interval);
  }, [router]);
  
  const kpiCards = [
    { title: "Leads Hoje", value: kpis.leadsToday.toString(), trend: "Tempo real", icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Agendamentos", value: kpis.appointmentsWeek.toString(), subtitle: "desta semana", icon: Calendar, color: "text-green-600", bg: "bg-green-100" },
    { title: "Interações Feitas", value: kpis.aiHandledRaw.toString(), trend: "Geral", icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-100" },
    { title: "Tempo Médio", value: "2.4m", subtitle: "por mensagem", icon: Clock, color: "text-orange-600", bg: "bg-orange-100" },
    { title: "Atendidos pela IA", value: kpis.aiPercentage, subtitle: "sem intervir", icon: Bot, color: "text-sky-600", bg: "bg-sky-100" },
    { title: "Receita Estimada", value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(kpis.totalRevenue), subtitle: "agendamentos × preço", icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-100" }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpiCards.map((kpi, idx) => (
          <div key={idx} className="rounded-xl border border-border bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${kpi.bg}`}>
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              {kpi.trend && (
                <span className="flex items-center text-xs font-semibold text-green-600">
                  {kpi.trend}
                </span>
              )}
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-500">{kpi.title}</p>
              <h3 className="text-2xl font-bold text-gray-900">{kpi.value}</h3>
              {kpi.subtitle && <p className="text-xs text-gray-400 mt-1">{kpi.subtitle}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos Primeira Linha */}
      <div className="grid gap-4 md:grid-cols-7">
        <div className="md:col-span-4 lg:col-span-5 rounded-xl border border-border bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900">Leads Recebidos Hoje</h3>
            <p className="text-sm text-gray-500">Volume de entrada de leads via WhatsApp</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={leadsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="leads" stroke="#0EA5E9" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="md:col-span-3 lg:col-span-2 rounded-xl border border-border bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900">Especialidades</h3>
            <p className="text-sm text-gray-500">Distribuição de agendamentos</p>
          </div>
          <div className="h-[300px] w-full flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={specialtyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {specialtyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4 text-xs w-full">
                {specialtyData.map(entry => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{backgroundColor: entry.color}} />
                    <span className="text-gray-600 truncate">{entry.name}</span>
                  </div>
                ))}
                {specialtyData.length === 0 && <span className="col-span-2 text-center text-gray-400">Sem dados</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos Segunda Linha */}
      <div className="grid gap-4 md:grid-cols-2">
         <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900">Volume de Mensagens (Semana)</h3>
            <p className="text-sm text-gray-500">Interações ativas recentes.</p>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={messageVolume}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                 <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                 <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                 <Tooltip cursor={{fill: 'transparent'}} />
                 <Bar dataKey="msgs" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="rounded-xl border border-border bg-white p-6 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900">Feed Real-Time</h3>
            <p className="text-sm text-gray-500">Últimas ações salvas</p>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4">
             {latestInteractions.length === 0 ? (
                <div className="flex items-center justify-center p-6 text-gray-400 text-sm h-full">Nenhuma movimentação ainda.</div>
             ) : latestInteractions.map((feed, i) => (
                <div key={i} className="flex items-center gap-3 border-b border-gray-100 pb-3 last:border-0 hover:bg-gray-50 p-2 rounded-lg transition-colors">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{feed.name}</p>
                    <p className="text-xs text-gray-500 truncate">{feed.action}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{feed.time}</span>
                </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}
