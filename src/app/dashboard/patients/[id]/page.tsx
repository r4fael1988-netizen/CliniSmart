import { getPatientById } from "../actions";
import { getDoctors, getServices } from "../../agenda/actions";
import { PatientDetailsView } from "@/components/patients/PatientDetailsView";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function PatientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [patient, doctors, services] = await Promise.all([
    getPatientById(id),
    getDoctors(),
    getServices()
  ]);

  if (!patient) {
    notFound();
  }

  return <PatientDetailsView patient={patient} doctors={doctors} services={services} />;
}
