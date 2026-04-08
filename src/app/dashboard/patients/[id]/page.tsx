import { getPatientById } from "../actions";
import { PatientDetailsView } from "@/components/patients/PatientDetailsView";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function PatientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patient = await getPatientById(id);

  if (!patient) {
    notFound();
  }

  return <PatientDetailsView patient={patient} />;
}
