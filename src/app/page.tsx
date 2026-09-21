import { DashboardService } from "@/lib/services/dashboard-service";
import DashboardClient from "@/components/DashboardClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Render the first dashboard view on the server so older browsers can
  // display useful content even if they cannot execute the modern React bundle.
  const dashboardService = DashboardService.getInstance();
  const data = await dashboardService.getDashboardData();

  return <DashboardClient initialData={data} />;
}
