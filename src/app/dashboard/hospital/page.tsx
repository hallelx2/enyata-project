import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getEMRRecords, getPendingPatientRequests, getLinkedPatients, getHospitalProfile, getHospitalResources } from "@/modules/hospital/actions";
import { getTriageRequestsForHospital } from "@/modules/triage/actions";
import { HospitalDashboardView } from "@/modules/dashboard/hospital/views/HospitalDashboardView";

export default async function HospitalDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login");
  }

  const hospitalId = session.user.id;

  const [emrRecords, linkedPatients, pendingRequests, triageRequests, hospitalProfileData, hospitalResources] = await Promise.all([
    getEMRRecords(hospitalId),
    getLinkedPatients(hospitalId),
    getPendingPatientRequests(hospitalId),
    getTriageRequestsForHospital(hospitalId),
    getHospitalProfile(hospitalId),
    getHospitalResources(hospitalId),
  ]);

  return (
    <HospitalDashboardView
      hospitalId={hospitalId}
      hospitalName={session.user.name}
      hospitalEmail={session.user.email}
      emrRecords={emrRecords}
      linkedPatients={linkedPatients}
      pendingRequests={pendingRequests}
      triageRequests={triageRequests}
      hospitalProfile={hospitalProfileData}
      hospitalResources={hospitalResources.map((r) => ({
        id: r.id,
        name: r.name,
        category: r.category,
        totalCount: r.totalCount,
        availableCount: r.availableCount,
        priceNaira: r.priceNaira ?? 0,
        unit: r.unit ?? "units",
      }))}
    />
  );
}
