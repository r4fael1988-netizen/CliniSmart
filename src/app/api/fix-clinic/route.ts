import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * ENDPOINT TEMPORÁRIO para corrigir configuração da clínica principal.
 * Deve ser removido após o uso.
 * 
 * POST /api/fix-clinic
 * Body: { secret: "...", clinicId: "...", whatsappInstance: "..." }
 */
export async function POST(req: Request) {
  try {
    const { secret, clinicId, whatsappInstance, agentName } = await req.json();

    if (secret !== (process.env.WEBHOOK_SECRET || "clini-smart-auth-2026")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!clinicId) {
      return NextResponse.json({ error: "clinicId required" }, { status: 400 });
    }

    const updateData: any = {};

    if (whatsappInstance) {
      updateData.whatsappInstance = whatsappInstance;
    }

    if (agentName) {
      // Merge into existing settings
      const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
      if (!clinic) {
        return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
      }
      const currentSettings = (clinic.settings as any) || {};
      updateData.settings = {
        ...currentSettings,
        agentName,
        aiActive: true
      };
    }

    const updated = await prisma.clinic.update({
      where: { id: clinicId },
      data: updateData,
      select: { id: true, name: true, whatsappInstance: true, settings: true }
    });

    return NextResponse.json({ success: true, clinic: updated });

  } catch (error) {
    console.error("Fix clinic error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
