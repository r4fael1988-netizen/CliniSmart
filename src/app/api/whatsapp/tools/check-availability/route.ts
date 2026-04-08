import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


export async function POST(req: Request) {
  try {
    const { clinicId, date, specialty } = await req.json();

    if (!clinicId || !date) {
      return NextResponse.json({ error: "Parâmetros clinicId e date são obrigatórios" }, { status: 400 });
    }

    // Busca médicos daquela clínica
    const doctors = await prisma.doctor.findMany({
      where: {
        clinicId,
        isActive: true,
        ...(specialty ? { specialty: { contains: specialty, mode: 'insensitive' } } : {})
      }
    });

    if (doctors.length === 0) {
      return NextResponse.json({ 
        available: false, 
        message: "Nenhum médico encontrado para esta especialidade." 
      });
    }

    // Pega o início e fim do dia para buscar os agendamentos existentes
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Busca agendamentos ocupados no dia
    const appointments = await prisma.appointment.findMany({
      where: {
        clinicId,
        doctorId: { in: doctors.map(d => d.id) },
        scheduledAt: { gte: startOfDay, lte: endOfDay },
        status: { not: "cancelled" }
      }
    });

    const results = doctors.map(doctor => {
      // Pega dias da semana do schedule JSON (ex: { "monday": ["09:00", "15:00"] })
      // Simplificado: Assumimos que o médico atende das 09h às 18h se não tiver config específica.
      const busySlots = appointments
        .filter(a => a.doctorId === doctor.id)
        .map(a => `${a.scheduledAt.getHours().toString().padStart(2, '0')}:${a.scheduledAt.getMinutes().toString().padStart(2, '0')}`);

      const allSlots = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];
      const freeSlots = allSlots.filter(slot => !busySlots.includes(slot));

      return {
        doctorId: doctor.id,
        doctorName: doctor.name,
        specialty: doctor.specialty,
        freeSlots
      };
    });

    return NextResponse.json({ 
      date: startOfDay.toISOString().split('T')[0],
      doctors: results
    }, { status: 200 });

  } catch (error) {
    console.error("Check availability error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
