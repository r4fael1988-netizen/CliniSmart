import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    console.log("History Tool Auth Header:", authHeader);

    if (authHeader !== `Bearer ${process.env.WEBHOOK_SECRET || 'clini-smart-auth-2026'}`) {
      console.warn("History Tool: Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("History Tool Body:", JSON.stringify(body));
    const { clinicId, patientPhone } = body;

    if (!clinicId || !patientPhone) {
      console.error("History Tool: Missing required parameters", { clinicId, patientPhone });
      return NextResponse.json({ 
        error: "Parâmetros obrigatórios ausentes",
        received: { clinicId: !!clinicId, patientPhone: !!patientPhone } 
      }, { status: 400 });
    }

    // Busca o paciente
    const patient = await prisma.patient.findFirst({
      where: { clinicId, phone: { contains: patientPhone } }
    });

    if (!patient) {
      return NextResponse.json({ history: [], message: "Paciente não encontrado" });
    }

    // Busca últimos agendamentos
    const appointments = await prisma.appointment.findMany({
      where: { patientId: patient.id },
      orderBy: { scheduledAt: 'desc' },
      take: 5,
      include: {
        doctor: { select: { name: true } },
        service: { select: { name: true } }
      }
    });

    const history = appointments.map(app => ({
      date: app.scheduledAt.toISOString().split('T')[0],
      time: app.scheduledAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      doctor: app.doctor?.name || "N/A",
      service: app.service?.name || app.specialty,
      status: app.status
    }));

    return NextResponse.json({
      patientName: patient.fullName,
      history
    }, { status: 200 });

  } catch (error) {
    console.error("Get patient history error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
