import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { format, addMinutes, parse, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    console.log("Availability Tool Auth Header:", authHeader);

    if (authHeader !== `Bearer ${process.env.WEBHOOK_SECRET || 'clini-smart-auth-2026'}`) {
      console.warn("Availability Tool: Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { clinicId, date, specialty } = await req.json();
    console.log("Availability Tool Input:", { clinicId, date });

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

    const targetDate = new Date(date);
    const dayOfWeek = format(targetDate, "eeee").toLowerCase(); // e.g. "monday"

    const appointments = await prisma.appointment.findMany({
      where: {
        clinicId,
        doctorId: { in: doctors.map(d => d.id) },
        scheduledAt: { 
          gte: startOfDay(targetDate), 
          lte: endOfDay(targetDate) 
        },
        status: { not: "cancelled" }
      }
    });

    const results = doctors.map(doctor => {
      const schedule = (doctor.schedule as any) || {};
      const daySchedule = schedule[dayOfWeek] || { start: "09:00", end: "18:00" };
      
      const slots: string[] = [];
      let current = parse(daySchedule.start, "HH:mm", targetDate);
      const end = parse(daySchedule.end, "HH:mm", targetDate);
      const duration = doctor.slotDurationMin || 30;

      while (isBefore(current, end)) {
        const slotTime = format(current, "HH:mm");
        
        // Verifica se o slot está ocupado
        const isOccupied = appointments.some(appt => {
          return appt.doctorId === doctor.id && format(appt.scheduledAt, "HH:mm") === slotTime;
        });

        if (!isOccupied) {
          slots.push(slotTime);
        }
        current = addMinutes(current, duration);
      }

      return {
        doctorId: doctor.id,
        doctorName: doctor.name,
        specialty: doctor.specialty,
        availableSlots: slots
      };
    });

    return NextResponse.json({ 
      date: format(targetDate, "yyyy-MM-dd"),
      doctors: results
    }, { status: 200 });

  } catch (error) {
    console.error("Check availability error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
