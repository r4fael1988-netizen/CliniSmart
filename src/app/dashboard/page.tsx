import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { startOfDay, startOfWeek, endOfWeek, subDays, format } from "date-fns";

const prisma = new PrismaClient();

// Mantém a dashboard viva buscando os dados em server-time
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clinicId) return <div>Sem Permissão</div>;
  const clinicId = session.user.clinicId;

  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  // KPIs
  const leadsToday = await prisma.patient.count({
    where: { clinicId, createdAt: { gte: todayStart } }
  });

  const appointmentsWeek = await prisma.appointment.count({
    where: { clinicId, scheduledAt: { gte: weekStart, lte: weekEnd } }
  });

  const aiHandledRaw = await prisma.interaction.count({
    where: { clinicId, handledBy: 'ai' }
  });

  const allInteractions = await prisma.interaction.count({
    where: { clinicId }
  });
  
  const aiPercentage = allInteractions === 0 ? "0%" : `${Math.round((aiHandledRaw / allInteractions) * 100)}%`;

  const appointmentsWithValue = await prisma.appointment.findMany({
    where: { clinicId, value: { not: null } }
  });
  const totalRevenue = appointmentsWithValue.reduce((acc, appt) => acc + Number(appt.value), 0);

  const kpis = {
    leadsToday,
    appointmentsWeek,
    aiHandledRaw,
    aiPercentage,
    totalRevenue
  };

  // --- Gráfico: Evolução Hoje (Horas) ---
  const todayLeads = await prisma.patient.findMany({
    where: { clinicId, createdAt: { gte: todayStart } },
    select: { createdAt: true }
  });
  
  const hourlyCount: Record<string, number> = {};
  todayLeads.forEach(lead => {
    const hour = format(lead.createdAt, "HH:00");
    hourlyCount[hour] = (hourlyCount[hour] || 0) + 1;
  });
  const leadsData = Object.entries(hourlyCount)
    .map(([time, leads]) => ({ time, leads }))
    .sort((a, b) => a.time.localeCompare(b.time));

  // --- Pizza: Especialidades ---
  const allAppointments = await prisma.appointment.findMany({
    where: { clinicId },
    select: { specialty: true }
  });
  const specialtyCount: Record<string, number> = {};
  allAppointments.forEach(appt => {
    specialtyCount[appt.specialty] = (specialtyCount[appt.specialty] || 0) + 1;
  });
  const colors = ["#0EA5E9", "#3B82F6", "#8B5CF6", "#F59E0B", "#10B981"];
  const specialtyData = Object.entries(specialtyCount).map(([name, value], i) => ({
    name,
    value,
    color: colors[i % colors.length]
  }));

  // --- Gráfico: Barras de Mensagem ---
  const last7Days = subDays(now, 7);
  const recentInteractions = await prisma.interaction.findMany({
    where: { clinicId, createdAt: { gte: last7Days } },
    select: { createdAt: true }
  });
  
  const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const msgsCount: Record<string, number> = {};
  recentInteractions.forEach(int => {
    const day = daysOfWeek[int.createdAt.getDay()];
    msgsCount[day] = (msgsCount[day] || 0) + 1;
  });
  const messageVolume = daysOfWeek.map(day => ({
    day,
    msgs: msgsCount[day] || 0
  }));

  // --- Feed em Tempo Real ---
  // Misturamos interações e novos pacientes para um feed genérico
  const latestInteractionsData = await prisma.interaction.findMany({
    where: { clinicId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { patient: { select: { fullName: true } } }
  });

  const latestInteractions = latestInteractionsData.map(int => {
    const timeDiffMs = now.getTime() - int.createdAt.getTime();
    const mins = Math.floor(timeDiffMs / 60000);
    const timeStr = mins < 60 ? `Há ${mins} min` : `Há ${Math.floor(mins/60)} horas`;
    
    // Resume a action
    let action = int.content.substring(0, 30) + "...";
    if (int.handledBy === 'ai') action = `IA: ${action}`;

    return {
      name: int.patient?.fullName || "Acesso Interno",
      action: action,
      time: timeStr
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão financeira e de crescimento da sua clínica em tempo real.</p>
      </div>
      
      <DashboardCharts 
        kpis={kpis} 
        leadsData={leadsData} 
        specialtyData={specialtyData} 
        messageVolume={messageVolume}
        latestInteractions={latestInteractions}
      />
    </div>
  );
}
