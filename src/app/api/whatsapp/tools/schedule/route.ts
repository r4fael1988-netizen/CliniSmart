import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    console.log("Schedule Tool Auth Header:", authHeader);

    if (authHeader !== `Bearer ${process.env.WEBHOOK_SECRET || 'clini-smart-auth-2026'}`) {
      console.warn("Schedule Tool: Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { clinicId, doctorId, serviceId, patientPhone, date, time, specialty, patientName } = await req.json();
    console.log("Schedule Tool Input:", { clinicId, doctorId, serviceId, patientPhone, date, time });

    if (!clinicId || !patientPhone || !date || !time) {
      return NextResponse.json({ error: "Parâmetros obrigatórios ausentes" }, { status: 400 });
    }

    // Procura o paciente pelo telefone na clínica ou cria um caso não exista
    let patient = await prisma.patient.findFirst({
      where: { clinicId, phone: { contains: patientPhone } }
    });

    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          clinicId,
          fullName: patientName || "Paciente WhatsApp",
          phone: patientPhone,
          status: "scheduled",
          priority: "normal"
        }
      });
    } else {
      // Atualiza status do paciente caso precise
      await prisma.patient.update({
        where: { id: patient.id },
        data: { status: "scheduled" }
      });
    }

    // Convertendo Date e Time para DateTime UTC
    const scheduledDateTime = new Date(`${date}T${time}:00`);

    // Verificação de conflito de horário
    if (doctorId) {
      const conflict = await prisma.appointment.findFirst({
        where: {
          doctorId,
          scheduledAt: scheduledDateTime,
          status: { not: "cancelled" }
        }
      });

      if (conflict) {
        return NextResponse.json({ 
          success: false, 
          error: "Horário já ocupado para este médico." 
        }, { status: 409 });
      }
    }

    const appointment = await prisma.appointment.create({
      data: {
        clinicId,
        patientId: patient.id,
        doctorId: doctorId || null,
        specialty: specialty || "Geral",
        scheduledAt: scheduledDateTime,
        durationMinutes: 30, // Padrão
        status: "scheduled",
        appointmentType: "consultation"
      }
    });

    return NextResponse.json({
      success: true,
      message: "Agendamento realizado com sucesso",
      appointmentId: appointment.id,
      patientId: patient.id,
      scheduledAt: appointment.scheduledAt
    }, { status: 200 });

  } catch (error) {
    console.error("Schedule error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
