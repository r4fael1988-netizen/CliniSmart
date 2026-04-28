import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clinicId = searchParams.get("clinicId") || "1";
  const days = parseInt(searchParams.get("days") || "30");

  try {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const startDatePrev = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);

    // 1️⃣ TAXA DE CONVERSÃO
    const { data: leadsNow } = await supabase
      .from("leads")
      .select("id, status")
      .eq("clinic_id", clinicId)
      .gte("created_at", startDate.toISOString());

    const { data: leadsPrev } = await supabase
      .from("leads")
      .select("id, status")
      .eq("clinic_id", clinicId)
      .gte("created_at", startDatePrev.toISOString())
      .lt("created_at", startDate.toISOString());

    const conversaoNow = leadsNow
      ? (leadsNow.filter((l) => l.status === "convertido").length / leadsNow.length) * 100
      : 0;
    const conversaoPrev = leadsPrev
      ? (leadsPrev.filter((l) => l.status === "convertido").length / leadsPrev.length) * 100
      : 0;

    // 2️⃣ FATURAMENTO
    const { data: appointmentsNow } = await supabase
      .from("appointments")
      .select("id, status, services(price)")
      .eq("clinic_id", clinicId)
      .eq("status", "realizado")
      .gte("created_at", startDate.toISOString());

    const { data: appointmentsPrev } = await supabase
      .from("appointments")
      .select("id, status, services(price)")
      .eq("clinic_id", clinicId)
      .eq("status", "realizado")
      .gte("created_at", startDatePrev.toISOString())
      .lt("created_at", startDate.toISOString());

    const faturamentoNow = appointmentsNow
      ? appointmentsNow.reduce((sum: number, apt: any) => sum + (apt.services?.price || 0), 0)
      : 0;
    const faturamentoPrev = appointmentsPrev
      ? appointmentsPrev.reduce((sum: number, apt: any) => sum + (apt.services?.price || 0), 0)
      : 0;

    // 3️⃣ AGENDAMENTOS E OCUPAÇÃO
    const { data: appointmentsTotal } = await supabase
      .from("appointments")
      .select("id, status")
      .eq("clinic_id", clinicId)
      .gte("created_at", startDate.toISOString());

    const agendamentosNow = appointmentsTotal?.length || 0;
    const ocupacaoNow = appointmentsTotal
      ? (appointmentsTotal.filter((a) => a.status === "realizado").length / agendamentosNow) * 100
      : 0;

    const { data: appointmentsTotalPrev } = await supabase
      .from("appointments")
      .select("id, status")
      .eq("clinic_id", clinicId)
      .gte("created_at", startDatePrev.toISOString())
      .lt("created_at", startDate.toISOString());

    const agendamentosPrev = appointmentsTotalPrev?.length || 0;
    const ocupacaoPrev = appointmentsTotalPrev
      ? (appointmentsTotalPrev.filter((a) => a.status === "realizado").length / agendamentosPrev) *
        100
      : 0;

    // 4️⃣ MÉDICO MAIS PROCURADO
    const { data: topDoctor } = await supabase
      .from("appointments")
      .select("doctor_id, doctors(name)")
      .eq("clinic_id", clinicId)
      .gte("created_at", startDate.toISOString());

    const doctorCount = topDoctor?.reduce(
      (acc: any, apt: any) => {
        const docId = apt.doctor_id;
        acc[docId] = (acc[docId] || 0) + 1;
        return acc;
      },
      {}
    );

    const topDoctorId = doctorCount ? Object.keys(doctorCount).sort((a, b) => doctorCount[b] - doctorCount[a])[0] : null;
    const topDoctorData = topDoctor?.find((apt: any) => apt.doctor_id === topDoctorId);
    const topDoctorName = topDoctorData?.doctors?.name || "N/A";
    const topDoctorCount = doctorCount ? doctorCount[topDoctorId] : 0;

    // 5️⃣ DADOS PARA GRÁFICOS
    const { data: appointmentsByDay } = await supabase
      .from("appointments")
      .select("created_at, services(price), status")
      .eq("clinic_id", clinicId)
      .gte("created_at", startDate.toISOString());

    const { data: appointmentsBySpecialty } = await supabase
      .from("appointments")
      .select("services(name), id")
      .eq("clinic_id", clinicId)
      .gte("created_at", startDate.toISOString());

    return Response.json({
      ok: true,
      period: { days, startDate: startDate.toISOString(), endDate: now.toISOString() },
      kpis: {
        conversao: {
          current: Math.round(conversaoNow * 100) / 100,
          previous: Math.round(conversaoPrev * 100) / 100,
          change: Math.round((conversaoNow - conversaoPrev) * 100) / 100,
        },
        faturamento: {
          current: faturamentoNow,
          previous: faturamentoPrev,
          change: faturamentoNow - faturamentoPrev,
        },
        agendamentos: {
          current: agendamentosNow,
          previous: agendamentosPrev,
          ocupacao: Math.round(ocupacaoNow * 100) / 100,
          ocupacaoPrev: Math.round(ocupacaoPrev * 100) / 100,
        },
        topDoctor: {
          name: topDoctorName,
          consultations: topDoctorCount,
        },
      },
      chartData: {
        byDay: appointmentsByDay,
        bySpecialty: appointmentsBySpecialty,
      },
    });
  } catch (error) {
    console.error("Error fetching KPIs:", error);
    return Response.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}
