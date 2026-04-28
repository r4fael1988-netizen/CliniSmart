"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

export default function Dashboard() {
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchKpis();
  }, [days]);

  const fetchKpis = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/kpis?clinicId=1&days=${days}`);
      const data = await res.json();
      if (data.ok) {
        setKpis(data.kpis);
      }
    } catch (error) {
      console.error("Error fetching KPIs:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-sm text-slate-500">
                Últimos {days} dias • Comparativo com período anterior
              </p>
            </div>
            <div className="flex gap-2">
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    days === d
                      ? "bg-brand-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Taxa de Conversão */}
          <KpiCard
            title="Taxa de Conversão"
            value={kpis?.conversao?.current || 0}
            unit="%"
            icon={TrendingUp}
            change={kpis?.conversao?.change}
            color="bg-blue-50"
            iconColor="text-blue-600"
          />

          {/* Faturamento */}
          <KpiCard
            title="Faturamento"
            value={kpis?.faturamento?.current || 0}
            unit="R$"
            icon={DollarSign}
            change={kpis?.faturamento?.change}
            color="bg-green-50"
            iconColor="text-green-600"
            isCurrency
          />

          {/* Agendamentos */}
          <KpiCard
            title="Agendamentos"
            value={kpis?.agendamentos?.current || 0}
            unit="consultas"
            icon={Calendar}
            change={0}
            color="bg-purple-50"
            iconColor="text-purple-600"
          />

          {/* Médico Mais Procurado */}
          <KpiCard
            title="Top Médico"
            value={kpis?.topDoctor?.consultations || 0}
            unit={`• ${kpis?.topDoctor?.name || "N/A"}`}
            icon={Users}
            change={0}
            color="bg-orange-50"
            iconColor="text-orange-600"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Receita ao longo do tempo */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Receita ao longo do período
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={generateChartData(30)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `R$ ${value}`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="receita"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name="Receita"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Agendamentos por especialidade */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Agendamentos por especialidade
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={generateSpecialtyData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="specialty" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" name="Agendamentos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ocupação por dia */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Taxa de Ocupação
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">
                  Período atual
                </span>
                <span className="text-2xl font-bold text-slate-900">
                  {kpis?.agendamentos?.ocupacao || 0}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div
                  className="bg-brand-600 h-3 rounded-full transition-all"
                  style={{
                    width: `${kpis?.agendamentos?.ocupacao || 0}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Resumo de métricas */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Resumo de Performance
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="text-sm text-slate-600">Leads recebidos</span>
              <span className="font-semibold text-slate-900">--</span>
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="text-sm text-slate-600">Leads convertidos</span>
              <span className="font-semibold text-slate-900">--</span>
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="text-sm text-slate-600">
                Ticket médio
              </span>
              <span className="font-semibold text-slate-900">
                R${" "}
                {kpis?.agendamentos?.current > 0
                  ? (kpis?.faturamento?.current / kpis?.agendamentos?.current).toFixed(2)
                  : 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">
                Tempo médio de resposta
              </span>
              <span className="font-semibold text-slate-900">--</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== COMPONENTES =====

function KpiCard({
  title,
  value,
  unit,
  icon: Icon,
  change,
  color,
  iconColor,
  isCurrency = false,
}: any) {
  const isPositive = change >= 0;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        {change !== 0 && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {isPositive ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-sm text-slate-600 mb-2">{title}</p>
      <p className="text-3xl font-bold text-slate-900 mb-1">
        {isCurrency ? "R$ " : ""}
        {typeof value === "number" ? value.toFixed(2) : value}
      </p>
      <p className="text-xs text-slate-500">{unit}</p>
    </div>
  );
}

// Dados mock para gráficos
function generateChartData(days: number) {
  const data = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    data.push({
      date: date.toLocaleDateString("pt-BR", { month: "short", day: "numeric" }),
      receita: Math.random() * 5000 + 2000,
    });
  }
  return data;
}

function generateSpecialtyData() {
  return [
    { specialty: "Cardiologia", count: 12 },
    { specialty: "Dermatologia", count: 8 },
    { specialty: "Oftalmologia", count: 15 },
    { specialty: "Ortopedia", count: 10 },
    { specialty: "Pediatria", count: 7 },
  ];
}
