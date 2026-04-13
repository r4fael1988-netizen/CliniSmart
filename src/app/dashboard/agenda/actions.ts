"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";


export async function getAppointments() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clinicId) return [];

  try {
    const appointments = await prisma.appointment.findMany({
      where: { clinicId: session.user.clinicId },
      include: {
        patient: { select: { fullName: true } },
        doctor: { select: { name: true, specialty: true } },
        service: { select: { name: true, price: true } }
      }
    });

    return appointments.map(appt => ({
      id: appt.id,
      title: `${appt.patient.fullName} - ${appt.specialty}`,
      start: appt.scheduledAt,
      end: new Date(appt.scheduledAt.getTime() + (appt.durationMinutes * 60000)),
      patientName: appt.patient.fullName,
      doctorName: appt.doctor?.name || "Geral",
      specialty: appt.specialty,
      status: appt.status,
      value: Number(appt.value || 0)
    }));
  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error);
    return [];
  }
}

export async function getDoctors() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clinicId) return [];

  try {
    return await prisma.doctor.findMany({
      where: { clinicId: session.user.clinicId, isActive: true }
    });
  } catch (error) {
    return [];
  }
}

export async function getPatients() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clinicId) return [];

  try {
    return await prisma.patient.findMany({
      where: { clinicId: session.user.clinicId },
      select: { id: true, fullName: true }
    });
  } catch (error) {
    return [];
  }
}

export async function getServices() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clinicId) return [];

  try {
    const services = await prisma.service.findMany({
      where: { clinicId: session.user.clinicId, isActive: true }
    });
    return services.map(s => ({ ...s, price: Number(s.price) }));
  } catch (error) {
    return [];
  }
}

export async function createAppointment(data: {
  patientId: string;
  doctorId?: string;
  serviceId?: string;
  scheduledAt: Date;
  durationMinutes: number;
  notes?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clinicId) return { error: "Não autorizado" };

  try {
    // Validação básica de data
    if (data.scheduledAt < new Date()) {
      return { error: "Não é possível realizar agendamentos em datas retroativas." };
    }

    // Busca o serviço pra pegar o valor e a especialidade (nome do serviço)
    let value = 0;
    let specialty = "Consulta Geral";

    if (data.serviceId) {
      const service = await prisma.service.findUnique({ where: { id: data.serviceId } });
      if (service) {
        value = Number(service.price);
        specialty = service.name;
      }
    }

    await prisma.appointment.create({
      data: {
        clinicId: session.user.clinicId,
        patientId: data.patientId,
        doctorId: data.doctorId,
        serviceId: data.serviceId,
        specialty: specialty,
        scheduledAt: data.scheduledAt,
        durationMinutes: data.durationMinutes,
        value: value,
        notes: data.notes,
        status: "scheduled"
      }
    });

    revalidatePath("/dashboard/agenda");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Erro ao agendar:", error);
    return { error: "Ocorreu um erro técnico ao processar seu agendamento. Por favor, tente novamente." };
  }
}

export async function deleteAppointment(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clinicId) return { error: "Não autorizado" };

  try {
    await prisma.appointment.delete({
      where: { id, clinicId: session.user.clinicId }
    });

    revalidatePath("/dashboard/agenda");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { error: "Erro ao excluir agendamento." };
  }
}
