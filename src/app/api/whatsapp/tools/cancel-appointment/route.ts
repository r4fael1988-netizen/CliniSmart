import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { appointmentId, patientPhone } = await req.json();

    if (!appointmentId || !patientPhone) {
      return NextResponse.json({ error: "Parâmetros obrigatórios ausentes" }, { status: 400 });
    }

    // Busca o agendamento e valida o paciente
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true }
    });

    if (!appointment || !appointment.patient.phone.includes(patientPhone)) {
      return NextResponse.json({ error: "Agendamento não encontrado para este paciente" }, { status: 404 });
    }

    // Atualiza status para cancelado
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "cancelled" }
    });

    return NextResponse.json({
      success: true,
      message: "Agendamento cancelado com sucesso"
    }, { status: 200 });

  } catch (error) {
    console.error("Cancel appointment error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
