import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { clinicId } = await req.json();

    if (!clinicId) {
      return NextResponse.json({ error: "O clinicId é obrigatório" }, { status: 400 });
    }

    // Busca médicos e serviços ativos
    const [doctors, services] = await Promise.all([
      prisma.doctor.findMany({
        where: { clinicId, isActive: true },
        select: { id: true, name: true, specialty: true }
      }),
      prisma.service.findMany({
        where: { clinicId, isActive: true },
        select: { id: true, name: true, price: true, durationMinutes: true }
      })
    ]);

    return NextResponse.json({
      doctors,
      services
    }, { status: 200 });

  } catch (error) {
    console.error("Get clinic data error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
