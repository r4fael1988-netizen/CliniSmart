import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// Force Rebuild: 2026-04-14T22:10 - Deep Diagnostic with Clinic Data


export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const deep = searchParams.get("deep") === "true";

  const baseInfo = {
    webhook_secret_set: !!process.env.WEBHOOK_SECRET,
    n8n_url: process.env.N8N_WEBHOOK_BASE || "NOT_SET",
    evolution_url: process.env.EVOLUTION_API_URL || "https://lostbaskingshark-evolution.cloudfy.live",
    evolution_instance: process.env.EVOLUTION_INSTANCE_NAME || "SOFIA_CRM (FALLBACK)",
    node_env: process.env.NODE_ENV,
    url: process.env.VERCEL_URL || "unknown"
  };

  if (!deep) {
    return NextResponse.json(baseInfo);
  }

  // Deep diagnostic - include clinic & patient counts
  try {
    const clinics = await prisma.clinic.findMany({
      select: {
        id: true,
        name: true,
        whatsappInstance: true,
        settings: true,
        _count: { select: { patients: true, appointments: true } }
      }
    });

    const conversations = await prisma.conversation.count({ where: { status: 'active' } });

    return NextResponse.json({
      ...baseInfo,
      clinics: clinics.map(c => ({
        id: c.id,
        name: c.name,
        whatsappInstance: c.whatsappInstance,
        aiActive: (c.settings as any)?.aiActive || false,
        agentName: (c.settings as any)?.agentName || "N/A",
        patientCount: c._count.patients,
        appointmentCount: c._count.appointments
      })),
      activeConversations: conversations
    });
  } catch (error) {
    return NextResponse.json({
      ...baseInfo,
      dbError: String(error)
    });
  }
}
